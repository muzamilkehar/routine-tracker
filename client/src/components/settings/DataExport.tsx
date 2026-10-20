import { Download, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/useAuth'
import { ApiError, api } from '../../lib/api'
import { todayInTimezone } from '../../lib/dates'
import { SettingsSection } from './SettingsSection'

export function DataExport() {
  const { user } = useAuth()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function download() {
    setPending(true)
    setError(null)
    try {
      const data = await api<unknown>('/users/me/export')

      // Turn the data into a file in memory, then "click" a temporary link to save it
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `routine-tracker-data-${todayInTimezone(user?.timezone ?? 'UTC')}.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server. Check your connection and try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <SettingsSection title="Your data" description="Download a copy of your account details, habits and every check-in.">
      {error && (
        <p role="alert" className="notice mb-4">
          {error}
        </p>
      )}
      <button type="button" className="btn btn-secondary" onClick={() => void download()} disabled={pending}>
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Download className="size-4" />}
        Download my data
      </button>
      <p className="mt-2 text-sm text-ink-soft">You get one JSON file that you can open in any text editor.</p>
    </SettingsSection>
  )
}