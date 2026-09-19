import type { ProvidenciaAfastamentoFormProps } from "../types/afastamentos.types";

export function ProvidenciaAfastamentoForm({
  providencia,
  concluir,
  onProvidenciaChange,
  onConcluirChange,
  onSubmit,
}: ProvidenciaAfastamentoFormProps) {
  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-950">Providencia RH</h3>
      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Providência administrativa
        </span>
        <textarea
          name="providenciaAdministrativa"
          value={providencia}
          onChange={(event) => onProvidenciaChange(event.target.value)}
          rows={3}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:border-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
        />
      </label>
      <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="concluirProcesso"
          checked={concluir}
          onChange={(event) => onConcluirChange(event.target.checked)}
        />
        Concluir processo
      </label>
      <button
        type="submit"
        className="mt-3 h-10 rounded-md bg-slate-800 px-3 text-sm font-semibold text-white hover:bg-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2"
      >
        Registrar providência
      </button>
    </form>
  );
}
