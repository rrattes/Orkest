interface EmptyStateProps {
  onAdd: () => void;
}

export function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="ork-empty">
      <h1>Nenhum agente aberto</h1>
      <p>Crie um agente para começar a operar um terminal real.</p>
      <button className="ork-btn ork-btn-primary" onClick={onAdd}>
        Novo agente
      </button>
    </div>
  );
}
