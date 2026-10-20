import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, refreshSession, setAccessToken } from '../lib/api'
import type { Session, User } from '../lib/types'
import { AuthContext, type RegisterInput } from './useAuth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // On first load, try to restore the session from the refresh cookie
  useEffect(() => {
    refreshSession()
      .then((session) => setUser(session?.user ?? null))
      .finally(() => setLoading(false))
  }, [])

  const applySession = useCallback((session: Session) => {
    setAccessToken(session.accessToken)
    setUser(session.user)
  }, [])

  const updateUser = useCallback((next: User) => setUser(next), [])

  // Re-reads the logged-in user from the server (for example after verifying the email)
  const refreshUser = useCallback(async () => {
    const { user: fresh } = await api<{ user: User }>('/users/me')
    setUser(fresh)
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const session = await api<Session>('/auth/login', { method: 'POST', body: { email, password }, auth: false })
      applySession(session)
    },
    [applySession],
  )

  const register = useCallback(
    async (input: RegisterInput) => {
      // Send the browser's timezone so "today" is correct for this user
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const session = await api<Session>('/auth/register', {
        method: 'POST',
        body: { ...input, timezone },
        auth: false,
      })
      applySession(session)
    },
    [applySession],
  )

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST', auth: false }).catch(() => undefined)
    setAccessToken(null)
    setUser(null)
    queryClient.clear() // never keep one user's data around for the next login
  }, [queryClient])

  const value = useMemo(
    () => ({ user, loading, login, register, logout, updateUser, refreshUser, applySession }),
    [user, loading, login, register, logout, updateUser, refreshUser, applySession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}