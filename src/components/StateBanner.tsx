import type { ReactNode } from "react";
import type { Tab } from "../types";
import { STATUS_COLOR } from "../types";
import { AgentGlyph, IDENTITY_COLORS, identityVar, identitySubtleVar, StatusGlyph } from "./icons";

export interface BannerActions {
  onPrompt: () => void;
  onLog: () => void;
  onRestart: () => void;
  onReconnect: () => void;
  onViewAgent: (name: string) => void;
}

const ICON: Record<string, ReactNode> = {
  prompt: <path d="M3 4l4 4-4 4M9 12h4" />,
  log: <path d="M3 4h10M3 8h10M3 12h6" />,
  refresh: <path d="M13 8a5 5 0 1 1-1.5-3.5M13 3v3h-3" />,
  link: (
    <path d="M6.5 9.5l3-3M5 8l-1.2 1.2a2.5 2.5 0 0 0 3.5 3.5L8.5 11.5M11 8l1.2-1.2a2.5 2.5 0 0 0-3.5-3.5L7.5 4.5" />
  ),
};

function BtnIcon({ name }: { name: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICON[name]}
    </svg>
  );
}

interface Spec {
  glyph: Tab["status"];
  title: string;
  sub: string;
  chip?: { agent: Tab | null; label: string };
  buttons: { icon: string; label: string; onClick: () => void }[];
}

/** Resolve o banner (§9.9) a partir do estado REAL da aba; null = sem banner. */
function specFor(tab: Tab, tabs: Tab[], a: BannerActions): Spec | null {
  if (tab.disconnected) {
    return {
      glyph: "blocked",
      title: "Sessão desconectada",
      sub: tab.notice ?? "o cliente tmux encerrou; a sessão continua ativa",
      buttons: [{ icon: "link", label: "Reconectar", onClick: a.onReconnect }],
    };
  }
  if (tab.status === "failed") {
    return {
      glyph: "failed",
      title: tab.exitSignal ? "Processo encerrado" : "Falhou",
      sub: tab.exitSignal ? `sinal ${tab.exitSignal}` : `código de saída ${tab.exitCode ?? "?"}`,
      buttons: [
        { icon: "log", label: "Ver log", onClick: a.onLog },
        { icon: "refresh", label: "Reiniciar", onClick: a.onRestart },
      ],
    };
  }
  if (tab.status === "blocked" && tab.blocker) {
    const b = tab.blocker;
    if (b.kind === "user") {
      return {
        glyph: "blocked",
        title: "Bloqueado",
        sub: "aguardando a sua resposta",
        buttons: [{ icon: "prompt", label: "Ir ao prompt", onClick: a.onPrompt }],
      };
    }
    const other = tabs.find((t) => t.agent.name === b.agent) ?? null;
    return {
      glyph: "blocked",
      title: "Bloqueado",
      sub: "aguardando resposta",
      chip: { agent: other, label: `${b.agent ?? "agente"} · t-${b.taskId.slice(0, 4)}` },
      buttons: other && b.agent ? [{ icon: "link", label: `Ver ${b.agent}`, onClick: () => a.onViewAgent(b.agent!) }] : [],
    };
  }
  return null;
}

/** Banner de estado de 36px (§9.9): entre o terminal e a barra de contexto. */
export function StateBanner({ tab, tabs, actions }: { tab: Tab; tabs: Tab[]; actions: BannerActions }) {
  const spec = specFor(tab, tabs, actions);
  if (!spec) return null;
  const color = STATUS_COLOR[spec.glyph];
  const chipAgent = spec.chip?.agent;
  const chipColor = chipAgent
    ? IDENTITY_COLORS[chipAgent.agent.identityColor % IDENTITY_COLORS.length]
    : "lilac";
  return (
    <div className="ork-banner" role="status" style={{ ["--c" as string]: color }}>
      <span className="ork-banner-glyph" style={{ color }}>
        <StatusGlyph status={spec.glyph} />
      </span>
      <span className="ork-banner-tx">
        {spec.title} <em>{spec.sub}</em>
      </span>
      {spec.chip && (
        <span className="ork-chip">
          <span className="ork-chip-tile" style={{ backgroundColor: identitySubtleVar(chipColor), color: identityVar(chipColor) }}>
            <AgentGlyph glyph={chipAgent ? chipAgent.agent.icon : 0} size={10} />
          </span>
          {spec.chip.label}
        </span>
      )}
      <span className="ork-banner-sp" />
      {spec.buttons.map((b) => (
        <button key={b.label} className="ork-banner-btn" onClick={b.onClick}>
          <BtnIcon name={b.icon} />
          {b.label}
        </button>
      ))}
    </div>
  );
}
