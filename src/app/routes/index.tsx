import { createElement, lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/features/auth'
import { PageSkeleton } from '@/shared/components/PageSkeleton'

// Lazy loading das páginas
const loginPage = lazy(() => import('@/pages/LoginPage'))
const forgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'))
const resetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'))
const portalPage = lazy(() => import('@/pages/PortalPage'))
const afastamentosPage = lazy(() => import('@/pages/AfastamentosPage'))
const novoAfastamentoPage = lazy(() => import('@/pages/NovoAfastamentoPage'))
const validarDocumentoPage = lazy(() => import('@/pages/ValidarDocumentoPage'))
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
    path: '/forgot-password',
    element: (
      <Suspense fallback={<PageSkeleton />}>
        {createElement(forgotPasswordPage)}
      </Suspense>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <Suspense fallback={<PageSkeleton />}>
        {createElement(resetPasswordPage)}
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
    path: '/afastamentos',
    element: (
      <ProtectedRoute permission="afastamentos:read">
        <Suspense fallback={<PageSkeleton />}>
          {createElement(afastamentosPage)}
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/afastamentos/novo',
    element: (
      <ProtectedRoute permission="afastamentos:create">
        <Suspense fallback={<PageSkeleton />}>
          {createElement(novoAfastamentoPage)}
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/validar-documento/:protocolo',
    element: (
      <ProtectedRoute permission="afastamentos:validar_documento">
        <Suspense fallback={<PageSkeleton />}>
          {createElement(validarDocumentoPage)}
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
