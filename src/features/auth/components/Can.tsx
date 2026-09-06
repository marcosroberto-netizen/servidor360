import { usePermission } from '../hooks/usePermission'
import type { CanProps } from '../types/auth.types'

export function Can({ permission, children, fallback = null }: CanProps) {
  const hasPermission = usePermission(permission)

  return hasPermission ? <>{children}</> : <>{fallback}</>
}
