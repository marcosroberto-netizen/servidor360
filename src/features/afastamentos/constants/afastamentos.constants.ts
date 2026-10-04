import { PERMISSIONS } from "@/features/auth";
import type {
  AfastamentoActionFeedback,
  AfastamentoStatus,
  AfastamentosPageVariant,
  AfastamentosPageVariantConfig,
  DevolutivaResultado,
  DocumentoDigitalStatus,
  PendingAfastamentoAction,
} from "../types/afastamentos.types";

export const AFASTAMENTOS_PERMISSIONS = {
  ADMIN: PERMISSIONS.ADMIN,
  CREATE: PERMISSIONS.AFASTAMENTOS_CREATE,
  VIEW_DOCUMENT: PERMISSIONS.AFASTAMENTOS_VISUALIZAR_DOCUMENTO,
  ANALISAR: PERMISSIONS.AFASTAMENTOS_ANALISAR,
  AVALIAR: PERMISSIONS.AFASTAMENTOS_AVALIAR,
  COMPLEMENTAR: PERMISSIONS.AFASTAMENTOS_COMPLEMENTAR,
  EMITIR_DEVOLUTIVA: PERMISSIONS.AFASTAMENTOS_EMITIR_DEVOLUTIVA,
  REGISTRAR_PROVIDENCIA: PERMISSIONS.AFASTAMENTOS_REGISTRAR_PROVIDENCIA,
  GERAR_DOCUMENTO: PERMISSIONS.AFASTAMENTOS_GERAR_DOCUMENTO,
  ASSINAR_DOCUMENTO: PERMISSIONS.AFASTAMENTOS_ASSINAR_DOCUMENTO,
  VALIDAR_DOCUMENTO: PERMISSIONS.AFASTAMENTOS_VALIDAR_DOCUMENTO,
} as const;

export const MAX_DOCUMENTO_SIZE = 10 * 1024 * 1024;

export const ALLOWED_DOCUMENTO_TYPES: readonly string[] = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const STATUS_LABELS: Record<AfastamentoStatus, string> = {
  rascunho: "Rascunho",
  registrado: "Registrado",
  encaminhado: "Encaminhado",
  aguardando_analise: "Aguardando análise",
  em_analise: "Em análise",
  aguardando_complementacao: "Aguardando complementação",
  aguardando_avaliacao: "Aguardando avaliação",
  avaliado: "Avaliado",
  aguardando_rh: "Aguardando RH",
  concluido: "Concluído",
};

export const STATUS_BADGE_CLASSES: Record<AfastamentoStatus, string> = {
  rascunho: "border-slate-200 bg-slate-50 text-slate-700",
  registrado: "border-sky-200 bg-sky-50 text-sky-800",
  encaminhado: "border-indigo-200 bg-indigo-50 text-indigo-800",
  aguardando_analise: "border-amber-200 bg-amber-50 text-amber-800",
  em_analise: "border-blue-200 bg-blue-50 text-blue-800",
  aguardando_complementacao: "border-orange-200 bg-orange-50 text-orange-800",
  aguardando_avaliacao: "border-violet-200 bg-violet-50 text-violet-800",
  avaliado: "border-teal-200 bg-teal-50 text-teal-800",
  aguardando_rh: "border-cyan-200 bg-cyan-50 text-cyan-800",
  concluido: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

export const RESULTADO_LABELS: Record<DevolutivaResultado, string> = {
  apto: "Apto",
  afastado: "Afastado",
  inapto: "Inapto",
  apto_com_restricoes: "Apto com restrições",
  nova_avaliacao: "Necessidade de nova avaliação",
  complementacao: "Necessidade de complementação",
  outra: "Outra conclusão",
};

export const DOCUMENTO_DIGITAL_STATUS_LABELS: Record<
  DocumentoDigitalStatus,
  string
> = {
  rascunho: "Rascunho",
  aguardando_assinatura: "Aguardando assinatura",
  assinado: "Assinado",
  substituido: "Substituído",
  cancelado: "Cancelado",
};

export const ACTION_FEEDBACK: Record<
  Exclude<PendingAfastamentoAction, null>,
  AfastamentoActionFeedback
> = {
  analise: {
    confirmTitle: "Confirmar triagem",
    confirmDescription: "Confirme para registrar a triagem e encaminhar o processo.",
    successTitle: "Triagem registrada",
  },
  complementacao: {
    confirmTitle: "Confirmar complementação",
    confirmDescription: "Confirme para enviar a resposta de complementação.",
    successTitle: "Complementação enviada",
  },
  devolutiva: {
    confirmTitle: "Confirmar devolutiva",
    confirmDescription: "Confirme para emitir a devolutiva formal.",
    successTitle: "Devolutiva emitida",
  },
  providencia: {
    confirmTitle: "Confirmar providência",
    confirmDescription: "Confirme para registrar a providência administrativa.",
    successTitle: "Providência registrada",
  },
};

export const PAGE_VARIANT_CONFIG: Record<
  AfastamentosPageVariant,
  AfastamentosPageVariantConfig
> = {
  geral: {
    title: "Processos de afastamento",
    description:
      "Lance e acompanhe afastamentos apenas dos servidores da sua unidade ou departamento.",
    allowCreate: true,
    permission: PERMISSIONS.AFASTAMENTOS_READ,
    scope: "operational",
  },
  educacao: {
    title: "Afastamentos da Educação",
    description:
      "Acompanhe registros iniciados pela rede, complementações pendentes e processos encaminhados.",
    statuses: ["registrado", "encaminhado", "aguardando_complementacao"],
    allowCreate: false,
    permission: PERMISSIONS.EDUCACAO_READ,
    scope: "administrative",
  },
  cas: {
    title: "Fila de afastamentos do CAS",
    description:
      "Analise solicitações, peça complementações e encaminhe processos para avaliação ou providência.",
    statuses: [
      "encaminhado",
      "aguardando_analise",
      "em_analise",
      "aguardando_avaliacao",
    ],
    allowCreate: false,
    permission: PERMISSIONS.CAS_FILA,
    scope: "administrative",
  },
  dp: {
    title: "Fila de afastamentos do DP",
    description:
      "Registre providências administrativas, acompanhe devolutivas recebidas e conclua processos.",
    statuses: ["avaliado", "aguardando_rh", "concluido"],
    allowCreate: false,
    permission: PERMISSIONS.RH_FILA,
    scope: "administrative",
  },
};
