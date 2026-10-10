import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// ---- Access token: short-lived JWT sent in the Authorization header ----
export function signAccessToken(user) {
  return jwt.sign({ role: user.role }, env.jwtAccessSecret, {
    algorithm: 'HS256',
    subject: String(user._id),
    expiresIn: env.jwtAccessExpires,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtAccessSecret, { algorithms: ['HS256'] });
}

// ---- Opaque random tokens (refresh, email verification, password reset) ----
export const generateOpaqueToken = () => crypto.randomBytes(32).toString('hex');

// We store only the hash, so a database leak does not leak usable tokens.
export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// ---- Refresh token cookie ----
export const REFRESH_COOKIE = 'refreshToken';

const cookieOptions = {
  httpOnly: true, // JavaScript in the browser cannot read it (protects against XSS theft)
  secure: env.isProd, // HTTPS only in production
  sameSite: env.isProd ? 'none' : 'lax', // 'none' is needed when frontend and API are on different domains
  path: '/api/v1/auth', // the browser only sends it to auth routes
};

export const setRefreshCookie = (res, token, expires) =>
  res.cookie(REFRESH_COOKIE, token, { ...cookieOptions, expires });

export const clearRefreshCookie = (res) => res.clearCookie(REFRESH_COOKIE, cookieOptions);