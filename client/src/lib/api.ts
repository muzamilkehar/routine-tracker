import type { Session } from './types'

// Empty VITE_API_URL (development) falls back to '/api/v1', which the Vite proxy forwards to the backend
const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

export interface FieldIssue {
  field: string
  message: string
}

// Same idea as the backend ApiError: an Error that also knows the HTTP status
export class ApiError extends Error {
  status: number
  details?: FieldIssue[]

  constructor(status: number, message: string, details?: FieldIssue[]) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

// The access token lives only in memory (a variable). It is gone on page reload,
// and the httpOnly refresh cookie quietly gets a new one. This is safer than localStorage.
let accessToken: string | null = null
export const setAccessToken = (token: string | null) => {
  accessToken = token
}

let refreshing: Promise<Session | null> | null = null

// Asks the backend for a new access token using the refresh cookie.
// Refresh tokens are single-use, so simultaneous callers must share ONE request.
export function refreshSession(): Promise<Session | null> {
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
      if (!res.ok) {
        accessToken = null
        return null
      }
      const session = (await res.json()) as Session
      accessToken = session.accessToken
      return session
    } catch {
      accessToken = null
      return null
    }
  })().finally(() => {
    refreshing = null
  })
  return refreshing
}

interface RequestOptions {
  method?: string
  body?: unknown
  auth?: boolean // false for login/register (no token needed, and no refresh retry)
}

// One function every API call goes through
export async function api<T>(path: string, options: RequestOptions = {}, retried = false): Promise<T> {
  const { method = 'GET', body, auth = true } = options

  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`

  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      credentials: 'include', // send/receive the refresh cookie
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your internet connection.')
  }

  // Access token expired? Refresh once and retry the same request.
  if (res.status === 401 && auth && !retried) {
    const session = await refreshSession()
    if (session) return api<T>(path, options, true)
  }

  if (res.status === 204) return undefined as T

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    // A failure with no JSON body usually means the backend is not running (the dev proxy answers instead)
    const fallback =
      data === null && res.status >= 500
        ? 'The server is not responding. Make sure the backend is running.'
        : 'Something went wrong'
    throw new ApiError(res.status, data?.message ?? fallback, data?.details)
  }

  return data as T
}