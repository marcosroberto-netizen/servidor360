import { FileSignature, Send, ShieldCheck, X } from "lucide-react";
import type { ServidorOption } from "../types/afastamentos.types";

interface AssinaturaAtestadoDialogProps {
  open: boolean;
  servidor: ServidorOption | null;
  senha: string;
  isLoading: boolean;
  onSenhaChange: (value: string) => void;
  onCancel: () => void;
  onSubmitSigned: () => void;
  onSubmitUnsigned: () => void;
}

export function AssinaturaAtestadoDialog({
  open,
  servidor,
  senha,
  isLoading,
  onSenhaChange,
  onCancel,
  onSubmitSigned,
  onSubmitUnsigned,
}: AssinaturaAtestadoDialogProps) {
  if (!open) return null;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 px-4"
      role="dialog"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-strong">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
              <FileSignature className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Etapa de envio
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-950">
                Assinar atestado digitalmente
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {servidor
                  ? `Antes de enviar para analise, voce pode assinar o atestado de ${servidor.nome}.`
                  : "Antes de enviar para analise, voce pode assinar este atestado."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div className="px-5 py-5">
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start gap-2 text-sm leading-6 text-slate-700">
              <ShieldCheck
                className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700"
                aria-hidden="true"
              />
              <p>
                Ao assinar, o sistema registra autoria, data e hora, protocolo,
                hash SHA-256 e deixa a versao disponivel no cofre digital do
                processo.
              </p>
            </div>
          </div>

          <label className="mt-5 block text-sm font-semibold text-slate-700">
            Senha para assinatura
            <input
              type="password"
              value={senha}
              onChange={(event) => onSenhaChange(event.target.value)}
              disabled={isLoading}
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              autoFocus
            />
          </label>
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onSubmitUnsigned}
            disabled={isLoading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            Enviar sem assinatura
          </button>
          <button
            type="button"
            onClick={onSubmitSigned}
            disabled={isLoading || !senha.trim()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <FileSignature className="h-4 w-4" aria-hidden="true" />
            {isLoading ? "Enviando..." : "Assinar e enviar"}
          </button>
        </footer>
      </div>
    </div>
  );
}
