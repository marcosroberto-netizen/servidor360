import { supabase } from '@/shared/lib/supabase'
import type {
  Notificacao,
  NotificacaoRow,
  NotificacoesResumo,
} from '../types/notificacoes.types'

function mapNotificacao(row: NotificacaoRow): Notificacao {
  return {
    id: row.id,
    modulo: row.modulo,
    evento: row.evento,
    titulo: row.titulo,
    mensagem: row.mensagem,
    prioridade: row.prioridade,
    entidadeTipo: row.entidade_tipo,
    entidadeId: row.entidade_id,
    rota: row.rota,
    metadata: row.metadata ?? {},
    status: row.status,
    criadoEm: row.criado_em,
    lidaEm: row.lida_em,
  }
}

export async function listMinhasNotificacoes(): Promise<NotificacoesResumo> {
  const [listaResult, contadorResult] = await Promise.all([
    supabase.rpc('listar_minhas_notificacoes', { page_size: 20 }),
    supabase.rpc('contar_minhas_notificacoes_pendentes'),
  ])

  if (listaResult.error) throw listaResult.error
  if (contadorResult.error) throw contadorResult.error

  return {
    itens: ((listaResult.data ?? []) as NotificacaoRow[]).map(mapNotificacao),
    pendentes: Number(contadorResult.data ?? 0),
  }
}

export async function marcarNotificacaoLida(notificacaoId: string): Promise<void> {
  const { error } = await supabase.rpc('marcar_notificacao_lida', {
    target_notificacao_id: notificacaoId,
  })

  if (error) throw error
}

export async function marcarTodasNotificacoesLidas(): Promise<void> {
  const { error } = await supabase.rpc('marcar_todas_notificacoes_lidas')
  if (error) throw error
}
