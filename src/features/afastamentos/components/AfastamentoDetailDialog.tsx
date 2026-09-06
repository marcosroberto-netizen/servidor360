import type { ReactNode, SyntheticEvent } from "react";
import type {
  AfastamentoDetalhe,
  DevolutivaResultado,
  RegistrarAnaliseInput,
} from "../types/afastamentos.types";
import {
  formatDate,
  formatDateTime,
  statusLabels,
} from "../utils/afastamentos.utils";
import { AfastamentoDocumentoPreview } from "./AfastamentoDocumentoPreview";
import { AfastamentoCofreDigital } from "./AfastamentoCofreDigital";
import { AnaliseAfastamentoForm } from "./AnaliseAfastamentoForm";
import { ComplementacaoAfastamentoForm } from "./ComplementacaoAfastamentoForm";
import { DevolutivaAfastamentoForm } from "./DevolutivaAfastamentoForm";
import { ProvidenciaAfastamentoForm } from "./ProvidenciaAfastamentoForm";

interface AfastamentoDetailDialogProps {
  detalhe: AfastamentoDetalhe | undefined;
  loadingDetail: boolean;
  canAnalyze: boolean;
  canComplement: boolean;
  canIssueReturn: boolean;
  canRegisterProvidence: boolean;
  canViewDocument: boolean;
  canGenerateDocument: boolean;
  canSignDocument: boolean;
  isGeneratingDocument: boolean;
  isSigningDocument: boolean;
  analise: string;
  proximaAcao: RegistrarAnaliseInput["proximaAcao"];
  complemento: string;
  resposta: string;
  documentoArquivo: File | null;
  resultado: DevolutivaResultado;
  descricao: string;
  orientacoes: string;
  encaminharRh: boolean;
  providencia: string;
  concluir: boolean;
  onClose: () => void;
  onAnaliseChange: (value: string) => void;
  onProximaAcaoChange: (value: RegistrarAnaliseInput["proximaAcao"]) => void;
  onComplementoChange: (value: string) => void;
  onRespostaChange: (value: string) => void;
  onDocumentoChange: (value: File | null) => void;
  onResultadoChange: (value: DevolutivaResultado) => void;
  onDescricaoChange: (value: string) => void;
  onOrientacoesChange: (value: string) => void;
  onEncaminharRhChange: (value: boolean) => void;
  onProvidenciaChange: (value: string) => void;
  onConcluirChange: (value: boolean) => void;
  onGenerateDocument: (tipo: "devolutiva_formal") => void;
  onSignDocument: (documentoId: string, password: string) => void;
  onSubmitAnalise: (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => void;
  onSubmitComplementacao: (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => void;
  onSubmitDevolutiva: (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => void;
  onSubmitProvidencia: (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => void;
}

export function AfastamentoDetailDialog(props: AfastamentoDetailDialogProps) {
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
  return (
    <div
      className="fixed inset-0 z-40 bg-slate-950/40"
      role="dialog"
      aria-modal="true"
    >
      <aside className="ml-auto flex h-full w-full max-w-3xl flex-col overflow-hidden bg-white shadow-strong">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {detalhe?.protocolo ?? "Processo"}
            </p>
            <h2 className="mt-1 truncate text-lg font-bold text-slate-950">
              {detalhe?.servidorNome ?? "Carregando"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100"
            aria-label="Fechar"
          >
            X
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {loadingDetail && (
            <p className="text-sm text-slate-600">Carregando processo...</p>
          )}
          {detalhe && (
            <div className="grid gap-5">
              <dl className="grid gap-3 sm:grid-cols-3">
                <Info label="Status">{statusLabels[detalhe.status]}</Info>
                <Info label="Tipo">{detalhe.tipo ?? "-"}</Info>
                <Info label="Periodo">
                  {formatDate(detalhe.dataInicio)} ate{" "}
                  {formatDate(detalhe.dataFim)}
                </Info>
              </dl>
              <section className="rounded-lg border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-950">
                  Documento e motivo
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {detalhe.motivo ?? "-"}
                </p>
                <AfastamentoDocumentoPreview
                  detalhe={detalhe}
                  canViewDocument={canViewDocument}
                />
              </section>
              <AfastamentoCofreDigital
                detalhe={detalhe}
                canGenerateDocument={canGenerateDocument}
                canSignDocument={canSignDocument}
                isGenerating={props.isGeneratingDocument}
                isSigning={props.isSigningDocument}
                onGenerateDocument={props.onGenerateDocument}
                onSignDocument={props.onSignDocument}
              />
              <div className="grid gap-4">
                {canAnalyze && (
                  <AnaliseAfastamentoForm
                    analise={props.analise}
                    proximaAcao={props.proximaAcao}
                    complemento={props.complemento}
                    onAnaliseChange={props.onAnaliseChange}
                    onProximaAcaoChange={props.onProximaAcaoChange}
                    onComplementoChange={props.onComplementoChange}
                    onSubmit={props.onSubmitAnalise}
                  />
                )}
                {canComplement &&
                  detalhe.status === "aguardando_complementacao" && (
                    <ComplementacaoAfastamentoForm
                      resposta={props.resposta}
                      onRespostaChange={props.onRespostaChange}
                      onDocumentoChange={props.onDocumentoChange}
                      onSubmit={props.onSubmitComplementacao}
                    />
                  )}
                {canIssueReturn && (
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
                {canRegisterProvidence && (
                  <ProvidenciaAfastamentoForm
                    providencia={props.providencia}
                    concluir={props.concluir}
                    onProvidenciaChange={props.onProvidenciaChange}
                    onConcluirChange={props.onConcluirChange}
                    onSubmit={props.onSubmitProvidencia}
                  />
                )}
              </div>
              <section className="rounded-lg border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-950">
                  Linha do tempo
                </h3>
                <div className="mt-3 grid gap-3">
                  {detalhe.movimentacoes.map((item) => (
                    <article
                      key={item.id}
                      className="border-l-2 border-emerald-600 pl-3"
                    >
                      <p className="text-sm font-semibold text-slate-950">
                        {item.titulo}
                      </p>
                      {item.descricao && (
                        <p className="mt-1 text-sm text-slate-700">
                          {item.descricao}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDateTime(item.criadoEm)}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-slate-950">{children}</dd>
    </div>
  );
}
