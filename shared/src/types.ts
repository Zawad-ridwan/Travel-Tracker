import type { TravelStyle, USER_ROLES } from './constants';
import type { ExpenseCategory, ItemKind, PackingCategory, TripCover } from './trips';

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

/* ---------------- Trips (Phase 2) ---------------- */

/** One stop or plan in the itinerary. */
export interface TripItem {
  id: string;
  /** The day it happens, or null while it is still an idea. */
  date: string | null;
  /** Position within its day (0 = first). */
  order: number;
  kind: ItemKind;
  title: string;
  /** "HH:mm" or null */
  time: string | null;
  endTime: string | null;
  location: string;
  notes: string;
  /** Planned cost in the trip's currency. */
  cost: number | null;
}

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  /** What was paid, in the currency it was paid in. */
  amount: number;
  currency: string;
  /** The same amount in the trip's currency. */
  convertedAmount: number;
  /** 1 unit of `currency` in the trip's currency, when it was converted. */
  rate: number;
  date: string;
  createdAt: string;
}

export interface PackingItem {
  id: string;
  label: string;
  category: PackingCategory;
  packed: boolean;
}

interface TripBase {
  id: string;
  title: string;
  destination: string;
  countryCode: string | null;
  /** YYYY-MM-DD */
  startDate: string;
  endDate: string;
  /** The currency the budget is kept in. */
  currency: string;
  budget: number;
  travelers: number;
  cover: TripCover;
  createdAt: string;
  updatedAt: string;
}

/** A whole trip, as shown on its own page. */
export interface Trip extends TripBase {
  notes: string;
  items: TripItem[];
  expenses: Expense[];
  packing: PackingItem[];
}

/** A trip card in the list: totals instead of every detail. */
export interface TripSummary extends TripBase {
  spent: number;
  plannedCost: number;
  itemCount: number;
  packing: { total: number; packed: number };
}

export interface TripResponse {
  trip: Trip;
}

export interface TripListResponse {
  trips: TripSummary[];
}

/** GET /api/currency/rates — how many of each currency one US dollar buys. */
export interface ExchangeRates {
  base: 'USD';
  rates: Record<string, number>;
  /** When the provider last updated the rates (ISO time). */
  updatedAt: string;
  source: 'exchangerate-api' | 'frankfurter';
}
