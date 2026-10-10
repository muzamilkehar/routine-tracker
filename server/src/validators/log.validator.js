import { z } from 'zod';
import { diffInDays } from '../utils/dateUtils.js';
import { dateString, objectId } from './habit.validator.js';

export const upsertLogSchema = z.object({
  body: z.object({
    habitId: objectId,
    date: dateString,
    status: z.enum(['done', 'missed', 'skipped']),
    note: z.string().trim().max(300).optional(),
  }),
});

export const listLogsSchema = z.object({
  query: z
    .object({ from: dateString, to: dateString })
    .refine((q) => q.from <= q.to && diffInDays(q.to, q.from) <= 366, {
      message: 'Range must be valid and at most 366 days',
      path: ['to'],
    }),
});

export const deleteLogSchema = z.object({
  params: z.object({ habitId: objectId, date: dateString }),
});