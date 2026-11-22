import { XP_PER_LEVEL, type AdminUserRow, type PublicUser } from '@tt/shared';
import type { UserDocument } from '../models/User';

export function levelForXp(xp: number) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

/** The only shape in which a user ever leaves the server. Never includes the password hash. */
export function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: user.id as string,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    avatarUrl: user.avatarUrl ?? null,
    bio: user.bio ?? '',
    homeCountry: user.homeCountry ?? null,
    travelStyles: [...(user.travelStyles ?? [])],
    dreamDestination: user.dreamDestination ?? '',
    profileVisibility: user.profileVisibility,
    onboardingCompleted: user.onboardingCompleted,
    xp: user.xp,
    level: levelForXp(user.xp),
    createdAt: user.createdAt.toISOString(),
  };
}

export function toAdminUserRow(user: UserDocument): AdminUserRow {
  return {
    id: user.id as string,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
  };
}
