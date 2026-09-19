import type { ReactNode } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const titleId = "confirm-dialog-title";
  const descriptionId = description ? "confirm-dialog-description" : undefined;

  return (
    <div
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 px-4"
      role="dialog"
    >
      <div className="w-full max-w-md overscroll-contain rounded-lg bg-white p-6 shadow-strong">
        <h2 id={titleId} className="text-lg font-semibold text-slate-950">{title}</h2>
        {description && (
          <div id={descriptionId} className="mt-2 text-sm leading-6 text-slate-600">
            {description}
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Enviando…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
