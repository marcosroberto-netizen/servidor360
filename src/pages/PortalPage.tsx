import { Can, PERMISSIONS, useAuth, useLogout } from '@/features/auth'
import { FeedbackDialog } from '@/shared/components/ui/FeedbackDialog'

export default function PortalPage() {
  const { user } = useAuth()
  const { mutate: logout, isPending: isLoggingOut } = useLogout()

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <FeedbackDialog
        open={isLoggingOut}
        title="Saindo"
        description="Estamos encerrando sua sessão."
        variant="loading"
      />

      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Servidor 360</h1>
              <p className="text-sm text-gray-600">Portal do Servidor</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user?.email}
              </span>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Bem-vindo, {user?.user_metadata?.nome_completo || user?.email || 'Servidor'}
          </h2>
          <p className="mt-2 text-gray-600">
            Selecione uma opção abaixo para acessar os serviços disponíveis.
          </p>
        </div>

        {/* Cards de Acesso */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Can permission={PERMISSIONS.DOCUMENTOS_READ}>
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="ml-4 text-lg font-semibold text-gray-900">Documentos</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Consulte documentos funcionais permitidos para seu perfil.
              </p>
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Acessar Documentos
              </button>
            </div>
          </Can>

          <Can permission={PERMISSIONS.AFASTAMENTOS_CREATE}>
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-cyan-100 rounded-full">
                  <svg className="w-6 h-6 text-cyan-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M5 21V7l8-4 6 3v15M9 9h1m-1 4h1m4-4h1m-1 4h1M9 21v-4h6v4" />
                  </svg>
                </div>
                <h3 className="ml-4 text-lg font-semibold text-gray-900">Gestão Escolar</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Registre afastamentos, responda pendências e acompanhe sua unidade.
              </p>
              <button className="w-full px-4 py-2 bg-cyan-700 text-white rounded-md hover:bg-cyan-800 transition-colors">
                Acessar Unidade
              </button>
            </div>
          </Can>

          <Can permission={PERMISSIONS.EDUCACAO_READ}>
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-indigo-100 rounded-full">
                  <svg className="w-6 h-6 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422A12.083 12.083 0 0118 13.5C18 16.538 15.314 19 12 19s-6-2.462-6-5.5c0-.99-.06-1.97-.16-2.922L12 14z" />
                  </svg>
                </div>
                <h3 className="ml-4 text-lg font-semibold text-gray-900">Educação</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Acompanhe processos, servidores da rede e indicadores gerenciais.
              </p>
              <button className="w-full px-4 py-2 bg-indigo-700 text-white rounded-md hover:bg-indigo-800 transition-colors">
                Acessar Educação
              </button>
            </div>
          </Can>

          {/* Afastamentos */}
          <Can permission={PERMISSIONS.AFASTAMENTOS_READ}>
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="ml-4 text-lg font-semibold text-gray-900">Afastamentos</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Consulte e gerencie seus afastamentos funcionais.
              </p>
              <button className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                Acessar Afastamentos
              </button>
            </div>
          </Can>

          {/* Prontuário */}
          <Can permission={PERMISSIONS.PRONTUARIO_READ}>
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="ml-4 text-lg font-semibold text-gray-900">Prontuário</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Acesse seu prontuário funcional e documentos.
              </p>
              <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                Acessar Prontuário
              </button>
            </div>
          </Can>

          {/* CAS */}
          <Can permission={PERMISSIONS.CAS_FILA}>
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-orange-100 rounded-full">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="ml-4 text-lg font-semibold text-gray-900">CAS</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Acesse fila de análise, complementações e encaminhamentos.
              </p>
              <button className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors">
                Acessar CAS
              </button>
            </div>
          </Can>

          <Can permission={PERMISSIONS.RH_FILA}>
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-slate-100 rounded-full">
                  <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h6M9 7h.01M5 7h.01M5 12h.01M5 17h.01M9 12h.01M13 7h6M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
                  </svg>
                </div>
                <h3 className="ml-4 text-lg font-semibold text-gray-900">RH</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Registre providências administrativas e conclua etapas do processo.
              </p>
              <button className="w-full px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors">
                Acessar RH
              </button>
            </div>
          </Can>

          {/* Servidores (Admin) */}
          <Can permission={PERMISSIONS.SERVIDORES_READ}>
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="ml-4 text-lg font-semibold text-gray-900">Servidores</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Gestão de servidores e cadastros.
              </p>
              <button className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
                Gerenciar Servidores
              </button>
            </div>
          </Can>
        </div>
      </main>
    </div>
  )
}
