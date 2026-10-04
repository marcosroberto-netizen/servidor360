import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import {
  ClipboardCheck,
  FileCheck2,
  FileText,
  History,
  Stamp,
  X,
} from "lucide-react";
import {
  useAfastamentoDetalhe,
  useAssinarDocumentoDigital,
  useEmitirDevolutiva,
  useGerarDocumentoDigital,
} from "../hooks/useAfastamentos";
import {
  buildDevolutivaFormalDocumentoInput,
  getAfastamentoDetalhe,
} from "../services/afastamentosService";
import type { AtendimentoMedicoFormValues } from "../types/afastamentos.types";
import {
  atendimentoDefaultValues,
  atendimentoSchema,
} from "../utils/atendimentoMedicoSchema";
import {
  formatDate,
  formatDateTime,
  getErrorMessage,
} from "../utils/afastamentos.utils";
import { AtendimentoMedicoForm } from "./AtendimentoMedicoForm";
import { AfastamentoDocumentoPreview } from "./AfastamentoDocumentoPreview";

const sections = [
  { id: "overview", label: "Visão geral", icon: FileText },
  { id: "documents", label: "Documentos", icon: FileCheck2 },
  { id: "attendance", label: "Atendimento", icon: ClipboardCheck },
  { id: "history", label: "Histórico", icon: History },
] as const;
type Section = (typeof sections)[number]["id"];

export function AtendimentoMedicoDialog({
  afastamentoId,
  onClose,
  onComplete,
}: {
  afastamentoId: string;
  onClose: () => void;
  onComplete: (message: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [section, setSection] = useState<Section>("overview");
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [recorded, setRecorded] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const detailQuery = useAfastamentoDetalhe(afastamentoId, true);
  const detail = detailQuery.data;
  const issueReturn = useEmitirDevolutiva();
  const generateDocument = useGerarDocumentoDigital();
  const signDocument = useAssinarDocumentoDigital(afastamentoId);
  const busy =
    issueReturn.isPending ||
    generateDocument.isPending ||
    signDocument.isPending;
  const form = useForm<AtendimentoMedicoFormValues>({
    resolver: zodResolver(atendimentoSchema),
    defaultValues: atendimentoDefaultValues,
  });
  const resultado = useWatch({ control: form.control, name: "resultado" });

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.showModal();
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  const createDocument = async () => {
    const updated = await getAfastamentoDetalhe(afastamentoId, false);
    const id = await generateDocument.mutateAsync(
      await buildDevolutivaFormalDocumentoInput(updated),
    );
    setDocumentId(id);
  };

  const submit = form.handleSubmit(async (values) => {
    if (!values.resultado) return;
    setError(null);
    try {
      const detalhes =
        values.resultado === "afastado"
          ? {
              afastamento: {
                periodo: {
                  inicio: values.afastamentoInicio,
                  fim: values.afastamentoFim,
                },
              },
            }
          : values.resultado === "apto_com_restricoes"
            ? {
                restricao: {
                  descricao: values.restricoes.trim(),
                  periodo: {
                    inicio: values.restricaoInicio,
                    fim: values.restricaoFim,
                  },
                },
              }
            : {};
      await issueReturn.mutateAsync({
        afastamentoId,
        resultado: values.resultado,
        descricao: values.observacoes.trim(),
        orientacoes:
          values.resultado === "complementacao"
            ? values.complementacao.trim()
            : undefined,
        encaminharRh: values.resultado !== "complementacao",
        detalhes,
      });
      if (values.resultado === "complementacao") {
        onComplete("Complementação solicitada");
        return;
      }
      setRecorded(true);
      await createDocument();
    } catch (cause) {
      setError(getErrorMessage(cause));
    }
  });

  const retryDocument = async () => {
    setError(null);
    try {
      await createDocument();
    } catch (cause) {
      setError(getErrorMessage(cause));
    }
  };

  const sign = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!documentId || !password.trim()) return;
    setError(null);
    try {
      await signDocument.mutateAsync({
        documentoId: documentId,
        password,
        perfilAssinante: "Médico/Perito",
      });
      setPassword("");
      onComplete("Atendimento concluído e documento assinado");
    } catch (cause) {
      setError(getErrorMessage(cause));
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="atendimento-title"
      aria-describedby="atendimento-description"
      onCancel={(event) => {
        if (event.target !== event.currentTarget) return;
        event.preventDefault();
        if (!busy && !recorded) onClose();
      }}
      className="m-auto h-[min(740px,calc(100dvh-2rem))] max-h-none w-[calc(100%-2rem)] max-w-4xl overflow-hidden rounded-lg border border-slate-200 bg-white p-0 text-slate-950 shadow-2xl backdrop:bg-slate-950/50"
    >
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex shrink-0 items-start justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h2
              id="atendimento-title"
              className="break-words text-lg font-semibold"
            >
              {detail?.servidorNome ?? "Atendimento Médico"}
            </h2>
            <p
              id="atendimento-description"
              className="mt-1 text-sm text-slate-500"
            >
              {detail?.protocolo ?? "Carregando processo"}
              {detail && ` · Matrícula ${detail.servidorMatricula}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy || recorded}
            aria-label="Fechar atendimento"
            title="Fechar atendimento"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-40"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <nav
          aria-label="Seções do atendimento"
          className="shrink-0 overflow-x-auto border-y border-slate-200 bg-slate-50 px-4 sm:px-6"
        >
          <div className="flex min-w-max gap-1">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={section === id}
                disabled={busy || recorded}
                onClick={() => setSection(id)}
                className={`inline-flex h-11 items-center gap-2 border-b-2 px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600 ${section === id ? "border-emerald-600 text-emerald-800" : "border-transparent text-slate-600 hover:text-slate-950"}`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          {detailQuery.isLoading && (
            <p className="text-sm text-slate-600" role="status">
              Carregando atendimento…
            </p>
          )}
          {detailQuery.isError && (
            <p className="text-sm text-red-700" role="alert">
              {getErrorMessage(detailQuery.error)}
            </p>
          )}
          {error && (
            <p
              role="alert"
              className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          {detail && section === "overview" && (
            <div className="space-y-6">
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                <Info label="Cargo" value={detail.servidorCargo} />
                <Info label="Unidade" value={detail.unidadeNome} />
                <Info label="Tipo" value={detail.tipo ?? "-"} />
                <Info
                  label="Período solicitado"
                  value={`${formatDate(detail.dataInicio)} até ${formatDate(detail.dataFim)}`}
                />
              </dl>
              <section className="border-t border-slate-200 pt-4">
                <h3 className="text-sm font-semibold">Motivo do afastamento</h3>
                <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-slate-700">
                  {detail.motivo || "Não informado"}
                </p>
              </section>
              {detail.observacoes && (
                <section className="border-t border-slate-200 pt-4">
                  <h3 className="text-sm font-semibold">
                    Observações da origem
                  </h3>
                  <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-slate-700">
                    {detail.observacoes}
                  </p>
                </section>
              )}
            </div>
          )}

          {detail && section === "documents" && (
            <AfastamentoDocumentoPreview detalhe={detail} canViewDocument />
          )}
          {detail && section === "attendance" && !recorded && (
            <AtendimentoMedicoForm
              form={form}
              isProcessing={busy}
              onSubmit={submit}
            />
          )}
          {section === "attendance" && recorded && (
            <div className="mx-auto max-w-lg space-y-4">
              <h3 className="text-base font-semibold">
                {documentId
                  ? "Assinar documento final"
                  : "Gerar documento final"}
              </h3>
              {documentId ? (
                <form id="assinatura-medica-form" onSubmit={sign}>
                  <label className="block text-sm font-semibold text-slate-700">
                    Senha do usuário
                    <input
                      type="password"
                      name="senhaAssinaturaAtendimento"
                      autoComplete="current-password"
                      required
                      autoFocus
                      value={password}
                      disabled={busy}
                      onChange={(event) => setPassword(event.target.value)}
                      className="mt-2 block h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                    />
                  </label>
                </form>
              ) : (
                <p className="text-sm text-slate-600">
                  A devolutiva foi registrada.{" "}
                  {busy
                    ? "Gerando documento…"
                    : "A geração do documento precisa ser retomada."}
                </p>
              )}
            </div>
          )}

          {detail && section === "history" && (
            <ol className="divide-y divide-slate-200">
              {detail.movimentacoes.map((item) => (
                <li key={item.id} className="py-4 first:pt-0">
                  <div className="flex flex-wrap justify-between gap-2">
                    <h3 className="text-sm font-semibold">{item.titulo}</h3>
                    <time
                      className="text-xs text-slate-500"
                      dateTime={item.criadoEm}
                    >
                      {formatDateTime(item.criadoEm)}
                    </time>
                  </div>
                  {item.descricao && (
                    <p className="mt-2 whitespace-pre-line break-words text-sm text-slate-700">
                      {item.descricao}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-slate-500">
                    {item.criadoPorNome ?? "Responsável não informado"}
                  </p>
                </li>
              ))}
              {!detail.movimentacoes.length && (
                <li className="text-sm text-slate-500">
                  Sem movimentações registradas.
                </li>
              )}
            </ol>
          )}
        </div>

        <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
          {!recorded && (
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-40"
            >
              Fechar
            </button>
          )}
          {detail && section !== "attendance" && (
            <button
              type="button"
              onClick={() => setSection("attendance")}
              className="inline-flex min-h-10 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
              Registrar atendimento
            </button>
          )}
          {detail && section === "attendance" && !recorded && resultado && (
            <button
              type="submit"
              form="atendimento-medico-form"
              disabled={busy}
              className="inline-flex min-h-10 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-40"
            >
              <FileCheck2 className="h-4 w-4" aria-hidden="true" />
              {busy ? "Registrando…" : "Registrar devolutiva"}
            </button>
          )}
          {recorded && (
            <button
              type={documentId ? "submit" : "button"}
              form={documentId ? "assinatura-medica-form" : undefined}
              onClick={documentId ? undefined : retryDocument}
              disabled={busy || (Boolean(documentId) && !password.trim())}
              className="inline-flex min-h-10 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-40"
            >
              <Stamp className="h-4 w-4" aria-hidden="true" />
              {busy
                ? "Processando…"
                : documentId
                  ? "Assinar e concluir"
                  : "Gerar documento"}
            </button>
          )}
        </footer>
      </div>
    </dialog>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-slate-900">
        {value}
      </dd>
    </div>
  );
}
