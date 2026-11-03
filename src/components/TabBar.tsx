import type { Tab } from "../types";
import { STATUS_COLOR, tabStatusLabel } from "../types";
import { AgentGlyph, IDENTITY_COLORS, identityVar, identitySubtleVar, PlusIcon, CloseIcon, StatusGlyph } from "./icons";

interface TabBarProps {
  tabs: Tab[];
  activeId: string | null;
  onSelect: (sessionId: string) => void;
  onClose: (sessionId: string) => void;
  onAdd: () => void;
}

export function TabBar({ tabs, activeId, onSelect, onClose, onAdd }: TabBarProps) {
  return (
    <div className="ork-tabbar" role="tablist" aria-label="Agentes abertos">
      <div className="ork-tabs">
        {tabs.map((tab, i) => {
          const active = tab.sessionId === activeId;
          const colorName = IDENTITY_COLORS[tab.agent.identityColor % IDENTITY_COLORS.length];
          const stateColor = STATUS_COLOR[tab.status];
          const label = `${tab.agent.name} · ${tabStatusLabel(tab)}`;
          return (
            <div
              key={tab.sessionId}
              role="tab"
              id={`ork-tab-${i}`}
              aria-selected={active}
              aria-controls="ork-terminal"
              aria-label={label}
              tabIndex={active ? 0 : -1}
              className={`ork-tab${active ? " is-active" : ""}`}
              title={`${tab.agent.name} · ${tab.agent.cliName} · ${tab.agent.model}`}
              onClick={() => onSelect(tab.sessionId)}
            >
              <div className="ork-tab-row">
                <span
                  className="ork-tile"
                  style={{
                    backgroundColor: identitySubtleVar(colorName),
                    color: identityVar(colorName),
                  }}
                >
                  <AgentGlyph glyph={tab.agent.icon} />
                </span>
                <span className="ork-tab-name">{tab.agent.name}</span>
                {tab.agent.type === "maestro" && (
                  <span className="ork-maestro-mark" aria-label="Maestro">◆</span>
                )}
                {tab.unseen && !active && <span className="ork-unseen" aria-label="nova saída" />}
                <span className={`ork-tab-status${tab.status === "blocked" ? " is-pulse" : ""}`} style={{ color: stateColor }}>
                  <StatusGlyph status={tab.status} />
                </span>
                <button
                  className="ork-tab-close"
                  aria-label={`Fechar ${tab.agent.name}`}
                  title={`Fechar ${tab.agent.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose(tab.sessionId);
                  }}
                >
                  <CloseIcon size={14} />
                </button>
              </div>
              <div className="ork-tab-meta">
                {tab.agent.cliName} · {tab.agent.model}
              </div>
              {tab.status !== "idle" && (
                <div
                  className={`ork-tab-trillho ${tab.status === "running" ? "is-running" : "is-static"}`}
                  style={{ ["--trillho" as string]: stateColor }}
                />
              )}
            </div>
          );
        })}
        <button
          className="ork-add"
          aria-label="Novo agente"
          title="Novo agente (Ctrl+Shift+N)"
          onClick={onAdd}
        >
          <PlusIcon />
        </button>
      </div>
    </div>
  );
}
