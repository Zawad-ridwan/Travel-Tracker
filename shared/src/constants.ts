export const APP_NAME = 'Travel Tracker';
export const APP_TAGLINE = 'Plan it. Live it. Stamp it.';

/** Every API route starts with this prefix. */
export const API_PREFIX = '/api';

/**
 * Every request that changes data must send this header.
 * Browsers never add custom headers to cross-site form posts,
 * so this blocks CSRF attacks together with SameSite cookies.
 */
export const CLIENT_HEADER = 'X-TT-Client';

/** User roles. Admin pages and routes require the "admin" role. */
export const USER_ROLES = ['user', 'admin'] as const;

export const PASSWORD_MIN_LENGTH = 8;

/** Answers for the onboarding quiz: "What kind of traveller are you?" */
export const TRAVEL_STYLES = [
  { id: 'adventure', label: 'Adventure' },
  { id: 'relaxation', label: 'Relaxation' },
  { id: 'culture', label: 'Culture & history' },
  { id: 'food', label: 'Food & drink' },
  { id: 'nature', label: 'Nature & hiking' },
  { id: 'city', label: 'City breaks' },
  { id: 'budget', label: 'Budget travel' },
  { id: 'luxury', label: 'Luxury' },
  { id: 'road-trip', label: 'Road trips' },
  { id: 'backpacking', label: 'Backpacking' },
] as const;

export type TravelStyle = (typeof TRAVEL_STYLES)[number]['id'];

export const TRAVEL_STYLE_IDS = TRAVEL_STYLES.map((s) => s.id) as [TravelStyle, ...TravelStyle[]];

/** XP awarded for actions. More arrive with check-ins and journeys (Phase 4). */
export const XP_REWARDS = {
  verifyEmail: 25,
  completeOnboarding: 25,
  /** Taken back if the trip is deleted, so it cannot be farmed. */
  planTrip: 20,
} as const;

export const XP_PER_LEVEL = 100;
