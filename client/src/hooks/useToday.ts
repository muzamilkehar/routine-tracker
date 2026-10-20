import { useEffect, useState } from 'react'
import { todayInTimezone } from '../lib/dates'

// Today's date in the user's timezone. It updates by itself when midnight passes while the page
// stays open (checked every minute, and again whenever you come back to the tab), and straight
// away when the timezone setting changes.
export function useToday(timeZone: string) {
  const [state, setState] = useState(() => ({ timeZone, today: todayInTimezone(timeZone) }))

  // Timezone changed? Recompute during render (React's recommended way to adjust state when an input changes)
  let current = state
  if (state.timeZone !== timeZone) {
    current = { timeZone, today: todayInTimezone(timeZone) }
    setState(current)
  }

  useEffect(() => {
    const update = () => setState({ timeZone, today: todayInTimezone(timeZone) })
    const timer = window.setInterval(update, 60_000)
    document.addEventListener('visibilitychange', update)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', update)
    }
  }, [timeZone])

  return current.today
}