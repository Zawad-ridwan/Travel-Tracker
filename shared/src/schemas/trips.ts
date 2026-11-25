import { z } from 'zod';
import { CURRENCY_CODES } from '../data/currencies';
import {
  EXPENSE_CATEGORY_IDS,
  isValidIsoDate,
  ITEM_KIND_IDS,
  PACKING_CATEGORY_IDS,
  PACKING_TEMPLATE_IDS,
  TIME_PATTERN,
  TRIP_COVERS,
  TRIP_LIMITS,
  tripLength,
} from '../trips';
import { countryCodeSchema } from './profile';

/** Rules for the trip API. The React forms use the same messages. */

export const isoDateSchema = z
  .string()
  .refine((v) => isValidIsoDate(v), 'Pick a valid date');

export const timeSchema = z.string().regex(TIME_PATTERN, 'Use a time like 09:30');

export const currencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .refine((code) => CURRENCY_CODES.includes(code), 'Choose a currency from the list');

/** A money amount: 0 or more, at most 2 decimals (rounded). */
export const amountSchema = z
  .number({ error: 'Enter an amount' })
  .min(0, 'Use 0 or more')
  .max(TRIP_LIMITS.maxAmount, 'That amount is too large')
  .transform((n) => Math.round(n * 100) / 100);

const titleSchema = z
  .string()
  .trim()
  .min(1, 'Give it a name')
  .max(80, 'Use 80 characters or fewer');

const tripFields = {
  title: titleSchema,
  destination: z.string().trim().max(80, 'Use 80 characters or fewer'),
  countryCode: countryCodeSchema.nullable(),
  startDate: isoDateSchema,
  endDate: isoDateSchema,
  currency: currencySchema,
  budget: amountSchema,
  travelers: z
    .number()
    .int()
    .min(1, 'At least 1 traveller')
    .max(TRIP_LIMITS.maxTravelers, `Up to ${TRIP_LIMITS.maxTravelers} travellers`),
  notes: z.string().trim().max(2000, 'Use 2000 characters or fewer'),
  cover: z.enum(TRIP_COVERS),
};

type DateRange = { startDate?: string; endDate?: string };

/** "End after start" and "not too long" checks for anything with both dates. */
function checkDates(trip: DateRange, ctx: z.RefinementCtx) {
  const { startDate, endDate } = trip;
  if (!startDate || !endDate || !isValidIsoDate(startDate) || !isValidIsoDate(endDate)) return;
  if (endDate < startDate) {
    ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'The trip must end on or after it starts' });
  } else if (tripLength(startDate, endDate) > TRIP_LIMITS.maxDays) {
    ctx.addIssue({
      code: 'custom',
      path: ['endDate'],
      message: `Trips can be up to ${TRIP_LIMITS.maxDays} days long`,
    });
  }
}

/** POST /api/trips */
export const createTripSchema = z
  .object({
    ...tripFields,
    destination: tripFields.destination.default(''),
    countryCode: tripFields.countryCode.default(null),
    budget: tripFields.budget.default(0),
    travelers: tripFields.travelers.default(1),
    notes: tripFields.notes.default(''),
    cover: tripFields.cover.default('sunset'),
    /** Optional packing list to start with. */
    packingTemplate: z.enum(PACKING_TEMPLATE_IDS).optional(),
  })
  .strict()
  .superRefine(checkDates);
export type CreateTripInput = z.input<typeof createTripSchema>;

/**
 * PATCH /api/trips/:id — send only what changed.
 * If the currency changes, expenses and planned costs are converted automatically;
 * set convertBudget to convert the budget too.
 */
export const updateTripSchema = z
  .object({ ...tripFields, convertBudget: z.boolean() })
  .partial()
  .strict()
  .superRefine(checkDates);
export type UpdateTripInput = z.input<typeof updateTripSchema>;

/* ---------------- Itinerary ---------------- */

const itemFields = {
  /** null = "Ideas" (not on a day yet) */
  date: isoDateSchema.nullable(),
  kind: z.enum(ITEM_KIND_IDS),
  title: z.string().trim().min(1, 'Give it a name').max(120, 'Use 120 characters or fewer'),
  time: timeSchema.nullable(),
  endTime: timeSchema.nullable(),
  location: z.string().trim().max(160, 'Use 160 characters or fewer'),
  notes: z.string().trim().max(1000, 'Use 1000 characters or fewer'),
  /** Planned cost in the trip's currency. */
  cost: amountSchema.nullable(),
};

type TimeRange = { time?: string | null; endTime?: string | null };

function checkTimes(item: TimeRange, ctx: z.RefinementCtx) {
  if (item.endTime && !item.time) {
    ctx.addIssue({ code: 'custom', path: ['time'], message: 'Add a start time too' });
  } else if (item.time && item.endTime && item.endTime <= item.time) {
    ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'End after it starts' });
  }
}

/** POST /api/trips/:id/items */
export const createItemSchema = z
  .object({
    ...itemFields,
    date: itemFields.date.default(null),
    kind: itemFields.kind.default('place'),
    time: itemFields.time.default(null),
    endTime: itemFields.endTime.default(null),
    location: itemFields.location.default(''),
    notes: itemFields.notes.default(''),
    cost: itemFields.cost.default(null),
  })
  .strict()
  .superRefine(checkTimes);
export type CreateItemInput = z.input<typeof createItemSchema>;

/**
 * PATCH /api/trips/:id/items/:itemId
 * Times are only compared here when both are sent; the server checks them against the saved plan too.
 */
export const updateItemSchema = z
  .object(itemFields)
  .partial()
  .strict()
  .superRefine((item, ctx) => {
    if (item.time && item.endTime && item.endTime <= item.time) {
      ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'End after it starts' });
    }
  });
export type UpdateItemInput = z.input<typeof updateItemSchema>;

const objectIdSchema = z.string().regex(/^[a-f0-9]{24}$/, 'Unknown item');

/**
 * PUT /api/trips/:id/itinerary — the whole arrangement after a drag and drop.
 * Every item must appear exactly once.
 */
export const reorderItinerarySchema = z
  .object({
    columns: z
      .array(
        z.object({
          date: isoDateSchema.nullable(),
          itemIds: z.array(objectIdSchema).max(TRIP_LIMITS.itemsPerTrip),
        }),
      )
      .max(TRIP_LIMITS.maxDays + 1),
  })
  .strict();
export type ReorderItineraryInput = z.infer<typeof reorderItinerarySchema>;

/* ---------------- Budget ---------------- */

const expenseFields = {
  title: z.string().trim().min(1, 'What was it for?').max(120, 'Use 120 characters or fewer'),
  category: z.enum(EXPENSE_CATEGORY_IDS),
  amount: amountSchema.refine((n) => n > 0, 'Enter an amount above 0'),
  /** The currency it was paid in. Converted to the trip's currency on the server. */
  currency: currencySchema,
  date: isoDateSchema,
};

/** POST /api/trips/:id/expenses */
export const createExpenseSchema = z.object(expenseFields).strict();
export type CreateExpenseInput = z.input<typeof createExpenseSchema>;

/** PATCH /api/trips/:id/expenses/:expenseId */
export const updateExpenseSchema = z.object(expenseFields).partial().strict();
export type UpdateExpenseInput = z.input<typeof updateExpenseSchema>;

/* ---------------- Packing ---------------- */

const packingLabelSchema = z
  .string()
  .trim()
  .min(1, 'Name the item')
  .max(80, 'Use 80 characters or fewer');

/** POST /api/trips/:id/packing */
export const createPackingSchema = z
  .object({
    label: packingLabelSchema,
    category: z.enum(PACKING_CATEGORY_IDS).default('other'),
  })
  .strict();
export type CreatePackingInput = z.input<typeof createPackingSchema>;

/** PATCH /api/trips/:id/packing/:itemId */
export const updatePackingSchema = z
  .object({
    label: packingLabelSchema,
    category: z.enum(PACKING_CATEGORY_IDS),
    packed: z.boolean(),
  })
  .partial()
  .strict();
export type UpdatePackingInput = z.input<typeof updatePackingSchema>;

/** POST /api/trips/:id/packing/template */
export const packingTemplateSchema = z.object({ template: z.enum(PACKING_TEMPLATE_IDS) }).strict();
export type PackingTemplateInput = z.infer<typeof packingTemplateSchema>;
