import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { PermissionString, User } from '../types/auth.types'

interface AuthStoreState {
  user: User | null
  perfis: string[]
  permissoes: PermissionString[]
  unidades: string[]
  setUser: (user: User | null) => void
  setPerfis: (perfis: string[]) => void
  setPermissoes: (permissoes: PermissionString[]) => void
  setUnidades: (unidades: string[]) => void
  reset: () => void
}

const initialState = {
  user: null,
  perfis: [],
  permissoes: [],
  unidades: [],
}

export const useAuthStore = create<AuthStoreState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setUser: (user) =>
          set({ user }, false, 'auth/setUser'),

        setPerfis: (perfis) =>
          set({ perfis }, false, 'auth/setPerfis'),

        setPermissoes: (permissoes) =>
          set({ permissoes }, false, 'auth/setPermissoes'),

        setUnidades: (unidades) =>
          set({ unidades }, false, 'auth/setUnidades'),

        reset: () =>
          set(initialState, false, 'auth/reset'),
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          user: state.user,
          perfis: state.perfis,
          permissoes: state.permissoes,
          unidades: state.unidades,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
)
