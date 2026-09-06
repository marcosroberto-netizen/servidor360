import type { SyntheticEvent } from "react";

interface ComplementacaoAfastamentoFormProps {
  resposta: string;
  onRespostaChange: (value: string) => void;
  onDocumentoChange: (value: File | null) => void;
  onSubmit: (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => void;
}

export function ComplementacaoAfastamentoForm({
  resposta,
  onRespostaChange,
  onDocumentoChange,
  onSubmit,
}: ComplementacaoAfastamentoFormProps) {
  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-950">Complementacao</h3>
      <textarea
        value={resposta}
        onChange={(event) => onRespostaChange(event.target.value)}
        rows={3}
        className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        type="file"
        accept="application/pdf,image/png,image/jpeg,image/webp"
        onChange={(event) => onDocumentoChange(event.target.files?.[0] ?? null)}
        className="mt-3 block w-full text-sm"
      />
      <button className="mt-3 h-10 rounded-md bg-cyan-700 px-3 text-sm font-semibold text-white">
        Enviar complementacao
      </button>
    </form>
  );
}
