import { Router } from 'express';
import * as user from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { changePasswordSchema, deleteAccountSchema, updateProfileSchema } from '../validators/auth.validator.js';

const router = Router();
router.use(requireAuth);

router.get('/me', user.getMe);
router.patch('/me', validate(updateProfileSchema), user.updateMe);
router.patch('/me/password', validate(changePasswordSchema), user.changePassword);
router.get('/me/export', user.exportData);
router.delete('/me', validate(deleteAccountSchema), user.deleteMe);

export default router;