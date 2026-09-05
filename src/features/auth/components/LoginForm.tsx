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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
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

      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Servidor 360
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Portal do Servidor
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                {...register('email')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                {...register('password')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting || isPending}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Entrar
            </button>
          </div>

          <div className="text-center">
            <a href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
              Esqueceu sua senha?
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
