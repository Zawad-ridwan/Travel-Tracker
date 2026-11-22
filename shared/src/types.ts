import type { TravelStyle, USER_ROLES } from './constants';

export type UserRole = (typeof USER_ROLES)[number];

/** Response of GET /api/health */
export interface HealthResponse {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
  database: 'connected' | 'disconnected';
  uptimeSeconds: number;
  timestamp: string;
}

/** Shape of every error the API sends back. */
export interface ApiErrorResponse {
  error: {
    message: string;
    code?: string;
    /** Field-by-field problems, e.g. { email: ['Enter a valid email'] } */
    fields?: Record<string, string[]>;
  };
}

/** What the API reveals about the logged-in user. Never includes the password hash. */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  avatarUrl: string | null;
  bio: string;
  homeCountry: string | null;
  travelStyles: TravelStyle[];
  dreamDestination: string;
  profileVisibility: 'public' | 'private';
  onboardingCompleted: boolean;
  xp: number;
  level: number;
  createdAt: string;
}

export interface UserResponse {
  user: PublicUser;
}

export interface MessageResponse {
  message: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** A row in the admin user table. */
export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AdminStats {
  users: {
    total: number;
    verified: number;
    admins: number;
    newLast7Days: number;
  };
  /** Sign-ups per day for the last 14 days, oldest first. */
  signupsByDay: { date: string; count: number }[];
}
