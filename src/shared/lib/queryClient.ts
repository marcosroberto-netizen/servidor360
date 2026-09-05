import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,       // 5 minutos
      gcTime: 1000 * 60 * 10,          // 10 minutos
      retry: (failureCount, error) => {
        // Não retry para erros de autenticação
        if (error instanceof Error && error.message.includes('Invalid login credentials')) {
          return false
        }
        // Retry até 2 vezes para outros erros
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})
