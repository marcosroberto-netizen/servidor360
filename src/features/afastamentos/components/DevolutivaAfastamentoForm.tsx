import type { SyntheticEvent } from "react";
import type { DevolutivaResultado } from "../types/afastamentos.types";
import { resultadoLabels } from "../utils/afastamentos.utils";

interface DevolutivaAfastamentoFormProps {
  resultado: DevolutivaResultado;
  descricao: string;
  orientacoes: string;
  encaminharRh: boolean;
  onResultadoChange: (value: DevolutivaResultado) => void;
  onDescricaoChange: (value: string) => void;
  onOrientacoesChange: (value: string) => void;
  onEncaminharRhChange: (value: boolean) => void;
  onSubmit: (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => void;
}

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
      <select
        value={resultado}
        onChange={(event) =>
          onResultadoChange(event.target.value as DevolutivaResultado)
        }
        className="mt-3 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
      >
        {Object.entries(resultadoLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <textarea
        value={descricao}
        onChange={(event) => onDescricaoChange(event.target.value)}
        rows={3}
        className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      <textarea
        value={orientacoes}
        onChange={(event) => onOrientacoesChange(event.target.value)}
        rows={2}
        placeholder="Orientacoes administrativas"
        className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={encaminharRh}
          onChange={(event) => onEncaminharRhChange(event.target.checked)}
        />
        Encaminhar ao RH
      </label>
      <button className="mt-3 h-10 rounded-md bg-indigo-700 px-3 text-sm font-semibold text-white">
        Emitir devolutiva
      </button>
    </form>
  );
}
