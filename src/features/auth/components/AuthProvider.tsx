import type { ReactNode } from 'react'
import { AuthContext } from '../hooks/authContext'
import { useAuthStateSubscription, useLogout, useSession } from '../services/useAuth'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  useAuthStateSubscription()

  const { data: session = null, isLoading } = useSession()
  const { mutateAsync: logout } = useLogout()

  const signOut = async () => {
    await logout()
  }

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading: isLoading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
