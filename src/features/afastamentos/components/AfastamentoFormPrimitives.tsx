import type { ReactNode } from "react";

export function FieldLabel({
  children,
  required = false,
}: {
  children: string;
  required?: boolean;
}) {
  return (
    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
      {required && (
        <span className="ml-1 text-red-600" aria-label="obrigatorio">
          *
        </span>
      )}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
      {children}
    </div>
  );
}
