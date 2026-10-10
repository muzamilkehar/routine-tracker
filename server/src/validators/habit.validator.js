import { z } from 'zod';
import { isValidDateString } from '../utils/dateUtils.js';

// Reusable building blocks (other validator files import these two)
export const objectId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'Invalid id')
  .transform((s) => s.toLowerCase());
export const dateString = z.string().refine(isValidDateString, 'Date must be a valid YYYY-MM-DD');

const title = z.string().trim().min(1).max(80);
const category = z.string().trim().min(1).max(40);
const timeOfDay = z.enum(['anytime', 'morning', 'afternoon', 'evening', 'night']);
const frequency = z.enum(['daily', 'custom']);
const days = z.array(z.number().int().min(0).max(6)).max(7);

const customNeedsDays = (b) => b.frequency !== 'custom' || (b.days && b.days.length > 0);
const atLeastOneField = (b) => Object.keys(b).length > 0;

export const listHabitsSchema = z.object({
  query: z.object({ includeArchived: z.enum(['true', 'false']).optional() }),
});

export const habitIdSchema = z.object({ params: z.object({ id: objectId }) });

export const createHabitSchema = z.object({
  body: z
    .object({
      title,
      category: category.optional(),
      timeOfDay: timeOfDay.optional(),
      frequency: frequency.optional(),
      days: days.optional(),
      startDate: dateString.optional(),
    })
    .refine(customNeedsDays, { message: 'Choose at least one day for a custom schedule', path: ['days'] }),
});

export const updateHabitSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      title: title.optional(),
      category: category.optional(),
      timeOfDay: timeOfDay.optional(),
      frequency: frequency.optional(),
      days: days.optional(),
      startDate: dateString.optional(),
      isArchived: z.boolean().optional(),
    })
    .refine(atLeastOneField, 'Provide at least one field to update'),
});