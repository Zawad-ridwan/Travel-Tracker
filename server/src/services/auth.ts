import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import type { Types } from 'mongoose';
import { setAuthCookies } from '../lib/cookies';
import { resetPasswordMessage, sendEmail, verifyEmailMessage } from '../lib/email';
import {
  hashToken,
  randomToken,
  REFRESH_TOKEN_TTL_MS,
  RESET_PASSWORD_TTL_MS,
  signAccessToken,
  VERIFY_EMAIL_TTL_MS,
} from '../lib/tokens';
import { Session } from '../models/Session';
import { Token, type TokenType } from '../models/Token';
import type { UserDocument } from '../models/User';

const BCRYPT_ROUNDS = 12;

export function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function checkPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

/**
 * Used when no user matches an email, so a failed login takes the same time
 * whether or not the account exists (stops attackers discovering emails).
 */
const DUMMY_HASH = bcrypt.hashSync('timing-safe-dummy-password', BCRYPT_ROUNDS);
export async function fakePasswordCheck() {
  await bcrypt.compare('wrong-password', DUMMY_HASH);
}

/** Creates a session for this device and sets the two auth cookies. */
export async function startSession(req: Request, res: Response, user: UserDocument) {
  const refreshToken = randomToken();
  const session = await Session.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    userAgent: (req.get('user-agent') ?? '').slice(0, 300),
    ip: req.ip ?? '',
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });

  const accessToken = signAccessToken({
    sub: user.id as string,
    role: user.role,
    sid: session.id as string,
  });
  setAuthCookies(res, accessToken, refreshToken);
  return session;
}

/** Creates a one-time token, stores its hash and returns the raw token for the email link. */
async function createOneTimeToken(userId: Types.ObjectId, type: TokenType, ttlMs: number) {
  await Token.deleteMany({ userId, type }); // only the newest link works
  const token = randomToken();
  await Token.create({
    userId,
    type,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + ttlMs),
  });
  return token;
}

/** Finds a valid one-time token and deletes it, so each link works only once. */
export async function consumeOneTimeToken(token: string, type: TokenType) {
  const doc = await Token.findOneAndDelete({
    tokenHash: hashToken(token),
    type,
    expiresAt: { $gt: new Date() },
  });
  return doc;
}

export async function sendVerificationEmail(user: UserDocument) {
  const token = await createOneTimeToken(user._id, 'verify_email', VERIFY_EMAIL_TTL_MS);
  await sendEmail(verifyEmailMessage({ email: user.email, name: user.name }, token));
}

export async function sendPasswordResetEmail(user: UserDocument) {
  const token = await createOneTimeToken(user._id, 'reset_password', RESET_PASSWORD_TTL_MS);
  await sendEmail(resetPasswordMessage({ email: user.email, name: user.name }, token));
}
