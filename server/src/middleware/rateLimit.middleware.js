import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const createLimiter = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    // Skip entirely in tests AND development so debugging doesn't lock you out.
    skip: () => env.nodeEnv !== 'production',
    message: { message },
  });

// General protection for the whole API
export const apiLimiter = createLimiter(15 * 60 * 1000, 300, 'Too many requests, please try again later');

// Much stricter for routes attackers love (password guessing, email spam)
export const authLimiter = createLimiter(15 * 60 * 1000, 20, 'Too many attempts, please try again in 15 minutes');