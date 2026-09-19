import type { ReactNode } from "react";

export function FieldLabel({
  children,
  required = false,
  htmlFor,
}: {
  children: string;
  required?: boolean;
  htmlFor?: string;
}) {
  const className =
    "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500";
  const content = (
    <>
      {children}
      {required && (
        <span className="ml-1 text-red-600" aria-label="obrigatorio">
          *
        </span>
      )}
    </>
  );

  if (htmlFor) {
    return (
      <label htmlFor={htmlFor} className={className}>
        {content}
      </label>
    );
  }

  return (
    <span className={className}>
      {content}
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
