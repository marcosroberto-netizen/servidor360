import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import { authKeys } from './authKeys'
import type { AuthzPayload, LoginDTO, RegisterDTO } from '../types/auth.types'

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    retry: false,
    mutationFn: async ({ email, password }: LoginDTO) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.all })
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    retry: false,
    mutationFn: async ({ email, password, nome_completo, cpf }: RegisterDTO) => {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome_completo,
            cpf,
          },
        },
      })

      if (authError) throw authError

      return authData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.all })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    retry: false,
    mutationFn: async () => {
      await supabase.auth.signOut()
    },
    onSuccess: () => {
      queryClient.clear()
    },
  })
}

export function useSession() {
  return useQuery({
    queryKey: authKeys.session(),
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      return session
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export function useCurrentUserAuthz(enabled: boolean) {
  return useQuery({
    queryKey: authKeys.authz(),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_current_user_authz')

      if (error) throw error

      return data as AuthzPayload
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  })
}

export function useAuthStateSubscription() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      queryClient.setQueryData(authKeys.session(), session)
      queryClient.invalidateQueries({ queryKey: authKeys.authz() })
    })

    return () => subscription.unsubscribe()
  }, [queryClient])
}

export function useResetPassword() {
  return useMutation({
    retry: false,
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
    },
  })
}

export function useUpdatePassword() {
  return useMutation({
    retry: false,
    mutationFn: async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
    },
  })
}
