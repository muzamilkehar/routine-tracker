import type { ComparisonHabit } from '../lib/types'
import { Change } from './Change'

interface ComparisonTableProps {
  rows: ComparisonHabit[]
  currentLabel: string
  previousLabel: string
}

const GRID =
  'grid grid-cols-[minmax(0,1fr)_5rem_9rem] items-center gap-x-4 px-4 md:grid-cols-[minmax(0,1fr)_10rem_10rem_4.5rem_4.5rem_4.5rem_8rem]'

function PercentBar({ value, muted = false }: { value: number | null; muted?: boolean }) {
  if (value === null) return <span className="text-sm text-ink-soft">–</span>
  return (
    <div className="flex items-center gap-3">
      <div className="hidden h-2 w-20 overflow-hidden rounded-full bg-line md:block" aria-hidden>
        <div className={`h-full rounded-full ${muted ? 'bg-line-strong' : 'bg-accent'}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-sm font-medium tabular-nums">{value}%</span>
    </div>
  )
}

// Every habit, this period against the one before it
export function ComparisonTable({ rows, currentLabel, previousLabel }: ComparisonTableProps) {
  const sorted = [...rows].sort((a, b) => (b.current ?? -1) - (a.current ?? -1))

  return (
    <div>
      <div className={`${GRID} border-b border-line py-2.5 text-xs font-medium text-ink-soft`}>
        <span>Habit</span>
        <span>{currentLabel}</span>
        <span className="hidden md:block">{previousLabel}</span>
        <span className="hidden md:block">Done</span>
        <span className="hidden md:block">Missed</span>
        <span className="hidden md:block">Skipped</span>
        <span>Change</span>
      </div>
      <ul className="divide-y divide-line">
        {sorted.map((row) => (
          <li key={row.habitId} className={`${GRID} py-3`}>
            <span className="min-w-0">
              <span className="block truncate font-medium">{row.title}</span>
              {/* On phones the three counts sit under the name, on wide screens they get their own columns */}
              <span className="block text-xs text-ink-soft md:hidden">
                {row.done} done · {row.missed} missed · {row.skipped} skipped
              </span>
            </span>
            <PercentBar value={row.current} />
            <div className="hidden md:block">
              <PercentBar value={row.previous} muted />
            </div>
            <span className="hidden text-sm font-medium tabular-nums md:block">{row.done}</span>
            <span className="hidden text-sm font-medium tabular-nums md:block">{row.missed}</span>
            <span className="hidden text-sm font-medium tabular-nums md:block">{row.skipped}</span>
            <Change value={row.change} />
          </li>
        ))}
      </ul>
    </div>
  )
}