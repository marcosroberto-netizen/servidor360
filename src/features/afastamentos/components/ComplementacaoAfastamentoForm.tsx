import { FileText, LoaderCircle, Send, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ComplementacaoAfastamentoFormProps } from "../types/afastamentos.types";

export function ComplementacaoAfastamentoForm({
  resposta,
  onRespostaChange,
  onDocumentoChange,
  onSubmit,
}: ComplementacaoAfastamentoFormProps) {
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isSelectingFile, setIsSelectingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isSelectingFile) return;

    const handleWindowFocus = () => setIsSelectingFile(false);
    window.addEventListener("focus", handleWindowFocus, { once: true });

    return () => window.removeEventListener("focus", handleWindowFocus);
  }, [isSelectingFile]);

  function handleDocumentoChange(file: File | null) {
    setIsSelectingFile(false);
    setSelectedFileName(file?.name ?? null);
    onDocumentoChange(file);
  }

  function handleChooseFile() {
    if (isSelectingFile) return;

    setIsSelectingFile(true);
    window.setTimeout(() => fileInputRef.current?.click(), 120);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="overflow-hidden rounded-lg border border-cyan-200 bg-white shadow-sm"
    >
      <div className="h-1 bg-cyan-600" aria-hidden="true" />
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-cyan-100 text-cyan-700">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-950">
              Responder complementação
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Registre a resposta e anexe o documento corrigido, se necessário.
            </p>
          </div>
        </div>

        <label className="mt-5 block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Resposta da complementação
          </span>
        <textarea
          name="respostaComplementacao"
          value={resposta}
          onChange={(event) => onRespostaChange(event.target.value)}
          rows={3}
          placeholder="Descreva as informações ou providências realizadas…"
          required
          className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
        />
        </label>

        <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
                <Upload className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800">
                  Documento complementar
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {selectedFileName ?? "Nenhum arquivo escolhido"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleChooseFile}
              disabled={isSelectingFile}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-cyan-300 bg-white px-3 text-sm font-semibold text-cyan-800 transition-colors hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:border-cyan-200 disabled:bg-cyan-50 disabled:text-cyan-700"
            >
              {isSelectingFile ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Abrindo explorador…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  Escolher arquivo
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              id="documento-complementar"
              name="documentoComplementar"
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              onChange={(event) =>
                handleDocumentoChange(event.target.files?.[0] ?? null)
              }
              className="sr-only"
            />
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            PDF, PNG, JPEG ou WebP. Anexe apenas se o documento fizer parte da resposta.
          </p>
          {selectedFileName ? (
            <button
              type="button"
              onClick={() => handleDocumentoChange(null)}
              className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 transition-colors hover:border-rose-300 hover:bg-rose-100 hover:text-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Remover arquivo
            </button>
          ) : null}
        </div>

        <div className="mt-5 flex justify-end border-t border-slate-200 pt-4">
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cyan-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:ring-offset-2"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            Enviar complementação
          </button>
        </div>
      </div>
    </form>
  );
}
