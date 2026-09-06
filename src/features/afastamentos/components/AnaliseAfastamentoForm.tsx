import type { SyntheticEvent } from "react";
import type { RegistrarAnaliseInput } from "../types/afastamentos.types";

interface AnaliseAfastamentoFormProps {
  analise: string;
  proximaAcao: RegistrarAnaliseInput["proximaAcao"];
  complemento: string;
  onAnaliseChange: (value: string) => void;
  onProximaAcaoChange: (
    value: RegistrarAnaliseInput["proximaAcao"],
  ) => void;
  onComplementoChange: (value: string) => void;
  onSubmit: (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => void;
}

export function AnaliseAfastamentoForm({
  analise,
  proximaAcao,
  complemento,
  onAnaliseChange,
  onProximaAcaoChange,
  onComplementoChange,
  onSubmit,
}: AnaliseAfastamentoFormProps) {
  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-950">Analise CAS</h3>
      <textarea
        value={analise}
        onChange={(event) => onAnaliseChange(event.target.value)}
        rows={3}
        className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <select
          value={proximaAcao}
          onChange={(event) =>
            onProximaAcaoChange(
              event.target.value as RegistrarAnaliseInput["proximaAcao"],
            )
          }
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
        >
          <option value="registrar">Registrar analise</option>
          <option value="solicitar_complementacao">
            Solicitar complementacao
          </option>
          <option value="encaminhar_avaliacao">Encaminhar avaliacao</option>
          <option value="encaminhar_rh">Encaminhar RH</option>
        </select>
        <button className="h-10 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white">
          Salvar
        </button>
      </div>
      {proximaAcao === "solicitar_complementacao" && (
        <textarea
          value={complemento}
          onChange={(event) => onComplementoChange(event.target.value)}
          rows={2}
          placeholder="Pendencia solicitada"
          className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      )}
    </form>
  );
}
