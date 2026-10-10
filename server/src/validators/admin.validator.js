import { z } from 'zod';
import { objectId } from './habit.validator.js';

export const listUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    search: z.string().trim().max(100).optional(),
    role: z.enum(['user', 'admin']).optional(),
    status: z.enum(['active', 'suspended']).optional(),
  }),
});

export const userIdSchema = z.object({ params: z.object({ id: objectId }) });

export const updateUserSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      role: z.enum(['user', 'admin']).optional(),
      status: z.enum(['active', 'suspended']).optional(),
    })
    .refine((b) => Object.keys(b).length > 0, 'Provide role and/or status'),
});