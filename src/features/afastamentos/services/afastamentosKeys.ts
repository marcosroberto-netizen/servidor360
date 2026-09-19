export const afastamentosKeys = {
  all: ["afastamentos"] as const,
  listas: () => [...afastamentosKeys.all, "listas"] as const,
  detalhes: () => [...afastamentosKeys.all, "detalhes"] as const,
  list: (unidades: string[], restricted: boolean) =>
    [...afastamentosKeys.listas(), "processos", unidades, restricted] as const,
  detailBase: (id: string) => [...afastamentosKeys.detalhes(), id] as const,
  detail: (id: string, includeDocumentoUrl = false) =>
    [...afastamentosKeys.detailBase(id), includeDocumentoUrl] as const,
  servidores: (unidades: string[], restricted: boolean) =>
    [...afastamentosKeys.all, "servidores", unidades, restricted] as const,
  medicosAvaliadores: () =>
    [...afastamentosKeys.all, "medicos-avaliadores"] as const,
  devolutivas: () => [...afastamentosKeys.all, "devolutivas"] as const,
  validacaoDocumento: (protocolo: string) =>
    [...afastamentosKeys.all, "validacao-documento", protocolo] as const,
};
