import type { Tab } from "../types";
import { STATUS_COLOR, tabStatusLabel } from "../types";
import { AgentGlyph, IDENTITY_COLORS, identityVar, identitySubtleVar, PlusIcon, CloseIcon, StatusGlyph } from "./icons";
import { BellIcon, BrandIcon, GearIcon } from "./HeaderIcons";

interface TabBarProps {
  tabs: Tab[];
  activeId: string | null;
  onSelect: (sessionId: string) => void;
  onClose: (sessionId: string) => void;
  onAdd: () => void;
  /** Abas bloqueadas/falhas/desconectadas (sino de avisos). */
  attention: number;
  onAttention: () => void;
  gearOpen: boolean;
  onGear: () => void;
}

/** Linha única de 48px (H2): marca | grupo Maestro | divisor | especialistas | + | avisos | engrenagem. */
export function TabBar({ tabs, activeId, onSelect, onClose, onAdd, attention, onAttention, gearOpen, onGear }: TabBarProps) {
  const indexed = tabs.map((tab, i) => ({ tab, i }));
  const maestros = indexed.filter((x) => x.tab.agent.type === "maestro");
  const others = indexed.filter((x) => x.tab.agent.type !== "maestro");

  const renderTab = ({ tab, i }: { tab: Tab; i: number }) => {
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
        title={`${tab.agent.name} · ${tab.agent.cliName} · ${tab.agent.model}${tab.agent.modelNote ? `\n⚠ ${tab.agent.modelNote}` : ""}`}
        onClick={() => onSelect(tab.sessionId)}
      >
        <span
          className="ork-tile"
          style={{ backgroundColor: identitySubtleVar(colorName), color: identityVar(colorName) }}
        >
          <AgentGlyph glyph={tab.agent.icon} size={18} />
        </span>
        <span className="ork-tab-name-row">
          <span className="ork-tab-name">{tab.agent.name}</span>
          {tab.agent.type === "maestro" && <span className="ork-maestro-mark" aria-label="Maestro">◆</span>}
        </span>
        <span className="ork-tab-meta">
          {tab.agent.cliName} · {tab.agent.model}
        </span>
        <span className="ork-tab-end">
          {tab.unseen && !active && <span className="ork-unseen" aria-label="nova saída" />}
          <span
            className={`ork-tab-status${tab.status === "blocked" ? " is-pulse" : ""}`}
            style={{ color: stateColor }}
          >
            <StatusGlyph status={tab.status} />
          </span>
          <button
            className="ork-tab-close"
            aria-label={`Fechar ${tab.agent.name}`}
            title={`Fechar ${tab.agent.name} (Ctrl+W)`}
            onClick={(e) => {
              e.stopPropagation();
              onClose(tab.sessionId);
            }}
          >
            <CloseIcon size={14} />
          </button>
        </span>
        {tab.status !== "idle" && (
          <div
            className={`ork-tab-trillho ${tab.status === "running" ? "is-running" : "is-static"}`}
            style={{ ["--trillho" as string]: stateColor }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="ork-tabbar">
      <span className="ork-brand" title="Orkest" aria-label="Orkest">
        <BrandIcon />
      </span>
      <div className="ork-tabs" role="tablist" aria-label="Agentes abertos">
        {maestros.map(renderTab)}
        {maestros.length > 0 && others.length > 0 && <span className="ork-vsep" aria-hidden="true" />}
        {others.map(renderTab)}
        <button className="ork-add" aria-label="Novo agente" title="Novo agente (Ctrl+Shift+N)" onClick={onAdd}>
          <PlusIcon />
        </button>
      </div>
      <span className="ork-tabbar-spacer" />
      <div className="ork-tools">
        <button
          className="ork-ibtn"
          aria-label={attention > 0 ? `Avisos: ${attention} aguardando ação` : "Avisos: nenhum"}
          title={attention > 0 ? `${attention} agente(s) bloqueado(s) ou com falha — clique para ir` : "Nenhum aviso"}
          disabled={attention === 0}
          onClick={onAttention}
        >
          <BellIcon />
          {attention > 0 && <span className="ork-ibtn-dot" />}
        </button>
        <button
          className={`ork-ibtn${gearOpen ? " is-on" : ""}`}
          aria-label="Configurações"
          aria-haspopup="menu"
          aria-expanded={gearOpen}
          title="Configurações (Ctrl+,)"
          onClick={onGear}
        >
          <GearIcon />
        </button>
      </div>
    </div>
  );
}
