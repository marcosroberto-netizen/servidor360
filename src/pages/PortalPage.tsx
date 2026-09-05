import { Can, PERMISSIONS, useAuth, useLogout } from '@/features/auth'
import { FeedbackDialog } from '@/shared/components/ui/FeedbackDialog'

export default function PortalPage() {
  const { user } = useAuth()
  const { mutate: logout, isPending: isLoggingOut } = useLogout()

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

      <header className="shrink-0 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-slate-950">Servidor 360</h1>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Portal do Servidor</p>
            </div>
            <div className="flex min-w-0 items-center gap-3">
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

          <Can permission={PERMISSIONS.AFASTAMENTOS_CREATE}>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan-50">
                  <svg className="h-5 w-5 text-cyan-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M5 21V7l8-4 6 3v15M9 9h1m-1 4h1m4-4h1m-1 4h1M9 21v-4h6v4" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-slate-950">Gestão Escolar</h3>
              </div>
              <p className="mb-4 min-h-10 text-sm leading-5 text-slate-600">
                Registre afastamentos, responda pendências e acompanhe sua unidade.
              </p>
              <button className="h-9 w-full rounded-md bg-cyan-700 px-3 text-sm font-semibold text-white transition-colors hover:bg-cyan-800">
                Acessar Unidade
              </button>
            </div>
          </Can>

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
              <button className="h-9 w-full rounded-md bg-green-700 px-3 text-sm font-semibold text-white transition-colors hover:bg-green-800">
                Acessar Afastamentos
              </button>
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
          <Can permission={PERMISSIONS.SERVIDORES_READ}>
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
