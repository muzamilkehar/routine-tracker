import { z } from 'zod';
import { isValidTimezone } from '../utils/dateUtils.js';

const name = z.string().trim().min(2).max(60);
const email = z.string().trim().toLowerCase().email().max(254);
// bcrypt only uses the first 72 bytes of a password, so we cap at 72
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number');
const timezone = z.string().refine(isValidTimezone, 'Invalid timezone');
const token = z.string().min(10).max(200);

export const registerSchema = z.object({
  body: z.object({ name, email, password, timezone: timezone.optional() }),
});

export const loginSchema = z.object({
  body: z.object({ email, password: z.string().min(1, 'Password is required') }),
});

export const verifyEmailSchema = z.object({ body: z.object({ token }) });
export const forgotPasswordSchema = z.object({ body: z.object({ email }) });
export const resetPasswordSchema = z.object({ body: z.object({ token, password }) });

export const updateProfileSchema = z.object({
  body: z
    .object({ name: name.optional(), timezone: timezone.optional() })
    .refine((b) => Object.keys(b).length > 0, 'Provide at least one field to update'),
});

export const changePasswordSchema = z.object({
  body: z.object({ currentPassword: z.string().min(1), newPassword: password }),
});

export const deleteAccountSchema = z.object({ body: z.object({ password: z.string().min(1) }) });