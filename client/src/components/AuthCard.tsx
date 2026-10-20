import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { APP_NAME } from '../lib/brand'

const YEAR = new Date().getFullYear()

const POINTS = [
  'Check off your habits in seconds',
  'See your completion rate for every month',
  'Compare each habit with previous months',
]

function Logo() {
  return (
    <span className="grid size-9 place-items-center rounded-lg bg-accent text-white">
      <Check className="size-5" strokeWidth={3} />
    </span>
  )
}

// Shared frame for the login and register pages: a brand panel on the left (large screens) and the form on the right
export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="hidden flex-col justify-between bg-panel p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
        </div>

        <div className="max-w-md">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">Build routines that last.</h2>
          <p className="mt-4 text-lg text-panel-soft">Track what you do every day and see how you are doing, month after month.</p>
          <ul className="mt-8 space-y-4">
            {POINTS.map((point) => (
              <li key={point} className="flex items-center gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/10">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-panel-soft">
          © {YEAR} {APP_NAME}
        </p>
      </aside>

      <div className="flex min-h-screen items-center justify-center px-6 py-12 lg:min-h-0">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <Logo />
            <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-ink-soft">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  )
}