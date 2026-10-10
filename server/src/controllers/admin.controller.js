import * as adminService from '../services/admin.service.js';

export async function listUsers(req, res) {
  res.json(await adminService.listUsers(req.validated.query));
}

export async function getUser(req, res) {
  res.json(await adminService.getUserDetail(req.validated.params.id));
}

export async function updateUser(req, res) {
  const { params, body } = req.validated;
  res.json({ user: await adminService.updateUser(req.user, params.id, body) });
}

export async function deleteUser(req, res) {
  await adminService.deleteUser(req.user, req.validated.params.id);
  res.status(204).send();
}

export async function stats(req, res) {
  res.json(await adminService.getSystemStats());
}