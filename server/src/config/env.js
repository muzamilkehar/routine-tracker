import 'dotenv/config';
import { z } from 'zod';

// Describe every variable the app needs. If one is missing or wrong, we stop immediately
// with a clear message instead of failing mysteriously later ("fail fast").
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_URL: z.string().url(),
  MONGODB_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32, 'must be at least 32 characters'),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  REFRESH_TOKEN_DAYS: z.coerce.number().int().positive().default(7),
  ADMIN_NAME: z.string().default('Admin'),
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('Routine Tracker <no-reply@routinetracker.app>'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const problems = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  console.error(`Invalid environment variables:\n${problems}`);
  process.exit(1);
}

const e = parsed.data;

// The rest of the app imports this tidy object instead of touching process.env.
export const env = {
  nodeEnv: e.NODE_ENV,
  isProd: e.NODE_ENV === 'production',
  port: e.PORT,
  clientUrl: e.CLIENT_URL,
  mongoUri: e.MONGODB_URI,
  jwtAccessSecret: e.JWT_ACCESS_SECRET,
  jwtAccessExpires: e.JWT_ACCESS_EXPIRES,
  refreshTokenDays: e.REFRESH_TOKEN_DAYS,
  admin: { name: e.ADMIN_NAME, email: e.ADMIN_EMAIL, password: e.ADMIN_PASSWORD },
  smtp: { host: e.SMTP_HOST, port: e.SMTP_PORT, user: e.SMTP_USER, pass: e.SMTP_PASS, from: e.EMAIL_FROM },
};