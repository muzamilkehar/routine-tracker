import { CalendarCheck, ChartColumn, Check, ListChecks, LogOut, Settings, ShieldCheck } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { VerifyEmailBanner } from './VerifyEmailBanner'
import { useAuth } from '../context/useAuth'
import { APP_NAME } from '../lib/brand'

const links = [
  { to: '/', label: 'Today', icon: CalendarCheck, end: true },
  { to: '/habits', label: 'Habits', icon: ListChecks, end: false },
  { to: '/progress', label: 'Progress', icon: ChartColumn, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
]

const adminLink = { to: '/admin', label: 'Admin', icon: ShieldCheck, end: false }

function Logo() {
  return (
    <span className="grid size-8 place-items-center rounded-lg bg-accent text-white">
      <Check className="size-5" strokeWidth={3} />
    </span>
  )
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

// The app shell. Large screens: a sidebar on the left. Phones: a slim top bar and a tab bar at the bottom.
export function Layout() {
  const { user, logout } = useAuth()
  const navLinks = user?.role === 'admin' ? [...links, adminLink] : links

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="hidden border-r border-line bg-surface lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <Logo />
          <span className="text-base font-semibold tracking-tight">{APP_NAME}</span>
        </div>

        <nav className="flex-1 space-y-1 px-3" aria-label="Main">
          {navLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-accent-soft text-accent-strong' : 'text-ink-soft hover:bg-canvas hover:text-ink'
                }`
              }
            >
              <Icon className="size-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3 border-t border-line p-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent-strong">
            {initials(user?.name ?? '')}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-ink-soft">{user?.email}</p>
          </div>
          <button onClick={logout} className="btn btn-quiet size-9 px-0" aria-label="Log out">
            <LogOut className="size-[18px]" />
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-line bg-surface px-4 lg:hidden">
          <div className="flex items-center gap-2.5">
            <Logo />
            <span className="font-semibold tracking-tight">{APP_NAME}</span>
          </div>
          <button onClick={logout} className="btn btn-quiet size-9 px-0" aria-label="Log out">
            <LogOut className="size-[18px]" />
          </button>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 sm:px-8 sm:pt-10 lg:pb-12">
          <VerifyEmailBanner />
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-10 grid auto-cols-fr grid-flow-col border-t border-line bg-surface lg:hidden" aria-label="Main">
        {navLinks.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2.5 text-xs font-medium ${isActive ? 'text-accent-strong' : 'text-ink-soft'}`
            }
          >
            <Icon className="size-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}