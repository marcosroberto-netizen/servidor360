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
    <main className="min-h-screen bg-slate-100 text-slate-900">
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

      <section className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 lg:grid-cols-[1.12fr_0.88fr]">
        <div className="flex min-h-[42vh] flex-col justify-between bg-slate-950 px-6 py-8 text-white sm:px-10 lg:min-h-screen lg:px-12">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white text-sm font-black text-slate-950">
                S360
              </div>
              <div>
                <p className="text-base font-semibold leading-tight">Servidor 360</p>
                <p className="text-xs uppercase tracking-[0.18em] text-blue-200">Portal do Servidor</p>
              </div>
            </div>
            <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-slate-200">
              Acesso seguro
            </span>
          </header>

          <div className="py-10 lg:py-0">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.22em] text-blue-200">
              Gestão funcional integrada
            </p>
            <h1 className="max-w-2xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              Um portal para acompanhar a vida funcional do servidor.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Acesse serviços, documentos, afastamentos e prontuário funcional com permissões
              adequadas ao seu perfil.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-bold text-white">RBAC</p>
              <p className="mt-1 text-sm text-slate-300">Permissões por perfil</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-bold text-white">RLS</p>
              <p className="mt-1 text-sm text-slate-300">Proteção no banco</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-bold text-white">360</p>
              <p className="mt-1 text-sm text-slate-300">Visão unificada</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-12">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-medium sm:p-8">
            <div className="mb-8">
              <p className="text-sm font-medium text-blue-700">Entrar no portal</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-950">Bem-vindo de volta</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Use suas credenciais institucionais para acessar sua área.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  {...register('email')}
                  className="mt-2 block h-12 w-full rounded-md border border-slate-300 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-red-50"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-4">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Senha
                  </label>
                  <a href="/forgot-password" className="text-sm font-medium text-blue-700 hover:text-blue-800">
                    Esqueci minha senha
                  </a>
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={Boolean(errors.password)}
                  {...register('password')}
                  className="mt-2 block h-12 w-full rounded-md border border-slate-300 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-red-50"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isPending}
                className="flex h-12 w-full items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Entrar
              </button>
            </form>

            <div className="mt-8 border-t border-slate-200 pt-5">
              <p className="text-xs leading-5 text-slate-500">
                O acesso é pessoal e auditável. Ao entrar, suas permissões serão aplicadas
                automaticamente conforme o perfil cadastrado.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
