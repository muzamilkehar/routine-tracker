import type { AdminStats } from '../../lib/types'

// The habits people create most often, as a ranked list with bars
export function TopHabits({ habits }: { habits: AdminStats['topHabits'] }) {
  if (habits.length === 0) {
    return <p className="px-5 py-10 text-center text-ink-soft">No habits have been created yet.</p>
  }

  const max = Math.max(...habits.map((h) => h.count))

  return (
    <ol className="divide-y divide-line">
      {habits.map((habit, index) => (
        <li key={habit.title} className="grid grid-cols-[1.5rem_minmax(0,1fr)_3rem] items-center gap-x-4 px-5 py-3 md:grid-cols-[1.5rem_minmax(0,1fr)_14rem_3rem]">
          <span className="text-sm text-ink-soft tabular-nums">{index + 1}</span>
          <span className="truncate font-medium capitalize">{habit.title}</span>
          <div className="hidden h-2 overflow-hidden rounded-full bg-line md:block" aria-hidden>
            <div className="h-full rounded-full bg-accent" style={{ width: `${(habit.count / max) * 100}%` }} />
          </div>
          <span className="text-right text-sm font-medium tabular-nums">{habit.count}</span>
        </li>
      ))}
    </ol>
  )
}