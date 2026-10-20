// Dates are plain "YYYY-MM-DD" strings, the same format the backend uses.
// Months are "YYYY-MM" strings.
const DAY_MS = 86_400_000

// How many days back a user may still change a check-in (the backend enforces the same limit)
export const MAX_EDIT_DAYS = 31

const toUTC = (date: string) => new Date(`${date}T00:00:00Z`)
const pad = (n: number) => String(n).padStart(2, '0')

export function todayInTimezone(timeZone: string): string {
  try {
    // The en-CA locale formats dates as YYYY-MM-DD
    return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  } catch {
    return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  }
}

export const addDays = (date: string, n: number) => new Date(toUTC(date).getTime() + n * DAY_MS).toISOString().slice(0, 10)

export const diffInDays = (a: string, b: string) => Math.round((toUTC(a).getTime() - toUTC(b).getTime()) / DAY_MS)

export const weekdayOf = (date: string) => toUTC(date).getUTCDay() // 0 = Sunday

// Position of a date in a Monday-first week: Monday = 0 ... Sunday = 6
export const mondayIndex = (date: string) => (weekdayOf(date) + 6) % 7

export function eachDay(start: string, end: string) {
  const days: string[] = []
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d)
  return days
}

// ---- Months ----
export const monthOf = (date: string) => date.slice(0, 7)

export function shiftMonth(month: string, delta: number) {
  const [year, m] = month.split('-').map(Number)
  const d = new Date(Date.UTC(year, m - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`
}

export function monthRange(month: string) {
  const [year, m] = month.split('-').map(Number)
  const lastDay = new Date(Date.UTC(year, m, 0)).getUTCDate()
  return { start: `${month}-01`, end: `${month}-${pad(lastDay)}` }
}

// ---- Formatting ----
export const formatLong = (date: string) =>
  new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(toUTC(date))

const formatShort = (date: string) =>
  new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(toUTC(date))

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(toUTC(date))

export const formatDayMonth = (date: string) =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(toUTC(date))

export const formatMonth = (month: string) =>
  new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(toUTC(`${month}-01`))

export const formatMonthShort = (month: string) =>
  new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(toUTC(`${month}-01`))

export const formatMonthName = (month: string) =>
  new Intl.DateTimeFormat('en-GB', { month: 'long', timeZone: 'UTC' }).format(toUTC(`${month}-01`))

export function dayLabel(date: string, today: string) {
  if (date === today) return 'Today'
  if (date === addDays(today, -1)) return 'Yesterday'
  return formatShort(date)
}

export const formatTimestamp = (iso: string) => 
  new Intl.DateTimeFormat('en-GB', {day: 'numeric', month: 'short', year: 'numeric'}).format(new Date(iso))