import { FileUp, Loader2 } from "lucide-react";
import type { NovoAfastamentoFormProps } from "../types/afastamentos.types";
import { EmptyState, FieldLabel } from "./AfastamentoFormPrimitives";

export function NovoAfastamentoForm({
  form,
  selectedServidor,
  canSubmit,
  isPending,
  isDocumentoLoading,
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
                <FieldLabel required>Tipo</FieldLabel>
                <select
                  value={form.tipo}
                  onChange={(event) => onFieldChange("tipo", event.target.value)}
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                  required
                >
                  <option>Atestado medico</option>
                  <option>Licenca medica</option>
                  <option>Readaptacao</option>
                  <option>Avaliacao ocupacional</option>
                  <option>Outro documento funcional</option>
                </select>
              </label>
              <label>
                <FieldLabel required>Inicio</FieldLabel>
                <input
                  type="date"
                  value={form.dataInicio}
                  onChange={(event) =>
                    onFieldChange("dataInicio", event.target.value)
                  }
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
                  required
                />
              </label>
              <label>
                <FieldLabel required>Fim</FieldLabel>
                <input
                  type="date"
                  value={form.dataFim}
                  onChange={(event) =>
                    onFieldChange("dataFim", event.target.value)
                  }
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
                  required
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
                id="documento-afastamento"
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/webp"
                onChange={(event) =>
                  onDocumentoChange(event.target.files?.[0] ?? null)
                }
                className="sr-only"
              />
              <label
                htmlFor="documento-afastamento"
                className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                {isDocumentoLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <FileUp className="h-4 w-4" aria-hidden="true" />
                )}
                {isDocumentoLoading ? "Carregando..." : "Carregar atestado"}
              </label>
              <p className="mt-3 text-sm text-slate-600">
                {form.documentoArquivo
                  ? form.documentoArquivo.name
                  : "PDF, PNG, JPG ou WEBP ate 10 MB."}
              </p>
            </div>
          </section>
          <section>
            <h3 className="text-base font-semibold text-slate-950">
              Registro
            </h3>
            <div className="mt-3 grid gap-4">
              <label>
                <FieldLabel required>Motivo</FieldLabel>
                <textarea
                  value={form.motivo}
                  onChange={(event) =>
                    onFieldChange("motivo", event.target.value)
                  }
                  rows={4}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  required
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
