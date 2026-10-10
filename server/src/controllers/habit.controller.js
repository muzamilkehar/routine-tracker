import * as habitService from '../services/habit.service.js';

export async function list(req, res) {
  const includeArchived = req.validated.query.includeArchived === 'true';
  res.json({ habits: await habitService.listHabits(req.user, { includeArchived }) });
}

export async function create(req, res) {
  res.status(201).json({ habit: await habitService.createHabit(req.user, req.validated.body) });
}

export async function getOne(req, res) {
  res.json({ habit: await habitService.getHabit(req.user, req.validated.params.id) });
}

export async function update(req, res) {
  const { params, body } = req.validated;
  res.json({ habit: await habitService.updateHabit(req.user, params.id, body) });
}

export async function remove(req, res) {
  await habitService.deleteHabit(req.user, req.validated.params.id);
  res.status(204).send();
}