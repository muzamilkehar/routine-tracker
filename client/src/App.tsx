import { LoaderCircle } from 'lucide-react'
import { Suspense, lazy } from 'react'
import { Link, Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import { GuestOnly, RequireAuth } from './components/RouteGuards'
import { HabitsPage } from './pages/HabitsPage'
import { LoginPage } from './pages/LoginPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { RegisterPage } from './pages/RegisterPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { SettingsPage } from './pages/SettingsPage'
import { TodayPage } from './pages/TodayPage'
import { VerifyEmailPage } from './pages/VerifyEmailPage'

// The Progress page (with the chart library) is only downloaded when someone opens it
const ProgressPage = lazy(() => import('./pages/ProgressPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))

function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-ink-soft">The page you are looking for does not exist.</p>
      <Link to="/" className="btn btn-primary">
        Go to Today
      </Link>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Only for visitors who are NOT logged in */}
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Opened from emails, so they work whether or not you are logged in */}
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Only for logged-in users, wrapped in the navigation layout */}
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route index element={<TodayPage />} />
          <Route path="habits" element={<HabitsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route
            path="progress"
            element={
              <Suspense fallback={<LoaderCircle className="size-6 animate-spin text-ink-soft" aria-label="Loading" />}>
                <ProgressPage />
              </Suspense>
            }
          />
          <Route element={<RequireAuth role="admin" />}>
            <Route
              path="admin"
              element={
                <Suspense fallback={<LoaderCircle className="size-6 animate-spin text-ink-soft" aria-label="Loading" />}>
                  <AdminPage />
                </Suspense>
              }
            />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}