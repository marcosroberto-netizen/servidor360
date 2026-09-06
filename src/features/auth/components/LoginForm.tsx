import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { FeedbackDialog } from '@/shared/components/ui/FeedbackDialog'
import { useLogin } from '../services/useAuth'
import { getAuthErrorMessage } from '../utils/authErrorMessage'
import { loginSchema } from '../utils/authSchema'
import type { LoginDTO } from '../types/auth.types'

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
        setDialogMessage(getAuthErrorMessage(error, 'Não foi possível entrar. Tente novamente.'))
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
    <main className="h-screen overflow-hidden bg-slate-50 text-slate-950">
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

      <section className="grid h-full grid-cols-1 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="hidden bg-emerald-950 px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
          <header className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white text-sm font-black text-emerald-950">
                S360
              </div>
              <div>
                <p className="text-base font-semibold leading-tight">Servidor 360</p>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-200">
                  Portal do Servidor
                </p>
              </div>
            </div>
          </header>

          <div className="max-w-xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
              Gestão funcional
            </p>
            <h1 className="text-5xl font-black leading-[1.02]">
              Um acesso único para a vida funcional do servidor.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-emerald-50/80">
              Servidores, unidades escolares, Educação, CAS e RH acessam somente o que faz
              parte da sua responsabilidade.
            </p>
          </div>

          <footer className="grid grid-cols-3 gap-4 border-t border-white/15 pt-6 text-sm">
            <div>
              <p className="font-semibold text-white">Perfil</p>
              <p className="mt-1 text-emerald-50/70">Acesso sob medida</p>
            </div>
            <div>
              <p className="font-semibold text-white">Unidade</p>
              <p className="mt-1 text-emerald-50/70">Escopo respeitado</p>
            </div>
            <div>
              <p className="font-semibold text-white">Histórico</p>
              <p className="mt-1 text-emerald-50/70">Ações rastreáveis</p>
            </div>
          </footer>
        </div>

        <div className="flex h-full items-center justify-center px-6 py-6 sm:px-10 lg:px-12">
          <div className="w-full max-w-[420px]">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-950 text-sm font-black text-white">
                S360
              </div>
              <div>
                <p className="text-base font-semibold leading-tight">Servidor 360</p>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  Portal do Servidor
                </p>
              </div>
            </div>

            <div className="mb-7">
              <p className="text-sm font-semibold text-emerald-800">Área restrita</p>
              <h2 className="mt-2 text-3xl font-black tracking-normal text-slate-950">
                Acesse sua conta
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Entre com suas credenciais institucionais.
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
                  <Link
                    to="/forgot-password"
                    className="inline-flex h-8 items-center rounded-md px-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 hover:text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  >
                    Recuperar senha
                  </Link>
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
                className="flex h-12 w-full items-center justify-center rounded-md bg-emerald-950 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Acessar
              </button>
            </form>

            <p className="mt-7 text-center text-xs text-slate-500">
              Servidor 360 · Secretaria Municipal de Educação
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
