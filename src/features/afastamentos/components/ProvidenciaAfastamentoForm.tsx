import type { SyntheticEvent } from "react";

interface ProvidenciaAfastamentoFormProps {
  providencia: string;
  concluir: boolean;
  onProvidenciaChange: (value: string) => void;
  onConcluirChange: (value: boolean) => void;
  onSubmit: (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => void;
}

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
      <textarea
        value={providencia}
        onChange={(event) => onProvidenciaChange(event.target.value)}
        rows={3}
        className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={concluir}
          onChange={(event) => onConcluirChange(event.target.checked)}
        />
        Concluir processo
      </label>
      <button className="mt-3 h-10 rounded-md bg-slate-800 px-3 text-sm font-semibold text-white">
        Registrar providencia
      </button>
    </form>
  );
}
