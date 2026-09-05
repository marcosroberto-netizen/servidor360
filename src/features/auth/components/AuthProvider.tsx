import { useEffect, type ReactNode } from 'react'
import { AuthContext } from '../hooks/authContext'
import { useAuthStore } from '../store/authStore'
import { useAuthStateSubscription, useCurrentUserAuthz, useLogout, useSession } from '../services/useAuth'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  useAuthStateSubscription()

  const { data: session = null, isLoading } = useSession()
  const { data: authz, isLoading: isLoadingAuthz } = useCurrentUserAuthz(Boolean(session))
  const { mutateAsync: logout } = useLogout()
  const { reset, setPerfis, setPermissoes, setUnidades, setUser } = useAuthStore()

  useEffect(() => {
    if (!session) {
      reset()
      return
    }

    if (!authz) return

    setUser(authz.usuario)
    setPerfis(authz.perfis)
    setPermissoes(authz.permissoes)
    setUnidades(authz.unidades)
  }, [authz, reset, session, setPerfis, setPermissoes, setUnidades, setUser])

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
