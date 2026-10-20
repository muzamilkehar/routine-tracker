import { LoaderCircle } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { useResendVerification } from '../hooks/useResendVerification'

// A gentle reminder at the top of the app until the email address is confirmed.
// It never blocks anything: the app works fine, we just keep asking nicely.
export function VerifyEmailBanner() {
  const { user } = useAuth()
  const resend = useResendVerification()

  if (!user || user.isEmailVerified) return null

  return (
    <div role="status" className="mb-6 flex flex-col gap-3 rounded-lg border border-warn/20 bg-warn-soft px-4 py-3 text-sm text-warn sm:flex-row sm:items-center sm:justify-between">
      <p>
        {resend.isSuccess && resend.wait > 0
          ? 'Email sent. Check your inbox, and your spam folder too.'
          : resend.isError
            ? resend.error.message
            : <>Please confirm your email address. We sent a link to <strong>{user.email}</strong>.</>}
      </p>
      <button
        type="button"
        className="btn btn-secondary h-9 shrink-0 bg-surface"
        disabled={resend.isPending || resend.wait > 0}
        onClick={() => resend.mutate()}
      >
        {resend.isPending && <LoaderCircle className="size-4 animate-spin" />}
        {resend.wait > 0 ? `Resend in ${resend.wait}s` : 'Resend email'}
      </button>
    </div>
  )
}