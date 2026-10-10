import { ApiError } from '../utils/ApiError.js';

// Checks req.body, req.query and req.params against a Zod schema.
// Clean, converted data is stored in req.validated (Express 5 does not allow overwriting req.query).
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({ body: req.body, query: req.query, params: req.params });

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.slice(1).join('.') || issue.path[0],
      message: issue.message,
    }));
    return next(ApiError.badRequest('Validation failed', details));
  }

  req.validated = result.data;
  next();
};