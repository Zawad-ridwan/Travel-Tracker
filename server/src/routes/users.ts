import { Router } from 'express';
import multer from 'multer';
import { Types } from 'mongoose';
import {
  changePasswordSchema,
  deleteAccountSchema,
  onboardingSchema,
  updateProfileSchema,
  XP_REWARDS,
  type MessageResponse,
  type UserResponse,
} from '@tt/shared';
import { deleteImage, detectImageType, uploadAvatar } from '../lib/cloudinary';
import { clearAuthCookies } from '../lib/cookies';
import { toPublicUser } from '../lib/serialize';
import { parse } from '../lib/validate';
import { requireAuth } from '../middleware/auth';
import { HttpError } from '../middleware/errors';
import { Session } from '../models/Session';
import { Token } from '../models/Token';
import { Trip } from '../models/Trip';
import { User } from '../models/User';
import { checkPassword, hashPassword } from '../services/auth';

export const usersRouter = Router();

usersRouter.use(requireAuth);

/** Loads the logged-in user or fails with 401 (e.g. the account was deleted on another device). */
async function currentUser(userId: string, withSecrets = false) {
  const query = User.findById(userId);
  if (withSecrets) query.select('+passwordHash +avatarPublicId');
  const user = await query;
  if (!user) throw new HttpError(401, 'Please log in to continue', 'UNAUTHENTICATED');
  return user;
}

/** PATCH /api/users/me — update profile fields. Send only what changed. */
usersRouter.patch('/me', async (req, res) => {
  const changes = parse(updateProfileSchema, req.body);
  const user = await currentUser(req.auth!.userId);
  user.set(changes);
  await user.save();
  const body: UserResponse = { user: toPublicUser(user) };
  res.json(body);
});

/** POST /api/users/me/onboarding — answers from the welcome quiz. */
usersRouter.post('/me/onboarding', async (req, res) => {
  const answers = parse(onboardingSchema, req.body);
  const user = await currentUser(req.auth!.userId);

  user.set(answers);
  if (!user.onboardingCompleted) {
    user.onboardingCompleted = true;
    user.xp += XP_REWARDS.completeOnboarding;
  }
  await user.save();

  const body: UserResponse = { user: toPublicUser(user) };
  res.json(body);
});

/* ---------------- Profile photo ---------------- */

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
});

/** POST /api/users/me/avatar — multipart form with one "avatar" file (JPEG, PNG or WebP, 2 MB max). */
usersRouter.post('/me/avatar', upload.single('avatar'), async (req, res) => {
  if (!req.file) {
    throw new HttpError(400, 'Choose a photo to upload', 'NO_FILE');
  }
  const type = detectImageType(req.file.buffer);
  if (!type) {
    throw new HttpError(400, 'Use a JPEG, PNG or WebP photo', 'BAD_FILE_TYPE');
  }

  const user = await currentUser(req.auth!.userId);
  const { url, publicId } = await uploadAvatar(user.id as string, req.file.buffer, `image/${type}`);
  user.avatarUrl = url;
  user.avatarPublicId = publicId;
  await user.save();

  const body: UserResponse = { user: toPublicUser(user) };
  res.json(body);
});

/** DELETE /api/users/me/avatar */
usersRouter.delete('/me/avatar', async (req, res) => {
  const user = await currentUser(req.auth!.userId, true);
  if (user.avatarPublicId) await deleteImage(user.avatarPublicId);
  user.avatarUrl = null;
  user.avatarPublicId = null;
  await user.save();
  const body: UserResponse = { user: toPublicUser(user) };
  res.json(body);
});

/* ---------------- Account ---------------- */

/** POST /api/users/me/password — change password and log out all other devices. */
usersRouter.post('/me/password', async (req, res) => {
  const { currentPassword, newPassword } = parse(changePasswordSchema, req.body);
  const user = await currentUser(req.auth!.userId, true);

  if (!(await checkPassword(currentPassword, user.passwordHash))) {
    throw new HttpError(400, 'Your current password is not right', 'WRONG_PASSWORD', {
      currentPassword: ['This is not your current password'],
    });
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();
  await Session.deleteMany({
    userId: user._id,
    _id: { $ne: new Types.ObjectId(req.auth!.sessionId) },
  });

  const body: MessageResponse = { message: 'Password changed. Other devices were logged out.' };
  res.json(body);
});

/** DELETE /api/users/me — permanently delete the account and everything linked to it. */
usersRouter.delete('/me', async (req, res) => {
  const { password } = parse(deleteAccountSchema, req.body);
  const user = await currentUser(req.auth!.userId, true);

  if (!(await checkPassword(password, user.passwordHash))) {
    throw new HttpError(400, 'That password is not right', 'WRONG_PASSWORD', {
      password: ['That password is not right'],
    });
  }

  if (user.avatarPublicId) await deleteImage(user.avatarPublicId);
  await Promise.all([
    Session.deleteMany({ userId: user._id }),
    Token.deleteMany({ userId: user._id }),
    Trip.deleteMany({ ownerId: user._id }),
  ]);
  await user.deleteOne();
  clearAuthCookies(res);

  const body: MessageResponse = { message: 'Your account has been deleted' };
  res.json(body);
});
