import type { Session, User as SupabaseUser } from '@supabase/supabase-js'
import type { ReactNode } from 'react'
import type { z } from 'zod'
import type { PERMISSIONS } from '../constants/auth.constants'
import type {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updatePasswordSchema,
} from '../utils/authSchema'

export interface User {
  id: string
  email: string
  nome_completo?: string
  cpf?: string
  ativo?: boolean
  created_at: string
  updated_at: string
}

export interface AuthzPayload {
  usuario: User | null
  perfis: string[]
  permissoes: PermissionString[]
  unidades: string[]
  setores?: string[]
}

export type PermissionString = '*' | `${string}:${string}`

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

export interface AuthContextType {
  user: SupabaseUser | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

export interface AuthProviderProps {
  children: ReactNode
}

export interface ProtectedRouteProps {
  children: ReactNode
  permission?: Permission
  fallback?: ReactNode
}

export interface CanProps {
  permission: Permission
  children: ReactNode
  fallback?: ReactNode
}

export type LoginDTO = z.infer<typeof loginSchema>

export type RegisterDTO = z.infer<typeof registerSchema>

export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema>

export type UpdatePasswordDTO = z.infer<typeof updatePasswordSchema>
