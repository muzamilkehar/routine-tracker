import * as authService from '../services/auth.service.js';
import { clearRefreshCookie, setRefreshCookie } from '../utils/token.js';

export const getMe = (req, res) => res.json({ user: req.user });

export async function updateMe(req, res) {
  const user = await authService.updateProfile(req.user, req.validated.body);
  res.json({ user });
}

export async function changePassword(req, res) {
  const { user, accessToken, refreshToken, refreshExpiresAt } = await authService.changePassword(
    req.user._id,
    req.validated.body
  );
  setRefreshCookie(res, refreshToken, refreshExpiresAt);
  res.json({ user, accessToken });
}

export async function exportData(req, res) {
  res.json(await authService.exportAccountData(req.user));
}

export async function deleteMe(req, res) {
  await authService.deleteAccount(req.user, req.validated.body.password);
  clearRefreshCookie(res);
  res.status(204).send();
}