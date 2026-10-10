import { z } from 'zod';

const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be YYYY-MM');

export const monthlyStatsSchema = z.object({ query: z.object({ month: month.optional() }) });

export const compareStatsSchema = z.object({
  query: z.object({
    month: month.optional(),
    against: z.enum(['previous-month', 'previous-year']).optional(),
  }),
});

export const yearlyStatsSchema = z.object({
  query: z.object({ year: z.coerce.number().int().min(2000).max(2100).optional() }),
});