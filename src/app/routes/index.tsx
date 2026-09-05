import { createElement, lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/features/auth'
import { PageSkeleton } from '@/shared/components/PageSkeleton'

// Lazy loading das páginas
const loginPage = lazy(() => import('@/pages/LoginPage'))
const portalPage = lazy(() => import('@/pages/PortalPage'))
const unauthorizedPage = lazy(() => import('@/pages/UnauthorizedPage'))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageSkeleton />}>
        {createElement(loginPage)}
      </Suspense>
    ),
  },
  {
    path: '/portal',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageSkeleton />}>
          {createElement(portalPage)}
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/unauthorized',
    element: (
      <Suspense fallback={<PageSkeleton />}>
        {createElement(unauthorizedPage)}
      </Suspense>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
])
