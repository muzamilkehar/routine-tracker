import { Router } from 'express';
import * as admin from '../controllers/admin.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { listUsersSchema, updateUserSchema, userIdSchema } from '../validators/admin.validator.js';

const router = Router();
// Every admin route needs a valid login AND the admin role
router.use(requireAuth, requireRole('admin'));

router.get('/stats', admin.stats);
router.get('/users', validate(listUsersSchema), admin.listUsers);
router.get('/users/:id', validate(userIdSchema), admin.getUser);
router.patch('/users/:id', validate(updateUserSchema), admin.updateUser);
router.delete('/users/:id', validate(userIdSchema), admin.deleteUser);

export default router;