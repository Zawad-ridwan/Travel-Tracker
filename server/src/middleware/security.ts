import type { RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import { CLIENT_HEADER } from '@tt/shared';
import { env } from '../config/env';
import { HttpError } from './errors';

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * CSRF protection: every request that changes data must carry our custom header.
 * A malicious site cannot add custom headers to a cross-site request without
 * a CORS preflight, which our CORS settings reject.
 */
export const requireClientHeader: RequestHandler = (req, _res, next) => {
  if (UNSAFE_METHODS.has(req.method) && !req.get(CLIENT_HEADER)) {
    return next(new HttpError(403, 'Request blocked for security reasons', 'CSRF'));
  }
  next();
};

function limiter(windowMinutes: number, limit: number, message: string) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => env.isTest,
    handler: (_req, _res, next) => next(new HttpError(429, message, 'RATE_LIMITED')),
  });
}

/** Slows down password guessing: 10 attempts per 15 minutes per IP. */
export const loginLimiter = limiter(15, 10, 'Too many attempts. Wait 15 minutes and try again.');

/** Stops sign-up spam: 5 accounts per hour per IP. */
export const signupLimiter = limiter(60, 5, 'Too many sign-ups from here. Try again in an hour.');

/** Stops email flooding: 5 emails per hour per IP. */
export const emailLimiter = limiter(60, 5, 'Too many emails requested. Try again in an hour.');

/** A general ceiling for the whole API: 300 requests per 5 minutes per IP. */
export const apiLimiter = limiter(5, 300, 'Too many requests. Slow down a little.');
