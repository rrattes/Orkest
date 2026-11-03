import type { Tab } from "../types";
import { STATUS_LABELS } from "../types";

interface ContextBarProps {
  tab: Tab | null;
  cols: number;
  rows: number;
}

/** Barra de contexto de 24 px no rodapé (§4.4). */
export function ContextBar({ tab, cols, rows }: ContextBarProps) {
  return (
    <div className="ork-contextbar">
      <span className="ork-ctx-workspace" title={tab?.agent.workspace ?? ""}>
        {tab ? tab.agent.workspace : "—"}
      </span>
      <span className="ork-ctx-spacer" />
      <span>{tab ? tab.title : "—"}</span>
      <span className="ork-ctx-spacer" />
      <span>
        {tab ? `${STATUS_LABELS[tab.status]} · ${cols}×${rows}` : "—"}
      </span>
    </div>
  );
}
