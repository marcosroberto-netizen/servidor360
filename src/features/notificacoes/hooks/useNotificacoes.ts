import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import { notificacoesKeys } from '../services/notificacoesKeys'
import {
  listMinhasNotificacoes,
  marcarNotificacaoLida,
  marcarTodasNotificacoesLidas,
} from '../services/notificacoesService'

export function useMinhasNotificacoes(enabled: boolean) {
  return useQuery({
    queryKey: notificacoesKeys.minhas(),
    queryFn: listMinhasNotificacoes,
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })
}

export function useMarcarNotificacaoLida() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: marcarNotificacaoLida,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificacoesKeys.all }),
  })
}

export function useMarcarTodasNotificacoesLidas() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: marcarTodasNotificacoesLidas,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificacoesKeys.all }),
  })
}

export function useNotificacoesRealtime(userId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`notificacoes:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'app_auth',
          table: 'notificacoes',
          filter: `destinatario_id=eq.${userId}`,
        },
        () => queryClient.invalidateQueries({ queryKey: notificacoesKeys.all }),
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [queryClient, userId])
}
