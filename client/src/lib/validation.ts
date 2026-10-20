import { z } from 'zod'

// One password rule for every screen that sets a password. It mirrors the backend validator,
// so people get instant feedback instead of waiting for the server to say no.
export const passwordSchema = z
  .string()
  .min(8, 'At least 8 characters')
  .max(72, 'At most 72 characters')
  .regex(/[A-Za-z]/, 'Must contain a letter')
  .regex(/\d/, 'Must contain a number')