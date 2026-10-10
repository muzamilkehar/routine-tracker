import { Habit } from '../models/Habit.js';
import { HabitLog } from '../models/HabitLog.js';
import { eachDay, maxDate, minDate, monthOf, monthRange, shiftMonth, todayInTimezone, weekdayOf } from '../utils/dateUtils.js';

const round1 = (n) => Math.round(n * 10) / 10;
const percentage = (done, scheduled) => (scheduled > 0 ? round1((done / scheduled) * 100) : null);
const delta = (a, b) => (a == null || b == null ? null : round1(a - b));
const sum = (list, key) => list.reduce((total, item) => total + item[key], 0);

const logKey = (habitId, date) => `${habitId}|${date}`;
const buildLogMap = (logs) => new Map(logs.map((l) => [logKey(l.habit, l.date), l.status]));
const isScheduledOn = (habit, date) => habit.frequency === 'daily' || habit.days.includes(weekdayOf(date));

// RULES for completion %:
//  - only days the habit was scheduled count
//  - 'skipped' days are excluded (rest days do not hurt you)
//  - a scheduled past day with no log counts as missed
//  - today does not count until you log it (the day is not over yet)
function statsForHabit(habit, logMap, start, end, today) {
  const from = maxDate(start, habit.startDate);
  const to = minDate(minDate(end, today), habit.endDate ?? end);

  let scheduled = 0;
  let done = 0;
  let skipped = 0;
  const doneDates = [];

  if (from <= to) {
    for (const date of eachDay(from, to)) {
      if (!isScheduledOn(habit, date)) continue;
      const status = logMap.get(logKey(habit._id, date));
      if (status === 'skipped') {
        skipped++;
        continue;
      }
      if (!status && date === today) continue;
      scheduled++;
      if (status === 'done') {
        done++;
        doneDates.push(date);
      }
    }
  }

  return {
    habitId: String(habit._id),
    title: habit.title,
    category: habit.category,
    scheduled,
    done,
    missed: scheduled - done,
    skipped,
    percentage: percentage(done, scheduled),
    doneDates,
  };
}

function computeRange(habits, logMap, start, end, today) {
  const perHabit = habits.map((h) => statsForHabit(h, logMap, start, end, today));
  const scheduled = sum(perHabit, 'scheduled');
  const done = sum(perHabit, 'done');

  return {
    overall: {
      scheduled,
      done,
      missed: scheduled - done,
      skipped: sum(perHabit, 'skipped'),
      percentage: percentage(done, scheduled),
      activeDays: new Set(perHabit.flatMap((h) => h.doneDates)).size, // days with at least one completion
    },
    habits: perHabit
      .filter((h) => h.scheduled > 0 || h.skipped > 0)
      .map(({ doneDates, ...rest }) => rest),
  };
}

async function loadData(user, start, end) {
  const [habits, logs] = await Promise.all([
    Habit.find({ user: user._id }).lean(),
    HabitLog.find({ user: user._id, date: { $gte: start, $lte: end } }).lean(),
  ]);
  return { habits, logMap: buildLogMap(logs) };
}

export async function getMonthlyStats(user, month) {
  const today = todayInTimezone(user.timezone);
  const target = month ?? monthOf(today);
  const { start, end } = monthRange(target);
  const { habits, logMap } = await loadData(user, start, end);
  return { month: target, ...computeRange(habits, logMap, start, end, today) };
}

export async function getComparison(user, { month, against = 'previous-month' }) {
  const today = todayInTimezone(user.timezone);
  const current = month ?? monthOf(today);
  const previous = shiftMonth(current, against === 'previous-year' ? -12 : -1);

  const cur = monthRange(current);
  const prev = monthRange(previous);
  const { habits, logMap } = await loadData(user, minDate(cur.start, prev.start), maxDate(cur.end, prev.end));

  const a = computeRange(habits, logMap, cur.start, cur.end, today);
  const b = computeRange(habits, logMap, prev.start, prev.end, today);

  const curById = new Map(a.habits.map((h) => [h.habitId, h]));
  const prevById = new Map(b.habits.map((h) => [h.habitId, h]));
  const ids = new Set([...curById.keys(), ...prevById.keys()]);

  return {
    month: current,
    comparedWith: previous,
    against,
    overallChange: delta(a.overall.percentage, b.overall.percentage), // in percentage points
    current: a,
    previous: b,
    habits: [...ids].map((id) => {
      const c = curById.get(id);
      const p = prevById.get(id);
      return {
        habitId: id,
        title: (c ?? p).title,
        current: c?.percentage ?? null,
        previous: p?.percentage ?? null,
        change: delta(c?.percentage ?? null, p?.percentage ?? null),
      };
    }),
  };
}

export async function getYearlyStats(user, year) {
  const today = todayInTimezone(user.timezone);
  const y = year ?? Number(today.slice(0, 4));
  const { habits, logMap } = await loadData(user, `${y}-01-01`, `${y}-12-31`);

  const months = Array.from({ length: 12 }, (_, i) => {
    const month = `${y}-${String(i + 1).padStart(2, '0')}`;
    const { start, end } = monthRange(month);
    return { month, ...computeRange(habits, logMap, start, end, today).overall };
  });

  return { year: y, overall: computeRange(habits, logMap, `${y}-01-01`, `${y}-12-31`, today).overall, months };
}

// Streak = consecutive scheduled days completed. Skipped days neither break nor extend it.
function streakFor(habit, logMap, today) {
  let current = 0;
  let longest = 0;

  for (const date of eachDay(habit.startDate, today)) {
    if (!isScheduledOn(habit, date)) continue;
    const status = logMap.get(logKey(habit._id, date));
    if (status === 'skipped') continue;
    if (status === 'done') {
      current++;
      longest = Math.max(longest, current);
    } else if (date !== today) {
      current = 0; // missed (or never logged); today is still open so it cannot break a streak
    }
  }
  return { current, longest };
}

export async function getStreaks(user) {
  const today = todayInTimezone(user.timezone);
  const habits = await Habit.find({ user: user._id, isArchived: false }).lean();
  const logs = await HabitLog.find({ user: user._id, habit: { $in: habits.map((h) => h._id) } }, 'habit date status').lean();
  const logMap = buildLogMap(logs);

  return {
    streaks: habits.map((h) => ({ habitId: String(h._id), title: h.title, ...streakFor(h, logMap, today) })),
  };
}