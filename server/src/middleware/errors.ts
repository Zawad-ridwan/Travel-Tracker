import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { ApiErrorResponse } from '@tt/shared';
import { env } from '../config/env';

/** An error with an HTTP status code. Throw it from any route: `throw new HttpError(404, 'Trip not found')`. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/** Runs when no route matched the request. */
export const notFound: RequestHandler = (req, _res, next) => {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND'));
};

/** Turns every error into the same JSON shape. Never leaks stack traces in production. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = err instanceof HttpError ? err.status : 500;
  const message =
    status === 500 && env.isProduction ? 'Something went wrong' : (err as Error).message;

  if (status === 500 && !env.isTest) {
    console.error(err);
  }

  const body: ApiErrorResponse = {
    error: { message, code: err instanceof HttpError ? err.code : 'INTERNAL_ERROR' },
  };
  res.status(status).json(body);
};
