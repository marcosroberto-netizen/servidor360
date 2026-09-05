import { Navigate } from 'react-router-dom'
import { FeedbackDialog } from '@/shared/components/ui/FeedbackDialog'
import { useAuth } from '../hooks/authContext'
import { usePermission, type Permission } from '../hooks/usePermission'

interface ProtectedRouteProps {
  children: React.ReactNode
  permission?: Permission
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, permission, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const hasPermission = usePermission(permission)

  if (loading) {
    return (
      <FeedbackDialog
        open
        title="Validando acesso"
        description="Estamos conferindo sua sessão e permissões."
        variant="loading"
      />
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!hasPermission) {
    return fallback || <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
