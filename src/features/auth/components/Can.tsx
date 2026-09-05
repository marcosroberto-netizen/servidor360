import { usePermission, type Permission } from '../hooks/usePermission'

interface CanProps {
  permission: Permission
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function Can({ permission, children, fallback = null }: CanProps) {
  const hasPermission = usePermission(permission)

  return hasPermission ? <>{children}</> : <>{fallback}</>
}
