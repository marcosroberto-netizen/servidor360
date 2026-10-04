import type { SyntheticEvent } from "react";

export interface ServidorOption {
  id: string;
  vinculoId: string;
  nome: string;
  matricula: string;
  cpf: string;
  cargo: string;
  funcao: string | null;
  unidadeId: string;
  unidadeNome: string;
  situacao: "ativo" | "afastado";
}

export interface AfastamentosAuthorization {
  permissions: string[];
  profiles: string[];
  allowedUnitIds: string[];
}

export interface AfastamentosActionPermissions {
  canAnalyze: boolean;
  canComplement: boolean;
  canCreate: boolean;
  canGenerateDocument: boolean;
  canIssueReturn: boolean;
  canRegisterProvidence: boolean;
  canSignDocument: boolean;
  canViewDocument: boolean;
}

export type AfastamentosPageVariant = "geral" | "educacao" | "cas" | "dp";

export type AfastamentosViewScope = "operational" | "administrative";

export type PendingAfastamentoAction =
  | "analise"
  | "complementacao"
  | "devolutiva"
  | "providencia"
  | null;

export type DocumentoDigitalTipo = "atestado_enviado" | "devolutiva_formal";

export type TriagemResultado =
  | "documentacao_regular"
  | "documentacao_incompleta"
  | "necessita_avaliacao_medica"
  | "homologado";

export type TriagemDecisao =
  | "solicitar_complementacao"
  | "encaminhar_avaliacao"
  | "homologar";

export type AvaliadorTipo = "medico" | "perito" | "profissional_autorizado";

export interface AvaliadorFila {
  avaliadorId: string;
  tipo: AvaliadorTipo;
  nome: string;
  registroProfissional: string | null;
  especialidade: string | null;
  unidade: string | null;
  pacientesPendentes: number;
}


export interface AfastamentosPageVariantConfig {
  title: string;
  description: string;
  statuses?: AfastamentoStatus[];
  allowCreate: boolean;
  permission: string;
  scope: AfastamentosViewScope;
}

export interface AfastamentoActionFeedback {
  confirmTitle: string;
  confirmDescription: string;
  successTitle: string;
}

export interface AfastamentosViewProps {
  authorization: AfastamentosAuthorization;
  variant?: AfastamentosPageVariant;
  scope: AfastamentosViewScope;
}

export interface ListServidoresForAfastamentoParams {
  allowedUnidades?: string[];
  restrictedToAllowedUnidades?: boolean;
}

export interface ListAfastamentosParams {
  allowedUnidades?: string[];
  restrictedToAllowedUnidades?: boolean;
}

export interface AfastamentoRow {
  id: string;
  servidor_id: string;
  vinculo_funcional_id: string;
  status: AfastamentoStatus;
  protocolo: string | null;
  tipo: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  motivo: string | null;
  observacoes?: string | null;
  documento_origem_nome: string | null;
  documento_origem_url?: string | null;
  documento_origem_tipo: string | null;
  iniciado_em: string;
}

export interface DocumentoDigitalRow {
  id: string;
  afastamento_id: string;
  tipo: string;
  titulo: string;
  protocolo: string;
  status: DocumentoDigitalStatus;
  conteudo: Record<string, unknown>;
  hash_sha256: string;
  qr_payload: string;
  criado_por: string | null;
  criado_em: string;
  assinado_em: string | null;
}

export interface AssinaturaDigitalRow {
  id: string;
  documento_id: string;
  assinante_id: string;
  assinante_nome: string;
  assinante_email: string | null;
  perfil_assinante: string | null;
  assinado_em: string;
  ip: string | null;
  user_agent: string | null;
}

export interface DevolutivaAlert {
  id: string;
  servidorNome: string;
  protocolo: string;
  mensagem: string;
  recebidaEm: string;
  status: "nova" | "pendente";
}

export type AfastamentoStatus =
  | "rascunho"
  | "registrado"
  | "encaminhado"
  | "aguardando_analise"
  | "em_analise"
  | "aguardando_complementacao"
  | "aguardando_avaliacao"
  | "avaliado"
  | "aguardando_rh"
  | "concluido";

export type DevolutivaResultado =
  | "apto"
  | "afastado"
  | "inapto"
  | "apto_com_restricoes"
  | "nova_avaliacao"
  | "complementacao"
  | "outra";

export type AtendimentoDevolutivaResultado =
  | "apto"
  | "afastado"
  | "apto_com_restricoes"
  | "complementacao";

export interface AfastamentoFormData {
  servidorId: string;
  vinculoId: string;
  tipo: string;
  dataInicio: string;
  dataFim: string;
  motivo: string;
  observacoes?: string;
  documentoArquivo?: File | null;
}

export type NovoAfastamentoFormFields = Omit<
  AfastamentoFormData,
  "servidorId" | "vinculoId"
>;

export interface NovoAfastamentoModalProps {
  open: boolean;
  onClose: () => void;
  servidores: ServidorOption[];
  isLoadingServidores: boolean;
}

export interface NovoAfastamentoServidorListProps {
  search: string;
  servidores: ServidorOption[];
  selectedServidor: ServidorOption | null;
  isLoadingServidores: boolean;
  onSearchChange: (value: string) => void;
  onSelectServidor: (value: ServidorOption) => void;
}

export interface NovoAfastamentoFormProps {
  form: NovoAfastamentoFormFields;
  selectedServidor: ServidorOption | null;
  canSubmit: boolean;
  isPending: boolean;
  isDocumentoLoading: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onFieldChange: (field: keyof NovoAfastamentoFormFields, value: string) => void;
  onDocumentoChange: (value: File | null) => void;
  onSubmit: (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => void;
}

export interface AfastamentosSummaryProps {
  counters: {
    total: number;
    analise: number;
    complementacao: number;
    rh: number;
  };
}

export interface AfastamentosFiltersProps {
  search: string;
  statusFilter: AfastamentoStatus | "todos";
  onSearchChange: (value: string) => void;
  onStatusChange: (status: AfastamentoStatus | "todos") => void;
}

export interface AfastamentosTableProps {
  items: AfastamentoResumo[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onSelect: (id: string) => void;
}

export type AfastamentosColumnKey =
  | "servidorNome"
  | "servidorMatricula"
  | "unidadeNome"
  | "protocolo"
  | "tipo"
  | "periodo"
  | "status";

export interface AfastamentoStatusBadgeProps {
  status: AfastamentoStatus;
}

export interface AfastamentoResumo {
  id: string;
  servidorId: string;
  vinculoId: string;
  servidorNome: string;
  servidorMatricula: string;
  servidorCargo: string;
  unidadeId: string | null;
  unidadeNome: string;
  status: AfastamentoStatus;
  protocolo: string | null;
  tipo: string | null;
  dataInicio: string | null;
  dataFim: string | null;
  motivo: string | null;
  documentoOrigemNome: string | null;
  documentoOrigemUrl: string | null;
  documentoOrigemTipo: string | null;
  iniciadoEm: string;
}

export interface AfastamentoAvaliacaoResumo extends AfastamentoResumo {
  encaminhadoEm: string;
}

export interface AtendimentoMedicoFormValues {
  resultado: AtendimentoDevolutivaResultado | "";
  observacoes: string;
  afastamentoInicio: string;
  afastamentoFim: string;
  restricoes: string;
  restricaoInicio: string;
  restricaoFim: string;
  complementacao: string;
}

export interface AfastamentoMovimentacao {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string | null;
  statusOrigem: AfastamentoStatus | null;
  statusDestino: AfastamentoStatus | null;
  criadoPor: string | null;
  criadoPorNome: string | null;
  criadoEm: string;
}

export interface AfastamentoComplementacao {
  id: string;
  solicitacao: string;
  resposta: string | null;
  documentoNome: string | null;
  documentoUrl: string | null;
  solicitadaEm: string;
  respondidaEm: string | null;
  status: "pendente" | "respondida";
}

export interface AfastamentoDevolutiva {
  id: string;
  resultado: DevolutivaResultado;
  descricao: string;
  orientacoes: string | null;
  detalhes: Record<string, unknown>;
  emitidaEm: string;
}

export interface AfastamentoProvidencia {
  id: string;
  descricao: string;
  registradaEm: string;
}

export type DocumentoDigitalStatus =
  | "rascunho"
  | "aguardando_assinatura"
  | "assinado"
  | "substituido"
  | "cancelado";

export interface AfastamentoAssinaturaDigital {
  id: string;
  assinanteId: string;
  assinanteNome: string;
  assinanteEmail: string | null;
  perfilAssinante: string | null;
  assinadoEm: string;
  ip: string | null;
  userAgent: string | null;
}

export interface AfastamentoDocumentoDigital {
  id: string;
  tipo: string;
  titulo: string;
  protocolo: string;
  status: DocumentoDigitalStatus;
  conteudo: Record<string, unknown>;
  hashSha256: string;
  qrPayload: string;
  criadoPor: string | null;
  criadoEm: string;
  assinadoEm: string | null;
  assinaturas: AfastamentoAssinaturaDigital[];
}

export interface AfastamentoDetalhe extends AfastamentoResumo {
  observacoes: string | null;
  avaliadorAtual: {
    avaliadorId: string;
    encaminhadoEm: string;
  } | null;
  movimentacoes: AfastamentoMovimentacao[];
  complementacoes: AfastamentoComplementacao[];
  devolutivas: AfastamentoDevolutiva[];
  providencias: AfastamentoProvidencia[];
  documentosDigitais: AfastamentoDocumentoDigital[];
}

export interface AfastamentoDetailDialogProps {
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
  proximaAcao: TriagemDecisao | null;
  avaliadores: AvaliadorFila[];
  isLoadingAvaliadores: boolean;
  avaliadorSelecionadoId: string | null;
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
  onProximaAcaoChange: (value: TriagemDecisao) => void;
  onAvaliadorSelecionadoChange: (value: string | null) => void;
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
  onSubmitComplementacao: (
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) => void;
  onSubmitDevolutiva: (
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) => void;
  onSubmitProvidencia: (
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) => void;
}

export interface AfastamentoCofreDigitalProps {
  detalhe: AfastamentoDetalhe;
  canGenerateDocument: boolean;
  canSignDocument: boolean;
  isGenerating: boolean;
  isSigning: boolean;
  onGenerateDocument: (tipo: "devolutiva_formal") => void;
  onSignDocument: (documentoId: string, password: string) => void;
}

export interface DocumentoDigitalCardProps {
  documento: AfastamentoDocumentoDigital;
  canSignDocument: boolean;
  isSigning: boolean;
  onRequestSign: () => void;
}

export interface AfastamentoDocumentoPreviewProps {
  detalhe: AfastamentoDetalhe;
  canViewDocument: boolean;
}

export interface AnaliseAfastamentoFormProps {
  analise: string;
  proximaAcao: TriagemDecisao | null;
  avaliadores: AvaliadorFila[];
  isLoadingAvaliadores: boolean;
  avaliadorSelecionadoId: string | null;
  avaliadorAtualId: string | null;
  onAnaliseChange: (value: string) => void;
  onProximaAcaoChange: (value: TriagemDecisao) => void;
  onAvaliadorSelecionadoChange: (value: string | null) => void;
  onSubmit: (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => void;
}

export interface AvaliadorSelectionDrawerProps {
  avaliadores: AvaliadorFila[];
  selectedAvaliadorId: string | null;
  currentAvaliadorId?: string | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (avaliadorId: string) => void;
}

export interface ComplementacaoAfastamentoFormProps {
  resposta: string;
  onRespostaChange: (value: string) => void;
  onDocumentoChange: (value: File | null) => void;
  onSubmit: (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => void;
}

export interface DevolutivaAfastamentoFormProps {
  resultado: DevolutivaResultado;
  descricao: string;
  orientacoes: string;
  encaminharRh: boolean;
  onResultadoChange: (value: DevolutivaResultado) => void;
  onDescricaoChange: (value: string) => void;
  onOrientacoesChange: (value: string) => void;
  onEncaminharRhChange: (value: boolean) => void;
  onSubmit: (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => void;
}

export interface ProvidenciaAfastamentoFormProps {
  providencia: string;
  concluir: boolean;
  onProvidenciaChange: (value: string) => void;
  onConcluirChange: (value: boolean) => void;
  onSubmit: (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => void;
}

export interface AssinaturaAtestadoDialogProps {
  open: boolean;
  servidor: ServidorOption | null;
  senha: string;
  isLoading: boolean;
  onSenhaChange: (value: string) => void;
  onCancel: () => void;
  onSubmitSigned: () => void;
}

export interface RegistrarAnaliseInput {
  afastamentoId: string;
  analise: string;
  proximaAcao: TriagemDecisao;
  avaliadorId?: string;
  permitirReatribuicao?: boolean;
}

export interface ResponderComplementacaoInput {
  afastamentoId: string;
  resposta: string;
  documentoArquivo?: File | null;
}

export interface EmitirDevolutivaInput {
  afastamentoId: string;
  resultado: DevolutivaResultado;
  descricao: string;
  orientacoes?: string;
  encaminharRh: boolean;
  detalhes?: Record<string, unknown>;
}

export interface RegistrarProvidenciaInput {
  afastamentoId: string;
  descricao: string;
  concluir: boolean;
}

export interface GerarDocumentoDigitalInput {
  afastamentoId: string;
  tipo: DocumentoDigitalTipo;
  titulo: string;
  conteudo: Record<string, unknown>;
  hashSha256: string;
}

export interface AssinarDocumentoDigitalInput {
  documentoId: string;
  password: string;
  perfilAssinante?: string;
}

export interface ValidacaoDocumentoDigital {
  id: string;
  protocolo: string;
  titulo: string;
  tipo: string;
  status: DocumentoDigitalStatus;
  hashSha256: string;
  assinadoEm: string | null;
  processoProtocolo: string | null;
  servidorNome: string;
  assinantes: AfastamentoAssinaturaDigital[];
}
