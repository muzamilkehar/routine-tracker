import { Habit } from '../models/Habit.js';
import { HabitLog } from '../models/HabitLog.js';
import { ApiError } from '../utils/ApiError.js';
import { todayInTimezone } from '../utils/dateUtils.js';

const MAX_ACTIVE_HABITS = 50;
const normalizeDays = (days = []) => [...new Set(days)].sort((a, b) => a - b);

export function listHabits(user, { includeArchived } = {}) {
  return Habit.find({ user: user._id, ...(includeArchived ? {} : { isArchived: false }) }).sort({ createdAt: 1 });
}

export async function createHabit(user, data) {
  const activeCount = await Habit.countDocuments({ user: user._id, isArchived: false });
  if (activeCount >= MAX_ACTIVE_HABITS) {
    throw ApiError.badRequest(`You can have at most ${MAX_ACTIVE_HABITS} active habits`);
  }

  const frequency = data.frequency ?? 'daily';
  return Habit.create({
    ...data,
    user: user._id,
    frequency,
    days: frequency === 'custom' ? normalizeDays(data.days) : [],
    startDate: data.startDate ?? todayInTimezone(user.timezone),
  });
}

// IMPORTANT: always filter by the logged-in user too. Without `user: user._id`,
// anyone could read anyone's habit by guessing ids (an "IDOR" vulnerability).
export async function getHabit(user, id) {
  const habit = await Habit.findOne({ _id: id, user: user._id });
  if (!habit) throw ApiError.notFound('Habit not found');
  return habit;
}

export async function updateHabit(user, id, { isArchived, ...changes }) {
  const habit = await getHabit(user, id);

  Object.assign(habit, changes);
  if (changes.days) habit.days = normalizeDays(changes.days);
  if (habit.frequency === 'daily') habit.days = [];
  if (habit.frequency === 'custom' && habit.days.length === 0) {
    throw ApiError.badRequest('Choose at least one day for a custom schedule');
  }

  // Archiving keeps all history but stops the habit from counting after today
  if (isArchived === true && !habit.isArchived) {
    habit.isArchived = true;
    habit.endDate = todayInTimezone(user.timezone);
  } else if (isArchived === false && habit.isArchived) {
    habit.isArchived = false;
    habit.endDate = null;
  }

  await habit.save();
  return habit;
}

export async function deleteHabit(user, id) {
  const habit = await getHabit(user, id);
  await Promise.all([HabitLog.deleteMany({ habit: habit._id }), habit.deleteOne()]);
}