import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { FeedbackDialog } from '@/shared/components/ui/FeedbackDialog'
import { useLogin } from '../services/useAuth'
import { loginSchema, type LoginDTO } from '../utils/authSchema'

export function LoginForm() {
  const navigate = useNavigate()
  const [dialogMessage, setDialogMessage] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginDTO>({
    resolver: zodResolver(loginSchema),
  })

  const { mutate: login, isPending, reset } = useLogin()

  const onSubmit = (data: LoginDTO) => {
    login(data, {
      onSuccess: () => {
        navigate('/portal')
      },
      onError: (error) => {
        setDialogMessage(
          error.message === 'Invalid login credentials'
            ? 'E-mail ou senha incorretos.'
            : error.message,
        )
      },
    })
  }

  const onInvalid = (fieldErrors: FieldErrors<LoginDTO>) => {
    const messages = Object.values(fieldErrors)
      .map((fieldError) => fieldError?.message)
      .filter(Boolean)

    setDialogMessage(messages.join('\n'))
  }

  const closeDialog = () => {
    setDialogMessage(null)
    reset()
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f8f6] text-slate-950">
      <FeedbackDialog
        actionLabel="Entendi"
        description={
          dialogMessage
            ?.split('\n')
            .map((message) => <p key={message}>{message}</p>)
        }
        onClose={closeDialog}
        open={Boolean(dialogMessage)}
        title="Não foi possível entrar"
        variant="error"
      />
      <FeedbackDialog
        description="Estamos validando suas credenciais."
        open={isPending && !dialogMessage}
        title="Entrando"
        variant="loading"
      />

      <section className="relative mx-auto grid min-h-screen w-full max-w-[1440px] grid-cols-1 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.38] [background-image:linear-gradient(#d8e5df_1px,transparent_1px),linear-gradient(90deg,#d8e5df_1px,transparent_1px)] [background-size:44px_44px]" />

        <div className="relative flex min-h-[48vh] flex-col justify-between px-6 py-7 sm:px-10 lg:min-h-screen lg:px-12 xl:px-16">
          <header className="flex items-center justify-between gap-4 rounded-lg border border-emerald-950/10 bg-white/75 px-4 py-3 shadow-soft backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-900 text-sm font-black text-white">
                S360
              </div>
              <div>
                <p className="text-base font-semibold leading-tight text-slate-950">Servidor 360</p>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">Portal do Servidor</p>
              </div>
            </div>
            <span className="rounded-full border border-emerald-900/10 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              Online
            </span>
          </header>

          <div className="grid items-center gap-8 py-10 lg:grid-cols-[0.92fr_1.08fr] lg:py-0">
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
                Prefeitura Municipal
              </p>
              <h1 className="max-w-2xl text-4xl font-black leading-[1.04] text-slate-950 sm:text-5xl xl:text-6xl">
                Vida funcional organizada para cada responsabilidade.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                Um acesso único para servidores, escolas, Educação, CAS e RH acompanharem o
                que precisa de atenção.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <span className="rounded-full border border-emerald-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                  Afastamentos
                </span>
                <span className="rounded-full border border-emerald-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                  Prontuário
                </span>
                <span className="rounded-full border border-emerald-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                  Pendências
                </span>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="rounded-lg border border-emerald-950/10 bg-white/80 p-4 shadow-strong backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Painel do dia</p>
                    <p className="text-xs text-slate-500">Fila de trabalho</p>
                  </div>
                  <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    Atualizado
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-emerald-900 p-4 text-white">
                    <p className="text-3xl font-black">12</p>
                    <p className="mt-6 text-xs text-emerald-100">Em análise</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-3xl font-black text-slate-950">04</p>
                    <p className="mt-6 text-xs text-slate-500">Pendências</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-3xl font-black text-slate-950">31</p>
                    <p className="mt-6 text-xs text-slate-500">Concluídos</p>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">Tramitação</p>
                    <p className="text-xs font-medium text-slate-500">Hoje</p>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-[92px_1fr_42px] items-center gap-3 text-xs">
                      <span className="font-medium text-slate-600">Escola</span>
                      <span className="h-2 rounded-full bg-emerald-100">
                        <span className="block h-2 w-[74%] rounded-full bg-emerald-700" />
                      </span>
                      <span className="text-right font-semibold text-slate-700">74%</span>
                    </div>
                    <div className="grid grid-cols-[92px_1fr_42px] items-center gap-3 text-xs">
                      <span className="font-medium text-slate-600">CAS</span>
                      <span className="h-2 rounded-full bg-amber-100">
                        <span className="block h-2 w-[48%] rounded-full bg-amber-500" />
                      </span>
                      <span className="text-right font-semibold text-slate-700">48%</span>
                    </div>
                    <div className="grid grid-cols-[92px_1fr_42px] items-center gap-3 text-xs">
                      <span className="font-medium text-slate-600">RH</span>
                      <span className="h-2 rounded-full bg-sky-100">
                        <span className="block h-2 w-[62%] rounded-full bg-sky-600" />
                      </span>
                      <span className="text-right font-semibold text-slate-700">62%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-[1fr_120px] gap-3">
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Próxima ação
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      Revisar devolutivas liberadas para unidade.
                    </p>
                  </div>
                  <div className="rounded-lg bg-[#ffe8bd] p-4">
                    <p className="text-xs font-semibold text-amber-900">Prazo médio</p>
                    <p className="mt-5 text-2xl font-black text-amber-950">2d</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <footer className="flex flex-col gap-3 rounded-lg border border-emerald-950/10 bg-white/75 px-4 py-3 text-sm text-slate-600 shadow-soft backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
            <p className="font-medium text-slate-700">Acesso pessoal e auditável</p>
            <p>Ambiente protegido por perfil, unidade e responsabilidade.</p>
          </footer>
        </div>

        <div className="relative flex items-center justify-center px-6 py-10 sm:px-10 lg:px-12 xl:px-16">
          <div className="w-full max-w-[440px] rounded-lg border border-slate-200 bg-white p-6 shadow-strong sm:p-8">
            <div className="mb-8">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-md bg-emerald-900 text-sm font-black text-white">
                S360
              </div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">
                Área restrita
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-normal text-slate-950">
                Entrar no portal
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Informe suas credenciais institucionais para continuar.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  placeholder="nome@municipio.gov.br"
                  {...register('email')}
                  className="mt-2 block h-12 w-full rounded-md border border-slate-300 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100 aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-red-50"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-4">
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                    Senha
                  </label>
                  <a href="/forgot-password" className="text-sm font-semibold text-emerald-800 hover:text-emerald-950">
                    Recuperar senha
                  </a>
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={Boolean(errors.password)}
                  placeholder="Sua senha"
                  {...register('password')}
                  className="mt-2 block h-12 w-full rounded-md border border-slate-300 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100 aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-red-50"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isPending}
                className="flex h-12 w-full items-center justify-center rounded-md bg-emerald-900 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-950 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Acessar
              </button>
            </form>

            <div className="mt-7 rounded-lg border border-emerald-900/10 bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">
                Segurança
              </p>
              <p className="mt-2 text-sm leading-6 text-emerald-950">
                Sua sessão respeita as permissões cadastradas para seu perfil e unidade.
              </p>
            </div>

            <p className="mt-6 text-center text-xs text-slate-500">
              Servidor 360 · Secretaria Municipal de Educação
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
