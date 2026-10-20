import { Check, Flame, Minus, X } from 'lucide-react'
import { describeSchedule } from '../lib/schedule'
import type { Habit, LogStatus } from '../lib/types'
import { HABIT_GRID } from '../lib/ui'
import { RowMenu, type MenuItem } from './RowMenu'

interface HabitRowProps {
  habit: Habit
  status?: LogStatus
  streak: number
  editable: boolean
  onSet: (status: LogStatus | null) => void
  onEdit: () => void
}

const PILL: Record<LogStatus, { label: string; style: string }> = {
  done: { label: 'Done', style: 'bg-accent-soft text-accent-strong' },
  missed: { label: 'Missed', style: 'bg-danger-soft text-danger' },
  skipped: { label: 'Skipped', style: 'bg-warn-soft text-warn' },
}

function StatusPill({ status }: { status?: LogStatus }) {
  if (!status) return <span className="text-sm text-ink-soft">Pending</span>
  const { label, style } = PILL[status]
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>{label}</span>
}

export function HabitRow({ habit, status, streak, editable, onSet, onEdit }: HabitRowProps) {
  const toggle = () => onSet(status === 'done' ? null : 'done')

  // Each state looks different, so you can read the list at a glance
  const box =
    status === 'done'
      ? 'border-accent bg-accent text-white'
      : status === 'missed'
        ? 'border-danger bg-danger-soft text-danger'
        : status === 'skipped'
          ? 'border-warn bg-warn-soft text-warn'
          : 'border-line-strong bg-surface hover:border-accent'

  const items: MenuItem[] = []
  if (editable && status !== 'missed') items.push({ label: 'Mark as missed', onSelect: () => onSet('missed') })
  if (editable && status !== 'skipped') items.push({ label: 'Skip this day', onSelect: () => onSet('skipped') })
  if (editable && status) items.push({ label: 'Clear status', onSelect: () => onSet(null) })
  items.push({ label: 'Edit habit', onSelect: onEdit })

  const action = status === 'done' ? 'Mark as not done' : 'Mark as done'

  return (
    <li className={`${HABIT_GRID} py-3`}>
      {/* The before: pseudo-element makes the tap area bigger than the 24px box */}
      <button
        type="button"
        onClick={toggle}
        disabled={!editable}
        aria-pressed={status === 'done'}
        aria-label={`${action}: ${habit.title}`}
        className={`relative grid size-6 place-items-center rounded-md border-2 transition-colors before:absolute before:-inset-2.5 before:content-[''] disabled:cursor-not-allowed ${box}`}
      >
        {status === 'done' && <Check className="size-4" strokeWidth={3} />}
        {status === 'missed' && <X className="size-4" strokeWidth={3} />}
        {status === 'skipped' && <Minus className="size-4" strokeWidth={3} />}
      </button>

      <div className="min-w-0">
        <p className="truncate font-medium">{habit.title}</p>
        <p className="truncate text-sm text-ink-soft">
          <span className="md:hidden">{status ? PILL[status].label : describeSchedule(habit)}</span>
          <span className="hidden md:inline">{habit.category}</span>
        </p>
      </div>

      <p className="hidden truncate text-sm text-ink-soft md:block">{describeSchedule(habit)}</p>

      <div className="flex items-center gap-1 text-sm tabular-nums">
        {streak > 0 ? (
          <>
            <Flame className="size-4 text-warn" aria-hidden />
            <span className="font-medium">{streak}</span>
            <span className="sr-only"> day streak</span>
          </>
        ) : (
          <span className="hidden text-ink-soft md:inline" aria-label="No streak yet">
            –
          </span>
        )}
      </div>

      <div className="hidden md:block">
        <StatusPill status={status} />
      </div>

      <RowMenu label={`More options for ${habit.title}`} items={items} />
    </li>
  )
}