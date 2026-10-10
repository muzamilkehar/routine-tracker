// All dates in this app are plain "YYYY-MM-DD" strings in the USER's timezone.
// Strings compare correctly with < and >, and avoid timezone bugs from timestamps.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86400000;

const toUTC = (dateStr) => new Date(`${dateStr}T00:00:00Z`);
const format = (d) => d.toISOString().slice(0, 10);
const pad = (n) => String(n).padStart(2, '0');

export function isValidDateString(s) {
  if (typeof s !== 'string' || !DATE_RE.test(s)) return false;
  const d = toUTC(s);
  return !Number.isNaN(d.getTime()) && format(d) === s; // rejects 2026-02-31
}

export function isValidTimezone(tz) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// "What is today's date for a user in this timezone?"
export function todayInTimezone(tz = 'UTC') {
  const timeZone = isValidTimezone(tz) ? tz : 'UTC';
  // The en-CA locale formats dates as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export const addDays = (dateStr, n) => format(new Date(toUTC(dateStr).getTime() + n * DAY_MS));
export const diffInDays = (a, b) => Math.round((toUTC(a) - toUTC(b)) / DAY_MS); // a minus b
export const weekdayOf = (dateStr) => toUTC(dateStr).getUTCDay(); // 0 = Sunday ... 6 = Saturday
export const monthOf = (dateStr) => dateStr.slice(0, 7);
export const maxDate = (a, b) => (a > b ? a : b);
export const minDate = (a, b) => (a < b ? a : b);

export function monthRange(month) {
  const [y, m] = month.split('-').map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { start: `${month}-01`, end: `${month}-${pad(lastDay)}` };
}

export function shiftMonth(month, delta) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

export function eachDay(start, end) {
  const days = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
  return days;
}