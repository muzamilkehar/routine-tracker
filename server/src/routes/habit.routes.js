import { Router } from 'express';
import * as habit from '../controllers/habit.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createHabitSchema, habitIdSchema, listHabitsSchema, updateHabitSchema } from '../validators/habit.validator.js';

const router = Router();
router.use(requireAuth);

router.get('/', validate(listHabitsSchema), habit.list);
router.post('/', validate(createHabitSchema), habit.create);
router.get('/:id', validate(habitIdSchema), habit.getOne);
router.patch('/:id', validate(updateHabitSchema), habit.update);
router.delete('/:id', validate(habitIdSchema), habit.remove);

export default router;