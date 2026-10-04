import { useState } from "react";
import {
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  FileQuestion,
  Stethoscope,
  UserRoundCheck,
} from "lucide-react";
import type {
  AnaliseAfastamentoFormProps,
  TriagemDecisao,
} from "../types/afastamentos.types";
import { AvaliadorSelectionDrawer } from "./MedicoSelectionDrawer";

const encaminhamentoOptions: Array<{
  value: TriagemDecisao;
  label: string;
  description: string;
  icon: typeof ClipboardCheck;
  selectedClassName: string;
  iconClassName: string;
  radioClassName: string;
}> = [
  {
    value: "solicitar_complementacao",
    label: "Solicitar complementação",
    description:
      "Documentação incompleta. Solicita os itens pendentes à unidade responsável.",
    icon: FileQuestion,
    selectedClassName: "border-orange-300 bg-orange-50",
    iconClassName: "bg-orange-100 text-orange-700",
    radioClassName: "text-orange-700 focus-visible:ring-orange-600",
  },
  {
    value: "homologar",
    label: "Homologar",
    description:
      "Documentação regular. Conclui a análise administrativa e encaminha ao DP.",
    icon: CheckCircle2,
    selectedClassName: "border-emerald-300 bg-emerald-50",
    iconClassName: "bg-emerald-100 text-emerald-700",
    radioClassName: "text-emerald-700 focus-visible:ring-emerald-600",
  },
  {
    value: "encaminhar_avaliacao",
    label: "Encaminhar para avaliação médica/pericial",
    description:
      "Registra a necessidade de avaliação e envia o processo para a perícia.",
    icon: ClipboardList,
    selectedClassName: "border-violet-300 bg-violet-50",
    iconClassName: "bg-violet-100 text-violet-700",
    radioClassName: "text-violet-700 focus-visible:ring-violet-600",
  },
];

const comentarioPorDecisao: Record<
  TriagemDecisao,
  { label: string; placeholder: string }
> = {
  solicitar_complementacao: {
    label: "Pendência e observações",
    placeholder: "Descreva os documentos ou informações que devem ser complementados…",
  },
  homologar: {
    label: "Comentário da homologação",
    placeholder: "Registre o fundamento administrativo da homologação…",
  },
  encaminhar_avaliacao: {
    label: "Justificativa do encaminhamento",
    placeholder: "Registre por que o processo deve seguir para avaliação médica/pericial…",
  },
};

const comentarioPadrao = {
  label: "Comentário da triagem",
  placeholder: "Selecione uma decisão e registre o fundamento administrativo…",
};

export function AnaliseAfastamentoForm({
  analise,
  proximaAcao,
  avaliadores = [],
  isLoadingAvaliadores = false,
  avaliadorSelecionadoId,
  avaliadorAtualId,
  onAnaliseChange,
  onProximaAcaoChange,
  onAvaliadorSelecionadoChange,
  onSubmit,
}: AnaliseAfastamentoFormProps) {
  const [isMedicoDrawerOpen, setIsMedicoDrawerOpen] = useState(false);
  const comentarioConfig = proximaAcao
    ? comentarioPorDecisao[proximaAcao]
    : comentarioPadrao;
  const avaliadorSelecionado = avaliadores.find(
    (avaliador) => avaliador.avaliadorId === avaliadorSelecionadoId,
  );
  const avaliadorAtual = avaliadores.find(
    (avaliador) => avaliador.avaliadorId === avaliadorAtualId,
  );
  const isReassignment = Boolean(avaliadorAtualId);
  const currentComentarioConfig = isReassignment
    ? {
        label: "Justificativa da reatribuição",
        placeholder: "Explique por que o processo deve ser transferido para outro médico…",
      }
    : comentarioConfig;

  return (
    <form
      onSubmit={onSubmit}
      className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
    >
      <div className="h-1 bg-blue-600" aria-hidden="true" />
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-950">
              {isReassignment ? "Reatribuição médica" : "Triagem CAS"}
            </h3>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {isReassignment
                ? "Transfira a avaliação pendente para outro médico e registre a justificativa."
                : "Escolha a decisão, registre o comentário e confirme. O resultado e a próxima etapa serão definidos automaticamente."}
            </p>
          </div>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
            Administrativo
          </span>
        </div>
        {isReassignment ? (
          <section className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
              Responsável atual
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {avaliadorAtual?.nome ?? "Profissional atualmente atribuído"}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              A atribuição atual será cancelada somente após a confirmação da transferência.
            </p>
          </section>
        ) : (
        <fieldset className="mt-4">
          <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Decisão da triagem
          </legend>
          <div className="mt-2 grid gap-3 lg:grid-cols-3">
            {encaminhamentoOptions.map((option) => {
              const Icon = option.icon;
              const selected = proximaAcao === option.value;

              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${
                    selected
                      ? option.selectedClassName
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="proximaAcao"
                    value={option.value}
                    checked={selected}
                    onChange={() => {
                      onProximaAcaoChange(option.value);
                      if (option.value === "encaminhar_avaliacao") {
                        setIsMedicoDrawerOpen(true);
                      }
                    }}
                    required
                    className={`mt-1 h-4 w-4 border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${option.radioClassName}`}
                  />
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                      selected
                        ? option.iconClassName
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-950">
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-slate-600">
                      {option.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
        )}
        {proximaAcao === "encaminhar_avaliacao" || isReassignment ? (
          <section className="mt-4 rounded-lg border border-violet-200 bg-violet-50/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-violet-100 text-violet-700">
                  {avaliadorSelecionado ? (
                    <UserRoundCheck className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Stethoscope className="h-5 w-5" aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                      Profissional avaliador
                  </p>
                  {avaliadorSelecionado ? (
                    <>
                      <p className="mt-0.5 truncate text-sm font-semibold text-slate-950">
                        {avaliadorSelecionado.nome}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-600">
                        {avaliadorSelecionado.tipo} · {avaliadorSelecionado.registroProfissional ?? "Registro não informado"}
                        {` · ${avaliadorSelecionado.pacientesPendentes} na fila`}
                      </p>
                    </>
                  ) : (
                    <p className="mt-0.5 text-sm font-medium text-violet-900">
                      Selecione um profissional para continuar.
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onProximaAcaoChange("encaminhar_avaliacao");
                  setIsMedicoDrawerOpen(true);
                }}
                className="h-9 rounded-md border border-violet-300 bg-white px-3 text-sm font-semibold text-violet-800 hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
              >
                {avaliadorSelecionado ? "Alterar avaliador" : "Escolher avaliador"}
              </button>
            </div>
          </section>
        ) : null}
        <label
          htmlFor="analise-cas"
          className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500"
        >
          {currentComentarioConfig.label}
        </label>
        <textarea
          id="analise-cas"
          name="analise"
          value={analise}
          onChange={(event) => onAnaliseChange(event.target.value)}
          rows={4}
          required
          placeholder={currentComentarioConfig.placeholder}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:border-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100"
        />
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
            {isReassignment ? "Reatribuir médico" : "Registrar triagem"}
          </button>
        </div>
      </div>
      {isMedicoDrawerOpen ? (
        <AvaliadorSelectionDrawer
          avaliadores={avaliadores}
          selectedAvaliadorId={avaliadorSelecionadoId}
          currentAvaliadorId={avaliadorAtualId}
          isLoading={isLoadingAvaliadores}
          onClose={() => setIsMedicoDrawerOpen(false)}
          onConfirm={(avaliadorId) => {
            onAvaliadorSelecionadoChange(avaliadorId);
            setIsMedicoDrawerOpen(false);
          }}
        />
      ) : null}
    </form>
  );
}
