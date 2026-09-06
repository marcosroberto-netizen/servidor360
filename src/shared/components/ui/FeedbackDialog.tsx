import type { ReactNode } from 'react'

type FeedbackVariant = 'error' | 'success' | 'warning' | 'info' | 'loading'

interface FeedbackDialogProps {
  open: boolean
  title: string
  description?: ReactNode
  variant?: FeedbackVariant
  actionLabel?: string
  onClose?: () => void
}

const variantStyles: Record<FeedbackVariant, string> = {
  error: 'border-red-200 bg-red-50 text-red-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
  loading: 'border-blue-200 bg-blue-50 text-blue-700',
}

const variantSymbols: Record<FeedbackVariant, string> = {
  error: '!',
  success: '✓',
  warning: '!',
  info: 'i',
  loading: '',
}

export function FeedbackDialog({
  open,
  title,
  description,
  variant = 'info',
  actionLabel = 'Entendi',
  onClose,
}: FeedbackDialogProps) {
  if (!open) return null

  const canClose = variant !== 'loading' && Boolean(onClose)

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4"
      role="dialog"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-strong">
        <div className="flex items-start gap-4">
          <div
            aria-hidden="true"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-lg font-bold ${variantStyles[variant]}`}
          >
            {variant === 'loading' ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              variantSymbols[variant]
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {description && (
              <div className="mt-2 text-sm leading-6 text-slate-600">{description}</div>
            )}
          </div>
        </div>

        {canClose && (
          <div className="mt-6 flex justify-end">
            <button
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={onClose}
              type="button"
            >
              {actionLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
