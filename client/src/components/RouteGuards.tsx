import { LoaderCircle } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../context/useAuth'

function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoaderCircle className="size-8 animate-spin text-ink" aria-label="Loading" />
    </div>
  )
}

// Wrap pages that need a login. Pass role="admin" for admin-only pages.
export function RequireAuth({ role }: { role?: 'admin' }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullPageSpinner />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return <Outlet />
}

// Login/register pages: logged-in users are sent to the dashboard instead
export function GuestOnly() {
  const { user, loading } = useAuth()

  if (loading) return <FullPageSpinner />
  if (user) return <Navigate to="/" replace />
  return <Outlet />
}