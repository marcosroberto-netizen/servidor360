import { useMemo, useState, type SyntheticEvent } from "react";
import { ModuleLayout } from "@/shared/components/ModuleLayout";
import { ConfirmDialog } from "@/shared/components/ui/ConfirmDialog";
import { FeedbackDialog } from "@/shared/components/ui/FeedbackDialog";
import { AFASTAMENTOS_PERMISSIONS } from "../constants/afastamentos.constants";
import { AfastamentoDetailDialog } from "../components/AfastamentoDetailDialog";
import { AfastamentosSummary } from "../components/AfastamentosSummary";
import { AfastamentosTable } from "../components/AfastamentosTable";
import { NovoAfastamentoModal } from "../components/NovoAfastamentoModal";
import {
  useAfastamentoDetalhe,
  useAssinarDocumentoDigital,
  useAfastamentos,
  useEmitirDevolutiva,
  useGerarDocumentoDigital,
  useRegistrarAnalise,
  useRegistrarProvidencia,
  useResponderComplementacao,
  useServidoresForAfastamento,
} from "../hooks/useAfastamentos";
import { createSha256Hash } from "../services/afastamentosService";
import type {
  AfastamentoDetalhe,
  AfastamentosPageProps,
  DevolutivaResultado,
  RegistrarAnaliseInput,
} from "../types/afastamentos.types";
import {
  getErrorMessage,
  hasPermission,
  validateDocumentoFile,
} from "../utils/afastamentos.utils";

type PendingAction =
  | "analise"
  | "complementacao"
  | "devolutiva"
  | "providencia"
  | null;

const actionFeedback: Record<
  Exclude<PendingAction, null>,
  { confirmTitle: string; confirmDescription: string; successTitle: string }
> = {
  analise: {
    confirmTitle: "Confirmar analise",
    confirmDescription: "Confirme para registrar a analise neste processo.",
    successTitle: "Analise registrada",
  },
  complementacao: {
    confirmTitle: "Confirmar complementacao",
    confirmDescription: "Confirme para enviar a resposta de complementacao.",
    successTitle: "Complementacao enviada",
  },
  devolutiva: {
    confirmTitle: "Confirmar devolutiva",
    confirmDescription: "Confirme para emitir a devolutiva formal.",
    successTitle: "Devolutiva emitida",
  },
  providencia: {
    confirmTitle: "Confirmar providencia",
    confirmDescription: "Confirme para registrar a providencia administrativa.",
    successTitle: "Providencia registrada",
  },
};

export default function AfastamentosPage({
  authorization,
}: AfastamentosPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [analise, setAnalise] = useState("");
  const [proximaAcao, setProximaAcao] =
    useState<RegistrarAnaliseInput["proximaAcao"]>("registrar");
  const [complemento, setComplemento] = useState("");
  const [resposta, setResposta] = useState("");
  const [documentoArquivo, setDocumentoArquivo] = useState<File | null>(null);
  const [resultado, setResultado] = useState<DevolutivaResultado>("apto");
  const [descricao, setDescricao] = useState("");
  const [orientacoes, setOrientacoes] = useState("");
  const [encaminharRh, setEncaminharRh] = useState(true);
  const [providencia, setProvidencia] = useState("");
  const [concluir, setConcluir] = useState(true);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [successTitle, setSuccessTitle] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isGestorEscolar =
    authorization.profiles.includes("gestor_escolar") &&
    !authorization.profiles.includes("administrador");
  const { data: servidores = [], isLoading: isLoadingServidores } =
    useServidoresForAfastamento(authorization.allowedUnitIds, isGestorEscolar);
  const {
    data: afastamentos = [],
    error: afastamentosError,
    isLoading,
    isError,
  } = useAfastamentos();
  const registrarAnalise = useRegistrarAnalise();
  const responderComplementacao = useResponderComplementacao();
  const emitirDevolutiva = useEmitirDevolutiva();
  const gerarDocumentoDigital = useGerarDocumentoDigital();
  const assinarDocumentoDigital = useAssinarDocumentoDigital(selectedId);
  const registrarProvidencia = useRegistrarProvidencia();
  const permissions = authorization.permissions;
  const canCreate = hasPermission(
    permissions,
    AFASTAMENTOS_PERMISSIONS.CREATE,
    AFASTAMENTOS_PERMISSIONS.ADMIN,
  );
  const canAnalyze = hasPermission(
    permissions,
    AFASTAMENTOS_PERMISSIONS.ANALISAR,
    AFASTAMENTOS_PERMISSIONS.ADMIN,
  );
  const canComplement = hasPermission(
    permissions,
    AFASTAMENTOS_PERMISSIONS.COMPLEMENTAR,
    AFASTAMENTOS_PERMISSIONS.ADMIN,
  );
  const canIssueReturn = hasPermission(
    permissions,
    AFASTAMENTOS_PERMISSIONS.EMITIR_DEVOLUTIVA,
    AFASTAMENTOS_PERMISSIONS.ADMIN,
  );
  const canRegisterProvidence = hasPermission(
    permissions,
    AFASTAMENTOS_PERMISSIONS.REGISTRAR_PROVIDENCIA,
    AFASTAMENTOS_PERMISSIONS.ADMIN,
  );
  const canViewDocument = hasPermission(
    permissions,
    AFASTAMENTOS_PERMISSIONS.VIEW_DOCUMENT,
    AFASTAMENTOS_PERMISSIONS.ADMIN,
  );
  const canGenerateDocument = hasPermission(
    permissions,
    AFASTAMENTOS_PERMISSIONS.GERAR_DOCUMENTO,
    AFASTAMENTOS_PERMISSIONS.ADMIN,
  );
  const canSignDocument = hasPermission(
    permissions,
    AFASTAMENTOS_PERMISSIONS.ASSINAR_DOCUMENTO,
    AFASTAMENTOS_PERMISSIONS.ADMIN,
  );
  const { data: detalhe, isLoading: loadingDetail } = useAfastamentoDetalhe(
    selectedId,
    canViewDocument,
  );
  const counters = useMemo(
    () => ({
      total: afastamentos.length,
      analise: afastamentos.filter(
        (item) => item.status === "aguardando_analise",
      ).length,
      complementacao: afastamentos.filter(
        (item) => item.status === "aguardando_complementacao",
      ).length,
      rh: afastamentos.filter((item) => item.status === "aguardando_rh").length,
    }),
    [afastamentos],
  );
  const pendingMutation =
    registrarAnalise.isPending ||
    responderComplementacao.isPending ||
    emitirDevolutiva.isPending ||
    gerarDocumentoDigital.isPending ||
    assinarDocumentoDigital.isPending ||
    registrarProvidencia.isPending;
  const submitAnalise = (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    event.preventDefault();
    if (!detalhe || !analise.trim()) return;
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
  const handleMutationSuccess = (action: Exclude<PendingAction, null>) => {
    setPendingAction(null);
    setErrorMessage(null);
    setSuccessTitle(actionFeedback[action].successTitle);
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
      const conteudo = buildDocumentoDigitalContent(detalhe, tipo);
      const hashSha256 = await createSha256Hash(conteudo);

      gerarDocumentoDigital.mutate(
        {
          afastamentoId: detalhe.id,
          tipo,
          titulo: "Devolutiva formal do afastamento",
          conteudo,
          hashSha256,
        },
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
      registrarAnalise.mutate(
        { afastamentoId: detalhe.id, analise, proximaAcao, complemento },
        {
          onSuccess: () => {
            setAnalise("");
            setComplemento("");
            setProximaAcao("registrar");
            handleMutationSuccess("analise");
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
  const confirmation = pendingAction ? actionFeedback[pendingAction] : null;

  return (
    <ModuleLayout
      moduleName="Afastamentos"
      title="Processos de afastamento"
      description="Acompanhe protocolos, pendencias e etapas administrativas em uma fila unica."
      navItems={[{ label: "Processos", to: "/afastamentos", active: true }]}
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
        title={confirmation?.confirmTitle ?? ""}
        description={confirmation?.confirmDescription}
        confirmLabel="Confirmar envio"
        isLoading={pendingMutation}
        onCancel={() => setPendingAction(null)}
        onConfirm={confirmPendingAction}
      />
      <FeedbackDialog
        open={pendingMutation}
        title="Enviando atualizacao"
        description="Registrando a movimentacao e atualizando a fila."
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
        title="Nao foi possivel enviar"
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
          items={afastamentos}
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
          canAnalyze={canAnalyze}
          canComplement={canComplement}
          canIssueReturn={canIssueReturn}
          canRegisterProvidence={canRegisterProvidence}
          canViewDocument={canViewDocument}
          canGenerateDocument={canGenerateDocument}
          canSignDocument={canSignDocument}
          isGeneratingDocument={gerarDocumentoDigital.isPending}
          isSigningDocument={assinarDocumentoDigital.isPending}
          analise={analise}
          proximaAcao={proximaAcao}
          complemento={complemento}
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
          onProximaAcaoChange={setProximaAcao}
          onComplementoChange={setComplemento}
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

function buildDocumentoDigitalContent(
  detalhe: AfastamentoDetalhe,
  tipo: "devolutiva_formal",
) {
  const devolutiva = detalhe.devolutivas[0] ?? null;

  const base = {
    tipoDocumento: tipo,
    processo: {
      id: detalhe.id,
      protocolo: detalhe.protocolo,
      status: detalhe.status,
      tipo: detalhe.tipo,
      periodo: {
        inicio: detalhe.dataInicio,
        fim: detalhe.dataFim,
      },
      motivo: detalhe.motivo,
      observacoes: detalhe.observacoes,
    },
    servidor: {
      id: detalhe.servidorId,
      nome: detalhe.servidorNome,
      matricula: detalhe.servidorMatricula,
      cargo: detalhe.servidorCargo,
      unidade: detalhe.unidadeNome,
    },
    geradoEm: new Date().toISOString(),
  };

  return {
    ...base,
    devolutiva,
    providencias: detalhe.providencias,
  };
}
