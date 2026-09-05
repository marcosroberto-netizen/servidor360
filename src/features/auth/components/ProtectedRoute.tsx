import { Navigate } from 'react-router-dom'
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
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
