import { useMemo, useState, type FormEvent } from 'react'
import {
  useAfastamentoDetalhe,
  useAfastamentos,
  useCreateAfastamento,
  useEmitirDevolutiva,
  useRegistrarAnalise,
  useRegistrarProvidencia,
  useResponderComplementacao,
  useServidoresForAfastamento,
  type AfastamentoFormData,
  type AfastamentoResumo,
  type DevolutivaResultado,
  type RegistrarAnaliseInput,
  type ServidorOption,
} from '@/features/afastamentos'
import { PERMISSIONS, useAuth, useCurrentUserAuthz } from '@/features/auth'
import { ModuleLayout } from '@/shared/components/ModuleLayout'
import { FeedbackDialog } from '@/shared/components/ui/FeedbackDialog'

const statusLabels: Record<AfastamentoResumo['status'], string> = {
  rascunho: 'Rascunho',
  registrado: 'Registrado',
  encaminhado: 'Encaminhado',
  aguardando_analise: 'Aguardando analise',
  em_analise: 'Em analise',
  aguardando_complementacao: 'Aguardando complementacao',
  aguardando_avaliacao: 'Aguardando avaliacao',
  avaliado: 'Avaliado',
  aguardando_rh: 'Aguardando RH',
  concluido: 'Concluido',
}

const resultadoLabels: Record<DevolutivaResultado, string> = {
  apto: 'Apto',
  inapto: 'Inapto',
  apto_com_restricoes: 'Apto com restricoes',
  nova_avaliacao: 'Necessidade de nova avaliacao',
  complementacao: 'Necessidade de complementacao',
  outra: 'Outra conclusao',
}

function has(permissoes: string[], permission: string) {
  return permissoes.includes(PERMISSIONS.ADMIN) || permissoes.includes(permission)
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function normalize(value: string) {
  return value
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function FieldLabel({ children }: { children: string }) {
  return <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</span>
}

function EmptyState({ children }: { children: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
      {children}
    </div>
  )
}

interface NovoAfastamentoModalProps {
  open: boolean
  onClose: () => void
  servidores: ServidorOption[]
  isLoadingServidores: boolean
}

function NovoAfastamentoModal({
  open,
  onClose,
  servidores,
  isLoadingServidores,
}: NovoAfastamentoModalProps) {
  const [search, setSearch] = useState('')
  const [selectedServidor, setSelectedServidor] = useState<ServidorOption | null>(null)
  const [form, setForm] = useState<Omit<AfastamentoFormData, 'servidorId'>>({
    tipo: 'Atestado medico',
    dataInicio: today(),
    dataFim: today(),
    motivo: '',
    observacoes: '',
    documentoArquivo: null,
  })
  const createAfastamento = useCreateAfastamento()

  const filteredServidores = useMemo(() => {
    const term = normalize(search)
    if (!term) return servidores.slice(0, 20)

    return servidores
      .filter((servidor) =>
        normalize(`${servidor.nome} ${servidor.matricula} ${servidor.cpf} ${servidor.unidadeNome}`).includes(term)
      )
      .slice(0, 30)
  }, [search, servidores])

  if (!open) return null

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const updateFile = (file: File | null) => {
    setForm((current) => ({
      ...current,
      documentoArquivo: file,
    }))
  }

  const resetAndClose = () => {
    setSearch('')
    setSelectedServidor(null)
    setForm({
      tipo: 'Atestado medico',
      dataInicio: today(),
      dataFim: today(),
      motivo: '',
      observacoes: '',
      documentoArquivo: null,
    })
    onClose()
  }

  const canSubmit =
    Boolean(selectedServidor) &&
    Boolean(form.tipo.trim()) &&
    Boolean(form.dataInicio) &&
    Boolean(form.dataFim) &&
    Boolean(form.motivo.trim()) &&
    !createAfastamento.isPending

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedServidor || !canSubmit) return

    createAfastamento.mutate(
      {
        servidorId: selectedServidor.id,
        ...form,
      },
      {
        onSuccess: resetAndClose,
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 px-4 py-6" role="dialog" aria-modal="true">
      <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-strong">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Novo afastamento</h2>
            <p className="mt-1 text-sm text-slate-600">
              {selectedServidor ? selectedServidor.nome : 'Selecione o funcionario para abrir o formulario.'}
            </p>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100"
            aria-label="Fechar"
          >
            X
          </button>
        </header>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[400px_minmax(0,1fr)]">
          <aside className="min-h-0 border-b border-slate-200 bg-slate-50 p-4 lg:border-b-0 lg:border-r">
            <FieldLabel>Funcionario</FieldLabel>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nome, matricula, CPF ou unidade"
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
            <div className="mt-3 grid max-h-[42vh] gap-2 overflow-y-auto pr-1 lg:max-h-[calc(100vh-220px)]">
              {isLoadingServidores && <p className="text-sm text-slate-600">Carregando funcionarios...</p>}
              {!isLoadingServidores &&
                filteredServidores.map((servidor) => (
                  <button
                    key={servidor.id}
                    type="button"
                    onClick={() => setSelectedServidor(servidor)}
                    className={`rounded-md border p-3 text-left transition-colors ${
                      selectedServidor?.id === servidor.id
                        ? 'border-emerald-600 bg-white ring-2 ring-emerald-100'
                        : 'border-slate-200 bg-white hover:border-emerald-300'
                    }`}
                  >
                    <p className="truncate text-sm font-semibold text-slate-950">{servidor.nome}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {servidor.matricula} - {servidor.unidadeNome}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-600">{servidor.cargo}</p>
                  </button>
                ))}
              {!isLoadingServidores && filteredServidores.length === 0 && (
                <EmptyState>Nenhum funcionario encontrado.</EmptyState>
              )}
            </div>
          </aside>

          <form onSubmit={handleSubmit} className="min-h-0 overflow-y-auto p-5">
            {!selectedServidor ? (
              <EmptyState>Selecione um funcionario para preencher os dados do afastamento.</EmptyState>
            ) : (
              <div className="mx-auto grid w-full max-w-2xl gap-5">
                <section>
                  <h3 className="text-base font-semibold text-slate-950">Dados do afastamento</h3>
                  <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(240px,1fr)_160px_160px]">
                    <label>
                      <FieldLabel>Tipo</FieldLabel>
                      <select
                        value={form.tipo}
                        onChange={(event) => updateField('tipo', event.target.value)}
                        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                      >
                        <option>Atestado medico</option>
                        <option>Licenca medica</option>
                        <option>Readaptacao</option>
                        <option>Avaliacao ocupacional</option>
                        <option>Outro documento funcional</option>
                      </select>
                    </label>
                    <label>
                      <FieldLabel>Inicio</FieldLabel>
                      <input
                        type="date"
                        value={form.dataInicio}
                        onChange={(event) => updateField('dataInicio', event.target.value)}
                        className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
                      />
                    </label>
                    <label>
                      <FieldLabel>Fim</FieldLabel>
                      <input
                        type="date"
                        value={form.dataFim}
                        onChange={(event) => updateField('dataFim', event.target.value)}
                        className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
                      />
                    </label>
                  </div>
                </section>

                <section>
                  <h3 className="text-base font-semibold text-slate-950">Documento</h3>
                  <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
                    <input
                      type="file"
                      accept="application/pdf,image/png,image/jpeg,image/webp"
                      onChange={(event) => updateFile(event.target.files?.[0] ?? null)}
                      className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                    />
                  </div>
                </section>

                <section>
                  <h3 className="text-base font-semibold text-slate-950">Registro</h3>
                  <div className="mt-3 grid gap-4">
                    <label>
                      <FieldLabel>Motivo</FieldLabel>
                      <textarea
                        value={form.motivo}
                        onChange={(event) => updateField('motivo', event.target.value)}
                        rows={4}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      />
                    </label>
                    <label>
                      <FieldLabel>Observacoes</FieldLabel>
                      <textarea
                        value={form.observacoes}
                        onChange={(event) => updateField('observacoes', event.target.value)}
                        rows={3}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      />
                    </label>
                  </div>
                </section>

                {createAfastamento.isError && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    Nao foi possivel registrar. Verifique os dados e suas permissoes.
                  </div>
                )}

                <div className="sticky bottom-0 -mx-5 flex justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4">
                  <button
                    type="button"
                    onClick={resetAndClose}
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Registrar afastamento
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default function AfastamentosPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [analise, setAnalise] = useState('')
  const [proximaAcao, setProximaAcao] =
    useState<RegistrarAnaliseInput['proximaAcao']>('registrar')
  const [complemento, setComplemento] = useState('')
  const [resposta, setResposta] = useState('')
  const [documentoArquivo, setDocumentoArquivo] = useState<File | null>(null)
  const [resultado, setResultado] = useState<DevolutivaResultado>('apto')
  const [descricao, setDescricao] = useState('')
  const [orientacoes, setOrientacoes] = useState('')
  const [encaminharRh, setEncaminharRh] = useState(true)
  const [providencia, setProvidencia] = useState('')
  const [concluir, setConcluir] = useState(true)
  const { session } = useAuth()
  const { data: authz } = useCurrentUserAuthz(Boolean(session))
  const permissoes = authz?.permissoes ?? []
  const isGestorEscolar =
    authz?.perfis.includes('gestor_escolar') && !authz?.perfis.includes('administrador')
  const { data: servidores = [], isLoading: isLoadingServidores } = useServidoresForAfastamento(
    authz?.unidades ?? [],
    Boolean(isGestorEscolar)
  )
  const { data: afastamentos = [], isLoading, isError } = useAfastamentos()
  const selected = selectedId
  const { data: detalhe, isLoading: loadingDetail } = useAfastamentoDetalhe(selected)
  const registrarAnalise = useRegistrarAnalise()
  const responderComplementacao = useResponderComplementacao()
  const emitirDevolutiva = useEmitirDevolutiva()
  const registrarProvidencia = useRegistrarProvidencia()

  const canCreate = has(permissoes, PERMISSIONS.AFASTAMENTOS_CREATE)
  const canAnalyze = has(permissoes, PERMISSIONS.AFASTAMENTOS_ANALISAR)
  const canComplement = has(permissoes, PERMISSIONS.AFASTAMENTOS_COMPLEMENTAR)
  const canIssueReturn = has(permissoes, PERMISSIONS.AFASTAMENTOS_EMITIR_DEVOLUTIVA)
  const canRegisterProvidence = has(permissoes, PERMISSIONS.AFASTAMENTOS_REGISTRAR_PROVIDENCIA)

  const filtered = useMemo(() => {
    const term = normalize(search)

    return afastamentos.filter((item) => {
      const matchStatus = statusFilter === 'todos' || item.status === statusFilter
      const searchable = normalize(
        `${item.servidorNome} ${item.servidorMatricula} ${item.protocolo ?? ''} ${item.unidadeNome}`
      )

      return matchStatus && (!term || searchable.includes(term))
    })
  }, [afastamentos, search, statusFilter])

  const counters = useMemo(
    () => ({
      total: afastamentos.length,
      analise: afastamentos.filter((item) => item.status === 'aguardando_analise').length,
      complementacao: afastamentos.filter((item) => item.status === 'aguardando_complementacao').length,
      rh: afastamentos.filter((item) => item.status === 'aguardando_rh').length,
    }),
    [afastamentos]
  )

  const pendingMutation =
    registrarAnalise.isPending ||
    responderComplementacao.isPending ||
    emitirDevolutiva.isPending ||
    registrarProvidencia.isPending

  const submitAnalise = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!detalhe || !analise.trim()) return

    registrarAnalise.mutate(
      {
        afastamentoId: detalhe.id,
        analise,
        proximaAcao,
        complemento,
      },
      {
        onSuccess: () => {
          setAnalise('')
          setComplemento('')
          setProximaAcao('registrar')
        },
      }
    )
  }

  const submitComplementacao = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!detalhe || !resposta.trim()) return

    responderComplementacao.mutate(
      {
        afastamentoId: detalhe.id,
        resposta,
        documentoArquivo,
      },
      {
        onSuccess: () => {
          setResposta('')
          setDocumentoArquivo(null)
        },
      }
    )
  }

  const submitDevolutiva = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!detalhe || !descricao.trim()) return

    emitirDevolutiva.mutate(
      {
        afastamentoId: detalhe.id,
        resultado,
        descricao,
        orientacoes,
        encaminharRh,
      },
      {
        onSuccess: () => {
          setResultado('apto')
          setDescricao('')
          setOrientacoes('')
          setEncaminharRh(true)
        },
      }
    )
  }

  const submitProvidencia = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!detalhe || !providencia.trim()) return

    registrarProvidencia.mutate(
      {
        afastamentoId: detalhe.id,
        descricao: providencia,
        concluir,
      },
      {
        onSuccess: () => {
          setProvidencia('')
          setConcluir(true)
        },
      }
    )
  }

  return (
    <ModuleLayout
      moduleName="Afastamentos"
      title="Processos de afastamento"
      description="Acompanhe protocolos, pendencias e etapas administrativas em uma fila unica."
      navItems={[{ label: 'Processos', to: '/afastamentos', active: true }]}
      actions={canCreate ? [{ label: 'Novo afastamento', onClick: () => setShowCreateModal(true) }] : []}
    >
      <FeedbackDialog
        open={pendingMutation}
        title="Atualizando processo"
        description="Registrando a movimentacao e atualizando a fila."
        variant="loading"
      />
      <NovoAfastamentoModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        servidores={servidores}
        isLoadingServidores={isLoadingServidores}
      />

      <section className="grid gap-3 md:grid-cols-4">
        {[
          ['Total', counters.total],
          ['Aguardando analise', counters.analise],
          ['Complementacao', counters.complementacao],
          ['Aguardando RH', counters.rh],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-4 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por servidor, matricula, protocolo ou unidade"
            className="h-10 flex-1 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm lg:w-64"
          >
            <option value="todos">Todos os status</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Servidor</th>
                <th className="px-4 py-3">Protocolo</th>
                <th className="px-4 py-3">Periodo</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-950">{item.servidorNome}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.servidorMatricula} - {item.unidadeNome}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">{item.protocolo ?? '-'}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(item.dataInicio)} ate {formatDate(item.dataFim)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
                      {statusLabels[item.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Abrir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isLoading && <p className="p-4 text-sm text-slate-600">Carregando processos...</p>}
        {isError && (
          <p className="m-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Nao foi possivel carregar a fila de afastamentos.
          </p>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="p-4">
            <EmptyState>Nenhum processo encontrado.</EmptyState>
          </div>
        )}
      </section>

      {selected && (
        <div className="fixed inset-0 z-40 bg-slate-950/40" role="dialog" aria-modal="true">
          <aside className="ml-auto flex h-full w-full max-w-3xl flex-col overflow-hidden bg-white shadow-strong">
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {detalhe?.protocolo ?? 'Processo'}
                </p>
                <h2 className="mt-1 truncate text-lg font-bold text-slate-950">
                  {detalhe?.servidorNome ?? 'Carregando'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100"
                aria-label="Fechar"
              >
                X
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {loadingDetail && <p className="text-sm text-slate-600">Carregando processo...</p>}
              {detalhe && (
                <div className="grid gap-5">
                  <dl className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-md bg-slate-50 p-3">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-950">{statusLabels[detalhe.status]}</dd>
                    </div>
                    <div className="rounded-md bg-slate-50 p-3">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo</dt>
                      <dd className="mt-1 text-sm text-slate-950">{detalhe.tipo ?? '-'}</dd>
                    </div>
                    <div className="rounded-md bg-slate-50 p-3">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Periodo</dt>
                      <dd className="mt-1 text-sm text-slate-950">
                        {formatDate(detalhe.dataInicio)} ate {formatDate(detalhe.dataFim)}
                      </dd>
                    </div>
                  </dl>

                  <section className="rounded-lg border border-slate-200 p-4">
                    <h3 className="text-sm font-semibold text-slate-950">Documento e motivo</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-700">{detalhe.motivo ?? '-'}</p>
                    {detalhe.documentoOrigemUrl ? (
                      <a
                        href={detalhe.documentoOrigemUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
                      >
                        {detalhe.documentoOrigemNome ?? 'Abrir documento'}
                      </a>
                    ) : (
                      <p className="mt-3 text-sm text-slate-500">{detalhe.documentoOrigemNome ?? 'Sem documento vinculado'}</p>
                    )}
                  </section>

                  <div className="grid gap-4">
                    {canAnalyze && (
                      <form onSubmit={submitAnalise} className="rounded-lg border border-slate-200 p-4">
                        <h3 className="text-sm font-semibold text-slate-950">Analise CAS</h3>
                        <textarea
                          value={analise}
                          onChange={(event) => setAnalise(event.target.value)}
                          rows={3}
                          className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        />
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <select
                            value={proximaAcao}
                            onChange={(event) =>
                              setProximaAcao(event.target.value as RegistrarAnaliseInput['proximaAcao'])
                            }
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
                          >
                            <option value="registrar">Registrar analise</option>
                            <option value="solicitar_complementacao">Solicitar complementacao</option>
                            <option value="encaminhar_avaliacao">Encaminhar avaliacao</option>
                            <option value="encaminhar_rh">Encaminhar RH</option>
                          </select>
                          <button className="h-10 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white">
                            Salvar
                          </button>
                        </div>
                        {proximaAcao === 'solicitar_complementacao' && (
                          <textarea
                            value={complemento}
                            onChange={(event) => setComplemento(event.target.value)}
                            rows={2}
                            placeholder="Pendencia solicitada"
                            className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                          />
                        )}
                      </form>
                    )}

                    {canComplement && detalhe.status === 'aguardando_complementacao' && (
                      <form onSubmit={submitComplementacao} className="rounded-lg border border-slate-200 p-4">
                        <h3 className="text-sm font-semibold text-slate-950">Complementacao</h3>
                        <textarea
                          value={resposta}
                          onChange={(event) => setResposta(event.target.value)}
                          rows={3}
                          className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        />
                        <div className="mt-3 rounded-md border border-dashed border-slate-300 bg-slate-50 p-3">
                          <input
                            type="file"
                            accept="application/pdf,image/png,image/jpeg,image/webp"
                            onChange={(event) => {
                              const file = event.target.files?.[0] ?? null
                              setDocumentoArquivo(file)
                            }}
                            className="block w-full text-sm"
                          />
                        </div>
                        <button className="mt-3 h-10 rounded-md bg-cyan-700 px-3 text-sm font-semibold text-white">
                          Enviar complementacao
                        </button>
                      </form>
                    )}

                    {canIssueReturn && (
                      <form onSubmit={submitDevolutiva} className="rounded-lg border border-slate-200 p-4">
                        <h3 className="text-sm font-semibold text-slate-950">Devolutiva formal</h3>
                        <select
                          value={resultado}
                          onChange={(event) => setResultado(event.target.value as DevolutivaResultado)}
                          className="mt-3 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                        >
                          {Object.entries(resultadoLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <textarea
                          value={descricao}
                          onChange={(event) => setDescricao(event.target.value)}
                          rows={3}
                          className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        />
                        <textarea
                          value={orientacoes}
                          onChange={(event) => setOrientacoes(event.target.value)}
                          rows={2}
                          placeholder="Orientacoes administrativas"
                          className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        />
                        <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={encaminharRh}
                            onChange={(event) => setEncaminharRh(event.target.checked)}
                          />
                          Encaminhar ao RH
                        </label>
                        <button className="mt-3 h-10 rounded-md bg-indigo-700 px-3 text-sm font-semibold text-white">
                          Emitir devolutiva
                        </button>
                      </form>
                    )}

                    {canRegisterProvidence && (
                      <form onSubmit={submitProvidencia} className="rounded-lg border border-slate-200 p-4">
                        <h3 className="text-sm font-semibold text-slate-950">Providencia RH</h3>
                        <textarea
                          value={providencia}
                          onChange={(event) => setProvidencia(event.target.value)}
                          rows={3}
                          className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        />
                        <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={concluir}
                            onChange={(event) => setConcluir(event.target.checked)}
                          />
                          Concluir processo
                        </label>
                        <button className="mt-3 h-10 rounded-md bg-slate-800 px-3 text-sm font-semibold text-white">
                          Registrar providencia
                        </button>
                      </form>
                    )}
                  </div>

                  <section className="rounded-lg border border-slate-200 p-4">
                    <h3 className="text-sm font-semibold text-slate-950">Linha do tempo</h3>
                    <div className="mt-3 grid gap-3">
                      {detalhe.movimentacoes.map((item) => (
                        <article key={item.id} className="border-l-2 border-emerald-600 pl-3">
                          <p className="text-sm font-semibold text-slate-950">{item.titulo}</p>
                          {item.descricao && <p className="mt-1 text-sm text-slate-700">{item.descricao}</p>}
                          <p className="mt-1 text-xs text-slate-500">{formatDateTime(item.criadoEm)}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </ModuleLayout>
  )
}
