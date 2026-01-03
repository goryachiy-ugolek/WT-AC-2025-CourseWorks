interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmLabel = "Подтвердить",
  cancelLabel = "Отмена",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
        </div>
        <div className="modal-body">
          <p style={{ margin: 0 }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Загрузка..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
