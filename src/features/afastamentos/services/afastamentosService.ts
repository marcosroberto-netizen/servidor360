import { supabase } from "@/shared/lib/supabase";
import type {
  AfastamentoComplementacao,
  AfastamentoDetalhe,
  AfastamentoDocumentoDigital,
  AfastamentoDevolutiva,
  AfastamentoFormData,
  AfastamentoMovimentacao,
  AfastamentoProvidencia,
  AfastamentoResumo,
  AfastamentoStatus,
  AssinarDocumentoDigitalInput,
  DevolutivaAlert,
  EmitirDevolutivaInput,
  GerarDocumentoDigitalInput,
  ListServidoresForAfastamentoParams,
  RegistrarAnaliseInput,
  RegistrarProvidenciaInput,
  ResponderComplementacaoInput,
  ServidorOption,
  ValidacaoDocumentoDigital,
} from "../types/afastamentos.types";

interface AfastamentoRow {
  id: string;
  servidor_id: string;
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

interface DocumentoDigitalRow {
  id: string;
  afastamento_id: string;
  tipo: string;
  titulo: string;
  protocolo: string;
  status: AfastamentoDocumentoDigital["status"];
  conteudo: Record<string, unknown>;
  hash_sha256: string;
  qr_payload: string;
  criado_por: string | null;
  criado_em: string;
  assinado_em: string | null;
}

interface AssinaturaDigitalRow {
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

const documentosBucket = "afastamentos-documentos";

function safeFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLocaleLowerCase("pt-BR");
}

function fileExtension(file: File) {
  const extension = file.name.split(".").pop();
  return extension ? `.${safeFileName(extension)}` : "";
}

function buildDocumentoName(
  servidor: ServidorOption | undefined,
  tipo: string,
  file: File,
) {
  const servidorPart = servidor
    ? `${servidor.matricula}-${servidor.nome}`
    : "servidor";
  const datePart = new Date().toISOString().slice(0, 10);

  return `${safeFileName(`${servidorPart}-${tipo}-${datePart}`)}${fileExtension(file)}`;
}

async function uploadDocumento(file: File, prefix: string, fileName: string) {
  const path = `${prefix}/${crypto.randomUUID()}-${safeFileName(fileName)}`;
  const { data, error } = await supabase.storage
    .from(documentosBucket)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw error;

  return data.path;
}

async function createSignedDocumentoUrl(path: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const { data, error } = await supabase.storage
    .from(documentosBucket)
    .createSignedUrl(path, 60 * 10);

  if (error) return null;

  return data.signedUrl;
}

function mapAfastamento(
  row: AfastamentoRow,
  servidor: ServidorOption | undefined,
): AfastamentoResumo {
  return {
    id: row.id,
    servidorId: row.servidor_id,
    servidorNome: servidor?.nome ?? "Servidor nao encontrado",
    servidorMatricula: servidor?.matricula ?? "-",
    servidorCargo: servidor?.cargo ?? "-",
    unidadeNome: servidor?.unidadeNome ?? "Unidade nao informada",
    status: row.status,
    protocolo: row.protocolo,
    tipo: row.tipo,
    dataInicio: row.data_inicio,
    dataFim: row.data_fim,
    motivo: row.motivo,
    documentoOrigemNome: row.documento_origem_nome,
    documentoOrigemUrl: row.documento_origem_url ?? null,
    documentoOrigemTipo: row.documento_origem_tipo,
    iniciadoEm: row.iniciado_em,
  };
}

function mapDocumentoDigital(
  row: DocumentoDigitalRow,
  assinaturas: AssinaturaDigitalRow[],
): AfastamentoDocumentoDigital {
  return {
    id: row.id,
    tipo: row.tipo,
    titulo: row.titulo,
    protocolo: row.protocolo,
    status: row.status,
    conteudo: row.conteudo,
    hashSha256: row.hash_sha256,
    qrPayload: row.qr_payload,
    criadoPor: row.criado_por,
    criadoEm: row.criado_em,
    assinadoEm: row.assinado_em,
    assinaturas: assinaturas.map((assinatura) => ({
      id: assinatura.id,
      assinanteId: assinatura.assinante_id,
      assinanteNome: assinatura.assinante_nome,
      assinanteEmail: assinatura.assinante_email,
      perfilAssinante: assinatura.perfil_assinante,
      assinadoEm: assinatura.assinado_em,
      ip: assinatura.ip,
      userAgent: assinatura.user_agent,
    })),
  };
}

export async function createSha256Hash(value: unknown) {
  const payload = typeof value === "string" ? value : JSON.stringify(value);
  const encoded = new TextEncoder().encode(payload);
  const digest = await crypto.subtle.digest("SHA-256", encoded);

  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function confirmarSenhaUsuario(password: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    throw new Error("Sessao expirada. Acesse novamente para assinar.");
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });

  if (error) {
    throw new Error("Senha invalida. Confira sua senha e tente novamente.");
  }
}

async function getServidoresById(ids: string[]) {
  const uniqueIds = [...new Set(ids)].filter(Boolean);
  if (uniqueIds.length === 0) return new Map<string, ServidorOption>();

  const { data, error } = await supabase
    .schema("servidores")
    .from("servidores")
    .select("id, nome, matricula, cpf, cargo, unidade_id, ativo")
    .in("id", uniqueIds);

  if (error) throw error;

  const unidadeIds = [
    ...new Set((data ?? []).map((servidor) => servidor.unidade_id)),
  ];
  const { data: unidades, error: unidadesError } =
    unidadeIds.length > 0
      ? await supabase
          .schema("organizacional")
          .from("unidades")
          .select("id, nome")
          .in("id", unidadeIds)
      : { data: [], error: null };

  if (unidadesError) throw unidadesError;

  const unidadeNamesById = new Map(
    (unidades ?? []).map((unidade) => [unidade.id, unidade.nome]),
  );
  const servidores = new Map<string, ServidorOption>();

  for (const servidor of data ?? []) {
    servidores.set(servidor.id, {
      id: servidor.id,
      nome: servidor.nome,
      matricula: servidor.matricula,
      cpf: servidor.cpf,
      cargo: servidor.cargo ?? "Servidor publico",
      unidadeId: servidor.unidade_id,
      unidadeNome:
        unidadeNamesById.get(servidor.unidade_id) ?? "Unidade nao informada",
      situacao: servidor.ativo ? "ativo" : "afastado",
    });
  }

  return servidores;
}

export async function listServidoresForAfastamento({
  allowedUnidades = [],
  restrictedToAllowedUnidades = false,
}: ListServidoresForAfastamentoParams = {}) {
  if (restrictedToAllowedUnidades && allowedUnidades.length === 0) {
    return [];
  }

  let query = supabase
    .schema("servidores")
    .from("servidores")
    .select("id, nome, matricula, cpf, cargo, unidade_id, ativo")
    .order("nome", { ascending: true });

  if (restrictedToAllowedUnidades) {
    query = query.in("unidade_id", allowedUnidades);
  }

  const { data, error } = await query;

  if (error) throw error;

  const unidadeIds = [
    ...new Set((data ?? []).map((servidor) => servidor.unidade_id)),
  ];
  const { data: unidades, error: unidadesError } =
    unidadeIds.length > 0
      ? await supabase
          .schema("organizacional")
          .from("unidades")
          .select("id, nome")
          .in("id", unidadeIds)
      : { data: [], error: null };

  if (unidadesError) throw unidadesError;

  const unidadeNamesById = new Map(
    (unidades ?? []).map((unidade) => [unidade.id, unidade.nome]),
  );

  return (data ?? []).map((servidor) => {
    return {
      id: servidor.id,
      nome: servidor.nome,
      matricula: servidor.matricula,
      cpf: servidor.cpf,
      cargo: servidor.cargo ?? "Servidor publico",
      unidadeId: servidor.unidade_id,
      unidadeNome:
        unidadeNamesById.get(servidor.unidade_id) ?? "Unidade nao informada",
      situacao: servidor.ativo ? "ativo" : "afastado",
    };
  }) satisfies ServidorOption[];
}

export async function createAfastamento(
  input: AfastamentoFormData,
): Promise<string> {
  const servidores = await getServidoresById([input.servidorId]);
  const servidor = servidores.get(input.servidorId);
  const documentoNome = input.documentoArquivo
    ? buildDocumentoName(servidor, input.tipo, input.documentoArquivo)
    : null;
  const uploadedPath = input.documentoArquivo
    ? await uploadDocumento(
        input.documentoArquivo,
        `origem/${input.servidorId}`,
        documentoNome ?? input.documentoArquivo.name,
      )
    : null;

  const { data, error } = await supabase.rpc("criar_afastamento", {
    input: {
      servidorId: input.servidorId,
      tipo: input.tipo,
      dataInicio: input.dataInicio,
      dataFim: input.dataFim,
      motivo: input.motivo,
      observacoes: input.observacoes ?? "",
      documentoNome: documentoNome ?? "",
      documentoUrl: uploadedPath ?? "",
      documentoTipo: input.documentoArquivo?.type ?? "",
    },
  });

  if (error) throw error;

  return data as string;
}

export async function listAfastamentos(): Promise<AfastamentoResumo[]> {
  const { data, error } = await supabase
    .schema("afastamentos")
    .from("afastamentos")
    .select(
      "id, servidor_id, status, protocolo, tipo, data_inicio, data_fim, motivo, documento_origem_nome, documento_origem_tipo, iniciado_em",
    )
    .order("updated_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as AfastamentoRow[];
  const servidores = await getServidoresById(
    rows.map((row) => row.servidor_id),
  );

  return rows.map((row) =>
    mapAfastamento(row, servidores.get(row.servidor_id)),
  );
}

export async function getAfastamentoDetalhe(
  id: string,
  includeDocumentoUrl = false,
): Promise<AfastamentoDetalhe> {
  const selectFields: string = includeDocumentoUrl
    ? "id, servidor_id, status, protocolo, tipo, data_inicio, data_fim, motivo, observacoes, documento_origem_nome, documento_origem_tipo, iniciado_em, documento_origem_url"
    : "id, servidor_id, status, protocolo, tipo, data_inicio, data_fim, motivo, observacoes, documento_origem_nome, documento_origem_tipo, iniciado_em";
  const { data, error } = await supabase
    .schema("afastamentos")
    .from("afastamentos")
    .select(selectFields)
    .eq("id", id)
    .single();

  if (error) throw error;

  const row = data as unknown as AfastamentoRow;
  const servidores = await getServidoresById([row.servidor_id]);
  const signedDocumentoUrl = includeDocumentoUrl
    ? await createSignedDocumentoUrl(row.documento_origem_url ?? null)
    : null;
  const resumo = mapAfastamento(
    { ...row, documento_origem_url: signedDocumentoUrl },
    servidores.get(row.servidor_id),
  );

  const [
    movimentacoesResult,
    complementacoesResult,
    devolutivasResult,
    providenciasResult,
    documentosDigitaisResult,
  ] = await Promise.all([
    supabase
      .schema("afastamentos")
      .from("movimentacoes")
      .select(
        "id, tipo, titulo, descricao, status_origem, status_destino, criado_em",
      )
      .eq("afastamento_id", id)
      .order("criado_em", { ascending: false }),
    supabase
      .schema("afastamentos")
      .from("complementacoes")
      .select(
        "id, solicitacao, resposta, documento_nome, documento_url, solicitada_em, respondida_em, status",
      )
      .eq("afastamento_id", id)
      .order("solicitada_em", { ascending: false }),
    supabase
      .schema("afastamentos")
      .from("devolutivas")
      .select("id, resultado, descricao, orientacoes, emitida_em")
      .eq("afastamento_id", id)
      .order("emitida_em", { ascending: false }),
    supabase
      .schema("afastamentos")
      .from("providencias")
      .select("id, descricao, registrada_em")
      .eq("afastamento_id", id)
      .order("registrada_em", { ascending: false }),
    supabase
      .schema("afastamentos")
      .from("documentos_digitais")
      .select(
        "id, afastamento_id, tipo, titulo, protocolo, status, conteudo, hash_sha256, qr_payload, criado_por, criado_em, assinado_em",
      )
      .eq("afastamento_id", id)
      .order("criado_em", { ascending: false }),
  ]);

  if (movimentacoesResult.error) throw movimentacoesResult.error;
  if (complementacoesResult.error) throw complementacoesResult.error;
  if (devolutivasResult.error) throw devolutivasResult.error;
  if (providenciasResult.error) throw providenciasResult.error;
  if (documentosDigitaisResult.error) throw documentosDigitaisResult.error;

  const documentoIds = (documentosDigitaisResult.data ?? []).map(
    (documento) => documento.id,
  );
  const assinaturasResult =
    documentoIds.length > 0
      ? await supabase
          .schema("afastamentos")
          .from("assinaturas_digitais")
          .select(
            "id, documento_id, assinante_id, assinante_nome, assinante_email, perfil_assinante, assinado_em, ip, user_agent",
          )
          .in("documento_id", documentoIds)
          .order("assinado_em", { ascending: false })
      : { data: [], error: null };

  if (assinaturasResult.error) throw assinaturasResult.error;

  const assinaturasByDocumento = new Map<string, AssinaturaDigitalRow[]>();

  for (const assinatura of (assinaturasResult.data ??
    []) as AssinaturaDigitalRow[]) {
    const current = assinaturasByDocumento.get(assinatura.documento_id) ?? [];
    current.push(assinatura);
    assinaturasByDocumento.set(assinatura.documento_id, current);
  }

  return {
    ...resumo,
    observacoes: row.observacoes ?? null,
    movimentacoes: (movimentacoesResult.data ?? []).map((item) => ({
      id: item.id,
      tipo: item.tipo,
      titulo: item.titulo,
      descricao: item.descricao,
      statusOrigem: item.status_origem,
      statusDestino: item.status_destino,
      criadoEm: item.criado_em,
    })) satisfies AfastamentoMovimentacao[],
    complementacoes: (complementacoesResult.data ?? []).map((item) => ({
      id: item.id,
      solicitacao: item.solicitacao,
      resposta: item.resposta,
      documentoNome: item.documento_nome,
      documentoUrl: item.documento_url,
      solicitadaEm: item.solicitada_em,
      respondidaEm: item.respondida_em,
      status: item.status,
    })) satisfies AfastamentoComplementacao[],
    devolutivas: (devolutivasResult.data ?? []).map((item) => ({
      id: item.id,
      resultado: item.resultado,
      descricao: item.descricao,
      orientacoes: item.orientacoes,
      emitidaEm: item.emitida_em,
    })) satisfies AfastamentoDevolutiva[],
    providencias: (providenciasResult.data ?? []).map((item) => ({
      id: item.id,
      descricao: item.descricao,
      registradaEm: item.registrada_em,
    })) satisfies AfastamentoProvidencia[],
    documentosDigitais: (
      (documentosDigitaisResult.data ?? []) as DocumentoDigitalRow[]
    ).map((documento) =>
      mapDocumentoDigital(
        documento,
        assinaturasByDocumento.get(documento.id) ?? [],
      ),
    ),
  };
}

export async function gerarDocumentoDigital(
  input: GerarDocumentoDigitalInput,
) {
  const { data, error } = await supabase.rpc(
    "gerar_documento_digital_afastamento",
    {
      target_afastamento_id: input.afastamentoId,
      tipo: input.tipo,
      titulo: input.titulo,
      conteudo: input.conteudo,
      hash_sha256: input.hashSha256,
    },
  );

  if (error) throw error;

  return data as string;
}

export async function assinarDocumentoDigital(
  input: AssinarDocumentoDigitalInput,
) {
  await confirmarSenhaUsuario(input.password);

  const { error } = await supabase.rpc("assinar_documento_digital_afastamento", {
    target_documento_id: input.documentoId,
    perfil_assinante: input.perfilAssinante ?? null,
    user_agent: navigator.userAgent,
  });

  if (error) throw error;
}

export async function validarDocumentoDigital(
  protocolo: string,
): Promise<ValidacaoDocumentoDigital> {
  const { data, error } = await supabase.rpc(
    "validar_documento_digital_afastamento",
    {
      target_protocolo: protocolo,
    },
  );

  if (error) throw error;

  return data as ValidacaoDocumentoDigital;
}

export async function registrarAnalise(input: RegistrarAnaliseInput) {
  const { error } = await supabase.rpc("registrar_analise_afastamento", {
    target_afastamento_id: input.afastamentoId,
    analise: input.analise,
    proxima_acao: input.proximaAcao,
    complemento: input.complemento ?? null,
  });

  if (error) throw error;
}

export async function responderComplementacao(
  input: ResponderComplementacaoInput,
) {
  const { data: afastamentoData, error: afastamentoError } = await supabase
    .schema("afastamentos")
    .from("afastamentos")
    .select("servidor_id, tipo")
    .eq("id", input.afastamentoId)
    .single();

  if (afastamentoError) throw afastamentoError;

  const servidores = await getServidoresById([afastamentoData.servidor_id]);
  const servidor = servidores.get(afastamentoData.servidor_id);
  const documentoNome = input.documentoArquivo
    ? buildDocumentoName(
        servidor,
        `${afastamentoData.tipo ?? "afastamento"}-complementacao`,
        input.documentoArquivo,
      )
    : null;
  const uploadedPath = input.documentoArquivo
    ? await uploadDocumento(
        input.documentoArquivo,
        `complementacoes/${input.afastamentoId}`,
        documentoNome ?? input.documentoArquivo.name,
      )
    : null;

  const { error } = await supabase.rpc("responder_complementacao_afastamento", {
    target_afastamento_id: input.afastamentoId,
    resposta: input.resposta,
    documento_nome: documentoNome,
    documento_url: uploadedPath ?? null,
  });

  if (error) throw error;
}

export async function emitirDevolutiva(input: EmitirDevolutivaInput) {
  const { error } = await supabase.rpc("emitir_devolutiva_afastamento", {
    target_afastamento_id: input.afastamentoId,
    resultado: input.resultado,
    descricao: input.descricao,
    orientacoes: input.orientacoes ?? null,
    encaminhar_rh: input.encaminharRh,
  });

  if (error) throw error;
}

export async function registrarProvidencia(input: RegistrarProvidenciaInput) {
  const { error } = await supabase.rpc("registrar_providencia_afastamento", {
    target_afastamento_id: input.afastamentoId,
    descricao: input.descricao,
    concluir: input.concluir,
  });

  if (error) throw error;
}

export async function listDevolutivaAlerts(): Promise<DevolutivaAlert[]> {
  const afastamentos = await listAfastamentos();
  const processosComDevolutiva = afastamentos.filter((item) =>
    ["avaliado", "aguardando_rh", "concluido"].includes(item.status),
  );

  return processosComDevolutiva.slice(0, 5).map((item) => ({
    id: item.id,
    servidorNome: item.servidorNome,
    protocolo: item.protocolo ?? "Sem protocolo",
    mensagem:
      item.status === "avaliado"
        ? "Devolutiva disponivel para ciencia."
        : "Processo possui devolutiva e segue para providencia administrativa.",
    recebidaEm: item.iniciadoEm,
    status: item.status === "avaliado" ? "nova" : "pendente",
  }));
}
