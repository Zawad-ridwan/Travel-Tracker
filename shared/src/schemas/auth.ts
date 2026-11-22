import { z } from 'zod';
import { PASSWORD_MIN_LENGTH } from '../constants';

/**
 * Validation rules shared by the React forms and the Express API,
 * so the browser and the server always agree on what is valid.
 */

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Enter your email')
  .max(254, 'That email is too long')
  .pipe(z.email('Enter a valid email, like you@example.com'));

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(128, 'Use 128 characters or fewer')
  .regex(/[A-Za-z]/, 'Include at least one letter')
  .regex(/\d/, 'Include at least one number');

export const nameSchema = z
  .string()
  .trim()
  .min(2, 'Use at least 2 characters')
  .max(60, 'Use 60 characters or fewer');

export const signupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  // Not checked against the rules here: old passwords may predate a rule change
  password: z.string().min(1, 'Enter your password').max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const tokenSchema = z.string().trim().min(20, 'This link is not valid').max(200);

export const resetPasswordSchema = z.object({
  token: tokenSchema,
  password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const verifyEmailSchema = z.object({
  token: tokenSchema,
});
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password').max(128),
  newPassword: passwordSchema,
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Enter your password to confirm').max(128),
});
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
