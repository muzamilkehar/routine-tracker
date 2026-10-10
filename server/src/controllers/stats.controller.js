import * as statsService from '../services/stats.service.js';

export async function monthly(req, res) {
  res.json(await statsService.getMonthlyStats(req.user, req.validated.query.month));
}

export async function compare(req, res) {
  res.json(await statsService.getComparison(req.user, req.validated.query));
}

export async function yearly(req, res) {
  res.json(await statsService.getYearlyStats(req.user, req.validated.query.year));
}

export async function streaks(req, res) {
  res.json(await statsService.getStreaks(req.user));
}