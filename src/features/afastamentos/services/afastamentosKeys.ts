export const afastamentosKeys = {
  all: ["afastamentos"] as const,
  listas: () => [...afastamentosKeys.all, "listas"] as const,
  detalhes: () => [...afastamentosKeys.all, "detalhes"] as const,
  list: () => [...afastamentosKeys.listas(), "processos"] as const,
  detailBase: (id: string) => [...afastamentosKeys.detalhes(), id] as const,
  detail: (id: string, includeDocumentoUrl = false) =>
    [...afastamentosKeys.detailBase(id), includeDocumentoUrl] as const,
  servidores: (unidades: string[], restricted: boolean) =>
    [...afastamentosKeys.all, "servidores", unidades, restricted] as const,
  devolutivas: () => [...afastamentosKeys.all, "devolutivas"] as const,
};
