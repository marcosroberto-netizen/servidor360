import { expect, test } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { loadEnv } from 'vite'

type ServidorResumo = {
  id: string
  vinculo_id: string
  ativo: boolean
}

type AvaliadorFila = {
  avaliador_id: string
  nome: string
  pacientes_pendentes: number
}

type AvaliacaoMedica = {
  avaliador_id: string
  status: string
}

type Movimentacao = {
  tipo: string
  titulo: string
  status_destino: string | null
}

type Notificacao = {
  evento: string
  entidade_id: string
  status: string
}

const env = loadEnv(process.env.MODE ?? 'test', process.cwd(), '')
const supabaseUrl = process.env.VITE_SUPABASE_URL ?? env.VITE_SUPABASE_URL
const supabaseAnonKey =
  process.env.VITE_SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_ANON_KEY
const password = process.env.E2E_TEST_PASSWORD ?? 'Servidor360@2026'

function createSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  })
}

async function signIn(email: string) {
  const client = createSupabaseClient()
  const { error } = await client.auth.signInWithPassword({ email, password })

  expect(error, `login ${email}`).toBeNull()

  return client
}

async function expectRpcSuccess<T>(
  action: PromiseLike<{ data: T | null; error: unknown }>,
  label: string,
) {
  const { data, error } = await action

  expect(error, label).toBeNull()

  return data as T
}

test.describe('encaminhamento CAS para avaliador especifico', () => {
  test.skip(
    !supabaseUrl || !supabaseAnonKey,
    'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para rodar este E2E.',
  )

  test('registra atribuicao, movimentacao, notificacao e acesso do avaliador', async () => {
    const gestor = await signIn('gestor@servidor360.local')
    const cas = await signIn('cas@servidor360.local')
    const avaliador = await signIn('medico4@servidor360.local')

    const servidores = await expectRpcSuccess<ServidorResumo[]>(
      gestor.rpc('list_servidores_for_afastamentos', {
        allowed_unidades: null,
      }),
      'listar servidores no escopo do gestor',
    )
    const servidor = servidores.find((item) => item.ativo)

    expect(servidor, 'servidor ativo para criar afastamento').toBeTruthy()

    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    const suffix = `${Date.now()}`
    const afastamentoId = await expectRpcSuccess<string>(
      gestor.rpc('criar_afastamento', {
        input: {
          servidorId: servidor!.id,
          vinculoId: servidor!.vinculo_id,
          tipo: 'Atestado medico',
          dataInicio: today.toISOString().slice(0, 10),
          dataFim: tomorrow.toISOString().slice(0, 10),
          motivo: `Teste E2E encaminhamento avaliador ${suffix}`,
          observacoes: 'Processo criado automaticamente por teste E2E.',
          documentoNome: `e2e-encaminhamento-${suffix}.pdf`,
          documentoUrl: '',
          documentoTipo: 'application/pdf',
        },
      }),
      'criar afastamento de teste',
    )

    const {
      data: { user: avaliadorUser },
      error: avaliadorUserError,
    } = await avaliador.auth.getUser()

    expect(avaliadorUserError, 'buscar usuario do avaliador autenticado').toBeNull()
    expect(avaliadorUser?.id, 'usuario do avaliador autenticado').toBeTruthy()

    const { data: avaliadorAtual, error: avaliadorAtualError } =
      await avaliador
        .schema('afastamentos')
        .from('avaliadores')
        .select('id')
        .eq('usuario_id', avaliadorUser!.id)
        .single()

    expect(avaliadorAtualError, 'buscar cadastro do avaliador autenticado').toBeNull()
    expect(avaliadorAtual?.id, 'avaliador autenticado possui cadastro').toBeTruthy()

    const avaliadores = await expectRpcSuccess<AvaliadorFila[]>(
      cas.rpc('list_avaliadores_para_avaliacao'),
      'listar avaliadores disponiveis para o CAS',
    )
    const targetAvaliador = avaliadores.find(
      (item) => item.avaliador_id === avaliadorAtual!.id,
    )

    expect(targetAvaliador, 'avaliador alvo aparece na fila do CAS').toBeTruthy()

    await expectRpcSuccess<null>(
      cas.rpc('encaminhar_avaliacao_afastamento', {
        target_afastamento_id: afastamentoId,
        target_avaliador_id: targetAvaliador!.avaliador_id,
        comentarios: `Encaminhamento E2E ${suffix}`,
        permitir_reatribuicao: false,
      }),
      'encaminhar afastamento para avaliador especifico',
    )

    const { data: avaliacoes, error: avaliacoesError } = await cas
      .schema('afastamentos')
      .from('avaliacoes_medicas')
      .select('avaliador_id, status')
      .eq('afastamento_id', afastamentoId)

    expect(avaliacoesError, 'consultar avaliacao criada').toBeNull()
    expect(avaliacoes as AvaliacaoMedica[]).toEqual([
      {
        avaliador_id: targetAvaliador!.avaliador_id,
        status: 'pendente',
      },
    ])

    const movimentacoes = await expectRpcSuccess<Movimentacao[]>(
      cas.rpc('get_movimentacoes_afastamento', {
        target_afastamento_id: afastamentoId,
      }),
      'consultar movimentacoes do afastamento',
    )

    expect(
      movimentacoes.some(
        (item) =>
          item.tipo === 'triagem' &&
          item.status_destino === 'aguardando_avaliacao',
      ),
      'movimentacao de triagem para avaliacao foi registrada',
    ).toBe(true)

    const { data: detalheAvaliador, error: detalheAvaliadorError } =
      await avaliador
        .schema('afastamentos')
        .from('afastamentos')
        .select('id, status')
        .eq('id', afastamentoId)
        .single()

    expect(detalheAvaliadorError, 'avaliador atribuido acessa o processo').toBeNull()
    expect(detalheAvaliador).toMatchObject({
      id: afastamentoId,
      status: 'aguardando_avaliacao',
    })

    const notificacoes = await expectRpcSuccess<Notificacao[]>(
      avaliador.rpc('listar_minhas_notificacoes', { page_size: 20 }),
      'listar notificacoes do avaliador',
    )

    expect(
      notificacoes.some(
        (item) =>
          item.evento === 'avaliacao' &&
          item.entidade_id === afastamentoId &&
          item.status === 'pendente',
      ),
      'notificacao de avaliacao pendente foi entregue ao avaliador',
    ).toBe(true)

    await Promise.all([
      gestor.auth.signOut(),
      cas.auth.signOut(),
      avaliador.auth.signOut(),
    ])
  })
})
