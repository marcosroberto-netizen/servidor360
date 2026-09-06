import type { NovoAfastamentoFormProps } from "../types/afastamentos.types";
import { EmptyState, FieldLabel } from "./AfastamentoFormPrimitives";

export function NovoAfastamentoForm({
  form,
  selectedServidor,
  canSubmit,
  isPending,
  errorMessage,
  onClose,
  onFieldChange,
  onDocumentoChange,
  onSubmit,
}: NovoAfastamentoFormProps) {
  return (
    <form onSubmit={onSubmit} className="min-h-0 overflow-y-auto p-5">
      {!selectedServidor ? (
        <EmptyState>
          Selecione um funcionario para preencher os dados do afastamento.
        </EmptyState>
      ) : (
        <div className="mx-auto grid w-full max-w-2xl gap-5">
          <section>
            <h3 className="text-base font-semibold text-slate-950">
              Dados do afastamento
            </h3>
            <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(240px,1fr)_160px_160px]">
              <label>
                <FieldLabel>Tipo</FieldLabel>
                <select
                  value={form.tipo}
                  onChange={(event) => onFieldChange("tipo", event.target.value)}
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                >
                  <option>Atestado medico</option>
                  <option>Licenca medica</option>
                  <option>Readaptacao</option>
                  <option>Avaliacao ocupacional</option>
                  <option>Outro documento funcional</option>
                </select>
              </label>
              <label>
                <FieldLabel>Inicio</FieldLabel>
                <input
                  type="date"
                  value={form.dataInicio}
                  onChange={(event) =>
                    onFieldChange("dataInicio", event.target.value)
                  }
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
                />
              </label>
              <label>
                <FieldLabel>Fim</FieldLabel>
                <input
                  type="date"
                  value={form.dataFim}
                  onChange={(event) =>
                    onFieldChange("dataFim", event.target.value)
                  }
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
                />
              </label>
            </div>
          </section>
          <section>
            <h3 className="text-base font-semibold text-slate-950">
              Documento
            </h3>
            <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
              <input
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/webp"
                onChange={(event) =>
                  onDocumentoChange(event.target.files?.[0] ?? null)
                }
                className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
            </div>
          </section>
          <section>
            <h3 className="text-base font-semibold text-slate-950">
              Registro
            </h3>
            <div className="mt-3 grid gap-4">
              <label>
                <FieldLabel>Motivo</FieldLabel>
                <textarea
                  value={form.motivo}
                  onChange={(event) =>
                    onFieldChange("motivo", event.target.value)
                  }
                  rows={4}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label>
                <FieldLabel>Observacoes</FieldLabel>
                <textarea
                  value={form.observacoes}
                  onChange={(event) =>
                    onFieldChange("observacoes", event.target.value)
                  }
                  rows={3}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
            </div>
          </section>
          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}
          <div className="sticky bottom-0 -mx-5 flex justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Enviando..." : "Registrar afastamento"}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
