import {
  ALLOWED_DOCUMENTO_TYPES,
  AFASTAMENTOS_PERMISSIONS,
  MAX_DOCUMENTO_SIZE,
} from "../constants/afastamentos.constants";
import type {
  AfastamentoStatus,
  AfastamentosActionPermissions,
} from "../types/afastamentos.types";
export function hasPermission(
  permissions: string[],
  permission: string,
  adminPermission: string,
) {
  return (
    permissions.includes(adminPermission) || permissions.includes(permission)
  );
}

export function getAfastamentosActionPermissions(
  permissions: string[],
): Omit<AfastamentosActionPermissions, "canCreate"> {
  return {
    canAnalyze: hasPermission(
      permissions,
      AFASTAMENTOS_PERMISSIONS.ANALISAR,
      AFASTAMENTOS_PERMISSIONS.ADMIN,
    ),
    canComplement: hasPermission(
      permissions,
      AFASTAMENTOS_PERMISSIONS.COMPLEMENTAR,
      AFASTAMENTOS_PERMISSIONS.ADMIN,
    ),
    canIssueReturn: hasPermission(
      permissions,
      AFASTAMENTOS_PERMISSIONS.EMITIR_DEVOLUTIVA,
      AFASTAMENTOS_PERMISSIONS.ADMIN,
    ),
    canRegisterProvidence: hasPermission(
      permissions,
      AFASTAMENTOS_PERMISSIONS.REGISTRAR_PROVIDENCIA,
      AFASTAMENTOS_PERMISSIONS.ADMIN,
    ),
    canViewDocument: hasPermission(
      permissions,
      AFASTAMENTOS_PERMISSIONS.VIEW_DOCUMENT,
      AFASTAMENTOS_PERMISSIONS.ADMIN,
    ),
    canGenerateDocument: hasPermission(
      permissions,
      AFASTAMENTOS_PERMISSIONS.GERAR_DOCUMENTO,
      AFASTAMENTOS_PERMISSIONS.ADMIN,
    ),
    canSignDocument: hasPermission(
      permissions,
      AFASTAMENTOS_PERMISSIONS.ASSINAR_DOCUMENTO,
      AFASTAMENTOS_PERMISSIONS.ADMIN,
    ),
  };
}

export function canAnalyzeAfastamento(status: AfastamentoStatus) {
  return [
    "encaminhado",
    "aguardando_analise",
    "em_analise",
    "aguardando_avaliacao",
  ].includes(status);
}

export function canIssueReturnAfastamento(status: AfastamentoStatus) {
  return status === "aguardando_avaliacao";
}

export function canRegisterProvidenceAfastamento(status: AfastamentoStatus) {
  return status === "avaliado" || status === "aguardando_rh";
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

  return "Não foi possível concluir a operação. Tente novamente.";
}

export function validateDocumentoFile(file: File | null) {
  if (!file) return null;

  if (!ALLOWED_DOCUMENTO_TYPES.includes(file.type)) {
    return "Arquivo inválido. Envie PDF, PNG, JPG ou WEBP.";
  }

  if (file.size > MAX_DOCUMENTO_SIZE) {
    return "Arquivo muito grande. O limite para documentos é 10 MB.";
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
