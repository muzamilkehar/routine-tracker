import { ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ComparisonTable } from '../components/ComparisonTable'
import { Delta } from '../components/Change'
import { Heatmap, type DaySummary } from '../components/Heatmap'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { YearChart } from '../components/YearChart'
import { useAuth } from '../context/useAuth'
import { useAllHabits, useComparison, useLogRange, useYearlyStats } from '../hooks/queries'
import { useToday } from '../hooks/useToday'
import { eachDay, formatMonth, formatMonthName, formatMonthShort, monthOf, monthRange, shiftMonth } from '../lib/dates'
import { isScheduledOn } from '../lib/schedule'
import type { CompareAgainst } from '../lib/types'

const COMPARE_OPTIONS: { value: CompareAgainst; label: string }[] = [
  { value: 'previous-month', label: 'Previous month' },
  { value: 'previous-year', label: 'Same month last year' },
]

function Spinner({ label }: { label: string }) {
  return <LoaderCircle className="size-6 animate-spin text-ink-soft" aria-label={label} />
}

function Retry({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="notice">
      <p>{message}</p>
      <button type="button" className="mt-2 font-medium underline" onClick={onRetry}>
        Try again
      </button>
    </div>
  )
}

export default function ProgressPage() {
  const { user } = useAuth()
  const today = useToday(user?.timezone ?? 'UTC')
  const currentMonth = monthOf(today)

  // `picked` is a month you chose with the arrows. While it is null we follow the current month.
  const [picked, setPicked] = useState<string | null>(null)
  const month = picked ?? currentMonth
  const [against, setAgainst] = useState<CompareAgainst>('previous-month')
  const year = Number(month.slice(0, 4))
  const { start, end } = monthRange(month)

  const habits = useAllHabits()
  const logs = useLogRange(start, end)
  const comparison = useComparison(month, against)
  const thisYear = useYearlyStats(year)
  const lastYear = useYearlyStats(year - 1)

  // You cannot go back further than your oldest habit, or forward past this month
  const earliestMonth = useMemo(() => {
    const dates = (habits.data ?? []).map((h) => h.startDate)
    return dates.length > 0 ? monthOf([...dates].sort()[0]) : currentMonth
  }, [habits.data, currentMonth])
  const canGoBack = month > earliestMonth
  const canGoForward = month < currentMonth

  const goToMonth = (delta: number) => {
    const next = shiftMonth(month, delta)
    setPicked(next === currentMonth ? null : next)
  }

  // For each day of the month: how many habits were due, and how many you completed
  const summaries = useMemo(() => {
    const result = new Map<string, DaySummary>()
    if (!habits.data || !logs.data) return result

    const statusOf = new Map(logs.data.map((l) => [`${l.habit}|${l.date}`, l.status] as const))
    for (const date of eachDay(start, end)) {
      if (date > today) continue // the future has no data yet
      let scheduled = 0
      let done = 0
      for (const habit of habits.data) {
        if (!isScheduledOn(habit, date)) continue
        const status = statusOf.get(`${habit.id}|${date}`)
        if (status === 'skipped') continue // rest days do not count against you
        scheduled++
        if (status === 'done') done++
      }
      result.set(date, { scheduled, done })
    }
    return result
  }, [habits.data, logs.data, start, end, today])

  // "September" for the same year, "October 2025" otherwise
  const compared = comparison.data?.comparedWith
  const comparedLong = compared ? (compared.slice(0, 4) === month.slice(0, 4) ? formatMonthName(compared) : formatMonth(compared)) : ''
  const overall = comparison.data?.current.overall

  // Add each habit's done and skipped counts for the selected month to its comparison row
  const habitRows = useMemo(() => {
    if (!comparison.data) return []
    const counts = new Map(comparison.data.current.habits.map((h) => [h.habitId, h] as const))
    return comparison.data.habits.map((row) => ({
      ...row,
      done: counts.get(row.habitId)?.done ?? 0,
      missed: counts.get(row.habitId)?.missed ?? 0,
      skipped: counts.get(row.habitId)?.skipped ?? 0,
    }))
  }, [comparison.data])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Progress"
        description={formatMonth(month)}
        actions={
          <>
            {picked !== null && (
              <button type="button" className="btn btn-secondary" onClick={() => setPicked(null)}>
                This month
              </button>
            )}
            <div className="inline-flex items-center rounded-lg border border-line-strong/40 bg-surface">
              <button
                type="button"
                className="btn btn-quiet size-10 px-0"
                onClick={() => goToMonth(-1)}
                disabled={!canGoBack}
                aria-label="Previous month"
              >
                <ChevronLeft className="size-5" />
              </button>
              <span className="min-w-36 px-2 text-center text-sm font-medium">{formatMonth(month)}</span>
              <button
                type="button"
                className="btn btn-quiet size-10 px-0"
                onClick={() => goToMonth(1)}
                disabled={!canGoForward}
                aria-label="Next month"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-ink-soft">Compare with</span>
        <div role="radiogroup" aria-label="Compare with" className="inline-flex rounded-lg border border-line bg-surface p-1">
          {COMPARE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={against === value}
              onClick={() => setAgainst(value)}
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                against === value ? 'bg-accent-soft text-accent-strong' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {comparison.isPending ? (
        <Spinner label="Loading statistics" />
      ) : comparison.isError ? (
        <Retry message="We could not load your statistics." onRetry={() => void comparison.refetch()} />
      ) : overall ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Completion"
            value={overall.percentage !== null ? `${overall.percentage}%` : '–'}
            hint={<Delta value={comparison.data.overallChange} label={comparedLong} />}
          />
          <StatCard label="Check-ins done" value={String(overall.done)} hint={`of ${overall.scheduled} scheduled`} />
          <StatCard
            label="Missed"
            value={String(overall.missed)}
            hint={overall.skipped > 0 ? `${overall.skipped} skipped, not counted` : 'Scheduled but not done'}
          />
          <StatCard label="Active days" value={String(overall.activeDays)} hint="Days with at least one habit done" />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[24rem_minmax(0,1fr)]">
        <section className="card p-5">
          <h2 className="font-semibold">Daily completion</h2>
          <p className="mb-4 text-sm text-ink-soft">The darker the day, the more habits you finished.</p>
          {habits.isPending || logs.isPending ? (
            <Spinner label="Loading calendar" />
          ) : habits.isError || logs.isError ? (
            <Retry
              message="We could not load the calendar."
              onRetry={() => {
                void habits.refetch()
                void logs.refetch()
              }}
            />
          ) : (
            <Heatmap month={month} today={today} summaries={summaries} />
          )}
        </section>

        <section className="card min-w-0 p-5">
          <h2 className="font-semibold">
            {year} compared with {year - 1}
          </h2>
          <p className="mb-4 text-sm text-ink-soft">Completion for each month of the year.</p>
          {thisYear.isPending || lastYear.isPending ? (
            <Spinner label="Loading yearly chart" />
          ) : thisYear.isError || lastYear.isError ? (
            <Retry
              message="We could not load the yearly chart."
              onRetry={() => {
                void thisYear.refetch()
                void lastYear.refetch()
              }}
            />
          ) : (
            <YearChart year={year} current={thisYear.data} previous={lastYear.data} />
          )}
        </section>
      </div>

      <section className="card">
        <div className="border-b border-line px-4 py-4">
          <h2 className="font-semibold">Habit by habit</h2>
          <p className="text-sm text-ink-soft">
            {formatMonth(month)} compared with {comparedLong || 'the previous period'}.
          </p>
        </div>
        {comparison.data && comparison.data.habits.length > 0 ? (
          <ComparisonTable
            rows={habitRows}
            currentLabel={formatMonthShort(month)}
            previousLabel={compared ? formatMonthShort(compared) : 'Before'}
          />
        ) : (
          <p className="px-4 py-10 text-center text-ink-soft">
            {comparison.isPending ? 'Loading…' : 'No habits were scheduled in this period yet.'}
          </p>
        )}
      </section>
    </div>
  )
}