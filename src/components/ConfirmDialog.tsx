export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Прибрати",
  cancelLabel = "Скасувати",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="font-display text-lg text-text">{title}</div>
        {message && <div className="mt-1 text-sm text-text-dim">{message}</div>}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-border px-4 py-3 font-bold text-text-dim"
          >
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className="flex-1 rounded-xl bg-danger px-4 py-3 font-bold text-bg">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
