import { LoaderCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useCreateHabit, useDeleteHabit, useUpdateHabit } from '../hooks/queries'
import { ApiError } from '../lib/api'
import { DAY_LABELS, DAY_ORDER, TIMES_OF_DAY } from '../lib/schedule'
import type { Frequency, Habit, TimeOfDay } from '../lib/types'
import { Chip } from './Chip'
import { Field } from './Field'
import { Modal } from './Modal'

interface HabitDialogProps {
  open: boolean
  habit?: Habit // present = editing, missing = creating
  defaultDate: string
  onClose: () => void
}

export function HabitDialog({ open, habit, defaultDate, onClose }: HabitDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={habit ? 'Edit habit' : 'New habit'}
      description={habit ? 'Changes apply from now on. Your history is kept.' : 'Choose what to track and how often.'}
    >
      <HabitForm habit={habit} defaultDate={defaultDate} onClose={onClose} />
    </Modal>
  )
}

function HabitForm({ habit, defaultDate, onClose }: Omit<HabitDialogProps, 'open'>) {
  // For a small form, plain React state is enough
  const [title, setTitle] = useState(habit?.title ?? '')
  const [category, setCategory] = useState(habit && habit.category !== 'General' ? habit.category : '')
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(habit?.timeOfDay ?? 'anytime')
  const [frequency, setFrequency] = useState<Frequency>(habit?.frequency ?? 'daily')
  const [days, setDays] = useState<number[]>(habit?.days ?? [])
  const [startDate, setStartDate] = useState(defaultDate)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const create = useCreateHabit()
  const update = useUpdateHabit()
  const remove = useDeleteHabit()
  const busy = create.isPending || update.isPending || remove.isPending

  const toggleDay = (day: number) =>
    setDays((current) => (current.includes(day) ? current.filter((d) => d !== day) : [...current, day]))

  // Runs an action and shows a readable message if the server says no
  async function run(action: () => Promise<unknown>) {
    setError(null)
    try {
      await action()
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server. Check your connection and try again.')
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const name = title.trim()
    if (!name) return setError('Enter a habit name.')
    if (frequency === 'custom' && days.length === 0) return setError('Select at least one day.')

    const shared = {
      title: name,
      category: category.trim() || 'General',
      timeOfDay,
      frequency,
      ...(frequency === 'custom' && { days }),
    }

    void run(() => (habit ? update.mutateAsync({ id: habit.id, ...shared }) : create.mutateAsync({ ...shared, startDate })))
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col" noValidate>
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <Field
          label="Habit name"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Read for 20 minutes"
          maxLength={80}
          autoFocus
        />

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">Repeat</legend>
          <div className="flex flex-wrap gap-2">
            <Chip type="radio" name="frequency" checked={frequency === 'daily'} onChange={() => setFrequency('daily')}>
              Every day
            </Chip>
            <Chip type="radio" name="frequency" checked={frequency === 'custom'} onChange={() => setFrequency('custom')}>
              Specific days
            </Chip>
          </div>
          {frequency === 'custom' && (
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Days of the week">
              {DAY_ORDER.map((day) => (
                <Chip key={day} type="checkbox" checked={days.includes(day)} onChange={() => toggleDay(day)}>
                  {DAY_LABELS[day]}
                </Chip>
              ))}
            </div>
          )}
        </fieldset>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">Time of day</legend>
          <div className="flex flex-wrap gap-2">
            {TIMES_OF_DAY.map(({ value, label }) => (
              <Chip key={value} type="radio" name="timeOfDay" checked={timeOfDay === value} onChange={() => setTimeOfDay(value)}>
                {label}
              </Chip>
            ))}
          </div>
        </fieldset>

        <Field
          label="Group (optional)"
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. Health, Study, Home"
          maxLength={40}
        />

        {!habit && (
          <Field label="Start date" name="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        )}

        {error && (
          <p role="alert" className="notice">
            {error}
          </p>
        )}

        {habit && (
          <section className="space-y-3 border-t border-line pt-6">
            <h3 className="text-sm font-medium">Manage</h3>
            <p className="text-sm text-ink-soft">
              {habit.isArchived
                ? 'Restoring puts this habit back on Today.'
                : 'Archiving hides this habit from Today but keeps its history.'}
            </p>
            <button
              type="button"
              disabled={busy}
              className="btn btn-secondary"
              onClick={() => void run(() => update.mutateAsync({ id: habit.id, isArchived: !habit.isArchived }))}
            >
              {habit.isArchived ? 'Restore habit' : 'Archive habit'}
            </button>

            {confirmDelete ? (
              <div className="rounded-lg border border-danger/20 bg-danger-soft p-4">
                <p className="text-sm font-medium text-danger">Delete this habit and all of its history? This cannot be undone.</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" disabled={busy} className="btn btn-danger" onClick={() => void run(() => remove.mutateAsync(habit.id))}>
                    Delete habit
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>
                    Keep habit
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className="btn btn-quiet text-danger hover:text-danger" onClick={() => setConfirmDelete(true)}>
                Delete habit…
              </button>
            )}
          </section>
        )}
      </div>

      <div className="flex justify-end gap-3 border-t border-line px-6 py-4">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" disabled={busy} className="btn btn-primary">
          {(create.isPending || update.isPending) && <LoaderCircle className="size-4 animate-spin" />}
          {habit ? 'Save changes' : 'Create habit'}
        </button>
      </div>
    </form>
  )
}