import { LoaderCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useAuth } from '../../context/useAuth'
import { ApiError, api } from '../../lib/api'
import { Field } from '../Field'
import { SettingsSection } from './SettingsSection'

export function DeleteAccount() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (user?.role === 'admin' && !user.isSeed) {
    return (
      <SettingsSection danger title="Delete account" description="Permanently remove your account and everything in it.">
        <p className="text-sm text-ink-soft">Administrator accounts cannot be deleted from here.</p>
      </SettingsSection>
    )
  }

  async function handleDelete(e: FormEvent) {
    e.preventDefault()
    if (!password) return setError('Enter your password to confirm.')

    setPending(true)
    setError(null)
    try {
      await api('/users/me', { method: 'DELETE', body: { password } })
      await logout() // clears the session on this device; the app then returns to the login page
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server. Check your connection and try again.')
      setPending(false)
    }
  }

  return (
    <SettingsSection danger title="Delete account" description="Permanently remove your account and everything in it.">
      {!open ? (
        <button type="button" className="btn btn-secondary text-danger" onClick={() => setOpen(true)}>
          Delete account…
        </button>
      ) : (
        <form onSubmit={handleDelete} className="space-y-4" noValidate>
          <p className="rounded-lg border border-danger/20 bg-danger-soft p-4 text-sm text-danger">
            This deletes your profile, all of your habits and every check-in. It cannot be undone. You may want to download your
            data first.
          </p>
          <Field
            label="Enter your password to confirm"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <p role="alert" className="notice">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className="btn btn-danger">
              {pending && <LoaderCircle className="size-4 animate-spin" />}
              Permanently delete my account
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={pending}
              onClick={() => {
                setOpen(false)
                setPassword('')
                setError(null)
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </SettingsSection>
  )
}