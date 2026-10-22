import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { APP_NAME } from '../lib/brand'

const TITLES: Record<string, string> = {
  '/': 'Today',
  '/habits': 'Habits',
  '/progress': 'Progress',
  '/settings': 'Settings',
  '/admin': 'Admin',
  '/login': 'Log in',
  '/register': 'Create account',
  '/forgot-password': 'Forgot password',
  '/reset-password': 'Reset password',
  '/verify-email': 'Verify email',
}

// Keeps the browser tab title in step with the page, for example "Habits · Routine Tracker"
export function useDocumentTitle() {
  const { pathname } = useLocation()

  useEffect(() => {
    const page = TITLES[pathname]
    document.title = page ? `${page} · ${APP_NAME}` : APP_NAME
  }, [pathname])
}