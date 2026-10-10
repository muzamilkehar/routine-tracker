import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// The ONE place where every error becomes a JSON response.
// Express recognises an error handler by its 4 parameters, so keep `next` even if unused.
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let status = err.statusCode || err.status || 500;
  let message = err.message;
  let details = err.details;

  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON body';
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    message = 'A record with that value already exists';
  }

  if (status >= 500) {
    logger.error({ err, method: req.method, url: req.originalUrl }, 'Unhandled error');
    message = 'Internal server error'; // never leak internals to clients
    details = undefined;
  }

  res.status(status).json({
    message,
    ...(details && { details }),
    ...(!env.isProd && status >= 500 && { stack: err.stack }),
  });
}