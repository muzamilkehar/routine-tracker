import { Router } from 'express';
import * as log from '../controllers/log.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { deleteLogSchema, listLogsSchema, upsertLogSchema } from '../validators/log.validator.js';

const router = Router();
router.use(requireAuth);

router.put('/', validate(upsertLogSchema), log.upsert);
router.get('/', validate(listLogsSchema), log.list);
router.delete('/:habitId/:date', validate(deleteLogSchema), log.remove);

export default router;