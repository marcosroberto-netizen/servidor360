import { useMemo, useState, type SyntheticEvent } from "react";
import { ModuleLayout } from "@/shared/components/ModuleLayout";
import { ConfirmDialog } from "@/shared/components/ui/ConfirmDialog";
import { FeedbackDialog } from "@/shared/components/ui/FeedbackDialog";
import {
  ACTION_FEEDBACK,
  AFASTAMENTOS_PERMISSIONS,
  PAGE_VARIANT_CONFIG,
} from "../constants/afastamentos.constants";
import { AfastamentoDetailDialog } from "./AfastamentoDetailDialog";
import { AfastamentosSummary } from "./AfastamentosSummary";
import { AfastamentosTable } from "./AfastamentosTable";
import { NovoAfastamentoModal } from "./NovoAfastamentoModal";
import {
  useAfastamentoDetalhe,
  useAssinarDocumentoDigital,
  useEmitirDevolutiva,
  useGerarDevolutivaFormalDocumento,
  useAvaliadoresParaAvaliacao,
  useRegistrarAnalise,
  useRegistrarProvidencia,
  useResponderComplementacao,
  useServidoresForAfastamento,
  useScopedAfastamentos,
} from "../hooks/useAfastamentos";
import type {
  AfastamentoResumo,
  AfastamentosPageVariant,
  AfastamentosViewProps,
  DevolutivaResultado,
  PendingAfastamentoAction,
  TriagemDecisao,
} from "../types/afastamentos.types";
import {
  getAfastamentosActionPermissions,
  getErrorMessage,
  hasPermission,
  validateDocumentoFile,
} from "../utils/afastamentos.utils";

function filterByVariant(
  items: AfastamentoResumo[],
  variant: AfastamentosPageVariant,
) {
  const statuses = PAGE_VARIANT_CONFIG[variant].statuses;
  if (!statuses) return items;

  return items.filter((item) => statuses.includes(item.status));
}

export function AfastamentosView({
  authorization,
  variant = "geral",
  scope,
}: AfastamentosViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [analise, setAnalise] = useState("");
  const [proximaAcao, setProximaAcao] = useState<TriagemDecisao | null>(null);
  const [avaliadorSelecionadoId, setAvaliadorSelecionadoId] = useState<string | null>(null);
  const [resposta, setResposta] = useState("");
  const [documentoArquivo, setDocumentoArquivo] = useState<File | null>(null);
  const [resultado, setResultado] = useState<DevolutivaResultado>("apto");
  const [descricao, setDescricao] = useState("");
  const [orientacoes, setOrientacoes] = useState("");
  const [encaminharRh, setEncaminharRh] = useState(true);
  const [providencia, setProvidencia] = useState("");
  const [concluir, setConcluir] = useState(true);
  const [pendingAction, setPendingAction] =
    useState<PendingAfastamentoAction>(null);
  const [successTitle, setSuccessTitle] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isOperationalPage = scope === "operational";
  const { data: servidores = [], isLoading: isLoadingServidores } =
    useServidoresForAfastamento(authorization.allowedUnitIds, isOperationalPage);
  const {
    data: afastamentos = [],
    error: afastamentosError,
    isLoading,
    isError,
  } = useScopedAfastamentos(authorization.allowedUnitIds, isOperationalPage);
  const visibleAfastamentos = useMemo(
    () => filterByVariant(afastamentos, variant),
    [afastamentos, variant],
  );
  const registrarAnalise = useRegistrarAnalise();
  const responderComplementacao = useResponderComplementacao();
  const emitirDevolutiva = useEmitirDevolutiva();
  const gerarDevolutivaFormal = useGerarDevolutivaFormalDocumento();
  const assinarDocumentoDigital = useAssinarDocumentoDigital(selectedId);
  const registrarProvidencia = useRegistrarProvidencia();
  const permissions = authorization.permissions;
  const actionPermissions = getAfastamentosActionPermissions(permissions);
  const { data: avaliadores = [], isLoading: isLoadingAvaliadores } =
    useAvaliadoresParaAvaliacao(Boolean(selectedId && actionPermissions.canAnalyze));
  const canCreate = hasPermission(
    permissions,
    AFASTAMENTOS_PERMISSIONS.CREATE,
    AFASTAMENTOS_PERMISSIONS.ADMIN,
  ) && PAGE_VARIANT_CONFIG[variant].allowCreate;
  const { data: detalhe, isLoading: loadingDetail } = useAfastamentoDetalhe(
    selectedId,
    actionPermissions.canViewDocument,
  );
  const counters = useMemo(
    () => ({
      total: visibleAfastamentos.length,
      analise: visibleAfastamentos.filter(
        (item) => item.status === "aguardando_analise",
      ).length,
      complementacao: visibleAfastamentos.filter(
        (item) => item.status === "aguardando_complementacao",
      ).length,
      rh: visibleAfastamentos.filter((item) => item.status === "aguardando_rh")
        .length,
    }),
    [visibleAfastamentos],
  );
  const pendingMutation =
    registrarAnalise.isPending ||
    responderComplementacao.isPending ||
    emitirDevolutiva.isPending ||
    gerarDevolutivaFormal.isPending ||
    assinarDocumentoDigital.isPending ||
    registrarProvidencia.isPending;
  const submitAnalise = (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    event.preventDefault();
    const isReassignment = Boolean(detalhe?.avaliadorAtual);
    const action = isReassignment ? "encaminhar_avaliacao" : proximaAcao;
    if (!detalhe || !action || !analise.trim()) return;
    if (action === "encaminhar_avaliacao" && !avaliadorSelecionadoId) {
      setErrorMessage("Selecione o profissional responsável pela avaliação antes de continuar.");
      return;
    }
    if (detalhe.avaliadorAtual?.avaliadorId === avaliadorSelecionadoId) {
      setErrorMessage("Este processo já está atribuído a esse profissional. Escolha outro avaliador.");
      return;
    }
    setPendingAction("analise");
  };
  const submitComplementacao = (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    event.preventDefault();
    if (!detalhe || !resposta.trim()) return;
    setPendingAction("complementacao");
  };
  const submitDevolutiva = (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    event.preventDefault();
    if (!detalhe || !descricao.trim()) return;
    setPendingAction("devolutiva");
  };
  const submitProvidencia = (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    event.preventDefault();
    if (!detalhe || !providencia.trim()) return;
    setPendingAction("providencia");
  };
  const handleMutationSuccess = (
    action: Exclude<PendingAfastamentoAction, null>,
  ) => {
    setPendingAction(null);
    setErrorMessage(null);
    setSuccessTitle(ACTION_FEEDBACK[action].successTitle);
  };
  const handleMutationError = (error: unknown) => {
    setPendingAction(null);
    setErrorMessage(getErrorMessage(error));
  };
  const handleDocumentoComplementacaoChange = (file: File | null) => {
    const fileError = validateDocumentoFile(file);

    if (fileError) {
      setErrorMessage(fileError);
      return;
    }

    setErrorMessage(null);
    setDocumentoArquivo(file);
  };
  const handleGenerateDocument = async (tipo: "devolutiva_formal") => {
    if (!detalhe) return;

    try {
      if (tipo !== "devolutiva_formal") return;

      gerarDevolutivaFormal.mutate(
        detalhe,
        {
          onSuccess: () => {
            setSuccessTitle("Documento digital gerado");
            setErrorMessage(null);
          },
          onError: handleMutationError,
        },
      );
    } catch (error) {
      handleMutationError(error);
    }
  };
  const handleSignDocument = (documentoId: string, password: string) => {
    assinarDocumentoDigital.mutate(
      {
        documentoId,
        password,
        perfilAssinante: authorization.profiles[0] ?? "usuario",
      },
      {
        onSuccess: () => {
          setSuccessTitle("Documento assinado");
          setErrorMessage(null);
        },
        onError: handleMutationError,
      },
    );
  };
  const confirmPendingAction = () => {
    if (!detalhe || !pendingAction) return;
    const action = pendingAction;
    setPendingAction(null);

    if (action === "analise") {
      const isReassignment = Boolean(detalhe.avaliadorAtual);
      const selectedAction = isReassignment ? "encaminhar_avaliacao" : proximaAcao;
      if (!selectedAction) return;
      registrarAnalise.mutate(
        {
          afastamentoId: detalhe.id,
          analise,
          proximaAcao: selectedAction,
          avaliadorId: avaliadorSelecionadoId ?? undefined,
          permitirReatribuicao: isReassignment,
        },
        {
          onSuccess: () => {
            setAnalise("");
            setProximaAcao(null);
            setAvaliadorSelecionadoId(null);
            if (isReassignment) {
              setPendingAction(null);
              setErrorMessage(null);
              setSuccessTitle("Médico reatribuído");
            } else {
              handleMutationSuccess("analise");
            }
          },
          onError: handleMutationError,
        },
      );
      return;
    }

    if (action === "complementacao") {
      responderComplementacao.mutate(
        { afastamentoId: detalhe.id, resposta, documentoArquivo },
        {
          onSuccess: () => {
            setResposta("");
            setDocumentoArquivo(null);
            handleMutationSuccess("complementacao");
          },
          onError: handleMutationError,
        },
      );
      return;
    }

    if (action === "devolutiva") {
      emitirDevolutiva.mutate(
        {
          afastamentoId: detalhe.id,
          resultado,
          descricao,
          orientacoes,
          encaminharRh,
        },
        {
          onSuccess: () => {
            setResultado("apto");
            setDescricao("");
            setOrientacoes("");
            setEncaminharRh(true);
            handleMutationSuccess("devolutiva");
          },
          onError: handleMutationError,
        },
      );
      return;
    }

    registrarProvidencia.mutate(
      { afastamentoId: detalhe.id, descricao: providencia, concluir },
      {
        onSuccess: () => {
          setProvidencia("");
          setConcluir(true);
          handleMutationSuccess("providencia");
        },
        onError: handleMutationError,
      },
    );
  };
  const confirmation = pendingAction ? ACTION_FEEDBACK[pendingAction] : null;
  const isMedicalReassignment = Boolean(
    pendingAction === "analise" && detalhe?.avaliadorAtual,
  );
  const currentPage = PAGE_VARIANT_CONFIG[variant];
  const navItems = isOperationalPage
    ? []
    : [
        {
          label: "Educação",
          to: "/afastamentos/educacao",
          active: variant === "educacao",
          permission: PAGE_VARIANT_CONFIG.educacao.permission,
        },
        {
          label: "CAS",
          to: "/afastamentos/cas",
          active: variant === "cas",
          permission: PAGE_VARIANT_CONFIG.cas.permission,
        },
        {
          label: "DP",
          to: "/afastamentos/dp",
          active: variant === "dp",
          permission: PAGE_VARIANT_CONFIG.dp.permission,
        },
      ].filter((item) =>
        hasPermission(
          authorization.permissions,
          item.permission,
          AFASTAMENTOS_PERMISSIONS.ADMIN,
        ),
      );

  return (
    <ModuleLayout
      moduleName="Afastamentos"
      title={currentPage.title}
      description={currentPage.description}
      navItems={navItems}
      actions={
        canCreate
          ? [
              {
                label: "Novo afastamento",
                onClick: () => setShowCreateModal(true),
              },
            ]
          : []
      }
    >
      <ConfirmDialog
        open={Boolean(confirmation)}
        title={isMedicalReassignment ? "Confirmar reatribuição" : confirmation?.confirmTitle ?? ""}
        description={
          isMedicalReassignment
            ? "O médico atual perderá a avaliação pendente e o novo profissional passará a ser o responsável. A justificativa ficará registrada no histórico."
            : confirmation?.confirmDescription
        }
        confirmLabel={isMedicalReassignment ? "Confirmar reatribuição" : "Confirmar envio"}
        isLoading={pendingMutation}
        onCancel={() => setPendingAction(null)}
        onConfirm={confirmPendingAction}
      />
      <FeedbackDialog
        open={pendingMutation}
        title="Enviando atualização"
        description="Registrando a movimentação e atualizando a fila."
        variant="loading"
      />
      <FeedbackDialog
        open={Boolean(successTitle)}
        title={successTitle ?? ""}
        description="A fila foi atualizada com sucesso."
        variant="success"
        onClose={() => setSuccessTitle(null)}
      />
      <FeedbackDialog
        open={Boolean(errorMessage)}
        title="Não foi possível enviar"
        description={errorMessage}
        variant="error"
        onClose={() => setErrorMessage(null)}
      />
      <NovoAfastamentoModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        servidores={servidores}
        isLoadingServidores={isLoadingServidores}
      />
      <div className="flex h-[calc(100vh-232px)] min-h-0 flex-col overflow-hidden">
        <AfastamentosSummary counters={counters} />
        <AfastamentosTable
          items={visibleAfastamentos}
          isLoading={isLoading}
          isError={isError}
          errorMessage={getErrorMessage(afastamentosError)}
          onSelect={setSelectedId}
        />
      </div>
      {selectedId && (
        <AfastamentoDetailDialog
          detalhe={detalhe}
          loadingDetail={loadingDetail}
          canAnalyze={actionPermissions.canAnalyze}
          canComplement={actionPermissions.canComplement}
          canIssueReturn={actionPermissions.canIssueReturn}
          canRegisterProvidence={actionPermissions.canRegisterProvidence}
          canViewDocument={actionPermissions.canViewDocument}
          canGenerateDocument={actionPermissions.canGenerateDocument}
          canSignDocument={actionPermissions.canSignDocument}
          isGeneratingDocument={gerarDevolutivaFormal.isPending}
          isSigningDocument={assinarDocumentoDigital.isPending}
          analise={analise}
          proximaAcao={proximaAcao}
          avaliadores={avaliadores}
          isLoadingAvaliadores={isLoadingAvaliadores}
          avaliadorSelecionadoId={avaliadorSelecionadoId}
          resposta={resposta}
          documentoArquivo={documentoArquivo}
          resultado={resultado}
          descricao={descricao}
          orientacoes={orientacoes}
          encaminharRh={encaminharRh}
          providencia={providencia}
          concluir={concluir}
          onClose={() => setSelectedId(null)}
          onAnaliseChange={setAnalise}
          onProximaAcaoChange={(value) => {
            setProximaAcao(value);
            if (value !== "encaminhar_avaliacao") setAvaliadorSelecionadoId(null);
          }}
          onAvaliadorSelecionadoChange={setAvaliadorSelecionadoId}
          onRespostaChange={setResposta}
          onDocumentoChange={handleDocumentoComplementacaoChange}
          onResultadoChange={setResultado}
          onDescricaoChange={setDescricao}
          onOrientacoesChange={setOrientacoes}
          onEncaminharRhChange={setEncaminharRh}
          onProvidenciaChange={setProvidencia}
          onConcluirChange={setConcluir}
          onGenerateDocument={handleGenerateDocument}
          onSignDocument={handleSignDocument}
          onSubmitAnalise={submitAnalise}
          onSubmitComplementacao={submitComplementacao}
          onSubmitDevolutiva={submitDevolutiva}
          onSubmitProvidencia={submitProvidencia}
        />
      )}
    </ModuleLayout>
  );
}
