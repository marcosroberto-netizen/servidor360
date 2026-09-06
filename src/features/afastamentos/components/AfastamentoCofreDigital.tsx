import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  BadgeCheck,
  FileCheck2,
  Fingerprint,
  LockKeyhole,
  QrCode,
  ShieldCheck,
  Stamp,
} from "lucide-react";
import type {
  AfastamentoDetalhe,
  AfastamentoDocumentoDigital,
} from "../types/afastamentos.types";
import { formatDateTime } from "../utils/afastamentos.utils";

interface AfastamentoCofreDigitalProps {
  detalhe: AfastamentoDetalhe;
  canGenerateDocument: boolean;
  canSignDocument: boolean;
  isGenerating: boolean;
  isSigning: boolean;
  onGenerateDocument: (tipo: "devolutiva_formal") => void;
  onSignDocument: (documentoId: string, password: string) => void;
}

const statusLabels: Record<AfastamentoDocumentoDigital["status"], string> = {
  rascunho: "Rascunho",
  aguardando_assinatura: "Aguardando assinatura",
  assinado: "Assinado",
  substituido: "Substituido",
  cancelado: "Cancelado",
};

export function AfastamentoCofreDigital({
  detalhe,
  canGenerateDocument,
  canSignDocument,
  isGenerating,
  isSigning,
  onGenerateDocument,
  onSignDocument,
}: AfastamentoCofreDigitalProps) {
  const [signingDocument, setSigningDocument] =
    useState<AfastamentoDocumentoDigital | null>(null);
  const [password, setPassword] = useState("");
  const hasDevolutiva = detalhe.devolutivas.length > 0;

  const submitSignature = () => {
    if (!signingDocument || !password.trim()) return;
    onSignDocument(signingDocument.id, password);
    setPassword("");
    setSigningDocument(null);
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-slate-950">
                Cofre digital e assinaturas
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Versoes congeladas, hash, protocolo e validacao interna.
              </p>
            </div>
          </div>
        </div>
        {canGenerateDocument && hasDevolutiva && (
          <div>
            <button
              type="button"
              onClick={() => onGenerateDocument("devolutiva_formal")}
              disabled={isGenerating}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <FileCheck2 className="h-4 w-4" aria-hidden="true" />
              Gerar devolutiva
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-3">
        {detalhe.documentosDigitais.length === 0 && (
          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            Nenhum documento digital foi gerado para este processo.
          </div>
        )}

        {detalhe.documentosDigitais.map((documento) => (
          <DocumentoDigitalCard
            key={documento.id}
            documento={documento}
            canSignDocument={canSignDocument}
            isSigning={isSigning}
            onRequestSign={() => setSigningDocument(documento)}
          />
        ))}
      </div>

      {signingDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-strong">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                <LockKeyhole className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h4 className="text-base font-bold text-slate-950">
                  Confirmar assinatura
                </h4>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Confirme sua senha para registrar a assinatura eletronica do
                  documento {signingDocument.protocolo}.
                </p>
              </div>
            </div>
            <label className="mt-5 block text-sm font-semibold text-slate-700">
              Senha do usuario
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 block h-11 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                autoFocus
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSigningDocument(null);
                  setPassword("");
                }}
                className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submitSignature}
                disabled={isSigning || !password.trim()}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Stamp className="h-4 w-4" aria-hidden="true" />
                Assinar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function DocumentoDigitalCard({
  documento,
  canSignDocument,
  isSigning,
  onRequestSign,
}: {
  documento: AfastamentoDocumentoDigital;
  canSignDocument: boolean;
  isSigning: boolean;
  onRequestSign: () => void;
}) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const validationUrl = `${window.location.origin}/validar-documento/${documento.protocolo}`;

  useEffect(() => {
    let active = true;

    QRCode.toDataURL(validationUrl, {
      margin: 1,
      width: 112,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    }).then((url) => {
      if (active) setQrCodeUrl(url);
    });

    return () => {
      active = false;
    };
  }, [validationUrl]);

  return (
    <article className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-bold text-slate-950">
              {documento.titulo}
            </h4>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
              {statusLabels[documento.status]}
            </span>
          </div>
          <dl className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
            <div>
              <dt className="font-semibold uppercase tracking-wide text-slate-500">
                Protocolo
              </dt>
              <dd className="mt-1 font-mono text-slate-950">
                {documento.protocolo}
              </dd>
            </div>
            <div>
              <dt className="font-semibold uppercase tracking-wide text-slate-500">
                Criado em
              </dt>
              <dd className="mt-1 text-slate-950">
                {formatDateTime(documento.criadoEm)}
              </dd>
            </div>
          </dl>
          <div className="mt-3 rounded-md bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Fingerprint className="h-4 w-4" aria-hidden="true" />
              Hash SHA-256
            </div>
            <p className="mt-2 break-all font-mono text-xs leading-5 text-slate-700">
              {documento.hashSha256}
            </p>
          </div>
          {documento.assinaturas.length > 0 && (
            <div className="mt-3 grid gap-2">
              {documento.assinaturas.map((assinatura) => (
                <div
                  key={assinatura.id}
                  className="flex items-start gap-2 text-sm text-slate-700"
                >
                  <BadgeCheck
                    className="mt-0.5 h-4 w-4 text-emerald-700"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-semibold text-slate-950">
                      {assinatura.assinanteNome}
                    </p>
                    <p className="text-xs text-slate-500">
                      {assinatura.perfilAssinante ?? "Perfil nao informado"} -
                      {" "}
                      {formatDateTime(assinatura.assinadoEm)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-row items-center gap-3 md:flex-col">
          <div className="flex h-28 w-28 items-center justify-center rounded-md border border-slate-200 bg-white">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt={`QR Code de validacao do documento ${documento.protocolo}`}
                className="h-24 w-24"
              />
            ) : (
              <QrCode className="h-9 w-9 text-slate-300" aria-hidden="true" />
            )}
          </div>
          {documento.status === "aguardando_assinatura" && canSignDocument && (
            <button
              type="button"
              onClick={onRequestSign}
              disabled={isSigning}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Stamp className="h-4 w-4" aria-hidden="true" />
              Assinar
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
