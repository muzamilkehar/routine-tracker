import { Router } from 'express';
import * as stats from '../controllers/stats.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { compareStatsSchema, monthlyStatsSchema, yearlyStatsSchema } from '../validators/stats.validator.js';

const router = Router();
router.use(requireAuth);

router.get('/monthly', validate(monthlyStatsSchema), stats.monthly);
router.get('/compare', validate(compareStatsSchema), stats.compare);
router.get('/yearly', validate(yearlyStatsSchema), stats.yearly);
router.get('/streaks', stats.streaks);

export default router;