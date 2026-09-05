import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

export type LoginDTO = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  nome_completo: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cpf: z.string().length(11, 'CPF deve ter 11 dígitos').optional(),
})

export type RegisterDTO = z.infer<typeof registerSchema>

export const resetPasswordSchema = z.object({
  email: z.string().email('E-mail inválido'),
})

export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema>

export const updatePasswordSchema = z.object({
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirmação de senha deve ter no mínimo 6 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
})

export type UpdatePasswordDTO = z.infer<typeof updatePasswordSchema>
