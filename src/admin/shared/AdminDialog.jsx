import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

// Diálogo modal nativo do painel: showModal() prende o foco e trata o Esc; quem abre decide quando fechar.
export default function AdminDialog({ id, eyebrow, title, onClose, wide = false, children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      aria-labelledby={`${id}-title`}
      className={`admin-dialog${wide ? ' is-wide' : ''}`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      ref={dialogRef}
    >
      <div className="admin-dialog-header">
        <div>
          {eyebrow ? <p className="admin-eyebrow">{eyebrow}</p> : null}
          <h2 id={`${id}-title`}>{title}</h2>
        </div>
        <button aria-label="Fechar" className="admin-icon-button" onClick={onClose} type="button">
          <X size={19} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
