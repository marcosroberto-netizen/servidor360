import { useState } from "react";
import type { AfastamentoDetalhe } from "../types/afastamentos.types";
import {
  documentoDisplayName,
  documentoPreviewKind,
} from "../utils/afastamentos.utils";

interface AfastamentoDocumentoPreviewProps {
  detalhe: AfastamentoDetalhe;
  canViewDocument: boolean;
}

export function AfastamentoDocumentoPreview({
  detalhe,
  canViewDocument,
}: AfastamentoDocumentoPreviewProps) {
  const [showViewer, setShowViewer] = useState(false);
  const displayName = documentoDisplayName(detalhe.tipo, detalhe.iniciadoEm);
  const previewKind = documentoPreviewKind(
    detalhe.documentoOrigemTipo,
    detalhe.documentoOrigemNome,
  );

  if (!detalhe.documentoOrigemNome) {
    return (
      <p className="mt-3 text-sm text-slate-500">Sem documento vinculado.</p>
    );
  }

  return (
    <>
      <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-950">
              {displayName}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Documento anexado ao processo.
            </p>
          </div>
          {canViewDocument && detalhe.documentoOrigemUrl ? (
            <button
              type="button"
              onClick={() => setShowViewer(true)}
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Visualizar documento
            </button>
          ) : (
            <span className="text-sm font-medium text-slate-500">
              Visualizacao restrita
            </span>
          )}
        </div>
      </div>

      {showViewer && canViewDocument && detalhe.documentoOrigemUrl && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 px-4 py-6"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-strong">
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Documento
                </p>
                <h2 className="mt-1 truncate text-lg font-bold text-slate-950">
                  {displayName}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowViewer(false)}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100"
                aria-label="Fechar visualizacao"
              >
                X
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-4">
              {previewKind === "image" && (
                <img
                  src={detalhe.documentoOrigemUrl}
                  alt={displayName}
                  className="mx-auto max-h-full max-w-full rounded-md bg-white object-contain"
                />
              )}
              {previewKind === "pdf" && (
                <iframe
                  src={detalhe.documentoOrigemUrl}
                  title={displayName}
                  className="h-full min-h-[70vh] w-full rounded-md bg-white"
                />
              )}
              {previewKind === "file" && (
                <div className="mx-auto max-w-md rounded-md bg-white p-6 text-center">
                  <p className="text-sm text-slate-600">
                    Este tipo de arquivo nao pode ser visualizado no navegador.
                  </p>
                  <a
                    href={detalhe.documentoOrigemUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white hover:bg-emerald-800"
                  >
                    Abrir arquivo
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
