import { RESULTADO_LABELS } from "../constants/afastamentos.constants";
import type {
  DevolutivaAfastamentoFormProps,
  DevolutivaResultado,
} from "../types/afastamentos.types";

export function DevolutivaAfastamentoForm({
  resultado,
  descricao,
  orientacoes,
  encaminharRh,
  onResultadoChange,
  onDescricaoChange,
  onOrientacoesChange,
  onEncaminharRhChange,
  onSubmit,
}: DevolutivaAfastamentoFormProps) {
  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-950">Devolutiva formal</h3>
      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Resultado
        </span>
        <select
          name="resultadoDevolutiva"
          value={resultado}
          onChange={(event) =>
            onResultadoChange(event.target.value as DevolutivaResultado)
          }
          className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus-visible:border-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-100"
        >
          {Object.entries(RESULTADO_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Descrição
        </span>
        <textarea
          name="descricaoDevolutiva"
          value={descricao}
          onChange={(event) => onDescricaoChange(event.target.value)}
          rows={3}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:border-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-100"
        />
      </label>
      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Orientações administrativas
        </span>
        <textarea
          name="orientacoesDevolutiva"
          value={orientacoes}
          onChange={(event) => onOrientacoesChange(event.target.value)}
          rows={2}
          placeholder="Informe as orientações administrativas…"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:border-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-100"
        />
      </label>
      <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="encaminharRh"
          checked={encaminharRh}
          onChange={(event) => onEncaminharRhChange(event.target.checked)}
        />
        Encaminhar ao RH
      </label>
      <button
        type="submit"
        className="mt-3 h-10 rounded-md bg-indigo-700 px-3 text-sm font-semibold text-white hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
      >
        Emitir devolutiva
      </button>
    </form>
  );
}
