export const authKeys = {
  all: ['auth'] as const,
  session: () => [...authKeys.all, 'session'] as const,
  authz: () => [...authKeys.all, 'authz'] as const,
  user: () => [...authKeys.all, 'user'] as const,
}
