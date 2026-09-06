import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDevolutivaAlerts } from '@/features/afastamentos'
import { Can, PERMISSIONS, useAuth, useCurrentUserAuthz, useLogout } from '@/features/auth'
import { FeedbackDialog } from '@/shared/components/ui/FeedbackDialog'

export default function PortalPage() {
  const [showDevolutivas, setShowDevolutivas] = useState(false)
  const { session, user } = useAuth()
  const { mutate: logout, isPending: isLoggingOut } = useLogout()
  const { data: authz } = useCurrentUserAuthz(Boolean(session))
  const canReadDevolutivas =
    authz?.permissoes.includes(PERMISSIONS.ADMIN) ||
    authz?.permissoes.includes(PERMISSIONS.AFASTAMENTOS_LER_DEVOLUTIVA)
  const { data: devolutivaAlerts = [] } = useDevolutivaAlerts(Boolean(canReadDevolutivas))
  const isGestorEscolar =
    authz?.perfis.includes('gestor_escolar') && !authz?.perfis.includes('administrador')

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      <FeedbackDialog
        open={isLoggingOut}
        title="Saindo"
        description="Estamos encerrando sua sessão."
        variant="loading"
      />

      {showDevolutivas && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4"
          role="dialog"
        >
          <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-strong">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Devolutivas</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {devolutivaAlerts.length > 0
                    ? `${devolutivaAlerts.length} mensagem(ns) aguardando atencao.`
                    : 'Nenhuma mensagem pendente no momento.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDevolutivas(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-100"
                aria-label="Fechar devolutivas"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {devolutivaAlerts.length > 0 ? (
              <div className="mt-4 grid max-h-[60vh] gap-3 overflow-y-auto pr-1">
                {devolutivaAlerts.map((alert) => (
                  <article key={alert.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-slate-950">{alert.servidorNome}</h3>
                        <p className="mt-1 text-xs font-medium text-slate-500">{alert.protocolo}</p>
                      </div>
                      <span className="shrink-0 rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                        {alert.status === 'nova' ? 'Nova' : 'Pendente'}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-5 text-slate-700">{alert.mensagem}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                A caixa de mensagens esta vazia.
              </div>
            )}
          </div>
        </div>
      )}

      <header className="shrink-0 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-slate-950">Servidor 360</h1>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Portal do Servidor</p>
            </div>
            <div className="flex min-w-0 items-center gap-3">
              {canReadDevolutivas && (
                <button
                  type="button"
                  onClick={() => setShowDevolutivas(true)}
                  className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition-colors hover:bg-slate-100"
                  aria-label={
                    devolutivaAlerts.length > 0
                      ? `Abrir caixa de mensagens com ${devolutivaAlerts.length} mensagem(ns)`
                      : 'Abrir caixa de mensagens'
                  }
                  title="Devolutivas"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {devolutivaAlerts.length > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-600 px-1 text-xs font-bold text-white">
                      {devolutivaAlerts.length}
                    </span>
                  )}
                </button>
              )}
              <span className="hidden truncate text-sm text-slate-600 sm:block">
                {user?.email}
              </span>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="h-9 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-slate-950">
            Bem-vindo, {user?.user_metadata?.nome_completo || user?.email || 'Servidor'}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Selecione uma opção abaixo para acessar os serviços disponíveis.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {!isGestorEscolar && (
          <Can permission={PERMISSIONS.DOCUMENTOS_READ}>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50">
                  <svg className="h-5 w-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-slate-950">Documentos</h3>
              </div>
              <p className="mb-4 min-h-10 text-sm leading-5 text-slate-600">
                Consulte documentos funcionais permitidos para seu perfil.
              </p>
              <button className="h-9 w-full rounded-md bg-blue-700 px-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800">
                Acessar Documentos
              </button>
            </div>
          </Can>
          )}

          {!isGestorEscolar && (
          <Can permission={PERMISSIONS.SERVIDORES_READ}>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan-50">
                  <svg className="h-5 w-5 text-cyan-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M5 21V7l8-4 6 3v15M9 9h1m-1 4h1m4-4h1m-1 4h1M9 21v-4h6v4" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-slate-950">Funcionários</h3>
              </div>
              <p className="mb-4 min-h-10 text-sm leading-5 text-slate-600">
                Consulte servidores vinculados à sua unidade escolar.
              </p>
              <button className="h-9 w-full rounded-md bg-cyan-700 px-3 text-sm font-semibold text-white transition-colors hover:bg-cyan-800">
                Acessar Funcionários
              </button>
            </div>
          </Can>
          )}

          <Can permission={PERMISSIONS.EDUCACAO_READ}>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-indigo-50">
                  <svg className="h-5 w-5 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422A12.083 12.083 0 0118 13.5C18 16.538 15.314 19 12 19s-6-2.462-6-5.5c0-.99-.06-1.97-.16-2.922L12 14z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-slate-950">Educação</h3>
              </div>
              <p className="mb-4 min-h-10 text-sm leading-5 text-slate-600">
                Acompanhe processos, servidores da rede e indicadores gerenciais.
              </p>
              <button className="h-9 w-full rounded-md bg-indigo-700 px-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-800">
                Acessar Educação
              </button>
            </div>
          </Can>

          {/* Afastamentos */}
          <Can permission={PERMISSIONS.AFASTAMENTOS_READ}>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-50">
                  <svg className="h-5 w-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-slate-950">Afastamentos</h3>
              </div>
              <p className="mb-4 min-h-10 text-sm leading-5 text-slate-600">
                Consulte e gerencie seus afastamentos funcionais.
              </p>
              <Link
                to="/afastamentos"
                className="flex h-9 w-full items-center justify-center rounded-md bg-green-700 px-3 text-sm font-semibold text-white transition-colors hover:bg-green-800"
              >
                Acessar Afastamentos
              </Link>
            </div>
          </Can>

          {/* Prontuário */}
          <Can permission={PERMISSIONS.PRONTUARIO_READ}>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-purple-50">
                  <svg className="h-5 w-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-slate-950">Prontuário</h3>
              </div>
              <p className="mb-4 min-h-10 text-sm leading-5 text-slate-600">
                Acesse seu prontuário funcional e documentos.
              </p>
              <button className="h-9 w-full rounded-md bg-purple-700 px-3 text-sm font-semibold text-white transition-colors hover:bg-purple-800">
                Acessar Prontuário
              </button>
            </div>
          </Can>

          {/* CAS */}
          <Can permission={PERMISSIONS.CAS_FILA}>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-50">
                  <svg className="h-5 w-5 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-slate-950">CAS</h3>
              </div>
              <p className="mb-4 min-h-10 text-sm leading-5 text-slate-600">
                Acesse fila de análise, complementações e encaminhamentos.
              </p>
              <button className="h-9 w-full rounded-md bg-orange-700 px-3 text-sm font-semibold text-white transition-colors hover:bg-orange-800">
                Acessar CAS
              </button>
            </div>
          </Can>

          <Can permission={PERMISSIONS.RH_FILA}>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100">
                  <svg className="h-5 w-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h6M9 7h.01M5 7h.01M5 12h.01M5 17h.01M9 12h.01M13 7h6M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-slate-950">RH</h3>
              </div>
              <p className="mb-4 min-h-10 text-sm leading-5 text-slate-600">
                Registre providências administrativas e conclua etapas do processo.
              </p>
              <button className="h-9 w-full rounded-md bg-slate-700 px-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800">
                Acessar RH
              </button>
            </div>
          </Can>

          {/* Servidores (Admin) */}
          <Can permission={PERMISSIONS.SERVIDORES_DELETE}>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-red-50">
                  <svg className="h-5 w-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-slate-950">Servidores</h3>
              </div>
              <p className="mb-4 min-h-10 text-sm leading-5 text-slate-600">
                Gestão de servidores e cadastros.
              </p>
              <button className="h-9 w-full rounded-md bg-red-700 px-3 text-sm font-semibold text-white transition-colors hover:bg-red-800">
                Gerenciar Servidores
              </button>
            </div>
          </Can>
        </div>
        </div>
      </main>
    </div>
  )
}
