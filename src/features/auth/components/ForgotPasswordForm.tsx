import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { FeedbackDialog } from '@/shared/components/ui/FeedbackDialog'
import { useResetPassword } from '../services/useAuth'
import { getAuthErrorMessage } from '../utils/authErrorMessage'
import { resetPasswordSchema } from '../utils/authSchema'
import type { ResetPasswordDTO } from '../types/auth.types'

export function ForgotPasswordForm() {
  const [dialog, setDialog] = useState<{
    title: string
    message: string
    variant: 'error' | 'success'
  } | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordDTO>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const { mutate: resetPassword, isPending, reset } = useResetPassword()

  const onSubmit = ({ email }: ResetPasswordDTO) => {
    resetPassword(email, {
      onSuccess: () => {
        setDialog({
          title: 'Verifique seu e-mail',
          message: 'Enviamos um link para você criar uma nova senha.',
          variant: 'success',
        })
      },
      onError: (error) => {
        setDialog({
          title: 'Não foi possível enviar o link',
          message: getAuthErrorMessage(error, 'Não foi possível enviar o link. Tente novamente.'),
          variant: 'error',
        })
      },
    })
  }

  const onInvalid = (fieldErrors: FieldErrors<ResetPasswordDTO>) => {
    const messages = Object.values(fieldErrors)
      .map((fieldError) => fieldError?.message)
      .filter(Boolean)

    setDialog({
      title: 'Revise o e-mail',
      message: messages.join('\n'),
      variant: 'error',
    })
  }

  const closeDialog = () => {
    setDialog(null)
    reset()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10 text-slate-950">
      <FeedbackDialog
        actionLabel="Entendi"
        description={dialog?.message.split('\n').map((message) => <p key={message}>{message}</p>)}
        onClose={closeDialog}
        open={Boolean(dialog)}
        title={dialog?.title ?? ''}
        variant={dialog?.variant}
      />
      <FeedbackDialog
        description="Estamos preparando o link de recuperação."
        open={isPending && !dialog}
        title="Enviando e-mail"
        variant="loading"
      />

      <section className="w-full max-w-[420px]">
        <Link
          to="/login"
          className="mb-8 inline-flex h-9 items-center rounded-md px-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 hover:text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        >
          Voltar para login
        </Link>

        <div className="mb-7">
          <p className="text-sm font-semibold text-emerald-800">Recuperação de acesso</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">
            Redefina sua senha
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Informe seu e-mail institucional para receber o link de recuperação.
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

          <button
            type="submit"
            disabled={isSubmitting || isPending}
            className="flex h-12 w-full items-center justify-center rounded-md bg-emerald-950 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Enviar link de recuperação
          </button>
        </form>
      </section>
    </main>
  )
}
