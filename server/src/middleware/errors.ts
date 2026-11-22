import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { ApiErrorResponse } from '@tt/shared';
import { env } from '../config/env';

/** An error with an HTTP status code. Throw it from any route: `throw new HttpError(404, 'Trip not found')`. */
export class HttpError extends Error {
  status: number;
  code?: string;
  fields?: Record<string, string[]>;

  constructor(status: number, message: string, code?: string, fields?: Record<string, string[]>) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

/** Runs when no route matched the request. */
export const notFound: RequestHandler = (req, _res, next) => {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND'));
};

interface KnownError {
  status?: number;
  type?: string;
  code?: string | number;
  name?: string;
  message?: string;
}

/** Turns errors from libraries into a status, message and code. */
function describe(err: unknown): { status: number; message: string; code: string } {
  const e = err as KnownError;

  if (e?.type === 'entity.parse.failed') {
    return { status: 400, message: 'The request body is not valid JSON', code: 'BAD_JSON' };
  }
  if (e?.type === 'entity.too.large') {
    return { status: 413, message: 'The request is too large', code: 'TOO_LARGE' };
  }
  if (e?.name === 'MulterError') {
    if (e.code === 'LIMIT_FILE_SIZE') {
      return { status: 413, message: 'The photo must be 2 MB or smaller', code: 'FILE_TOO_LARGE' };
    }
    return { status: 400, message: 'The upload could not be read', code: 'BAD_UPLOAD' };
  }
  // MongoDB duplicate key, e.g. two sign-ups with the same email at the same moment
  if (e?.code === 11000) {
    return { status: 409, message: 'That already exists', code: 'DUPLICATE' };
  }
  return {
    status: 500,
    message: env.isProduction ? 'Something went wrong' : (e?.message ?? 'Unknown error'),
    code: 'INTERNAL_ERROR',
  };
}

/** Turns every error into the same JSON shape. Never leaks stack traces in production. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let body: ApiErrorResponse;
  let status: number;

  if (err instanceof HttpError) {
    status = err.status;
    body = { error: { message: err.message, code: err.code, fields: err.fields } };
  } else {
    const d = describe(err);
    status = d.status;
    body = { error: { message: d.message, code: d.code } };
    if (status === 500 && !env.isTest) console.error(err);
  }

  res.status(status).json(body);
};
