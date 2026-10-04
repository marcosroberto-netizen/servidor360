import { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";

interface RestricaoValues {
  description: string;
  startDate: string;
  endDate: string;
}

export function RestricoesAtendimentoDialog({
  description,
  startDate,
  endDate,
  onClose,
  onSave,
}: {
  description: RestricaoValues["description"];
  startDate: RestricaoValues["startDate"];
  endDate: RestricaoValues["endDate"];
  onClose: () => void;
  onSave: (values: RestricaoValues) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(description);
  const [draftStartDate, setDraftStartDate] = useState(startDate);
  const [draftEndDate, setDraftEndDate] = useState(endDate);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="restricoes-title"
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
      className="m-auto h-[min(640px,calc(100dvh-2rem))] max-h-none w-[calc(100%-2rem)] max-w-3xl overflow-hidden rounded-lg border border-slate-200 bg-white p-0 text-slate-950 shadow-2xl backdrop:bg-slate-950/50"
    >
      <form
        className="flex h-full min-h-0 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          if (draft.trim().length < 8) {
            setError("Descreva as restrições aplicáveis.");
            return;
          }
          if (!draftStartDate || !draftEndDate) {
            setError("Informe o início e o fim da restrição.");
            return;
          }
          if (draftEndDate < draftStartDate) {
            setError("A data final deve ser posterior ou igual à inicial.");
            return;
          }
          onSave({
            description: draft.trim(),
            startDate: draftStartDate,
            endDate: draftEndDate,
          });
        }}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
          <h2 id="restricoes-title" className="text-lg font-semibold">
            Descrição das restrições
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar restrições"
            title="Fechar restrições"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-4 sm:p-6">
          <div className="grid shrink-0 gap-3 sm:grid-cols-2">
            <label className="block min-w-0 text-sm font-semibold text-slate-700">
              Início da restrição
              <input
                type="date"
                name="restricaoInicio"
                value={draftStartDate}
                onChange={(event) => {
                  setDraftStartDate(event.target.value);
                  setError(null);
                }}
                className="mt-2 block h-10 w-full min-w-0 rounded-md border border-slate-300 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              />
            </label>
            <label className="block min-w-0 text-sm font-semibold text-slate-700">
              Fim da restrição
              <input
                type="date"
                name="restricaoFim"
                value={draftEndDate}
                onChange={(event) => {
                  setDraftEndDate(event.target.value);
                  setError(null);
                }}
                className="mt-2 block h-10 w-full min-w-0 rounded-md border border-slate-300 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              />
            </label>
          </div>
          <label
            htmlFor="restricoes-description"
            className="text-sm font-semibold text-slate-700"
          >
            Restrições aplicáveis
          </label>
          <textarea
            id="restricoes-description"
            name="restricoes"
            autoComplete="off"
            autoFocus
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setError(null);
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "restricoes-error" : undefined}
            placeholder="Descreva limitações, atividades vedadas e cuidados…"
            className="min-h-0 w-full flex-1 resize-none rounded-md border border-slate-300 px-3 py-3 text-sm leading-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          />
          {error && (
            <p
              id="restricoes-error"
              role="alert"
              className="text-sm text-red-700"
            >
              {error}
            </p>
          )}
        </div>
        <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            Salvar restrições
          </button>
        </footer>
      </form>
    </dialog>
  );
}
