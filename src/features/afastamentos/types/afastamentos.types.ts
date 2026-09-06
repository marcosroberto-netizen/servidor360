import type { SyntheticEvent } from "react";

export interface ServidorOption {
  id: string;
  nome: string;
  matricula: string;
  cpf: string;
  cargo: string;
  unidadeId: string;
  unidadeNome: string;
  situacao: "ativo" | "afastado";
}

export interface AfastamentosAuthorization {
  permissions: string[];
  profiles: string[];
  allowedUnitIds: string[];
}

export interface AfastamentosPageProps {
  authorization: AfastamentosAuthorization;
}

export interface ListServidoresForAfastamentoParams {
  allowedUnidades?: string[];
  restrictedToAllowedUnidades?: boolean;
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
  | "inapto"
  | "apto_com_restricoes"
  | "nova_avaliacao"
  | "complementacao"
  | "outra";

export interface AfastamentoFormData {
  servidorId: string;
  tipo: string;
  dataInicio: string;
  dataFim: string;
  motivo: string;
  observacoes?: string;
  documentoArquivo?: File | null;
}

export type NovoAfastamentoFormFields = Omit<AfastamentoFormData, "servidorId">;

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
  errorMessage: string | null;
  onClose: () => void;
  onFieldChange: (field: keyof NovoAfastamentoFormFields, value: string) => void;
  onDocumentoChange: (value: File | null) => void;
  onSubmit: (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => void;
}

export interface AfastamentoResumo {
  id: string;
  servidorId: string;
  servidorNome: string;
  servidorMatricula: string;
  servidorCargo: string;
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

export interface AfastamentoMovimentacao {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string | null;
  statusOrigem: AfastamentoStatus | null;
  statusDestino: AfastamentoStatus | null;
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
  emitidaEm: string;
}

export interface AfastamentoProvidencia {
  id: string;
  descricao: string;
  registradaEm: string;
}

export interface AfastamentoDetalhe extends AfastamentoResumo {
  observacoes: string | null;
  movimentacoes: AfastamentoMovimentacao[];
  complementacoes: AfastamentoComplementacao[];
  devolutivas: AfastamentoDevolutiva[];
  providencias: AfastamentoProvidencia[];
}

export interface RegistrarAnaliseInput {
  afastamentoId: string;
  analise: string;
  proximaAcao:
    | "registrar"
    | "solicitar_complementacao"
    | "encaminhar_avaliacao"
    | "encaminhar_rh";
  complemento?: string;
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
}

export interface RegistrarProvidenciaInput {
  afastamentoId: string;
  descricao: string;
  concluir: boolean;
}
