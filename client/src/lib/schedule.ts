import { weekdayOf } from './dates'
import type { Habit, TimeOfDay } from './types'

// Weeks start on Monday in the UI; the backend uses 0 = Sunday
export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]
export const DAY_LABELS: Record<number, string> = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' }

export const TIMES_OF_DAY: { value: TimeOfDay; label: string }[] = [
  { value: 'anytime', label: 'Anytime' },
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
  { value: 'night', label: 'Night' },
]

const TIME_PHRASE: Record<TimeOfDay, string> = {
  anytime: '',
  morning: 'in the morning',
  afternoon: 'in the afternoon',
  evening: 'in the evening',
  night: 'at night',
}

const listFormat = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' })

// Should this habit appear on this date?
export function isScheduledOn(habit: Habit, date: string) {
  if (date < habit.startDate) return false
  if (habit.endDate && date > habit.endDate) return false
  return habit.frequency === 'daily' || habit.days.includes(weekdayOf(date))
}

// "Every day, in the morning" / "Mon, Wed, and Fri"
export function describeSchedule(habit: Habit) {
  const when =
    habit.frequency === 'daily'
      ? 'Every day'
      : listFormat.format(DAY_ORDER.filter((d) => habit.days.includes(d)).map((d) => DAY_LABELS[d]))
  const time = TIME_PHRASE[habit.timeOfDay]
  return time ? `${when}, ${time}` : when
}