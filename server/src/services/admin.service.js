import { User } from '../models/User.js';
import { Habit } from '../models/Habit.js';
import { HabitLog } from '../models/HabitLog.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // so user input cannot act as a regex

export async function listUsers({ page, limit, search, role, status }) {
  const filter = {};
  if (role) filter.role = role;
  if (status) filter.status = status;
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: pattern }, { email: pattern }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);

  return { users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

export async function getUserDetail(id) {
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found');
  const [habitCount, logCount] = await Promise.all([
    Habit.countDocuments({ user: id }),
    HabitLog.countDocuments({ user: id }),
  ]);
  return { user, habitCount, logCount };
}

export async function updateUser(admin, id, changes) {
  if (String(admin._id) === id) throw ApiError.badRequest('You cannot change your own role or status');

  const user = await User.findByIdAndUpdate(id, changes, { returnDocument: 'after', runValidators: true });
  if (!user) throw ApiError.notFound('User not found');

  if (changes.status === 'suspended') {
    await User.updateOne({ _id: id }, { $set: { refreshTokens: [] } }); // end their sessions
  }

  logger.info({ adminId: String(admin._id), targetId: id, changes }, 'AUDIT: admin updated user');
  return user;
}

export async function deleteUser(admin, id) {
  if (String(admin._id) === id) throw ApiError.badRequest('You cannot delete your own account here');

  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found');

  await Promise.all([HabitLog.deleteMany({ user: id }), Habit.deleteMany({ user: id }), user.deleteOne()]);
  logger.info({ adminId: String(admin._id), targetId: id, email: user.email }, 'AUDIT: admin deleted user');
}

export async function getSystemStats() {
  const day = 24 * 60 * 60 * 1000;
  const daysAgo = (n) => new Date(Date.now() - n * day);

  const [totalUsers, newUsersLast30Days, activeUsersLast7Days, suspendedUsers, totalHabits, totalLogs, topHabits] =
    await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: daysAgo(30) } }),
      User.countDocuments({ lastLoginAt: { $gte: daysAgo(7) } }),
      User.countDocuments({ status: 'suspended' }),
      Habit.countDocuments(),
      HabitLog.countDocuments(),
      Habit.aggregate([
        { $group: { _id: { $toLower: '$title' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, title: '$_id', count: 1 } },
      ]),
    ]);

  return { totalUsers, newUsersLast30Days, activeUsersLast7Days, suspendedUsers, totalHabits, totalLogs, topHabits };
}