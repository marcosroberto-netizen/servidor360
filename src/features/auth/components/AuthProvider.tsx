import { AuthContext } from '../hooks/authContext'
import { useAuthStateSubscription, useCurrentUserAuthz, useLogout, useSession } from '../services/useAuth'
import type { AuthProviderProps } from '../types/auth.types'

export function AuthProvider({ children }: AuthProviderProps) {
  useAuthStateSubscription()

  const { data: session = null, isLoading } = useSession()
  const { isLoading: isLoadingAuthz } = useCurrentUserAuthz(Boolean(session))
  const { mutateAsync: logout } = useLogout()

  const signOut = async () => {
    await logout()
  }

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading: isLoading || (Boolean(session) && isLoadingAuthz),
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
