import { z } from 'zod';
import { TRAVEL_STYLE_IDS } from '../constants';
import { COUNTRY_CODES } from '../data/countries';
import { nameSchema } from './auth';

export const countryCodeSchema = z
  .string()
  .refine((code) => COUNTRY_CODES.includes(code), 'Choose a country from the list');

export const profileVisibilitySchema = z.enum(['public', 'private']);

/** PATCH /api/users/me — every field is optional; send only what changed. */
export const updateProfileSchema = z
  .object({
    name: nameSchema,
    bio: z.string().trim().max(280, 'Keep it under 280 characters'),
    homeCountry: countryCodeSchema.nullable(),
    travelStyles: z.array(z.enum(TRAVEL_STYLE_IDS)).max(5, 'Pick up to 5'),
    dreamDestination: z.string().trim().max(80, 'Use 80 characters or fewer'),
    profileVisibility: profileVisibilitySchema,
  })
  .partial()
  .strict();
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/** The 3-step onboarding quiz after sign up. */
export const onboardingSchema = z.object({
  travelStyles: z
    .array(z.enum(TRAVEL_STYLE_IDS))
    .min(1, 'Pick at least one')
    .max(5, 'Pick up to 5'),
  homeCountry: countryCodeSchema,
  dreamDestination: z.string().trim().max(80, 'Use 80 characters or fewer'),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;

/** Query string for GET /api/admin/users */
export const adminUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
});
export type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>;
