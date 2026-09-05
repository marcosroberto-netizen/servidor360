import { useAuthStore } from '../store/authStore'

export const PERMISSIONS = {
  SERVIDORES_READ: 'servidores:read',
  SERVIDORES_WRITE: 'servidores:write',
  SERVIDORES_DELETE: 'servidores:delete',
  AFASTAMENTOS_READ: 'afastamentos:read',
  AFASTAMENTOS_WRITE: 'afastamentos:write',
  AFASTAMENTOS_DELETE: 'afastamentos:delete',
  AFASTAMENTOS_DEVOLUTIVA: 'afastamentos:devolutiva',
  PRONTUARIO_READ: 'prontuario:read',
  PRONTUARIO_WRITE: 'prontuario:write',
  CAS_READ: 'cas:read',
  CAS_WRITE: 'cas:write',
  ADMIN: '*',
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

function hasPermission(perfis: string[], permission: Permission): boolean {
  if (perfis.includes('administrador')) return true

  void permission

  return false
}

export function usePermission(permission?: Permission): boolean {
  const { perfis } = useAuthStore()

  if (!permission) return true

  return hasPermission(perfis, permission)
}

export function useAnyPermission(permissions: Permission[]): boolean {
  const { perfis } = useAuthStore()

  return permissions.some((permission) => hasPermission(perfis, permission))
}

export function useAllPermissions(permissions: Permission[]): boolean {
  const { perfis } = useAuthStore()

  return permissions.every((permission) => hasPermission(perfis, permission))
}
