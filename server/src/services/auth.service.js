import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Habit } from '../models/Habit.js';
import { HabitLog } from '../models/HabitLog.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { generateOpaqueToken, hashToken, signAccessToken } from '../utils/token.js';
import { sendPasswordResetEmail, sendVerificationEmail } from './email.service.js';

const BCRYPT_ROUNDS = env.nodeEnv === 'test' ? 4 : 12; // lower in tests so they run fast
const MAX_SESSIONS = 5; // max devices logged in at once
const RESET_TOKEN_MINUTES = 60;

// Used to make "unknown email" take as long as "wrong password" (prevents timing-based user discovery)
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

const logEmailError = (err) => logger.error({ err }, 'Failed to send email');

// Creates a new refresh token (stored hashed) and a fresh access token
async function issueSession(user) {
  const refreshToken = generateOpaqueToken();
  const refreshExpiresAt = new Date(Date.now() + env.refreshTokenDays * 24 * 60 * 60 * 1000);

  await User.updateOne(
    { _id: user._id },
    {
      $push: {
        // $slice: -5 keeps only the newest 5 sessions
        refreshTokens: { $each: [{ tokenHash: hashToken(refreshToken), expiresAt: refreshExpiresAt }], $slice: -MAX_SESSIONS },
      },
    }
  );

  return { accessToken: signAccessToken(user), refreshToken, refreshExpiresAt };
}

export async function register({ name, email, password, timezone }) {
  if (await User.exists({ email })) throw ApiError.conflict('Email is already registered');

  const verificationToken = generateOpaqueToken();
  const user = await User.create({
    name,
    email,
    timezone,
    passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
    emailVerificationTokenHash: hashToken(verificationToken),
  });

  // Fire and forget: a slow or failing mail server must not break registration
  sendVerificationEmail(user, verificationToken).catch(logEmailError);

  return { user, ...(await issueSession(user)) };
}

export async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash');
  const passwordOk = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);

  // Same message for both cases so attackers cannot tell which emails exist
  if (!user || !passwordOk) throw ApiError.unauthorized('Invalid email or password');
  if (user.status !== 'active') throw ApiError.forbidden('This account has been suspended');

  user.lastLoginAt = new Date();
  await user.save();

  return { user, ...(await issueSession(user)) };
}

// Refresh-token ROTATION: every refresh invalidates the old token and issues a new one.
export async function refreshSession(refreshToken) {
  const tokenHash = hashToken(refreshToken);

  // Atomically remove the presented token. If two requests race with the same token, only one wins.
  const user = await User.findOneAndUpdate(
    { 'refreshTokens.tokenHash': tokenHash },
    { $pull: { refreshTokens: { tokenHash } } }
  ).select('+refreshTokens');

  const stored = user?.refreshTokens.find((t) => t.tokenHash === tokenHash);
  if (!stored || stored.expiresAt < new Date()) throw ApiError.unauthorized('Session expired, please log in again');
  if (user.status !== 'active') throw ApiError.forbidden('This account has been suspended');

  return { user, ...(await issueSession(user)) };
}

export async function logout(refreshToken) {
  if (!refreshToken) return;
  const tokenHash = hashToken(refreshToken);
  await User.updateOne({ 'refreshTokens.tokenHash': tokenHash }, { $pull: { refreshTokens: { tokenHash } } });
}

export async function verifyEmail(token) {
  const user = await User.findOneAndUpdate(
    { emailVerificationTokenHash: hashToken(token) },
    { isEmailVerified: true, $unset: { emailVerificationTokenHash: 1 } }
  );
  if (!user) throw ApiError.badRequest('Invalid or expired verification link');
}

export async function resendVerification(user) {
  if (user.isEmailVerified) throw ApiError.badRequest('Email is already verified');
  const token = generateOpaqueToken();
  await User.updateOne({ _id: user._id }, { emailVerificationTokenHash: hashToken(token) });
  await sendVerificationEmail(user, token);
}

export async function forgotPassword(email) {
  const user = await User.findOne({ email, status: 'active' });
  if (!user) return; // say nothing: the response is identical whether or not the email exists

  const token = generateOpaqueToken();
  await User.updateOne(
    { _id: user._id },
    {
      passwordResetTokenHash: hashToken(token),
      passwordResetExpires: new Date(Date.now() + RESET_TOKEN_MINUTES * 60 * 1000),
    }
  );
  sendPasswordResetEmail(user, token).catch(logEmailError);
}

export async function resetPassword({ token, password }) {
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await User.findOneAndUpdate(
    { passwordResetTokenHash: hashToken(token), passwordResetExpires: { $gt: new Date() } },
    {
      $set: { passwordHash, refreshTokens: [] }, // log out everywhere after a reset
      $unset: { passwordResetTokenHash: 1, passwordResetExpires: 1 },
    }
  );
  if (!user) throw ApiError.badRequest('Invalid or expired reset link');
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await user.save();
  await User.updateOne({ _id: userId }, { $set: { refreshTokens: [] } }); // sign out all devices

  return { user, ...(await issueSession(user)) }; // keep THIS device signed in
}

export async function updateProfile(user, changes) {
  Object.assign(user, changes);
  await user.save();
  return user;
}

export async function exportAccountData(user) {
  const [habits, logs] = await Promise.all([
    Habit.find({ user: user._id }),
    HabitLog.find({ user: user._id }).sort({ date: 1 }),
  ]);
  return { exportedAt: new Date().toISOString(), user, habits, logs };
}

export async function deleteAccount(user, password) {
  if (user.role === 'admin' && !user.isSeed) throw ApiError.forbidden('Admin accounts cannot be deleted this way');

  const withHash = await User.findById(user._id).select('+passwordHash');
  if (!(await bcrypt.compare(password, withHash.passwordHash))) {
    throw ApiError.badRequest('Password is incorrect');
  }

  await Promise.all([
    HabitLog.deleteMany({ user: user._id }),
    Habit.deleteMany({ user: user._id }),
    User.deleteOne({ _id: user._id }),
  ]);
}