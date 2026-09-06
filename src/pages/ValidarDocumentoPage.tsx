import { useParams } from "react-router-dom";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  CircleAlert,
  Fingerprint,
  FileCheck2,
  ShieldCheck,
} from "lucide-react";
import { ModuleLayout } from "@/shared/components/ModuleLayout";
import { validarDocumentoDigital } from "@/features/afastamentos";

function formatDateTime(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function ValidarDocumentoPage() {
  const { protocolo = "" } = useParams();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["validar-documento", protocolo],
    queryFn: () => validarDocumentoDigital(protocolo),
    enabled: Boolean(protocolo),
    retry: false,
  });

  return (
    <ModuleLayout
      moduleName="Validador"
      title="Validacao de documento digital"
      description="Confira protocolo, integridade e assinatura registrada no Servidor 360."
      navItems={[{ label: "Validacao", to: "#", active: true }]}
    >
      <div className="mx-auto w-full max-w-3xl">
        {isLoading && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            Validando documento...
          </div>
        )}

        {isError && (
          <div className="rounded-lg border border-red-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-red-50 text-red-700">
                <CircleAlert className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-950">
                  Documento nao validado
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {error instanceof Error
                    ? error.message
                    : "Nao foi possivel validar este protocolo."}
                </p>
              </div>
            </div>
          </div>
        )}

        {data && (
          <section className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                <ShieldCheck className="h-6 w-6" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Documento encontrado
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">
                  {data.titulo}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Processo {data.processoProtocolo ?? "sem protocolo"} -
                  Servidor {data.servidorNome}
                </p>
              </div>
            </div>

            <dl className="mt-6 grid gap-3 sm:grid-cols-3">
              <Info label="Protocolo">{data.protocolo}</Info>
              <Info label="Status">{data.status}</Info>
              <Info label="Assinado em">
                {data.assinadoEm ? formatDateTime(data.assinadoEm) : "-"}
              </Info>
            </dl>

            <div className="mt-4 rounded-md bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Fingerprint className="h-4 w-4" aria-hidden="true" />
                Hash SHA-256
              </div>
              <p className="mt-2 break-all font-mono text-xs leading-5 text-slate-700">
                {data.hashSha256}
              </p>
            </div>

            <div className="mt-5">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-slate-500" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-slate-950">
                  Assinaturas registradas
                </h3>
              </div>
              <div className="mt-3 grid gap-3">
                {data.assinantes.map((assinatura) => (
                  <article
                    key={assinatura.id}
                    className="rounded-md border border-slate-200 p-3"
                  >
                    <div className="flex items-start gap-2">
                      <BadgeCheck
                        className="mt-0.5 h-4 w-4 text-emerald-700"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          {assinatura.assinanteNome}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {assinatura.perfilAssinante ?? "Perfil nao informado"} -
                          {" "}
                          {formatDateTime(assinatura.assinadoEm)}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </ModuleLayout>
  );
}

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold text-slate-950">
        {children}
      </dd>
    </div>
  );
}
