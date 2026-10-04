import { useState, type ReactNode } from "react";
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  FileClock,
  FileText,
  History,
  MapPin,
  PenLine,
  MessageSquareWarning,
  SearchCheck,
  Send,
  Stethoscope,
  TriangleAlert,
  X,
} from "lucide-react";
import {
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
} from "../constants/afastamentos.constants";
import type {
  AfastamentoComplementacao,
  AfastamentoDetailDialogProps,
  AfastamentoMovimentacao,
  AfastamentoStatus,
} from "../types/afastamentos.types";
import {
  canAnalyzeAfastamento,
  canIssueReturnAfastamento,
  canRegisterProvidenceAfastamento,
  formatDate,
  formatDateTime,
} from "../utils/afastamentos.utils";
import { AfastamentoDocumentoPreview } from "./AfastamentoDocumentoPreview";
import { AfastamentoCofreDigital } from "./AfastamentoCofreDigital";
import { AnaliseAfastamentoForm } from "./AnaliseAfastamentoForm";
import { ComplementacaoAfastamentoForm } from "./ComplementacaoAfastamentoForm";
import { DevolutivaAfastamentoForm } from "./DevolutivaAfastamentoForm";
import { ProvidenciaAfastamentoForm } from "./ProvidenciaAfastamentoForm";

const statusIcons: Record<AfastamentoStatus, typeof CircleDashed> = {
  rascunho: CircleDashed,
  registrado: ClipboardCheck,
  encaminhado: Send,
  aguardando_analise: Clock3,
  em_analise: SearchCheck,
  aguardando_complementacao: TriangleAlert,
  aguardando_avaliacao: ClipboardList,
  avaliado: BadgeCheck,
  aguardando_rh: FileClock,
  concluido: CheckCircle2,
};

const technicalHistoryTypes = new Set(["documento_digital", "assinatura_digital"]);

const historyTermLabels: Record<string, string> = {
  necessita_avaliacao_medica: "Necessita de avaliação médica",
  documentacao_incompleta: "Documentação incompleta",
  documentacao_regular: "Documentação regular",
  homologado: "Homologado",
};

function humanizeHistoryDescription(description: string | null) {
  if (!description) return null;

  return Object.entries(historyTermLabels).reduce(
    (text, [term, label]) => text.replaceAll(term, label),
    description,
  ).replace("Comentarios:", "Comentários:");
}

function HistoryDescription({ description }: { description: string }) {
  const commentMarker = "Comentários:";
  const markerIndex = description.indexOf(commentMarker);

  if (markerIndex < 0) {
    return (
      <p className="mt-1 whitespace-pre-line wrap-break-word text-sm leading-6 text-slate-700">
        {description}
      </p>
    );
  }

  const context = description.slice(0, markerIndex).trim();
  const comment = description.slice(markerIndex + commentMarker.length).trim();

  return (
    <div className="mt-1 text-sm leading-6 text-slate-700">
      {context ? <p className="whitespace-pre-line wrap-break-word">{context}</p> : null}
      <div className="mt-1 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-1">
        <span className="font-medium text-slate-600">Comentários:</span>
        <span className="group/comment relative min-w-0">
          <span
            tabIndex={0}
            aria-label={`Comentário completo: ${comment}`}
            className="truncate cursor-help rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            {comment}
          </span>
          <span
            role="tooltip"
            className="absolute bottom-full left-0 z-20 mb-2 hidden max-h-64 w-[min(32rem,calc(100vw-4rem))] overflow-y-auto rounded-md bg-slate-950 px-3 py-2 text-xs leading-5 text-white shadow-lg group-hover/comment:block group-focus-within/comment:block"
          >
            {comment}
          </span>
        </span>
      </div>
    </div>
  );
}

function PendingComplementacaoRequest({
  complementacao,
}: {
  complementacao: AfastamentoComplementacao;
}) {
  return (
    <section
      className="overflow-hidden rounded-lg border border-amber-200 bg-white shadow-sm"
      aria-labelledby="pending-complementacao-title"
    >
      <div className="border-b border-amber-200 bg-amber-50/80 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-amber-700 shadow-sm ring-1 ring-amber-200">
            <MessageSquareWarning className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 id="pending-complementacao-title" className="text-sm font-semibold text-amber-950">
              Solicitação de complementação
            </h3>
            <p className="mt-0.5 text-xs leading-5 text-amber-900/75">
              Revise a pendência registrada pelo CAS antes de responder.
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-3 p-5">
        <p className="whitespace-pre-line wrap-break-word text-sm leading-6 text-slate-800">
          {complementacao.solicitacao}
        </p>
        <p className="text-xs font-medium tabular-nums text-slate-500">
          Solicitada em {formatDateTime(complementacao.solicitadaEm)}
        </p>
      </div>
    </section>
  );
}

export function AfastamentoDetailDialog(props: AfastamentoDetailDialogProps) {
  const [isCofreOpen, setIsCofreOpen] = useState(false);
  const {
    detalhe,
    loadingDetail,
    canAnalyze,
    canComplement,
    canIssueReturn,
    canRegisterProvidence,
    canViewDocument,
    canGenerateDocument,
    canSignDocument,
    onClose,
  } = props;
  const hasActions =
    Boolean(
      detalhe &&
        ((canAnalyze && canAnalyzeAfastamento(detalhe.status)) ||
          (canComplement && detalhe.status === "aguardando_complementacao") ||
          (canIssueReturn && canIssueReturnAfastamento(detalhe.status)) ||
          (canRegisterProvidence &&
            canRegisterProvidenceAfastamento(detalhe.status))),
    );
  const [activeSection, setActiveSection] = useState<
    "overview" | "actions" | "history"
  >("overview");
  const titleId = "afastamento-detail-title";
  const descriptionId = "afastamento-detail-description";
  const cofreTitleId = "afastamento-cofre-title";
  const cofreDescriptionId = "afastamento-cofre-description";
  const StatusIcon = detalhe ? statusIcons[detalhe.status] : CircleDashed;
  const creationMovement = detalhe?.movimentacoes.find(
    (item) => item.tipo === "criacao",
  );
  const initialTechnicalMovements =
    detalhe?.movimentacoes.filter((item) => {
      if (!creationMovement || !technicalHistoryTypes.has(item.tipo)) return false;
      const distanceFromCreation = Math.abs(
        new Date(item.criadoEm).getTime() - new Date(creationMovement.criadoEm).getTime(),
      );
      return distanceFromCreation <= 5 * 60 * 1000;
    }) ?? [];
  const groupedMovementIds = new Set(
    initialTechnicalMovements.map((item) => item.id),
  );
  const summaryMovements =
    detalhe?.movimentacoes.filter((item) => !groupedMovementIds.has(item.id)) ?? [];
  const pendingComplementacao =
    detalhe?.complementacoes.find((item) => item.status === "pendente") ?? null;
  const hasAvailableAction = Boolean(
    (canAnalyze && detalhe && canAnalyzeAfastamento(detalhe.status)) ||
      (canComplement && detalhe?.status === "aguardando_complementacao") ||
    (canIssueReturn && detalhe && canIssueReturnAfastamento(detalhe.status)) ||
    (canRegisterProvidence &&
      detalhe &&
      canRegisterProvidenceAfastamento(detalhe.status)),
  );

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div className="flex max-h-[calc(100dvh-1.5rem)] w-full flex-col overflow-hidden overscroll-contain rounded-lg bg-white shadow-strong sm:max-h-[90dvh] lg:h-[90dvh] lg:w-4/5">
        <header className="flex shrink-0 items-start justify-between gap-4 bg-white px-5 py-4 sm:px-6">
          <div className="min-w-0 space-y-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h2 id={titleId} className="truncate text-lg font-bold text-slate-950">
                {detalhe?.servidorNome ?? "Carregando"}
              </h2>
              {detalhe ? (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE_CLASSES[detalhe.status]}`}
                >
                  <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  {STATUS_LABELS[detalhe.status]}
                </span>
              ) : null}
            </div>
            <p id={descriptionId} className="text-sm text-slate-500">
              {detalhe?.protocolo ?? "Processo de afastamento"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>
        <nav
          className="shrink-0 overflow-x-auto border-y border-slate-200 bg-slate-50/80 px-4 sm:px-6"
          aria-label="Seções do processo"
        >
          <div className="flex min-w-max gap-1">
            <SectionButton
              active={activeSection === "overview"}
              icon={FileText}
              onClick={() => setActiveSection("overview")}
            >
              Visão geral
            </SectionButton>
            {hasActions ? (
              <SectionButton
                active={activeSection === "actions"}
                icon={ClipboardList}
                onClick={() => setActiveSection("actions")}
              >
                Triagem e ações
              </SectionButton>
            ) : null}
            <SectionButton
              active={activeSection === "history"}
              icon={History}
              onClick={() => setActiveSection("history")}
            >
              Histórico
            </SectionButton>
          </div>
        </nav>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          {loadingDetail && (
            <p className="text-sm text-slate-600">Carregando processo…</p>
          )}
          {detalhe && (
            <div className="mx-auto w-full max-w-5xl">
              {activeSection === "overview" ? (
                <div className="grid gap-5">
                  <section aria-labelledby="process-summary-title">
                    <h3
                      id="process-summary-title"
                      className="mb-3 text-sm font-semibold text-slate-950"
                    >
                      Dados do afastamento
                    </h3>
                    <dl className="grid gap-3 sm:grid-cols-3">
                      <Info label="Tipo" icon={Stethoscope} tone="blue">
                        {detalhe.tipo ?? "-"}
                      </Info>
                      <Info label="Período" icon={CalendarDays} tone="violet">
                        {formatDate(detalhe.dataInicio)} até{" "}
                        {formatDate(detalhe.dataFim)}
                      </Info>
                      <Info label="Unidade" icon={MapPin} tone="cyan">
                        {detalhe.unidadeNome ?? "-"}
                      </Info>
                    </dl>
                  </section>
                  <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-100 text-blue-700">
                          <FileText className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-950">
                            Solicitação e documentos
                          </h3>
                          <p className="mt-0.5 text-xs text-slate-500">
                            Motivo informado e documentação anexada.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="wrap-break-word text-sm leading-6 text-slate-700">
                        {detalhe.motivo ?? "-"}
                      </p>
                      <AfastamentoDocumentoPreview
                        detalhe={detalhe}
                        canViewDocument={canViewDocument}
                      />
                    </div>
                  </section>
                  <div className="flex justify-end border-t border-slate-200 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsCofreOpen(true)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-violet-200 bg-violet-50 px-4 text-sm font-semibold text-violet-800 transition-colors hover:border-violet-300 hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
                    >
                      <PenLine className="h-4 w-4" aria-hidden="true" />
                      Visualizar assinatura digital
                    </button>
                  </div>
                </div>
              ) : null}

              {activeSection === "actions" ? (
                <div className="mx-auto grid max-w-4xl min-w-0 gap-4">
                  {canAnalyze && canAnalyzeAfastamento(detalhe.status) && (
                    <AnaliseAfastamentoForm
                      analise={props.analise}
                      proximaAcao={props.proximaAcao}
                      avaliadores={props.avaliadores}
                      isLoadingAvaliadores={props.isLoadingAvaliadores}
                      avaliadorSelecionadoId={props.avaliadorSelecionadoId}
                      avaliadorAtualId={detalhe.avaliadorAtual?.avaliadorId ?? null}
                      onAnaliseChange={props.onAnaliseChange}
                      onProximaAcaoChange={props.onProximaAcaoChange}
                      onAvaliadorSelecionadoChange={props.onAvaliadorSelecionadoChange}
                      onSubmit={props.onSubmitAnalise}
                    />
                  )}
                  {canComplement &&
                    detalhe.status === "aguardando_complementacao" && (
                      <>
                        {pendingComplementacao ? (
                          <>
                            <PendingComplementacaoRequest
                              complementacao={pendingComplementacao}
                            />
                            <ComplementacaoAfastamentoForm
                              resposta={props.resposta}
                              onRespostaChange={props.onRespostaChange}
                              onDocumentoChange={props.onDocumentoChange}
                              onSubmit={props.onSubmitComplementacao}
                            />
                          </>
                        ) : (
                          <section className="rounded-lg border border-amber-200 bg-amber-50/80 p-5">
                            <div className="flex items-start gap-3">
                              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
                              <div className="min-w-0">
                                <h3 className="text-sm font-semibold text-amber-950">
                                  Solicitação não localizada
                                </h3>
                                <p className="mt-1 text-sm leading-6 text-amber-900/80">
                                  O processo está aguardando complementação, mas a pendência não foi carregada. Atualize a tela antes de responder.
                                </p>
                              </div>
                            </div>
                          </section>
                        )}
                      </>
                    )}
                  {canIssueReturn && canIssueReturnAfastamento(detalhe.status) && (
                    <DevolutivaAfastamentoForm
                      resultado={props.resultado}
                      descricao={props.descricao}
                      orientacoes={props.orientacoes}
                      encaminharRh={props.encaminharRh}
                      onResultadoChange={props.onResultadoChange}
                      onDescricaoChange={props.onDescricaoChange}
                      onOrientacoesChange={props.onOrientacoesChange}
                      onEncaminharRhChange={props.onEncaminharRhChange}
                      onSubmit={props.onSubmitDevolutiva}
                    />
                  )}
                  {canRegisterProvidence &&
                    canRegisterProvidenceAfastamento(detalhe.status) && (
                    <ProvidenciaAfastamentoForm
                      providencia={props.providencia}
                      concluir={props.concluir}
                      onProvidenciaChange={props.onProvidenciaChange}
                      onConcluirChange={props.onConcluirChange}
                      onSubmit={props.onSubmitProvidencia}
                    />
                  )}
                  {!hasAvailableAction ? (
                    <section className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-5 sm:p-6">
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div>
                          <h3 className="text-sm font-semibold text-emerald-950">
                            Complementação enviada com sucesso
                          </h3>
                          <p className="mt-1 text-sm leading-6 text-emerald-900/80">
                            A resposta foi registrada e o processo foi encaminhado para nova análise.
                          </p>
                          <p className="mt-3 text-xs font-medium text-emerald-800">
                            Consulte o Histórico para acompanhar essa movimentação.
                          </p>
                        </div>
                      </div>
                    </section>
                  ) : null}
                </div>
              ) : null}

              {activeSection === "history" ? (
                <section
                  className="mx-auto max-w-4xl"
                  aria-labelledby="history-title"
                >
                  <div className="mb-5">
                    <h3
                      id="history-title"
                      className="text-base font-semibold text-slate-950"
                    >
                      Histórico do processo
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Principais ações, com as mais recentes primeiro.
                    </p>
                  </div>
                  {detalhe.movimentacoes.length > 0 ? (
                    <div className="grid gap-4">
                      {summaryMovements.map((item) => {
                        const isCreation = item.tipo === "criacao";
                        const groupedTechnicalEvents = isCreation
                          ? initialTechnicalMovements
                          : [];

                        return (
                          <HistoryItem
                            key={item.id}
                            item={item}
                            groupedTechnicalEvents={groupedTechnicalEvents}
                            showTechnicalDetails
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
                      Nenhuma movimentação registrada.
                    </div>
                  )}
                </section>
              ) : null}
            </div>
          )}
        </div>
      </div>
      {detalhe && isCofreOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={cofreTitleId}
          aria-describedby={cofreDescriptionId}
        >
          <div className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden overscroll-contain rounded-lg bg-white shadow-strong">
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div className="min-w-0">
                <p id={cofreDescriptionId} className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {detalhe.protocolo ?? "Processo"}
                </p>
                <h3 id={cofreTitleId} className="mt-1 truncate text-lg font-bold text-slate-950">
                  Visualizar assinatura digital
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCofreOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                aria-label="Fechar assinatura digital"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </header>
            <div className="min-h-0 overflow-y-auto p-5">
              <AfastamentoCofreDigital
                detalhe={detalhe}
                canGenerateDocument={canGenerateDocument}
                canSignDocument={canSignDocument}
                isGenerating={props.isGeneratingDocument}
                isSigning={props.isSigningDocument}
                onGenerateDocument={props.onGenerateDocument}
                onSignDocument={props.onSignDocument}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryItem({
  item,
  groupedTechnicalEvents,
  showTechnicalDetails,
}: {
  item: AfastamentoMovimentacao;
  groupedTechnicalEvents: AfastamentoMovimentacao[];
  showTechnicalDetails: boolean;
}) {
  const hasSignedDocument = groupedTechnicalEvents.some(
    (event) => event.tipo === "assinatura_digital",
  );
  const description =
    item.tipo === "criacao" && hasSignedDocument
      ? "Atestado incluído e assinado eletronicamente."
      : humanizeHistoryDescription(item.descricao);

  return (
    <article className="relative min-w-0 border-l-2 border-blue-200 py-1 pl-5 before:absolute before:-left-1.25 before:top-2 before:h-2 before:w-2 before:rounded-full before:bg-blue-600 before:ring-4 before:ring-blue-50">
      <p className="wrap-break-word text-sm font-semibold text-slate-950">
        {item.titulo}
      </p>
      {description ? (
        <HistoryDescription description={description} />
      ) : null}
      <p className="mt-2 text-xs font-medium text-slate-600">
        Por:{" "}
        <span className="text-blue-700">
          {item.criadoPorNome ?? "Sistema"}
        </span>
      </p>
      <p className="mt-1 text-xs tabular-nums text-slate-500">
        {formatDateTime(item.criadoEm)}
      </p>
      {showTechnicalDetails && groupedTechnicalEvents.length > 0 ? (
        <details className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <summary className="cursor-pointer text-xs font-semibold text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
            Ver detalhes técnicos ({groupedTechnicalEvents.length})
          </summary>
          <div className="mt-3 grid gap-3 border-t border-slate-200 pt-3">
            {groupedTechnicalEvents.map((event) => (
              <div key={event.id}>
                <p className="text-xs font-semibold text-slate-800">{event.titulo}</p>
                {event.descricao ? (
                  <p className="mt-0.5 wrap-break-word text-xs leading-5 text-slate-600">
                    {humanizeHistoryDescription(event.descricao)}
                  </p>
                ) : null}
                <p className="mt-1 text-xs font-medium text-slate-600">
                  Por:{" "}
                  <span className="text-blue-700">
                    {event.criadoPorNome ?? "Sistema"}
                  </span>
                </p>
                <p className="mt-1 text-xs tabular-nums text-slate-500">
                  {formatDateTime(event.criadoEm)}
                </p>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </article>
  );
}

function SectionButton({
  active,
  icon: Icon,
  onClick,
  children,
}: {
  active: boolean;
  icon: typeof FileText;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-12 touch-manipulation items-center gap-2 border-b-2 px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 ${
        active
          ? "border-blue-700 text-blue-800"
          : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-950"
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {children}
    </button>
  );
}

const infoTones = {
  blue: "bg-blue-50 text-blue-700",
  violet: "bg-violet-50 text-violet-700",
  cyan: "bg-cyan-50 text-cyan-700",
} as const;

function Info({
  label,
  icon: Icon,
  tone,
  children,
}: {
  label: string;
  icon: typeof FileText;
  tone: keyof typeof infoTones;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${infoTones[tone]}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </dt>
        <dd className="mt-1 wrap-break-word text-sm font-medium text-slate-950">
          {children}
        </dd>
      </div>
    </div>
  );
}
