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

// Componentes
export { LoginForm } from './components/LoginForm'
export { ForgotPasswordForm } from './components/ForgotPasswordForm'
export { ResetPasswordForm } from './components/ResetPasswordForm'
export { AuthProvider } from './components/AuthProvider'
export { useAuth } from './hooks/authContext'
export { Can } from './components/Can'
export { ProtectedRoute } from './components/ProtectedRoute'

// Permissões
export {
  useAllPermissions,
  useAnyPermission,
  usePermission,
} from './hooks/usePermission'
export { PERMISSIONS } from './constants/auth.constants'

// Tipos
export type {
  AuthzPayload,
  LoginDTO,
  Permission,
  PermissionString,
  RegisterDTO,
  ResetPasswordDTO,
  UpdatePasswordDTO,
  User,
} from './types/auth.types'
export type { Permission as AuthPermission } from './types/auth.types'

// Schemas
export { loginSchema, registerSchema, resetPasswordSchema, updatePasswordSchema } from './utils/authSchema'
