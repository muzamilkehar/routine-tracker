import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const COOLDOWN_SECONDS = 30

// Asks the server for a fresh verification email. After a send the button is locked for a short
// time, so nobody can fire off a pile of emails by double-clicking.
export function useResendVerification() {
  const [wait, setWait] = useState(0)

  const mutation = useMutation({
    mutationFn: () => api<{ message: string }>('/auth/resend-verification', { method: 'POST' }),
    onSuccess: () => setWait(COOLDOWN_SECONDS),
  })

  // Count the cooldown down one second at a time
  useEffect(() => {
    if (wait <= 0) return
    const timer = setTimeout(() => setWait((seconds) => seconds - 1), 1000)
    return () => clearTimeout(timer)
  }, [wait])

  return { ...mutation, wait }
}