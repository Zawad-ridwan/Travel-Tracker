import { Router } from 'express';
import { Types } from 'mongoose';
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  verifyEmailSchema,
  XP_REWARDS,
  type MessageResponse,
  type UserResponse,
} from '@tt/shared';
import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from '../lib/cookies';
import { toPublicUser } from '../lib/serialize';
import { hashToken, REFRESH_TOKEN_TTL_MS, signAccessToken } from '../lib/tokens';
import { parse } from '../lib/validate';
import { requireAuth } from '../middleware/auth';
import { HttpError } from '../middleware/errors';
import { emailLimiter, loginLimiter, signupLimiter } from '../middleware/security';
import { Session } from '../models/Session';
import { Token } from '../models/Token';
import { User } from '../models/User';
import {
  checkPassword,
  consumeOneTimeToken,
  fakePasswordCheck,
  hashPassword,
  sendPasswordResetEmail,
  sendVerificationEmail,
  startSession,
} from '../services/auth';

export const authRouter = Router();

/** POST /api/auth/signup — create an account and log in straight away. */
authRouter.post('/signup', signupLimiter, async (req, res) => {
  const { name, email, password } = parse(signupSchema, req.body);

  if (await User.exists({ email })) {
    throw new HttpError(409, 'An account with this email already exists. Try logging in.', 'EMAIL_TAKEN', {
      email: ['An account with this email already exists'],
    });
  }

  const user = await User.create({
    name,
    email,
    passwordHash: await hashPassword(password),
    lastLoginAt: new Date(),
  });

  await sendVerificationEmail(user);
  await startSession(req, res, user);

  const body: UserResponse = { user: toPublicUser(user) };
  res.status(201).json(body);
});

/** POST /api/auth/login */
authRouter.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = parse(loginSchema, req.body);

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    await fakePasswordCheck();
    throw new HttpError(401, 'Email or password is incorrect', 'INVALID_CREDENTIALS');
  }
  if (!(await checkPassword(password, user.passwordHash))) {
    throw new HttpError(401, 'Email or password is incorrect', 'INVALID_CREDENTIALS');
  }

  user.lastLoginAt = new Date();
  await user.save();
  await startSession(req, res, user);

  const body: UserResponse = { user: toPublicUser(user) };
  res.json(body);
});

/**
 * POST /api/auth/refresh — swaps the long-lived refresh cookie for a new access cookie.
 * The client calls this automatically when a request fails with TOKEN_EXPIRED.
 */
authRouter.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (!refreshToken) {
    throw new HttpError(401, 'Please log in to continue', 'UNAUTHENTICATED');
  }

  const session = await Session.findOne({
    tokenHash: hashToken(refreshToken),
    expiresAt: { $gt: new Date() },
  });
  const user = session ? await User.findById(session.userId) : null;

  if (!session || !user) {
    clearAuthCookies(res);
    throw new HttpError(401, 'Your session has ended. Please log in again.', 'SESSION_ENDED');
  }

  // Sliding expiry: active users stay logged in
  session.lastUsedAt = new Date();
  session.expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  await session.save();

  const accessToken = signAccessToken({
    sub: user.id as string,
    role: user.role,
    sid: session.id as string,
  });
  setAuthCookies(res, accessToken, refreshToken);

  const body: UserResponse = { user: toPublicUser(user) };
  res.json(body);
});

/** POST /api/auth/logout — ends this device's session. */
authRouter.post('/logout', async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (refreshToken) {
    await Session.deleteOne({ tokenHash: hashToken(refreshToken) });
  } else if (req.auth) {
    await Session.deleteOne({ _id: new Types.ObjectId(req.auth.sessionId) });
  }
  clearAuthCookies(res);
  const body: MessageResponse = { message: 'Logged out' };
  res.json(body);
});

/** GET /api/auth/me — who is logged in? */
authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.auth!.userId);
  if (!user) {
    clearAuthCookies(res);
    throw new HttpError(401, 'Please log in to continue', 'UNAUTHENTICATED');
  }
  const body: UserResponse = { user: toPublicUser(user) };
  res.json(body);
});

/** POST /api/auth/verify-email — the link in the welcome email lands here. */
authRouter.post('/verify-email', async (req, res) => {
  const { token } = parse(verifyEmailSchema, req.body);
  const record = await consumeOneTimeToken(token, 'verify_email');
  if (!record) {
    throw new HttpError(
      400,
      'This link has expired or was already used. Log in and ask for a new one.',
      'INVALID_TOKEN',
    );
  }

  const user = await User.findById(record.userId);
  if (!user) throw new HttpError(400, 'This account no longer exists', 'INVALID_TOKEN');

  if (!user.emailVerified) {
    user.emailVerified = true;
    user.xp += XP_REWARDS.verifyEmail;
    await user.save();
  }

  const body: MessageResponse = { message: 'Email confirmed. You earned 25 XP!' };
  res.json(body);
});

/** POST /api/auth/resend-verification */
authRouter.post('/resend-verification', requireAuth, emailLimiter, async (req, res) => {
  const user = await User.findById(req.auth!.userId);
  if (!user) throw new HttpError(401, 'Please log in to continue', 'UNAUTHENTICATED');
  if (user.emailVerified) {
    throw new HttpError(400, 'Your email is already confirmed', 'ALREADY_VERIFIED');
  }
  await sendVerificationEmail(user);
  const body: MessageResponse = { message: `We sent a new link to ${user.email}` };
  res.json(body);
});

/**
 * POST /api/auth/forgot-password
 * Always gives the same answer, so nobody can use it to check who has an account.
 */
authRouter.post('/forgot-password', emailLimiter, async (req, res) => {
  const { email } = parse(forgotPasswordSchema, req.body);
  const user = await User.findOne({ email });
  if (user) await sendPasswordResetEmail(user);

  const body: MessageResponse = {
    message: 'If an account exists for that email, a reset link is on its way.',
  };
  res.json(body);
});

/** POST /api/auth/reset-password — sets a new password and logs out every device. */
authRouter.post('/reset-password', async (req, res) => {
  const { token, password } = parse(resetPasswordSchema, req.body);
  const record = await consumeOneTimeToken(token, 'reset_password');
  if (!record) {
    throw new HttpError(
      400,
      'This link has expired or was already used. Ask for a new one.',
      'INVALID_TOKEN',
    );
  }

  const user = await User.findById(record.userId);
  if (!user) throw new HttpError(400, 'This account no longer exists', 'INVALID_TOKEN');

  user.passwordHash = await hashPassword(password);
  user.emailVerified = true; // they just proved they own the inbox
  await user.save();

  await Session.deleteMany({ userId: user._id });
  await Token.deleteMany({ userId: user._id, type: 'reset_password' });
  clearAuthCookies(res);

  const body: MessageResponse = { message: 'Password changed. You can log in now.' };
  res.json(body);
});
