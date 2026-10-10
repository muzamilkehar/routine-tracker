import { Habit } from '../models/Habit.js';
import { HabitLog } from '../models/HabitLog.js';
import { ApiError } from '../utils/ApiError.js';
import { diffInDays, todayInTimezone } from '../utils/dateUtils.js';

const BACKFILL_LIMIT_DAYS = 31; // how far back a user may edit

// "Upsert" = update if it exists, otherwise insert. Clicking "done" twice is safe.
export async function upsertLog(user, { habitId, date, status, note }) {
  const habit = await Habit.findOne({ _id: habitId, user: user._id });
  if (!habit) throw ApiError.notFound('Habit not found');
  if (habit.isArchived) throw ApiError.badRequest('Archived habits cannot be logged');

  const today = todayInTimezone(user.timezone);
  if (date > today) throw ApiError.badRequest('You cannot log a future date');
  if (diffInDays(today, date) > BACKFILL_LIMIT_DAYS) {
    throw ApiError.badRequest(`You can only edit the last ${BACKFILL_LIMIT_DAYS} days`);
  }
  if (date < habit.startDate) throw ApiError.badRequest('Date is before the habit start date');

  return HabitLog.findOneAndUpdate(
    { habit: habit._id, date },
    { $set: { user: user._id, status, ...(note !== undefined && { note }) } },
    { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true }
  );
}

export function listLogs(user, { from, to }) {
  return HabitLog.find({ user: user._id, date: { $gte: from, $lte: to } }).sort({ date: 1 });
}

export async function deleteLog(user, habitId, date) {
  const result = await HabitLog.deleteOne({ user: user._id, habit: habitId, date });
  if (!result.deletedCount) throw ApiError.notFound('Log not found');
}