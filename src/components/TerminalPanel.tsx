import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { writeInput, resizePty } from "../lib/tauri";
import { readToken } from "../lib/tokens";
import { debounce } from "../lib/debounce";
import type { Tab } from "../types";

interface TerminalPanelProps {
  tab: Tab;
  active: boolean;
  fontSize: number;
  onSize: (sessionId: string, cols: number, rows: number) => void;
}

function copyText(text: string) {
  try {
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(text);
  } catch {
    /* clipboard indisponível (webkit2gtk sem permissão) — ignorado */
  }
}

function pasteInto(term: Terminal) {
  try {
    if (navigator.clipboard?.readText) {
      void navigator.clipboard.readText().then((text) => term.paste(text));
    }
  } catch {
    /* clipboard indisponível — ignorado */
  }
}

export function TerminalPanel({ tab, active, fontSize, onSize }: TerminalPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const [focused, setFocused] = useState(false);
  const onSizeRef = useRef(onSize);
  onSizeRef.current = onSize;
  const fontSizeRef = useRef(fontSize);
  fontSizeRef.current = fontSize;

  // Cria o xterm e conecta teclado/saída/resize. Reexecuta apenas quando a sessão muda.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: "block",
      cursorInactiveStyle: "outline",
      fontFamily: readToken("--ork-font-mono-family"),
      fontSize: fontSizeRef.current,
      lineHeight: 1.25,
      scrollback: 5000,
      theme: {
        background: readToken("--ork-bg-terminal"),
        foreground: readToken("--ork-text-terminal"),
        cursor: readToken("--ork-accent"),
        cursorAccent: readToken("--ork-bg-terminal"),
        selectionBackground: readToken("--ork-selection"),
        black: readToken("--ork-ansi-black"),
        red: readToken("--ork-ansi-red"),
        green: readToken("--ork-ansi-green"),
        yellow: readToken("--ork-ansi-yellow"),
        blue: readToken("--ork-ansi-blue"),
        magenta: readToken("--ork-ansi-magenta"),
        cyan: readToken("--ork-ansi-cyan"),
        white: readToken("--ork-ansi-white"),
        brightBlack: readToken("--ork-ansi-bright-black"),
        brightRed: readToken("--ork-ansi-bright-red"),
        brightGreen: readToken("--ork-ansi-bright-green"),
        brightYellow: readToken("--ork-ansi-bright-yellow"),
        brightBlue: readToken("--ork-ansi-bright-blue"),
        brightMagenta: readToken("--ork-ansi-bright-magenta"),
        brightCyan: readToken("--ork-ansi-bright-cyan"),
        brightWhite: readToken("--ork-ansi-bright-white"),
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(container);

    termRef.current = term;
    fitRef.current = fit;

    const sendResize = debounce((c: number, r: number) => {
      void resizePty(tab.sessionId, c, r).catch(() => {});
    }, 100);

    const disposeResize = term.onResize(({ cols, rows }) => {
      onSizeRef.current(tab.sessionId, cols, rows);
      sendResize(cols, rows);
    });

    const disposeData = term.onData((data) => {
      void writeInput(tab.sessionId, data).catch(() => {});
    });

    // Copiar/colar (convenção Linux Ctrl+Shift+C/V) + colar nativo do browser.
    term.attachCustomKeyEventHandler((arg: KeyboardEvent) => {
      if (arg.type === "keydown" && arg.ctrlKey && arg.shiftKey) {
        if (arg.code === "KeyC") {
          const sel = term.getSelection();
          if (sel) copyText(sel);
          return false;
        }
        if (arg.code === "KeyV") {
          pasteInto(term);
          return false;
        }
      }
      return true;
    });

    const onPaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text");
      if (text) {
        e.preventDefault();
        term.paste(text);
      }
    };
    container.addEventListener("paste", onPaste);

    let disposed = false;
    let unlistenOutput: UnlistenFn | undefined;

    void (async () => {
      const un = await listen<{ session_id: string; data: string }>(
        "session-output",
        (e) => {
          if (e.payload.session_id === tab.sessionId) {
            term.write(e.payload.data);
          }
        },
      );
      if (disposed) {
        un();
      } else {
        unlistenOutput = un;
      }
    })();

    // fit inicial após o layout (painel pode estar oculto, mas com dimensões reais).
    const raf = requestAnimationFrame(() => {
      try {
        fit.fit();
      } catch {
        /* ignora fit antes de o elemento ter dimensões */
      }
    });

    // Recalcula o fit quando o contêiner redimensiona (debounce ~50ms, §4.4).
    const scheduleFit = debounce(() => {
      try {
        fit.fit();
      } catch {
        /* ignora */
      }
    }, 50);
    const ro = new ResizeObserver(() => scheduleFit());
    ro.observe(container);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      disposeResize.dispose();
      disposeData.dispose();
      unlistenOutput?.();
      container.removeEventListener("paste", onPaste);
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
  }, [tab.sessionId]);

  // Ao ativar: reajusta o fit e devolve o foco ao terminal; ao desativar: tira o foco.
  useEffect(() => {
    const term = termRef.current;
    const fit = fitRef.current;
    if (!term || !fit) return;
    if (active) {
      const raf = requestAnimationFrame(() => {
        try {
          fit.fit();
        } catch {
          /* ignora */
        }
        term.focus();
      });
      return () => cancelAnimationFrame(raf);
    }
    term.blur();
    return undefined;
  }, [active]);

  // Ajusta o tamanho da fonte do terminal e refaz o fit (§9.4).
  useEffect(() => {
    const term = termRef.current;
    const fit = fitRef.current;
    if (!term || !fit) return;
    term.options.fontSize = fontSize;
    try {
      fit.fit();
    } catch {
      /* ignora */
    }
  }, [fontSize]);

  return (
    <div
      role="region"
      data-session-id={tab.sessionId}
      aria-label={`Terminal de ${tab.agent.name}`}
      className={`ork-term-panel${focused && active ? " is-focused" : ""}`}
      style={{ visibility: active ? "visible" : "hidden" }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <div ref={containerRef} className="ork-term" />
    </div>
  );
}
