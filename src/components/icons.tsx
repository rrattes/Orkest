import type { ReactNode } from "react";
import type { SessionStatus } from "../types";

/* ====== Glifos de identidade do agente (16, §4.6) ======
   Geométricos e abstratos, traço único 1,5 em grade 16, sem dependência de cor. */

const g = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const AGENT_GLYPHS: ReactNode[] = [
  <g key="circle" {...g}><circle cx="8" cy="8" r="5.5" /></g>,
  <g key="square" {...g}><rect x="3" y="3" width="10" height="10" rx="1" /></g>,
  <g key="triangle" {...g}><path d="M8 3.5 L13 12 H3 Z" /></g>,
  <g key="diamond" {...g}><path d="M8 2.5 L13.5 8 L8 13.5 L2.5 8 Z" /></g>,
  <g key="hexagon" {...g}><path d="M8 2.5 L12.8 5.25 V10.75 L8 13.5 L3.2 10.75 V5.25 Z" /></g>,
  <g key="arc" {...g}><path d="M4 11.5 A5 5 0 0 1 12 11.5" /></g>,
  <g key="parallel" {...g}><path d="M3 4.5 H13 M3 11.5 H13" /></g>,
  <g key="cross" {...g}><path d="M8 3 V13 M3 8 H13" /></g>,
  <g key="dotring" {...g}><circle cx="8" cy="8" r="5.5" /><circle cx="8" cy="8" r="2" fill="currentColor" stroke="none" /></g>,
  <g key="wave" {...g}><path d="M2.5 8 C4 4.5 6 11.5 8 8 C10 4.5 12 11.5 13.5 8" /></g>,
  <g key="staff" {...g}><path d="M3 3 H13 M3 6 H13 M3 9 H13 M3 12 H13 M3 15 H13" /></g>,
  <g key="stairs" {...g}><path d="M3 12 V9 H8 V6 H13 V3" /></g>,
  <g key="grid" {...g}><rect x="3" y="3" width="10" height="10" rx="1" /><path d="M8 3 V13 M3 8 H13" /></g>,
  <g key="key" {...g}><circle cx="5.5" cy="5.5" r="2" /><path d="M7 7 L12 12 M10 10 L12 12 M8.5 8.5 L10 10" /></g>,
  <g key="orbit" {...g}><circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none" /><ellipse cx="8" cy="8" rx="6.5" ry="2.8" /></g>,
  <g key="arrow" {...g}><path d="M2.5 8 H12.5 M9 4.5 L12.5 8 L9 11.5" /></g>,
];

export function AgentGlyph({ glyph, size = 16 }: { glyph: number; size?: number }) {
  const idx = ((glyph % AGENT_GLYPHS.length) + AGENT_GLYPHS.length) % AGENT_GLYPHS.length;
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      {AGENT_GLYPHS[idx]}
    </svg>
  );
}

/* ====== Cores de identidade (8 matizes, §3.3) ====== */
export const IDENTITY_COLORS = [
  "blue",
  "lilac",
  "pink",
  "orange",
  "sand",
  "sage",
  "aqua",
  "stone",
] as const;

export function identityVar(name: string): string {
  return `var(--ork-identity-${name})`;
}

export function identitySubtleVar(name: string): string {
  return `var(--ork-identity-${name}-subtle)`;
}

/* ====== Glifo de estado (5 estados, §4.5): forma + cor ====== */
const s = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function StatusGlyph({ status, size = 14 }: { status: SessionStatus; size?: number }) {
  let inner: ReactNode;
  switch (status) {
    case "idle":
      inner = <circle cx="7" cy="7" r="5" {...s} />;
      break;
    case "running":
      // ¾ de anel aberto (◜), gira via CSS.
      inner = (
        <circle
          className="ork-status-running"
          cx="7"
          cy="7"
          r="5"
          pathLength={100}
          strokeDasharray="75 25"
          {...s}
        />
      );
      break;
    case "done":
      inner = (
        <>
          <circle cx="7" cy="7" r="5" fill="currentColor" stroke="none" />
          <path d="M4.6 7.1 L6.3 8.8 L9.4 5.4" {...s} stroke="var(--ork-bg-terminal)" />
        </>
      );
      break;
    case "blocked":
      inner = (
        <>
          <path d="M7 3 L12.2 11.5 H1.8 Z" {...s} />
          <path d="M4.6 9.4 H9.4" {...s} />
        </>
      );
      break;
    case "failed":
      inner = (
        <>
          <rect x="2" y="2" width="10" height="10" rx="2.5" fill="currentColor" stroke="none" />
          <path d="M5 5 L9 9 M9 5 L5 9" {...s} stroke="var(--ork-bg-terminal)" />
        </>
      );
      break;
    default:
      inner = <circle cx="7" cy="7" r="5" {...s} />;
  }
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true">
      {inner}
    </svg>
  );
}

/* ====== Ícones de UI (traço único, 16px) ====== */
export function PlusIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 3 V13 M3 8 H13" {...s} />
    </svg>
  );
}

export function CloseIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 4 L12 12 M12 4 L4 12" {...s} />
    </svg>
  );
}

/** Glifo neutro do CLI (prompt ">"), sem logos de terceiros (§4.3). */
export function CliGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 4.5 L8.5 8 L4 11.5" {...s} />
      <path d="M9.5 12.5 H12.5" {...s} />
    </svg>
  );
}
