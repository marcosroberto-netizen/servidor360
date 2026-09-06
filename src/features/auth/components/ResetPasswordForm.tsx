import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { FeedbackDialog } from '@/shared/components/ui/FeedbackDialog'
import { useUpdatePassword } from '../services/useAuth'
import { getAuthErrorMessage } from '../utils/authErrorMessage'
import { updatePasswordSchema } from '../utils/authSchema'
import type { UpdatePasswordDTO } from '../types/auth.types'

export function ResetPasswordForm() {
  const navigate = useNavigate()
  const [dialog, setDialog] = useState<{
    title: string
    message: string
    variant: 'error' | 'success'
  } | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<UpdatePasswordDTO>({
    resolver: zodResolver(updatePasswordSchema),
  })

  const { mutate: updatePassword, isPending, reset } = useUpdatePassword()

  const onSubmit = ({ password }: UpdatePasswordDTO) => {
    updatePassword(password, {
      onSuccess: () => {
        setDialog({
          title: 'Senha atualizada',
          message: 'Sua senha foi alterada. Você já pode acessar sua conta.',
          variant: 'success',
        })
      },
      onError: (error) => {
        setDialog({
          title: 'Não foi possível atualizar',
          message: getAuthErrorMessage(error, 'Não foi possível atualizar a senha. Tente novamente.'),
          variant: 'error',
        })
      },
    })
  }

  const onInvalid = (fieldErrors: FieldErrors<UpdatePasswordDTO>) => {
    const messages = Object.values(fieldErrors)
      .map((fieldError) => fieldError?.message)
      .filter(Boolean)

    setDialog({
      title: 'Revise os campos',
      message: messages.join('\n'),
      variant: 'error',
    })
  }

  const closeDialog = () => {
    const wasSuccess = dialog?.variant === 'success'

    setDialog(null)
    reset()

    if (wasSuccess) {
      navigate('/login')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10 text-slate-950">
      <FeedbackDialog
        actionLabel={dialog?.variant === 'success' ? 'Ir para login' : 'Entendi'}
        description={dialog?.message.split('\n').map((message) => <p key={message}>{message}</p>)}
        onClose={closeDialog}
        open={Boolean(dialog)}
        title={dialog?.title ?? ''}
        variant={dialog?.variant}
      />
      <FeedbackDialog
        description="Estamos salvando sua nova senha."
        open={isPending && !dialog}
        title="Atualizando senha"
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
          <p className="text-sm font-semibold text-emerald-800">Nova senha</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">
            Crie uma nova senha
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use uma senha com pelo menos 6 caracteres.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
              Nova senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              placeholder="Digite a nova senha"
              {...register('password')}
              className="mt-2 block h-12 w-full rounded-md border border-slate-300 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100 aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-red-50"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700">
              Confirmar senha
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmPassword)}
              placeholder="Repita a nova senha"
              {...register('confirmPassword')}
              className="mt-2 block h-12 w-full rounded-md border border-slate-300 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100 aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-red-50"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isPending}
            className="flex h-12 w-full items-center justify-center rounded-md bg-emerald-950 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Salvar nova senha
          </button>
        </form>
      </section>
    </main>
  )
}
