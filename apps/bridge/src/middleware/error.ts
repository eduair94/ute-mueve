import type { ErrorHandler } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { ZodError } from 'zod';
import { UteApiError } from '../upstream/errors.js';

export const errorMiddleware: ErrorHandler = (err, c) => {
  if (err instanceof UteApiError) {
    return c.json(
      {
        error: {
          code: err.code,
          status: err.status,
          message: err.message,
          details: err.details ?? undefined,
        },
      },
      err.status as ContentfulStatusCode,
    );
  }
  if (err instanceof ZodError) {
    return c.json(
      {
        error: {
          code: 'VALIDATION',
          status: 400,
          message: 'Validation failed',
          details: err.flatten(),
        },
      },
      400,
    );
  }
  return c.json(
    { error: { code: 'INTERNAL', status: 500, message: err.message } },
    500,
  );
};
