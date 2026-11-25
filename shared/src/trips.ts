/**
 * Trip constants and date helpers, shared by the client and the server.
 *
 * Trip dates are plain calendar dates written as "YYYY-MM-DD" strings (no time, no time zone),
 * so a trip from 12 to 15 January is the same 4 days wherever the traveller is.
 */

export const TRIP_LIMITS = {
  /** Longest trip, in days. */
  maxDays: 60,
  tripsPerUser: 100,
  itemsPerTrip: 300,
  expensesPerTrip: 1000,
  packingPerTrip: 300,
  maxTravelers: 20,
  maxAmount: 1_000_000_000,
} as const;

/** Cover colours for trip cards (the client turns each into a gradient). */
export const TRIP_COVERS = ['sunset', 'ocean', 'mustard', 'forest', 'dusk'] as const;
export type TripCover = (typeof TRIP_COVERS)[number];

/** Kinds of things in an itinerary. */
export const ITEM_KINDS = [
  { id: 'place', label: 'Sightseeing' },
  { id: 'food', label: 'Food & drink' },
  { id: 'activity', label: 'Activity' },
  { id: 'transport', label: 'Transport' },
  { id: 'stay', label: 'Stay' },
  { id: 'note', label: 'Note' },
] as const;
export type ItemKind = (typeof ITEM_KINDS)[number]['id'];
export const ITEM_KIND_IDS = ITEM_KINDS.map((k) => k.id) as [ItemKind, ...ItemKind[]];

export const EXPENSE_CATEGORIES = [
  { id: 'accommodation', label: 'Accommodation' },
  { id: 'food', label: 'Food & dining' },
  { id: 'transport', label: 'Transport' },
  { id: 'activities', label: 'Activities' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'other', label: 'Other' },
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]['id'];
export const EXPENSE_CATEGORY_IDS = EXPENSE_CATEGORIES.map((c) => c.id) as [
  ExpenseCategory,
  ...ExpenseCategory[],
];

export const PACKING_CATEGORIES = [
  { id: 'documents', label: 'Documents & money' },
  { id: 'clothes', label: 'Clothes' },
  { id: 'toiletries', label: 'Toiletries' },
  { id: 'tech', label: 'Tech' },
  { id: 'health', label: 'Health' },
  { id: 'gear', label: 'Gear' },
  { id: 'other', label: 'Other' },
] as const;
export type PackingCategory = (typeof PACKING_CATEGORIES)[number]['id'];
export const PACKING_CATEGORY_IDS = PACKING_CATEGORIES.map((c) => c.id) as [
  PackingCategory,
  ...PackingCategory[],
];

type TemplateItem = readonly [label: string, category: PackingCategory];

/** Ready-made packing lists. Adding one skips items the list already has. */
export const PACKING_TEMPLATES = {
  essentials: {
    label: 'Essentials',
    items: [
      ['Passport / ID', 'documents'],
      ['Tickets & bookings', 'documents'],
      ['Cards & some cash', 'documents'],
      ['Travel insurance details', 'documents'],
      ['Phone & charger', 'tech'],
      ['Power bank', 'tech'],
      ['Plug adapter', 'tech'],
      ['Toothbrush & toothpaste', 'toiletries'],
      ['Medicines', 'health'],
      ['Underwear & socks', 'clothes'],
      ['Sleepwear', 'clothes'],
      ['Reusable water bottle', 'gear'],
    ],
  },
  beach: {
    label: 'Beach',
    items: [
      ['Swimwear', 'clothes'],
      ['Sunscreen', 'toiletries'],
      ['Sunglasses', 'gear'],
      ['Hat', 'clothes'],
      ['Flip-flops', 'clothes'],
      ['Beach towel', 'gear'],
      ['After-sun lotion', 'toiletries'],
      ['Waterproof phone pouch', 'tech'],
    ],
  },
  city: {
    label: 'City break',
    items: [
      ['Comfortable walking shoes', 'clothes'],
      ['Day bag', 'gear'],
      ['Smart outfit for dinner', 'clothes'],
      ['Umbrella', 'gear'],
      ['Offline maps downloaded', 'tech'],
      ['Transit card / app', 'documents'],
    ],
  },
  hiking: {
    label: 'Hiking',
    items: [
      ['Hiking boots', 'clothes'],
      ['Rain jacket', 'clothes'],
      ['Warm layer', 'clothes'],
      ['Backpack', 'gear'],
      ['Head torch', 'gear'],
      ['First-aid kit', 'health'],
      ['Snacks', 'other'],
      ['Insect repellent', 'health'],
    ],
  },
  winter: {
    label: 'Winter',
    items: [
      ['Warm coat', 'clothes'],
      ['Thermal layers', 'clothes'],
      ['Gloves', 'clothes'],
      ['Woolly hat', 'clothes'],
      ['Scarf', 'clothes'],
      ['Lip balm', 'toiletries'],
      ['Moisturiser', 'toiletries'],
    ],
  },
  business: {
    label: 'Business',
    items: [
      ['Laptop & charger', 'tech'],
      ['Business cards', 'documents'],
      ['Formal outfit', 'clothes'],
      ['Notebook & pen', 'other'],
      ['Presentation on a USB stick', 'tech'],
    ],
  },
} as const satisfies Record<string, { label: string; items: readonly TemplateItem[] }>;
export type PackingTemplate = keyof typeof PACKING_TEMPLATES;
export const PACKING_TEMPLATE_IDS = Object.keys(PACKING_TEMPLATES) as [
  PackingTemplate,
  ...PackingTemplate[],
];

/**
 * Rough daily spend per traveller in US dollars, used to suggest a budget.
 * Replaces the old "low / mid / high" vacation plans with a one-tap estimate.
 */
export const BUDGET_STYLES = [
  { id: 'shoestring', label: 'Shoestring', perDayUsd: 35, description: 'Hostels, street food, buses' },
  { id: 'comfort', label: 'Comfort', perDayUsd: 100, description: '3-star hotels, cafés, some tours' },
  { id: 'luxury', label: 'Luxury', perDayUsd: 300, description: 'Top hotels, fine dining, private transfers' },
] as const;
export type BudgetStyle = (typeof BUDGET_STYLES)[number]['id'];

/* ---------------- Dates ---------------- */

const DAY_MS = 86_400_000;
export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function toUtc(date: string) {
  return Date.parse(`${date}T00:00:00Z`);
}

/** True for a real calendar date written as YYYY-MM-DD (rejects 2026-02-30). */
export function isValidIsoDate(value: string) {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const ms = toUtc(value);
  return !Number.isNaN(ms) && new Date(ms).toISOString().slice(0, 10) === value;
}

export function addDays(date: string, days: number) {
  return new Date(toUtc(date) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Whole days from one date to another: daysBetween('2026-01-01', '2026-01-03') === 2. */
export function daysBetween(from: string, to: string) {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS);
}

/** Number of days in a trip, counting both the first and last day. */
export function tripLength(startDate: string, endDate: string) {
  return daysBetween(startDate, endDate) + 1;
}

/** Every date of a trip, in order. */
export function tripDates(startDate: string, endDate: string) {
  const length = Math.max(0, Math.min(tripLength(startDate, endDate), TRIP_LIMITS.maxDays));
  return Array.from({ length }, (_, i) => addDays(startDate, i));
}

/** Today's date on this device, as YYYY-MM-DD. */
export function todayIso(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export type TripPhase = 'upcoming' | 'ongoing' | 'past';

export function tripPhase(startDate: string, endDate: string, today = todayIso()): TripPhase {
  if (today < startDate) return 'upcoming';
  if (today > endDate) return 'past';
  return 'ongoing';
}
