import { ApiError } from '../utils/ApiError.js';

// Usage: router.use(requireRole('admin')). Must run AFTER requireAuth.
export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden('You do not have permission to do this'));
    next();
  };