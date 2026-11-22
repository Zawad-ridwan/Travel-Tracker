import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { UserRole } from '@tt/shared';
import { env } from '../config/env';

/** Access tokens are short-lived; the refresh token quietly renews them. */
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const VERIFY_EMAIL_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
export const RESET_PASSWORD_TTL_MS = 60 * 60 * 1000; // 1 hour

/** A long random string, safe to put in a URL or cookie. */
export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString('hex');
}

/** One-way hash used to store tokens. We can check a token but never recover it. */
export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export interface AccessTokenPayload {
  sub: string; // user id
  role: UserRole;
  sid: string; // session id
}

export function signAccessToken(payload: AccessTokenPayload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    algorithm: 'HS256',
  });
}

/** Returns the payload, or null if the token is missing, forged or expired. */
export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });
    if (typeof decoded === 'string') return null;
    const { sub, role, sid } = decoded as Partial<AccessTokenPayload>;
    if (!sub || !role || !sid) return null;
    return { sub, role, sid };
  } catch {
    return null;
  }
}
