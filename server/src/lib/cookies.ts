import type { CookieOptions, Response } from 'express';
import { API_PREFIX } from '@tt/shared';
import { env } from '../config/env';
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_MS } from './tokens';

export const ACCESS_COOKIE = 'tt_at';
export const REFRESH_COOKIE = 'tt_rt';

/**
 * httpOnly: JavaScript in the page cannot read the cookie (protects against XSS theft).
 * secure: only sent over HTTPS in production.
 * sameSite lax: not sent with cross-site form posts (protects against CSRF).
 */
const base: CookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'lax',
};

// The refresh cookie is only sent to /api/auth, so normal requests never carry it
const refreshPath = `${API_PREFIX}/auth`;

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...base,
    path: '/',
    maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
  });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...base,
    path: refreshPath,
    maxAge: REFRESH_TOKEN_TTL_MS,
  });
}

export function setAccessCookie(res: Response, accessToken: string) {
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...base,
    path: '/',
    maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, { ...base, path: '/' });
  res.clearCookie(REFRESH_COOKIE, { ...base, path: refreshPath });
}
