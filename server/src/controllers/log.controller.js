import * as logService from '../services/log.service.js';

export async function upsert(req, res) {
  res.json({ log: await logService.upsertLog(req.user, req.validated.body) });
}

export async function list(req, res) {
  res.json({ logs: await logService.listLogs(req.user, req.validated.query) });
}

export async function remove(req, res) {
  const { habitId, date } = req.validated.params;
  await logService.deleteLog(req.user, habitId, date);
  res.status(204).send();
}