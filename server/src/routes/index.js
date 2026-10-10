import { Router } from 'express';
import adminRoutes from './admin.routes.js';
import authRoutes from './auth.routes.js';
import habitRoutes from './habit.routes.js';
import logRoutes from './log.routes.js';
import statsRoutes from './stats.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/habits', habitRoutes);
router.use('/logs', logRoutes);
router.use('/stats', statsRoutes);
router.use('/admin', adminRoutes);

export default router;