import { useEffect, type ReactNode } from "react";
import { CloseIcon } from "./icons";

/** Casca de diálogo (mesmo padrão do modal de criação: cabeçalho/rodapé fixos). */
export function DialogShell({ title, onClose, footer, children, labelId }: {
  title: string; onClose: () => void; footer: ReactNode; children: ReactNode; labelId: string;
}) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);
  return (
    <div className="ork-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ork-modal" role="dialog" aria-modal="true" aria-labelledby={labelId}>
        <div className="ork-modal-header">
          <h2 className="ork-modal-title" id={labelId}>{title}</h2>
          <button className="ork-modal-close" aria-label="Fechar" onClick={onClose}>
            <CloseIcon size={16} />
          </button>
        </div>
        <div className="ork-modal-form">
          <div className="ork-modal-body">{children}</div>
          <div className="ork-modal-footer">{footer}</div>
        </div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }: {
  title: string; message: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <DialogShell
      title={title}
      labelId="ork-confirm-title"
      onClose={onCancel}
      footer={
        <>
          <button className="ork-btn ork-btn-secondary" onClick={onCancel} autoFocus>Cancelar</button>
          <button className="ork-btn ork-btn-primary" onClick={onConfirm}>{confirmLabel}</button>
        </>
      }
    >
      <p className="ork-dialog-text">{message}</p>
    </DialogShell>
  );
}

export const SHORTCUTS: [string, string][] = [
  ["Ctrl+Shift+N", "Novo agente"],
  ["Ctrl+Tab / Ctrl+Shift+Tab", "Próxima / anterior aba"],
  ["Ctrl+W", "Fechar aba (fora do terminal)"],
  ["Ctrl+Shift+W", "Fechar aba (também com o foco no terminal)"],
  ["Ctrl+,", "Configurações"],
  ["Ctrl+/", "Atalhos de teclado (fora do terminal)"],
  ["Ctrl+Shift+=", "Aumentar a fonte do terminal"],
  ["Ctrl+Alt+-", "Diminuir a fonte do terminal"],
  ["Ctrl+Shift+0", "Restaurar a fonte do terminal"],
  ["Ctrl+Shift+C / V", "Copiar / colar no terminal"],
];

export function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  return (
    <DialogShell title="Atalhos de teclado" labelId="ork-shortcuts-title" onClose={onClose}
      footer={<button className="ork-btn ork-btn-primary" onClick={onClose}>Fechar</button>}>
      <dl className="ork-kv">
        {SHORTCUTS.map(([k, v]) => (
          <div key={k} className="ork-kv-row"><dt><kbd>{k}</kbd></dt><dd>{v}</dd></div>
        ))}
      </dl>
    </DialogShell>
  );
}

export function KeyValueDialog({ title, rows, onClose, id }: {
  title: string; rows: [string, string][]; onClose: () => void; id: string;
}) {
  return (
    <DialogShell title={title} labelId={id} onClose={onClose}
      footer={<button className="ork-btn ork-btn-primary" onClick={onClose}>Fechar</button>}>
      <dl className="ork-kv">
        {rows.map(([k, v]) => (
          <div key={k} className="ork-kv-row"><dt>{k}</dt><dd className="is-mono">{v}</dd></div>
        ))}
      </dl>
    </DialogShell>
  );
}
