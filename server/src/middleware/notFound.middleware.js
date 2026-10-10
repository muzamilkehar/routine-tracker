import { ApiError } from '../utils/ApiError.js';

export const notFound = (req, res, next) =>
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));