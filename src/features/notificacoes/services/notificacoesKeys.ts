export const notificacoesKeys = {
  all: ['notificacoes'] as const,
  minhas: () => [...notificacoesKeys.all, 'minhas'] as const,
}
