import { ChevronLeft, ChevronRight, ListChecks, LoaderCircle, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { HabitDialog } from '../components/HabitDialog'
import { HabitRow } from '../components/HabitRow'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { useAuth } from '../context/useAuth'
import { useBulkSetLog, useHabits, useLogs, useMonthlyStats, useSetLog, useStreaks } from '../hooks/queries'
import { useToday } from '../hooks/useToday'
import { MAX_EDIT_DAYS, addDays, dayLabel, diffInDays, formatLong } from '../lib/dates'
import { isScheduledOn } from '../lib/schedule'
import type { Habit, LogStatus } from '../lib/types'
import { HABIT_GRID } from '../lib/ui'
import { BulkActions } from '../components/BulkActions'



export function TodayPage() {
  const { user } = useAuth()
const today = useToday(user?.timezone ?? 'UTC')
  // `picked` is a day you chose with the arrows. While it is null we simply follow today,
  // so the page moves on by itself after midnight.
  const [picked, setPicked] = useState<string | null>(null)
  const date = picked ?? today
  const setDate = (day: string) => setPicked(day === today ? null : day)
  const [dialog, setDialog] = useState<{ open: boolean; habit?: Habit }>({ open: false })

  const habits = useHabits()
  const logs = useLogs(date)
  const streaks = useStreaks()
  const monthly = useMonthlyStats()
  const setLog = useSetLog(date)
  const bulkSet = useBulkSetLog(date)

  // Only the habits that are meant to happen on the chosen day
  const scheduled = useMemo(() => (habits.data ?? []).filter((h) => isScheduledOn(h, date)), [habits.data, date])
  const statusByHabit = useMemo(() => new Map((logs.data ?? []).map((l) => [l.habit, l.status] as const)), [logs.data])
  const streakByHabit = useMemo(() => new Map((streaks.data ?? []).map((s) => [s.habitId, s.current] as const)), [streaks.data])

  const doneCount = scheduled.filter((h) => statusByHabit.get(h.id) === 'done').length
  const remaining = scheduled.length - doneCount
  const isToday = date === today
  const daysAgo = diffInDays(today, date)
  const editable = daysAgo >= 0 && daysAgo <= MAX_EDIT_DAYS
  
  // Quick selection for the whole day. Clearing only touches habits that actually have a status.
  const applyToAll = (status: LogStatus | null) => {
    const habitIds = scheduled.filter((h) => status !== null || statusByHabit.has(h.id)).map((h) => h.id)
    if (habitIds.length > 0) bulkSet.mutate({ habitIds, status })
  }

  // The three headline numbers
  const best = (streaks.data ?? []).reduce<{ title: string; current: number } | null>(
    (top, s) => (s.current > (top?.current ?? 0) ? { title: s.title, current: s.current } : top),
    null,
  )
  const month = monthly.data?.overall

  return (
    <div className="space-y-6">
      <BulkActions disabled={!editable || scheduled.length === 0} pending={bulkSet.isPending} onApply={applyToAll} />
      <PageHeader
        title={isToday ? 'Today' : dayLabel(date, today)}
        description={formatLong(date)}
        actions={
          <>
            {!isToday && (
              <button type="button" className="btn btn-secondary" onClick={() => setDate(today)}>
                Back to today
              </button>
            )}
            <div className="inline-flex items-center rounded-lg border border-line-strong/40 bg-surface">
              <button
                type="button"
                className="btn btn-quiet size-10 px-0"
                onClick={() => setDate(addDays(date, -1))}
                disabled={daysAgo >= MAX_EDIT_DAYS}
                aria-label="Previous day"
              >
                <ChevronLeft className="size-5" />
              </button>
              <span className="min-w-24 px-2 text-center text-sm font-medium">{dayLabel(date, today)}</span>
              <button
                type="button"
                className="btn btn-quiet size-10 px-0"
                onClick={() => setDate(addDays(date, 1))}
                disabled={isToday}
                aria-label="Next day"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
            <button type="button" className="btn btn-primary" onClick={() => setDialog({ open: true })}>
              <Plus className="size-4" />
              Add habit
            </button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={isToday ? 'Completed today' : 'Completed on this day'}
          value={scheduled.length > 0 ? `${doneCount} / ${scheduled.length}` : '–'}
          progress={scheduled.length > 0 ? (doneCount / scheduled.length) * 100 : undefined}
          hint={scheduled.length === 0 ? 'Nothing scheduled' : remaining === 0 ? 'All done' : `${remaining} left`}
        />
        <StatCard
          label="Best current streak"
          value={best ? `${best.current} ${best.current === 1 ? 'day' : 'days'}` : '0 days'}
          hint={best ? best.title : 'Complete a habit to start a streak'}
        />
        <StatCard
          label="This month"
          value={month?.percentage != null ? `${month.percentage}%` : '–'}
          hint={month && month.scheduled > 0 ? `${month.done} of ${month.scheduled} check-ins done` : 'No check-ins yet'}
        />
      </div>

      {!isToday && (
        <p className="rounded-lg border border-line bg-surface px-4 py-3 text-sm text-ink-soft">
          {editable
            ? 'You are viewing a past day. Changes are saved to that day.'
            : `This day is more than ${MAX_EDIT_DAYS} days ago, so it is view only.`}
        </p>
      )}

      {setLog.isError && (
        <p role="alert" className="notice">
          Could not save that change: {setLog.error?.message}
        </p>
      )}

      {bulkSet.isError && (
        <p role="alert" className="notice">
          Could not update every habit: {bulkSet.error?.message}
        </p>
      )}

      {habits.isPending ? (
        <LoaderCircle className="size-6 animate-spin text-ink-soft" aria-label="Loading habits" />
      ) : habits.isError ? (
        <div className="notice">
          <p>We could not load your habits.</p>
          <button type="button" className="mt-2 font-medium underline" onClick={() => void habits.refetch()}>
            Try again
          </button>
        </div>
      ) : (habits.data ?? []).length === 0 ? (
        <section className="card flex flex-col items-center px-6 py-14 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent-strong">
            <ListChecks className="size-6" />
          </span>
          <h2 className="mt-4 text-lg font-semibold">No habits yet</h2>
          <p className="mt-1 max-w-sm text-ink-soft">Create your first habit to start tracking your day.</p>
          <button type="button" className="btn btn-primary mt-5" onClick={() => setDialog({ open: true })}>
            <Plus className="size-4" />
            Add habit
          </button>
        </section>
      ) : scheduled.length === 0 ? (
        <p className="card px-6 py-10 text-center text-ink-soft">Nothing is scheduled for this day.</p>
      ) : (
        <section className="card">
          <div className={`${HABIT_GRID} hidden border-b border-line py-2.5 text-xs font-medium text-ink-soft md:grid`}>
            <span />
            <span>Habit</span>
            <span>Schedule</span>
            <span>Streak</span>
            <span>Status</span>
            <span />
          </div>
          <ul className="divide-y divide-line">
            {scheduled.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                status={statusByHabit.get(habit.id)}
                streak={streakByHabit.get(habit.id) ?? 0}
                editable={editable}
                onSet={(status) => setLog.mutate({ habitId: habit.id, status })}
                onEdit={() => setDialog({ open: true, habit })}
              />
            ))}
          </ul>
        </section>
      )}

      <HabitDialog open={dialog.open} habit={dialog.habit} defaultDate={today} onClose={() => setDialog({ open: false })} />
    </div>
  )
}