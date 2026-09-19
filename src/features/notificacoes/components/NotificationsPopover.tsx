import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck, CircleAlert, Inbox, Loader2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  useMarcarNotificacaoLida,
  useMarcarTodasNotificacoesLidas,
  useMinhasNotificacoes,
  useNotificacoesRealtime,
} from '../hooks/useNotificacoes'
import type { Notificacao, NotificacaoPrioridade } from '../types/notificacoes.types'

interface NotificationsPopoverProps {
  userId: string | undefined
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

const moduleLabels: Record<string, string> = {
  afastamentos: 'Afastamentos',
  servidores: 'Vida funcional',
  exoneracoes: 'Exonerações',
  documentos: 'Documentos',
  sistema: 'Sistema',
}

const priorityClasses: Record<NotificacaoPrioridade, string> = {
  baixa: 'border-slate-200 bg-slate-50 text-slate-700',
  normal: 'border-sky-200 bg-sky-50 text-sky-700',
  alta: 'border-amber-200 bg-amber-50 text-amber-800',
  critica: 'border-red-200 bg-red-50 text-red-700',
}

const priorityLabels: Record<NotificacaoPrioridade, string> = {
  baixa: 'Baixa',
  normal: 'Normal',
  alta: 'Alta',
  critica: 'Crítica',
}

const itemAccentClasses: Record<NotificacaoPrioridade, string> = {
  baixa: 'border-l-slate-300',
  normal: 'border-l-sky-500',
  alta: 'border-l-amber-500',
  critica: 'border-l-red-500',
}

function isSafePortalRoute(route: string | null): route is string {
  return Boolean(route?.startsWith('/') && !route.startsWith('//'))
}

function NotificationItem({ item, onOpen }: { item: Notificacao; onOpen: (item: Notificacao) => void }) {
  const isUnread = item.status === 'pendente'
  const createdAt = new Date(item.criadoEm)

  return (
    <li className="p-2">
      <button
        type="button"
        onClick={() => onOpen(item)}
        className={`group flex w-full gap-3 rounded-md border border-l-4 px-3.5 py-3 text-left shadow-sm transition-[border-color,background-color,box-shadow] hover:border-slate-300 hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 ${
          isUnread ? 'border-sky-100 bg-sky-50/70' : 'border-slate-200 bg-white'
        } ${itemAccentClasses[item.prioridade]}`}
      >
        <span
          aria-hidden="true"
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${priorityClasses[item.prioridade]}`}
        >
          <CircleAlert className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-3">
            <span className={`line-clamp-2 break-words text-sm leading-5 text-slate-950 ${isUnread ? 'font-semibold' : 'font-medium'}`}>
              {item.titulo}
            </span>
            {isUnread ? (
              <span className="mt-1 flex shrink-0 items-center gap-1 rounded-full bg-sky-600 px-2 py-0.5 text-[11px] font-semibold leading-4 text-white">
                Nova
              </span>
            ) : null}
          </span>
          <span className="mt-1 line-clamp-2 block break-words text-sm leading-5 text-slate-600">
            {item.mensagem}
          </span>
          <span className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-medium text-slate-700">
              {moduleLabels[item.modulo] ?? item.modulo}
            </span>
            <span className={`rounded-full border px-2 py-0.5 font-medium ${priorityClasses[item.prioridade]}`}>
              {priorityLabels[item.prioridade]}
            </span>
            <time
              dateTime={item.criadoEm}
              title={dateFormatter.format(createdAt)}
              className="ml-0.5 py-0.5 font-medium tabular-nums text-slate-500"
            >
              {dateFormatter.format(createdAt)}
            </time>
          </span>
        </span>
      </button>
    </li>
  )
}

export function NotificationsPopover({ userId }: NotificationsPopoverProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useMinhasNotificacoes(Boolean(userId))
  const { mutateAsync: markRead } = useMarcarNotificacaoLida()
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarcarTodasNotificacoesLidas()

  useNotificacoesRealtime(userId)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const handleOpenItem = async (item: Notificacao) => {
    if (item.status === 'pendente') await markRead(item.id)
    setOpen(false)
    if (isSafePortalRoute(item.rota)) navigate(item.rota)
  }

  const unreadCount = data?.pendentes ?? 0
  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount)

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        aria-label={unreadCount > 0 ? `Notificações: ${unreadCount} não lida(s)` : 'Notificações'}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold tabular-nums text-white">
            {badgeLabel}
          </span>
        ) : null}
      </button>

      {open ? (
        <section
          role="dialog"
          aria-modal="false"
          aria-labelledby="notifications-title"
          className="fixed inset-x-3 top-16 z-50 flex max-h-[min(74vh,36rem)] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[28rem]"
        >
          <header className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-3">
            <div className="min-w-0">
              <h2 id="notifications-title" className="text-base font-semibold text-slate-950">Notificações</h2>
              <p className="mt-0.5 text-xs font-medium text-slate-500" aria-live="polite">
                {unreadCount > 0 ? `${unreadCount} não lida(s)` : 'Tudo em dia'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={() => markAllRead()}
                  disabled={isMarkingAll}
                  className="flex h-9 items-center gap-2 rounded-md border border-sky-200 bg-white px-2.5 text-xs font-semibold text-sky-700 transition-[background-color,border-color,color] hover:border-sky-300 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-50"
                >
                  {isMarkingAll ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <CheckCheck className="h-4 w-4" aria-hidden="true" />}
                  Marcar todas como lidas
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                aria-label="Fechar notificações"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </header>

          <div className="min-h-32 overflow-y-auto overscroll-contain bg-slate-50/70">
            {isLoading ? (
              <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-slate-600" role="status">
                <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                Carregando…
              </div>
            ) : isError ? (
              <div className="flex min-h-40 flex-col items-center justify-center px-6 text-center">
                <CircleAlert className="h-6 w-6 text-red-600" aria-hidden="true" />
                <p className="mt-2 text-sm font-medium text-slate-900">Não foi possível carregar as notificações.</p>
                <button type="button" onClick={() => refetch()} className="mt-3 rounded-md px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                  Tentar novamente
                </button>
              </div>
            ) : data && data.itens.length > 0 ? (
              <ul className="space-y-1 p-2">
                {data.itens.map((item) => <NotificationItem key={item.id} item={item} onOpen={handleOpenItem} />)}
              </ul>
            ) : (
              <div className="flex min-h-44 flex-col items-center justify-center px-6 text-center">
                <Inbox className="h-7 w-7 text-slate-400" aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold text-slate-900">Nenhuma notificação</p>
                <p className="mt-1 text-sm text-slate-500">Atualizações importantes aparecerão aqui.</p>
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  )
}
