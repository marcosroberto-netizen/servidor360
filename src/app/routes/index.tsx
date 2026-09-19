import { createElement, lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { PERMISSIONS, ProtectedRoute } from '@/features/auth'
import { PageSkeleton } from '@/shared/components/PageSkeleton'

// Lazy loading das páginas
const loginPage = lazy(() => import('@/pages/LoginPage'))
const forgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'))
const resetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'))
const portalPage = lazy(() => import('@/pages/PortalPage'))
const afastamentosPage = lazy(() => import('@/features/afastamentos/pages/AfastamentosGeralPage'))
const afastamentosEducacaoPage = lazy(() => import('@/features/afastamentos/pages/AfastamentosEducacaoPage'))
const afastamentosCasPage = lazy(() => import('@/features/afastamentos/pages/AfastamentosCasPage'))
const afastamentosDpPage = lazy(() => import('@/features/afastamentos/pages/AfastamentosDpPage'))
const validarDocumentoPage = lazy(() => import('@/features/afastamentos/pages/ValidarDocumentoPage'))
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
      <ProtectedRoute permission={PERMISSIONS.AFASTAMENTOS_READ}>
        <Suspense fallback={<PageSkeleton />}>
          {createElement(afastamentosPage)}
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/afastamentos/educacao',
    element: (
      <ProtectedRoute permission={PERMISSIONS.EDUCACAO_READ}>
        <Suspense fallback={<PageSkeleton />}>
          {createElement(afastamentosEducacaoPage)}
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/afastamentos/cas',
    element: (
      <ProtectedRoute permission={PERMISSIONS.CAS_FILA}>
        <Suspense fallback={<PageSkeleton />}>
          {createElement(afastamentosCasPage)}
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/afastamentos/dp',
    element: (
      <ProtectedRoute permission={PERMISSIONS.RH_FILA}>
        <Suspense fallback={<PageSkeleton />}>
          {createElement(afastamentosDpPage)}
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/validar-documento/:protocolo',
    element: (
      <ProtectedRoute permission={PERMISSIONS.AFASTAMENTOS_VALIDAR_DOCUMENTO}>
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
