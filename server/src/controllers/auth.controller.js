import * as authService from '../services/auth.service.js';
import { ApiError } from '../utils/ApiError.js';
import { REFRESH_COOKIE, clearRefreshCookie, setRefreshCookie } from '../utils/token.js';

// Controllers stay thin: read the request, call a service, send the response.

export async function register(req, res) {
  const { user, accessToken, refreshToken, refreshExpiresAt } = await authService.register(req.validated.body);
  setRefreshCookie(res, refreshToken, refreshExpiresAt);
  res.status(201).json({ user, accessToken });
}

export async function login(req, res) {
  const { user, accessToken, refreshToken, refreshExpiresAt } = await authService.login(req.validated.body);
  setRefreshCookie(res, refreshToken, refreshExpiresAt);
  res.json({ user, accessToken });
}

export async function refresh(req, res) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw ApiError.unauthorized('No refresh token');

  try {
    const { user, accessToken, refreshToken, refreshExpiresAt } = await authService.refreshSession(token);
    setRefreshCookie(res, refreshToken, refreshExpiresAt);
    res.json({ user, accessToken });
  } catch (err) {
    clearRefreshCookie(res);
    throw err;
  }
}

export async function logout(req, res) {
  await authService.logout(req.cookies?.[REFRESH_COOKIE]);
  clearRefreshCookie(res);
  res.status(204).send();
}

export async function verifyEmail(req, res) {
  await authService.verifyEmail(req.validated.body.token);
  res.json({ message: 'Email verified' });
}

export async function resendVerification(req, res) {
  await authService.resendVerification(req.user);
  res.json({ message: 'Verification email sent' });
}

export async function forgotPassword(req, res) {
  await authService.forgotPassword(req.validated.body.email);
  res.json({ message: 'If that email is registered, a reset link has been sent' });
}

export async function resetPassword(req, res) {
  await authService.resetPassword(req.validated.body);
  res.json({ message: 'Password updated. Please log in.' });
}