import { useCallback, useEffect, useRef, useState } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { AgentDefinition, Tab } from "./types";
import type { Message } from "./lib/tauri";
import {
  createSession,
  closeSession,
  writeInput,
  detectClis,
  reconnectSession,
  diagnostics,
  type Diagnostics,
  lastInputAt,
  type CliAvail,
} from "./lib/tauri";
import { TabBar } from "./components/TabBar";
import { TerminalPanel } from "./components/TerminalPanel";
import { CreateAgentModal } from "./components/CreateAgentModal";
import { EmptyState } from "./components/EmptyState";
import { ContextBar } from "./components/ContextBar";
import { StateBanner } from "./components/StateBanner";
import { GearMenu } from "./components/GearMenu";
import { SettingsDialog } from "./components/SettingsDialog";
import { ConfirmDialog, KeyValueDialog, ShortcutsDialog } from "./components/Dialogs";
import { loadSettings, saveSettings, type Settings } from "./lib/settings";

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

// running = saída real do PTY nos últimos RUNNING_IDLE_MS (proxy de atividade; o
// backend não expõe "executando"). Saída até ECHO_MS depois de uma digitação é eco.
const RUNNING_IDLE_MS = 2500;
const ECHO_MS = 300;

const blankTab = {
  exitCode: null,
  unseen: false,
  exitSignal: null,
  disconnected: false,
  blocker: null,
  notice: null,
} as const;

function App() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [sizes, setSizes] = useState<Record<string, { cols: number; rows: number }>>({});
  const [termFontSize, setTermFontSize] = useState(loadTermFontSize);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const [gearOpen, setGearOpen] = useState(false);
  const [dialog, setDialog] = useState<null | "settings" | "shortcuts" | "diagnostics" | "about">(null);
  const [pendingClose, setPendingClose] = useState<string | null>(null);
  const [diag, setDiag] = useState<Diagnostics | null>(null);
  // null = detecção pendente/indisponível (modal mostra todos os CLIs).
  const [clis, setClis] = useState<CliAvail[] | null>(null);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    diagnostics()
      .then(setDiag)
      .catch(() => setDiag(null));
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
    void listen<{ session_id: string; code: number; signal?: string | null; recoverable?: boolean }>(
      "session-exit",
      (e) => {
      const { session_id, code, signal, recoverable } = e.payload;
      setTabs((prev) =>
        prev.map((t) =>
          t.sessionId === session_id
            ? {
                ...t,
                // F4: o tmux sobreviveu ao cliente => desconectada (recuperável),
                // glifo de bloqueado. Senão: código 0 => done; ≠0/sinal => failed.
                status: recoverable ? "blocked" : code === 0 && !signal ? "done" : "failed",
                disconnected: !!recoverable,
                exitCode: code,
                exitSignal: signal ?? null,
                blocker: null,
                notice: null,
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

  // R1/R2: saída do PTY => running (aba inativa também ganha o ponto "nova saída").
  const activityRef = useRef<Record<string, number>>({});
  useEffect(() => {
    let un: UnlistenFn | undefined;
    void listen<{ session_id: string }>("session-output", (e) => {
      const id = e.payload.session_id;
      const now = Date.now();
      if (now - (lastInputAt[id] ?? 0) < ECHO_MS) return; // eco da digitação
      activityRef.current[id] = now;
      const t = tabsRef.current.find((x) => x.sessionId === id);
      if (!t || t.disconnected || t.status === "failed" || t.status === "done") return;
      const inactive = id !== activeIdRef.current;
      const needRunning = t.status === "idle";
      const needUnseen = inactive && !t.unseen;
      if (!needRunning && !needUnseen) return;
      setTabs((prev) =>
        prev.map((x) =>
          x.sessionId === id
            ? { ...x, status: needRunning ? "running" : x.status, unseen: x.unseen || inactive }
            : x,
        ),
      );
    }).then((fn) => {
      un = fn;
    });
    const timer = window.setInterval(() => {
      const now = Date.now();
      const stale = tabsRef.current.some(
        (t) => t.status === "running" && now - (activityRef.current[t.sessionId] ?? 0) > RUNNING_IDLE_MS,
      );
      if (!stale) return;
      setTabs((prev) =>
        prev.map((t) =>
          t.status === "running" && now - (activityRef.current[t.sessionId] ?? 0) > RUNNING_IDLE_MS
            ? { ...t, status: "idle" }
            : t,
        ),
      );
    }, 1000);
    return () => {
      un?.();
      window.clearInterval(timer);
    };
  }, []);

  // B1/B2: mensagem `question` do broker => blocked; qualquer outra mensagem da
  // mesma task (resposta/progresso/resultado/falha) libera.
  useEffect(() => {
    let un: UnlistenFn | undefined;
    void listen<Message>("message-received", (e) => {
      const m = e.payload;
      setTabs((prev) =>
        prev.map((t) => {
          if (m.kind === "question") {
            if (t.agent.name !== m.from || t.disconnected || t.status === "failed" || t.status === "done") return t;
            return {
              ...t,
              status: "blocked",
              unseen: t.sessionId !== activeIdRef.current || t.unseen,
              blocker: {
                kind: m.to === "orkest-ui" ? "user" : "agent",
                agent: m.to === "orkest-ui" ? null : m.to,
                taskId: m.task_id,
                questionId: m.id,
              },
            };
          }
          if (t.status === "blocked" && t.blocker?.taskId === m.task_id && t.blocker.questionId !== m.id) {
            return { ...t, status: "idle", blocker: null };
          }
          return t;
        }),
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

  /** Abre a sessão e digita o CLI do agente (write_input pós-attach). */
  const startSession = useCallback(async (def: AgentDefinition) => {
    const info = await createSession(def.name);
    const avail = clisRef.current?.find((c) => c.key === def.cli);
    if (settingsRef.current.launchCli && (!clisRef.current || avail?.installed)) {
      window.setTimeout(() => {
        void writeInput(info.id, launchCommand(def.workspace, def.cli)).catch(() => {});
      }, LAUNCH_DELAY_MS);
    }
    return info;
  }, []);

  const createAgent = useCallback(
    async (def: AgentDefinition): Promise<void> => {
      const info = await startSession(def);
      const tab: Tab = { sessionId: info.id, title: info.title, agent: def, status: "idle", ...blankTab };
      setTabs((prev) => [...prev, tab]);
      setActiveId(info.id);
    },
    [startSession],
  );

  // F1/F2 "Reiniciar": ação explícita do usuário — nova sessão no mesmo lugar da aba.
  const restartTab = useCallback(
    async (id: string) => {
      const old = tabsRef.current.find((t) => t.sessionId === id);
      if (!old) return;
      try {
        const info = await startSession(old.agent);
        void closeSession(id).catch(() => {});
        setTabs((prev) =>
          prev.map((t) =>
            t.sessionId === id
              ? { ...t, sessionId: info.id, title: info.title, status: "idle", ...blankTab }
              : t,
          ),
        );
        setActiveId((cur) => (cur === id ? info.id : cur));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setTabs((prev) => prev.map((t) => (t.sessionId === id ? { ...t, notice: `reinício falhou: ${msg}` } : t)));
      }
    },
    [startSession],
  );

  // F4 "Reconectar": re-attach explícito; falha vira aviso visível, sem retry silencioso.
  const reconnectTab = useCallback(async (id: string) => {
    try {
      await reconnectSession(id);
      setTabs((prev) =>
        prev.map((t) =>
          t.sessionId === id
            ? { ...t, status: "idle", disconnected: false, exitCode: null, exitSignal: null, notice: null }
            : t,
        ),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setTabs((prev) => prev.map((t) => (t.sessionId === id ? { ...t, notice: msg } : t)));
    }
  }, []);

  const focusTerminal = useCallback((id: string) => {
    document
      .querySelector<HTMLElement>(`[data-session-id="${id}"] .xterm-helper-textarea`)
      ?.focus();
  }, []);

  const doCloseTab = useCallback(
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

  // Fecha com confirmação opcional quando o agente está em execução/bloqueado.
  const closeTab = useCallback(
    (id: string) => {
      const t = tabsRef.current.find((x) => x.sessionId === id);
      const busy = t && (t.status === "running" || t.status === "blocked");
      if (busy && settingsRef.current.confirmClose) setPendingClose(id);
      else void doCloseTab(id);
    },
    [doCloseTab],
  );

  const adjustFont = useCallback((v: number) => {
    setTermFontSize(Math.min(TERM_FONT_MAX, Math.max(TERM_FONT_MIN, v)));
  }, []);

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

      if (inTerminal && !e.altKey && !ctrlShift && !(e.ctrlKey && e.code === "Comma")) return;

      if (e.ctrlKey && !e.shiftKey && !e.altKey && e.code === "Comma") {
        e.preventDefault();
        setGearOpen(false);
        setDialog("settings");
      } else if (e.ctrlKey && e.altKey === false && !inTerminal && !e.shiftKey && e.code === "Slash") {
        e.preventDefault();
        setDialog("shortcuts");
      } else if (
        activeIdRef.current &&
        e.ctrlKey &&
        !e.altKey &&
        e.code === "KeyW" &&
        (ctrlShift || !inTerminal) // Ctrl+W puro é do readline dentro do terminal
      ) {
        e.preventDefault();
        closeTab(activeIdRef.current);
      } else if (ctrlShift && e.code === "KeyN") {
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
  }, [cycle, closeTab]);

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
        attention={tabs.filter((t) => t.status === "blocked" || t.status === "failed").length}
        onAttention={() => {
          const list = tabs.filter((t) => t.status === "blocked" || t.status === "failed");
          if (list.length === 0) return;
          const after = list.find((t) => t.sessionId !== activeId) ?? list[0];
          activateTab(after.sessionId);
        }}
        gearOpen={gearOpen}
        onGear={() => setGearOpen((v) => !v)}
      />
      {gearOpen && (
        <GearMenu
          fontSize={termFontSize}
          fontMin={TERM_FONT_MIN}
          fontMax={TERM_FONT_MAX}
          onFont={adjustFont}
          launchCli={settings.launchCli}
          onLaunchCli={(v) => setSettings((cur) => ({ ...cur, launchCli: v }))}
          version={diag?.app_version ?? "0.1.0"}
          onSettings={() => setDialog("settings")}
          onShortcuts={() => setDialog("shortcuts")}
          onDiagnostics={() => setDialog("diagnostics")}
          onAbout={() => setDialog("about")}
          onClose={() => setGearOpen(false)}
        />
      )}

      <div className="ork-stage" id="ork-terminal">
        {tabs.length === 0 && <EmptyState onAdd={() => setModalOpen(true)} />}
        {tabs.map((tab) => (
          <TerminalPanel
            key={tab.sessionId}
            tab={tab}
            active={tab.sessionId === activeId}
            fontSize={termFontSize}
            cursor={settings.cursor}
            onSize={onSize}
          />
        ))}
      </div>

      {activeTab && (
        <StateBanner
          tab={activeTab}
          tabs={tabs}
          actions={{
            onPrompt: () => focusTerminal(activeTab.sessionId),
            onLog: () => focusTerminal(activeTab.sessionId), // o scrollback do terminal é o log
            onRestart: () => void restartTab(activeTab.sessionId),
            onReconnect: () => void reconnectTab(activeTab.sessionId),
            onViewAgent: (name) => {
              const t = tabs.find((x) => x.agent.name === name);
              if (t) activateTab(t.sessionId);
            },
          }}
        />
      )}

      {tabs.length > 0 && (
        <ContextBar
          tab={activeTab}
          cols={activeSize?.cols ?? 0}
          rows={activeSize?.rows ?? 0}
        />
      )}

      {dialog === "settings" && (
        <SettingsDialog
          settings={settings}
          onChange={setSettings}
          fontSize={termFontSize}
          fontMin={TERM_FONT_MIN}
          fontMax={TERM_FONT_MAX}
          onFont={adjustFont}
          onRestoreFont={() => setTermFontSize(TERM_FONT_DEFAULT)}
          clis={clis}
          version={diag?.app_version ?? "0.1.0"}
          onDiagnostics={() => setDialog("diagnostics")}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "shortcuts" && <ShortcutsDialog onClose={() => setDialog(null)} />}
      {dialog === "diagnostics" && (
        <KeyValueDialog
          id="ork-diag-title"
          title="Diagnóstico"
          onClose={() => setDialog(null)}
          rows={[
            ["Orkest", `v${diag?.app_version ?? "?"}`],
            ["tmux", diag ? (diag.tmux ?? "não encontrado") : "indisponível"],
            [
              "CLIs",
              clis
                ? clis.map((c) => `${c.key}: ${c.installed ? "instalado" : "ausente"}${c.headless_ready ? " (headless)" : ""}`).join("\n")
                : "detecção indisponível",
            ],
            ["Janela", `${window.innerWidth}×${window.innerHeight} @ DPR ${window.devicePixelRatio}`],
            ["Sessões abertas", String(tabs.length)],
          ]}
        />
      )}
      {dialog === "about" && (
        <KeyValueDialog
          id="ork-about-title"
          title="Sobre o Orkest"
          onClose={() => setDialog(null)}
          rows={[
            ["Versão", `v${diag?.app_version ?? "?"}`],
            ["Descrição", "Terminal de agentes (Tauri 2 + Rust + xterm.js)"],
          ]}
        />
      )}
      {pendingClose && (
        <ConfirmDialog
          title="Fechar agente em execução?"
          message={`"${tabs.find((t) => t.sessionId === pendingClose)?.agent.name ?? "O agente"}" ainda está em atividade. Fechar encerra a sessão tmux e a tarefa em curso.`}
          confirmLabel="Fechar agente"
          onCancel={() => setPendingClose(null)}
          onConfirm={() => {
            const id = pendingClose;
            setPendingClose(null);
            void doCloseTab(id);
          }}
        />
      )}

      {modalOpen && (
        <CreateAgentModal
          defaults={{
            cli: settings.defaultCli,
            model: settings.defaultModel,
            workspace: settings.defaultWorkspace,
          }}
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
