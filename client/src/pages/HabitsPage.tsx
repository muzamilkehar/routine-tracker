import { ChevronRight, ListChecks, LoaderCircle, Plus } from 'lucide-react'
import { useState } from 'react'
import { HabitDialog } from '../components/HabitDialog'
import { PageHeader } from '../components/PageHeader'
import { useAuth } from '../context/useAuth'
import { useAllHabits } from '../hooks/queries'
import { useToday } from '../hooks/useToday'
import { formatDate } from '../lib/dates' 
import { describeSchedule } from '../lib/schedule'
import type { Habit } from '../lib/types'

const ROW_GRID = 'grid grid-cols-[minmax(0,1fr)_1.25rem] items-center gap-x-4 px-4 md:grid-cols-[minmax(0,1fr)_13rem_8rem_1.25rem]'

function HabitTable({ habits, onEdit }: { habits: Habit[]; onEdit: (habit: Habit) => void }) {
  return (
    <section className="card">
      <div className={`${ROW_GRID} hidden border-b border-line py-2.5 text-xs font-medium text-ink-soft md:grid`}>
        <span>Habit</span>
        <span>Schedule</span>
        <span>Started</span>
        <span />
      </div>
      <ul className="divide-y divide-line">
        {habits.map((habit) => (
          <li key={habit.id}>
            <button
              type="button"
              onClick={() => onEdit(habit)}
              aria-label={`Edit ${habit.title}`}
              className={`${ROW_GRID} w-full py-3 text-left transition-colors hover:bg-canvas`}
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{habit.title}</span>
                <span className="block truncate text-sm text-ink-soft">
                  <span className="md:hidden">{describeSchedule(habit)}</span>
                  <span className="hidden md:inline">{habit.category}</span>
                </span>
              </span>
              <span className="hidden truncate text-sm text-ink-soft md:block">{describeSchedule(habit)}</span>
              <span className="hidden text-sm text-ink-soft tabular-nums md:block">{formatDate(habit.startDate)}</span>
              <ChevronRight className="size-5 text-ink-soft" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function HabitsPage() {
  const { user } = useAuth()
  const today = useToday(user?.timezone ?? 'UTC')
  const habits = useAllHabits()
  const [tab, setTab] = useState<'active' | 'archived'>('active')
  const [dialog, setDialog] = useState<{ open: boolean; habit?: Habit }>({ open: false })

  const active = (habits.data ?? []).filter((h) => !h.isArchived)
  const archived = (habits.data ?? []).filter((h) => h.isArchived)
  const shown = tab === 'active' ? active : archived

  const tabs = [
    { id: 'active' as const, label: 'Active', count: active.length },
    { id: 'archived' as const, label: 'Archived', count: archived.length },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Habits"
        description="Everything you track. Select a habit to edit, archive or delete it."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setDialog({ open: true })}>
            <Plus className="size-4" />
            Add habit
          </button>
        }
      />

      <div role="tablist" aria-label="Habit status" className="inline-flex rounded-lg border border-line bg-surface p-1">
        {tabs.map(({ id, label, count }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
              tab === id ? 'bg-accent-soft text-accent-strong' : 'text-ink-soft hover:text-ink'
            }`}
          >
            {label} <span className="tabular-nums opacity-70">{count}</span>
          </button>
        ))}
      </div>

      {habits.isPending ? (
        <LoaderCircle className="size-6 animate-spin text-ink-soft" aria-label="Loading habits" />
      ) : habits.isError ? (
        <div className="notice">
          <p>We could not load your habits.</p>
          <button type="button" className="mt-2 font-medium underline" onClick={() => void habits.refetch()}>
            Try again
          </button>
        </div>
      ) : shown.length > 0 ? (
        <HabitTable habits={shown} onEdit={(habit) => setDialog({ open: true, habit })} />
      ) : (
        <section className="card flex flex-col items-center px-6 py-14 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent-strong">
            <ListChecks className="size-6" />
          </span>
          <h2 className="mt-4 text-lg font-semibold">{tab === 'active' ? 'No active habits' : 'No archived habits'}</h2>
          <p className="mt-1 max-w-sm text-ink-soft">
            {tab === 'active'
              ? 'Create a habit and it will show up on Today.'
              : 'Archived habits keep their history but no longer show up on Today.'}
          </p>
        </section>
      )}

      <HabitDialog open={dialog.open} habit={dialog.habit} defaultDate={today} onClose={() => setDialog({ open: false })} />
    </div>
  )
}