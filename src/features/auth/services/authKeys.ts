export const authKeys = {
  all: ['auth'] as const,
  session: () => [...authKeys.all, 'session'] as const,
  user: () => [...authKeys.all, 'user'] as const,
  userPerfis: (userId: string) => [...authKeys.all, 'user-perfis', userId] as const,
}
