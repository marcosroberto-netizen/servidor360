import { PERMISSIONS } from '../constants/auth.constants'
import { useAuth } from './authContext'
import { useCurrentUserAuthz } from '../services/useAuth'
import type { Permission, PermissionString } from '../types/auth.types'

function hasPermission(perfis: string[], permissoes: PermissionString[], permission: Permission): boolean {
  void perfis
  if (permissoes.includes(PERMISSIONS.ADMIN)) return true

  return permissoes.includes(permission)
}

export function usePermission(permission?: Permission): boolean {
  const { session } = useAuth()
  const { data: authz } = useCurrentUserAuthz(Boolean(session))

  if (!permission) return true

  return hasPermission(authz?.perfis ?? [], authz?.permissoes ?? [], permission)
}

export function useAnyPermission(permissions: Permission[]): boolean {
  const { session } = useAuth()
  const { data: authz } = useCurrentUserAuthz(Boolean(session))

  return permissions.some((permission) =>
    hasPermission(authz?.perfis ?? [], authz?.permissoes ?? [], permission)
  )
}

export function useAllPermissions(permissions: Permission[]): boolean {
  const { session } = useAuth()
  const { data: authz } = useCurrentUserAuthz(Boolean(session))

  return permissions.every((permission) =>
    hasPermission(authz?.perfis ?? [], authz?.permissoes ?? [], permission)
  )
}
