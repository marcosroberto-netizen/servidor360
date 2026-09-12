import type {
  AfastamentoStatus,
  DevolutivaResultado,
} from "../types/afastamentos.types";

const maxDocumentoSize = 10 * 1024 * 1024;
const allowedDocumentoTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const statusLabels: Record<AfastamentoStatus, string> = {
  rascunho: "Rascunho",
  registrado: "Registrado",
  encaminhado: "Encaminhado",
  aguardando_analise: "Aguardando analise",
  em_analise: "Em analise",
  aguardando_complementacao: "Aguardando complementacao",
  aguardando_avaliacao: "Aguardando avaliacao",
  avaliado: "Avaliado",
  aguardando_rh: "Aguardando RH",
  concluido: "Concluido",
};

export const statusBadgeClasses: Record<AfastamentoStatus, string> = {
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

export const resultadoLabels: Record<DevolutivaResultado, string> = {
  apto: "Apto",
  inapto: "Inapto",
  apto_com_restricoes: "Apto com restricoes",
  nova_avaliacao: "Necessidade de nova avaliacao",
  complementacao: "Necessidade de complementacao",
  outra: "Outra conclusao",
};
export function hasPermission(
  permissions: string[],
  permission: string,
  adminPermission: string,
) {
  return (
    permissions.includes(adminPermission) || permissions.includes(permission)
  );
}
export function today() {
  return new Date().toISOString().slice(0, 10);
}
export function normalize(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
export function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
        new Date(value),
      )
    : "-";
}
export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }

  return "Nao foi possivel concluir a operacao. Tente novamente.";
}

export function validateDocumentoFile(file: File | null) {
  if (!file) return null;

  if (!allowedDocumentoTypes.includes(file.type)) {
    return "Arquivo invalido. Envie PDF, PNG, JPG ou WEBP.";
  }

  if (file.size > maxDocumentoSize) {
    return "Arquivo muito grande. O limite para documentos e 10 MB.";
  }

  return null;
}

export function documentoDisplayName(tipo: string | null, enviadoEm: string) {
  return `${tipo ?? "Documento"} - ${formatDate(enviadoEm)}`;
}

export function documentoPreviewKind(
  mimeType: string | null,
  fileName: string | null,
) {
  const normalizedMime = mimeType?.toLocaleLowerCase("pt-BR") ?? "";
  const normalizedName = fileName?.toLocaleLowerCase("pt-BR") ?? "";

  if (
    normalizedMime.startsWith("image/") ||
    /\.(png|jpe?g|webp)$/i.test(normalizedName)
  ) {
    return "image";
  }

  if (normalizedMime === "application/pdf" || normalizedName.endsWith(".pdf")) {
    return "pdf";
  }

  return "file";
}
