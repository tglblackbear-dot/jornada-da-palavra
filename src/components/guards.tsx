import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Alert, EmptyState } from './ui'
import { useAuth } from '../contexts/AuthContext'
import { CONFIG_HINT } from '../lib/env'

function Loading() {
  return <div className="flex min-h-dvh items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-100 border-t-brand-900" role="status" aria-label="Carregando" /></div>
}

export function ConfigGuard({ children }: { children: React.ReactNode }) {
  const { configured } = useAuth()
  if (!configured) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <EmptyState
          title="Configuração necessária"
          description="O backend Supabase ainda não foi configurado. Nenhuma autenticação ou dado será simulado."
          action={<Alert tone="info">{CONFIG_HINT}</Alert>}
        />
      </div>
    )
  }
  return <>{children}</>
}

export function PublicRoute() {
  const { configured, loading, session } = useAuth()
  if (!configured) return <ConfigGuard><></></ConfigGuard>
  if (loading) return <Loading />
  if (session) return <Navigate to="/app" replace />
  return <Outlet />
}

export function ProtectedRoute() {
  const { configured, loading, session } = useAuth()
  const location = useLocation()
  if (!configured) return <ConfigGuard><></></ConfigGuard>
  if (loading) return <Loading />
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

export function RoleGuard({ allow }: { allow: string[] }) {
  const { roles } = useAuth()
  if (!allow.some((r) => roles.includes(r as never))) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <EmptyState title="Acesso restrito" description="Sua conta não possui a permissão necessária para esta área." />
      </div>
    )
  }
  return <Outlet />
}

export function SessionGuard() {
  const { loading } = useAuth()
  if (loading) return <Loading />
  return <Outlet />
}
