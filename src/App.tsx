import { useCallback, useEffect, useRef, useState } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { AgentDefinition, Tab } from "./types";
import { createSession, closeSession, writeInput, detectClis, type CliAvail } from "./lib/tauri";
import { TabBar } from "./components/TabBar";
import { TerminalPanel } from "./components/TerminalPanel";
import { CreateAgentModal } from "./components/CreateAgentModal";
import { EmptyState } from "./components/EmptyState";
import { ContextBar } from "./components/ContextBar";

const TERM_FONT_MIN = 10;
const TERM_FONT_MAX = 20;
const TERM_FONT_DEFAULT = 13;
const TERM_FONT_KEY = "orkest.termFontSize";

function loadTermFontSize(): number {
  try {
    const v = Number(localStorage.getItem(TERM_FONT_KEY));
    if (Number.isFinite(v) && v >= TERM_FONT_MIN && v <= TERM_FONT_MAX) return v;
  } catch {
    /* localStorage indisponível */
  }
  return TERM_FONT_DEFAULT;
}

/** Aspas simples seguras para o shell do PTY. */
function shq(s: string): string {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

/** `cd <workspace> && <cli>` com `~` expandido pelo shell do usuário. */
export function launchCommand(workspace: string, cli: string): string {
  const ws = workspace.trim() || "~";
  let cd: string;
  if (ws === "~") cd = "cd ~";
  else if (ws.startsWith("~/")) cd = `cd ~/${shq(ws.slice(2))}`;
  else cd = `cd ${shq(ws)}`;
  return `${cd} && ${cli}\n`;
}

// Tempo para o tmux anexar e o shell do pane ficar pronto antes de digitar o CLI.
const LAUNCH_DELAY_MS = 600;

function App() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [sizes, setSizes] = useState<Record<string, { cols: number; rows: number }>>({});
  const [termFontSize, setTermFontSize] = useState(loadTermFontSize);
  // null = detecção pendente/indisponível (modal mostra todos os CLIs).
  const [clis, setClis] = useState<CliAvail[] | null>(null);

  useEffect(() => {
    detectClis()
      .then(setClis)
      .catch(() => setClis(null));
  }, []);

  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;
  const clisRef = useRef(clis);
  clisRef.current = clis;
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;

  // Evento de saída da sessão → atualiza o estado da aba correspondente.
  useEffect(() => {
    let un: UnlistenFn | undefined;
    void listen<{ session_id: string; code: number }>("session-exit", (e) => {
      const { session_id, code } = e.payload;
      setTabs((prev) =>
        prev.map((t) =>
          t.sessionId === session_id
            ? {
                ...t,
                status: code === 0 ? "done" : "failed",
                exitCode: code,
                unseen: t.sessionId !== activeIdRef.current,
              }
            : t,
        ),
      );
    }).then((fn) => {
      un = fn;
    });
    return () => {
      un?.();
    };
  }, []);

  const activateTab = useCallback((id: string) => {
    setActiveId(id);
    setTabs((prev) =>
      prev.map((t) => (t.sessionId === id ? { ...t, unseen: false } : t)),
    );
  }, []);

  const createAgent = useCallback(async (def: AgentDefinition): Promise<void> => {
    const info = await createSession(def.name);
    const tab: Tab = {
      sessionId: info.id,
      title: info.title,
      agent: def,
      status: "idle",
      exitCode: null,
      unseen: false,
    };
    setTabs((prev) => [...prev, tab]);
    setActiveId(info.id);
    // Abre o CLI do agente no terminal recém-criado (write_input pós-attach;
    // o attach do tmux segue idempotente). Só se instalado, quando a detecção respondeu.
    const avail = clisRef.current?.find((c) => c.key === def.cli);
    if (!clisRef.current || avail?.installed) {
      window.setTimeout(() => {
        void writeInput(info.id, launchCommand(def.workspace, def.cli)).catch(() => {});
      }, LAUNCH_DELAY_MS);
    }
  }, []);

  const closeTab = useCallback(
    async (id: string) => {
      void closeSession(id).catch(() => {});
      const list = tabsRef.current;
      const idx = list.findIndex((t) => t.sessionId === id);
      const remaining = list.filter((t) => t.sessionId !== id);
      setTabs(remaining);
      setSizes((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (activeIdRef.current === id) {
        const neighbor = remaining[Math.min(idx, remaining.length - 1)];
        setActiveId(neighbor ? neighbor.sessionId : null);
      }
    },
    [],
  );

  const onSize = useCallback((sessionId: string, cols: number, rows: number) => {
    setSizes((prev) => ({ ...prev, [sessionId]: { cols, rows } }));
  }, []);

  const cycle = useCallback(
    (dir: 1 | -1) => {
      const list = tabsRef.current;
      if (list.length === 0) return;
      const idx = list.findIndex((t) => t.sessionId === activeIdRef.current);
      const next = list[(idx + dir + list.length) % list.length];
      activateTab(next.sessionId);
    },
    [activateTab],
  );

  // Atalhos: Ctrl+Shift+N abre o modal; Ctrl+Tab / Ctrl+Shift+Tab ciclam;
  // Ctrl+Shift+= (aumenta), Ctrl+Alt+- (diminui; Ctrl+Shift+- é consumido pelo
  // acelerador de zoom do WebKitGTK) e Ctrl+Shift+0 (reset) ajustam a fonte (§9.4).
  // O decremento casa com Alt+- (independente de Ctrl) porque o XWayland às vezes
  // entrega o combo CTRL+ALT apenas como Alt+- (omezibação da injeção/teclado real).
  // Quando o foco está no terminal, apenas atalhos com Ctrl+Shift ou Alt são
  // capturados pelo app (§4.1).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inTerminal = !!target?.closest?.(".ork-term");
      const ctrlShift = e.ctrlKey && e.shiftKey;
      const altMinus = e.altKey && e.code === "Minus";

      if (inTerminal && !e.altKey && !ctrlShift) return;

      if (ctrlShift && e.code === "KeyN") {
        e.preventDefault();
        setModalOpen(true);
      } else if (
        (ctrlShift && (e.code === "Equal" || e.code === "Digit0")) ||
        altMinus
      ) {
        e.preventDefault();
        setTermFontSize((cur) => {
          if (e.code === "Equal") return Math.min(TERM_FONT_MAX, cur + 1);
          if (e.code === "Minus") return Math.max(TERM_FONT_MIN, cur - 1);
          return TERM_FONT_DEFAULT;
        });
      } else if (e.ctrlKey && e.code === "Tab") {
        e.preventDefault();
        cycle(e.shiftKey ? -1 : 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cycle]);

  // Persiste a fonte do terminal.
  useEffect(() => {
    try {
      localStorage.setItem(TERM_FONT_KEY, String(termFontSize));
    } catch {
      /* ignora */
    }
  }, [termFontSize]);

  const activeTab = tabs.find((t) => t.sessionId === activeId) ?? null;
  const activeSize = activeId ? sizes[activeId] : undefined;

  return (
    <div className="ork-app">
      <TabBar
        tabs={tabs}
        activeId={activeId}
        onSelect={activateTab}
        onClose={closeTab}
        onAdd={() => setModalOpen(true)}
      />

      <div className="ork-stage" id="ork-terminal">
        {tabs.length === 0 && <EmptyState onAdd={() => setModalOpen(true)} />}
        {tabs.map((tab) => (
          <TerminalPanel
            key={tab.sessionId}
            tab={tab}
            active={tab.sessionId === activeId}
            fontSize={termFontSize}
            onSize={onSize}
          />
        ))}
      </div>

      {tabs.length > 0 && (
        <ContextBar
          tab={activeTab}
          cols={activeSize?.cols ?? 0}
          rows={activeSize?.rows ?? 0}
        />
      )}

      {modalOpen && (
        <CreateAgentModal
          clis={clis}
          existingNames={tabs.map((t) => t.agent.name)}
          onCreate={createAgent}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
