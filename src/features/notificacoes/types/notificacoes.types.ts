export type NotificacaoPrioridade = 'baixa' | 'normal' | 'alta' | 'critica'
export type NotificacaoStatus = 'pendente' | 'lida'

export interface Notificacao {
  id: string
  modulo: string
  evento: string
  titulo: string
  mensagem: string
  prioridade: NotificacaoPrioridade
  entidadeTipo: string | null
  entidadeId: string | null
  rota: string | null
  metadata: Record<string, unknown>
  status: NotificacaoStatus
  criadoEm: string
  lidaEm: string | null
}

export interface NotificacoesResumo {
  itens: Notificacao[]
  pendentes: number
}

export interface NotificacaoRow {
  id: string
  modulo: string
  evento: string
  titulo: string
  mensagem: string
  prioridade: NotificacaoPrioridade
  entidade_tipo: string | null
  entidade_id: string | null
  rota: string | null
  metadata: Record<string, unknown> | null
  status: NotificacaoStatus
  criado_em: string
  lida_em: string | null
}
