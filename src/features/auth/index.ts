// API pública da feature auth

// Hooks
export {
  useAuthStateSubscription,
  useCurrentUserAuthz,
  useLogin,
  useRegister,
  useLogout,
  useSession,
  useResetPassword,
  useUpdatePassword,
} from './services/useAuth'

// Store
export { useAuthStore } from './store/authStore'

// Componentes
export { LoginForm } from './components/LoginForm'
export { AuthProvider } from './components/AuthProvider'
export { useAuth } from './hooks/authContext'
export { Can } from './components/Can'
export { ProtectedRoute } from './components/ProtectedRoute'

// Permissões
export {
  PERMISSIONS,
  useAllPermissions,
  useAnyPermission,
  usePermission,
} from './hooks/usePermission'
export type { Permission as AuthPermission } from './hooks/usePermission'

// Tipos
export type { AuthzPayload, User, PermissionString } from './types/auth.types'

// Schemas
export type { LoginDTO, RegisterDTO, ResetPasswordDTO, UpdatePasswordDTO } from './utils/authSchema'
export { loginSchema, registerSchema, resetPasswordSchema, updatePasswordSchema } from './utils/authSchema'
