import { LoaderCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { AuthCard } from '../components/AuthCard'
import { useAuth } from '../context/useAuth'
import { useResendVerification } from '../hooks/useResendVerification'
import { ApiError, api } from '../lib/api'

type State = { status: 'verifying' } | { status: 'success' } | { status: 'error'; message: string }

// Opened from the link in the verification email: /verify-email?token=...
export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const { user, loading, refreshUser } = useAuth()
  const resend = useResendVerification()
  const [state, setState] = useState<State>(
    token ? { status: 'verifying' } : { status: 'error', message: 'This link is incomplete. Please open the full link from your email.' },
  )

  // A token works only once. In development React runs effects twice, so without this guard the
  // second request would fail and a good link would look broken.
  const started = useRef(false)

  useEffect(() => {
    if (!token || loading || started.current) return // wait until we know whether someone is logged in
    started.current = true

    api('/auth/verify-email', { method: 'POST', body: { token }, auth: false })
      .then(async () => {
        if (user) await refreshUser().catch(() => undefined) // so the reminder banner disappears
        setState({ status: 'success' })
      })
      .catch((err: unknown) =>
        setState({ status: 'error', message: err instanceof ApiError ? err.message : 'Could not reach the server' }),
      )
  }, [token, loading, user, refreshUser])

  // Already confirmed (for example the link was opened twice): that is good news, not an error
  if (state.status === 'success' || (state.status === 'error' && user?.isEmailVerified)) {
    return (
      <AuthCard title="Email verified" subtitle="Thanks, your email address is confirmed">
        <Link to="/" className="btn btn-primary w-full">
          Continue
        </Link>
      </AuthCard>
    )
  }

  if (state.status === 'error') {
    return (
      <AuthCard title="This link will not work" subtitle={`${state.message}. It may have expired or already been used.`}>
        {user ? (
          <>
            <button type="button" className="btn btn-primary w-full" disabled={resend.isPending || resend.wait > 0} onClick={() => resend.mutate()}>
              {resend.isPending && <LoaderCircle className="size-4 animate-spin" />}
              {resend.wait > 0 ? `Email sent. Resend in ${resend.wait}s` : 'Send me a new link'}
            </button>
            {resend.isError && (
              <p role="alert" className="notice mt-4">
                {resend.error.message}
              </p>
            )}
          </>
        ) : (
          <Link to="/login" className="btn btn-primary w-full">
            Log in to get a new link
          </Link>
        )}
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Verifying your email" subtitle="One moment, please">
      <LoaderCircle className="size-6 animate-spin text-ink-soft" aria-label="Verifying" />
    </AuthCard>
  )
}