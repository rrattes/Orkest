import { PlusIcon } from "./icons";

interface EmptyStateProps {
  onAdd: () => void;
}

export function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="ork-empty">
      <h1>Nenhum agente aberto</h1>
      <p>Crie um agente para começar a operar um terminal real.</p>
      <button className="ork-btn ork-btn-primary" onClick={onAdd}>
        <PlusIcon size={14} />
        Novo agente
      </button>
      <span className="ork-empty-hint">
        <kbd>Ctrl</kbd>
        <span>+</span>
        <kbd>Shift</kbd>
        <span>+</span>
        <kbd>N</kbd>
      </span>
    </div>
  );
}
