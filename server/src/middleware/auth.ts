import type { RequestHandler } from 'express';
import type { UserRole } from '@tt/shared';
import { ACCESS_COOKIE } from '../lib/cookies';
import { verifyAccessToken } from '../lib/tokens';
import { HttpError } from './errors';

/** Reads the access-token cookie on every request and sets req.auth if it is valid. */
export const authenticate: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.[ACCESS_COOKIE] as string | undefined;
  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) {
      req.auth = { userId: payload.sub, role: payload.role, sessionId: payload.sid };
    }
  }
  next();
};

/**
 * Blocks the request unless the user is logged in.
 * The client reacts to TOKEN_EXPIRED by calling /api/auth/refresh and retrying.
 */
export const requireAuth: RequestHandler = (req, _res, next) => {
  if (req.auth) return next();
  const hadToken = Boolean(req.cookies?.[ACCESS_COOKIE]);
  next(
    new HttpError(
      401,
      hadToken ? 'Your session has expired' : 'Please log in to continue',
      hadToken ? 'TOKEN_EXPIRED' : 'UNAUTHENTICATED',
    ),
  );
};

/** Blocks the request unless the user has one of the given roles. Use after requireAuth. */
export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (req.auth && roles.includes(req.auth.role)) return next();
    next(new HttpError(403, 'You do not have access to this', 'FORBIDDEN'));
  };
}
