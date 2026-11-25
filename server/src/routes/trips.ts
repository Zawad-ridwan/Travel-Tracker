import { Router, type Response } from 'express';
import { Types } from 'mongoose';
import {
  createExpenseSchema,
  createItemSchema,
  createPackingSchema,
  createTripSchema,
  crossRate,
  packingTemplateSchema,
  PACKING_TEMPLATES,
  reorderItinerarySchema,
  roundMoney,
  TRIP_LIMITS,
  tripLength,
  updateExpenseSchema,
  updateItemSchema,
  updatePackingSchema,
  updateTripSchema,
  XP_REWARDS,
  type PackingCategory,
  type PackingTemplate,
  type TripListResponse,
  type TripResponse,
} from '@tt/shared';
import { convert, getRates } from '../lib/currency';
import { buildTripCalendar, calendarFileName } from '../lib/ics';
import { toTrip, toTripSummary, type TripSummaryRow } from '../lib/serialize';
import { parse } from '../lib/validate';
import { requireAuth } from '../middleware/auth';
import { HttpError } from '../middleware/errors';
import { Trip, type TripDocument } from '../models/Trip';
import { User } from '../models/User';

export const tripsRouter = Router();

tripsRouter.use(requireAuth);

/* ---------------- Helpers ---------------- */

const OBJECT_ID = /^[a-f0-9]{24}$/i;

function notFound(what: string) {
  return new HttpError(404, `${what} not found`, 'NOT_FOUND');
}

/** A 400 error shown under one form field. */
function fieldError(field: string, message: string, status = 400, code = 'VALIDATION_ERROR') {
  return new HttpError(status, message, code, { [field]: [message] });
}

/** Loads one of the user's own trips. Someone else's trip looks exactly like a missing one. */
async function loadTrip(userId: string, tripId: string | undefined): Promise<TripDocument> {
  if (!tripId || !OBJECT_ID.test(tripId)) throw notFound('Trip');
  const trip = await Trip.findOne({ _id: tripId, ownerId: userId });
  if (!trip) throw notFound('Trip');
  return trip;
}

/** Finds a plan, expense or packing item inside a trip. */
function findIn<T extends { _id: Types.ObjectId }>(
  list: Types.DocumentArray<T>,
  id: string | undefined,
  what: string,
) {
  const entry = id && OBJECT_ID.test(id) ? list.id(id) : null;
  if (!entry) throw notFound(what);
  return entry;
}

function sendTrip(res: Response, trip: TripDocument, status = 200) {
  const body: TripResponse = { trip: toTrip(trip) };
  res.status(status).json(body);
}

function checkDateRange(startDate: string, endDate: string) {
  if (endDate < startDate) {
    throw fieldError('endDate', 'The trip must end on or after it starts');
  }
  if (tripLength(startDate, endDate) > TRIP_LIMITS.maxDays) {
    throw fieldError('endDate', `Trips can be up to ${TRIP_LIMITS.maxDays} days long`);
  }
}

/** A plan's day must be inside the trip (or null for "Ideas"). */
function checkDayInTrip(trip: TripDocument, date: string | null, field = 'date') {
  if (date !== null && (date < trip.startDate || date > trip.endDate)) {
    throw fieldError(field, 'Pick a day within the trip');
  }
}

function checkTimes(time: string | null, endTime: string | null) {
  if (endTime && !time) throw fieldError('time', 'Add a start time too');
  if (time && endTime && endTime <= time) throw fieldError('endTime', 'End after it starts');
}

function itemsOn(trip: TripDocument, date: string | null) {
  return trip.items.filter((item) => (item.date ?? null) === date);
}

/** The position after the last plan of a day. */
function nextOrder(trip: TripDocument, date: string | null) {
  return itemsOn(trip, date).reduce((max, item) => Math.max(max, item.order + 1), 0);
}

/** Closes gaps after a plan leaves a day: 0, 2, 3 → 0, 1, 2. */
function renumber(trip: TripDocument, date: string | null) {
  itemsOn(trip, date)
    .sort((a, b) => a.order - b.order)
    .forEach((item, index) => {
      item.order = index;
    });
}

/** Template items, plus the essentials for any themed template. */
function templateItems(template: PackingTemplate) {
  const lists =
    template === 'essentials'
      ? [PACKING_TEMPLATES.essentials]
      : [PACKING_TEMPLATES.essentials, PACKING_TEMPLATES[template]];
  return lists.flatMap((list) =>
    list.items.map(([label, category]) => ({ label, category: category as PackingCategory })),
  );
}

/** Adds template items the list doesn't have yet. Returns how many were added. */
function addTemplate(trip: TripDocument, template: PackingTemplate) {
  const have = new Set(trip.packing.map((p) => p.label.toLowerCase()));
  let added = 0;
  for (const item of templateItems(template)) {
    if (trip.packing.length >= TRIP_LIMITS.packingPerTrip) break;
    if (have.has(item.label.toLowerCase())) continue;
    trip.packing.push({ ...item, packed: false });
    have.add(item.label.toLowerCase());
    added++;
  }
  return added;
}

function checkUniqueLabel(trip: TripDocument, label: string, exceptId?: string) {
  const taken = trip.packing.some(
    (p) => p.label.toLowerCase() === label.toLowerCase() && p._id.toString() !== exceptId,
  );
  if (taken) throw fieldError('label', 'That is already on your list', 409, 'DUPLICATE');
}

/* ---------------- Trips ---------------- */

/** GET /api/trips — the user's trips with totals, soonest first. */
tripsRouter.get('/', async (req, res) => {
  const rows = await Trip.aggregate<TripSummaryRow>([
    { $match: { ownerId: new Types.ObjectId(req.auth!.userId) } },
    { $sort: { startDate: 1, createdAt: 1 } },
    {
      $project: {
        title: 1,
        destination: 1,
        countryCode: 1,
        startDate: 1,
        endDate: 1,
        currency: 1,
        budget: 1,
        travelers: 1,
        cover: 1,
        createdAt: 1,
        updatedAt: 1,
        spent: { $sum: '$expenses.convertedAmount' },
        plannedCost: { $sum: '$items.cost' },
        itemCount: { $size: { $ifNull: ['$items', []] } },
        packingTotal: { $size: { $ifNull: ['$packing', []] } },
        packingPacked: {
          $size: {
            $filter: { input: { $ifNull: ['$packing', []] }, as: 'p', cond: '$$p.packed' },
          },
        },
      },
    },
  ]);
  const body: TripListResponse = { trips: rows.map(toTripSummary) };
  res.json(body);
});

/** POST /api/trips — plan a new trip (+20 XP). */
tripsRouter.post('/', async (req, res) => {
  const { packingTemplate, ...data } = parse(createTripSchema, req.body);
  const userId = req.auth!.userId;

  if (!(await User.exists({ _id: userId }))) {
    throw new HttpError(401, 'Please log in to continue', 'UNAUTHENTICATED');
  }
  if ((await Trip.countDocuments({ ownerId: userId })) >= TRIP_LIMITS.tripsPerUser) {
    throw new HttpError(
      400,
      `You can keep up to ${TRIP_LIMITS.tripsPerUser} trips. Delete an old one first.`,
      'LIMIT_REACHED',
    );
  }

  const trip = new Trip({ ...data, ownerId: userId, xpAwarded: XP_REWARDS.planTrip });
  if (packingTemplate) addTemplate(trip, packingTemplate);
  await trip.save();
  await User.updateOne({ _id: userId }, { $inc: { xp: XP_REWARDS.planTrip } });

  sendTrip(res, trip, 201);
});

/** GET /api/trips/:id */
tripsRouter.get('/:id', async (req, res) => {
  sendTrip(res, await loadTrip(req.auth!.userId, req.params.id));
});

/**
 * PATCH /api/trips/:id — change details. Send only what changed.
 * New dates: plans on days that no longer exist move to "Ideas".
 * New currency: expenses and planned costs are converted; the budget too if convertBudget is true
 * (the budget sent with it, or the current one, is read as being in the old currency).
 */
tripsRouter.patch('/:id', async (req, res) => {
  const { convertBudget, ...changes } = parse(updateTripSchema, req.body);
  const trip = await loadTrip(req.auth!.userId, req.params.id);

  const startDate = changes.startDate ?? trip.startDate;
  const endDate = changes.endDate ?? trip.endDate;
  const datesChanged = startDate !== trip.startDate || endDate !== trip.endDate;
  if (datesChanged) checkDateRange(startDate, endDate);

  if (changes.currency && changes.currency !== trip.currency) {
    const to = changes.currency;
    const { rates } = await getRates();
    const rateTo = (from: string) => {
      const rate = crossRate(rates, from, to);
      if (rate === null) {
        throw fieldError('currency', `There is no exchange rate for ${from} right now`, 422, 'NO_RATE');
      }
      return rate;
    };

    const tripRate = rateTo(trip.currency);
    for (const expense of trip.expenses) {
      expense.rate = rateTo(expense.currency);
      expense.convertedAmount = roundMoney(expense.amount * expense.rate);
    }
    for (const item of trip.items) {
      if (item.cost !== null && item.cost !== undefined) item.cost = roundMoney(item.cost * tripRate);
    }
    if (convertBudget) changes.budget = roundMoney((changes.budget ?? trip.budget) * tripRate);
  }

  trip.set(changes);

  if (datesChanged) {
    for (const item of trip.items) {
      if (item.date && (item.date < startDate || item.date > endDate)) {
        item.order = nextOrder(trip, null);
        item.date = null;
      }
    }
  }

  await trip.save();
  sendTrip(res, trip);
});

/** DELETE /api/trips/:id — also takes back the XP it earned. */
tripsRouter.delete('/:id', async (req, res) => {
  const trip = await loadTrip(req.auth!.userId, req.params.id);
  await trip.deleteOne();

  if (trip.xpAwarded > 0) {
    const user = await User.findById(req.auth!.userId);
    if (user) {
      user.xp = Math.max(0, user.xp - trip.xpAwarded);
      await user.save();
    }
  }
  res.json({ message: 'Trip deleted' });
});

/** GET /api/trips/:id/calendar.ics — the trip and its plans, for any calendar app. */
tripsRouter.get('/:id/calendar.ics', async (req, res) => {
  const trip = toTrip(await loadTrip(req.auth!.userId, req.params.id));
  res
    .attachment(calendarFileName(trip.title))
    .type('text/calendar; charset=utf-8')
    .send(buildTripCalendar(trip));
});

/* ---------------- Itinerary ---------------- */

/** POST /api/trips/:id/items — add a plan to a day (or to Ideas). */
tripsRouter.post('/:id/items', async (req, res) => {
  const input = parse(createItemSchema, req.body);
  const trip = await loadTrip(req.auth!.userId, req.params.id);

  if (trip.items.length >= TRIP_LIMITS.itemsPerTrip) {
    throw new HttpError(400, `A trip can hold up to ${TRIP_LIMITS.itemsPerTrip} plans`, 'LIMIT_REACHED');
  }
  checkDayInTrip(trip, input.date);

  trip.items.push({ ...input, order: nextOrder(trip, input.date) });
  await trip.save();
  sendTrip(res, trip, 201);
});

/** PATCH /api/trips/:id/items/:itemId — edit a plan, or move it to another day (it goes last). */
tripsRouter.patch('/:id/items/:itemId', async (req, res) => {
  const { date, ...changes } = parse(updateItemSchema, req.body);
  const trip = await loadTrip(req.auth!.userId, req.params.id);
  const item = findIn(trip.items, req.params.itemId, 'Plan');

  checkTimes(
    changes.time !== undefined ? changes.time : (item.time ?? null),
    changes.endTime !== undefined ? changes.endTime : (item.endTime ?? null),
  );
  item.set(changes);

  const oldDate = item.date ?? null;
  if (date !== undefined && date !== oldDate) {
    checkDayInTrip(trip, date);
    item.order = nextOrder(trip, date);
    item.date = date;
    renumber(trip, oldDate);
  }

  await trip.save();
  sendTrip(res, trip);
});

/** DELETE /api/trips/:id/items/:itemId */
tripsRouter.delete('/:id/items/:itemId', async (req, res) => {
  const trip = await loadTrip(req.auth!.userId, req.params.id);
  const item = findIn(trip.items, req.params.itemId, 'Plan');

  const date = item.date ?? null;
  trip.items.pull(item._id);
  renumber(trip, date);
  await trip.save();
  sendTrip(res, trip);
});

/**
 * PUT /api/trips/:id/itinerary — saves the arrangement after drag and drop.
 * Lists every day (and Ideas) with its plans in order; every plan must appear exactly once.
 */
tripsRouter.put('/:id/itinerary', async (req, res) => {
  const { columns } = parse(reorderItinerarySchema, req.body);
  const trip = await loadTrip(req.auth!.userId, req.params.id);

  const days = new Set<string>();
  const ids = new Set<string>();
  for (const column of columns) {
    const key = column.date ?? 'ideas';
    if (days.has(key)) throw new HttpError(400, 'Each day can appear only once', 'VALIDATION_ERROR');
    days.add(key);
    checkDayInTrip(trip, column.date, 'columns');
    for (const id of column.itemIds) {
      if (ids.has(id)) throw new HttpError(400, 'A plan appears twice', 'VALIDATION_ERROR');
      ids.add(id);
    }
  }

  const matches =
    ids.size === trip.items.length && trip.items.every((item) => ids.has(item._id.toString()));
  if (!matches) {
    throw new HttpError(
      409,
      'Your itinerary changed somewhere else. Refresh the page and try again.',
      'STALE_ITINERARY',
    );
  }

  for (const column of columns) {
    column.itemIds.forEach((id, index) => {
      const item = trip.items.id(id);
      if (item) {
        item.date = column.date;
        item.order = index;
      }
    });
  }

  await trip.save();
  sendTrip(res, trip);
});

/* ---------------- Budget ---------------- */

/** POST /api/trips/:id/expenses — paid in any currency; converted to the trip's currency. */
tripsRouter.post('/:id/expenses', async (req, res) => {
  const input = parse(createExpenseSchema, req.body);
  const trip = await loadTrip(req.auth!.userId, req.params.id);

  if (trip.expenses.length >= TRIP_LIMITS.expensesPerTrip) {
    throw new HttpError(400, `A trip can hold up to ${TRIP_LIMITS.expensesPerTrip} expenses`, 'LIMIT_REACHED');
  }

  const { rate, converted } = await convert(input.amount, input.currency, trip.currency);
  trip.expenses.push({ ...input, rate, convertedAmount: converted });
  await trip.save();
  sendTrip(res, trip, 201);
});

/**
 * PATCH /api/trips/:id/expenses/:expenseId
 * A new currency uses today's rate; a new amount in the same currency keeps the original rate.
 */
tripsRouter.patch('/:id/expenses/:expenseId', async (req, res) => {
  const changes = parse(updateExpenseSchema, req.body);
  const trip = await loadTrip(req.auth!.userId, req.params.id);
  const expense = findIn(trip.expenses, req.params.expenseId, 'Expense');

  const oldCurrency = expense.currency;
  expense.set(changes);

  if (expense.currency !== oldCurrency) {
    const { rate, converted } = await convert(expense.amount, expense.currency, trip.currency);
    expense.rate = rate;
    expense.convertedAmount = converted;
  } else if (changes.amount !== undefined) {
    expense.convertedAmount = roundMoney(expense.amount * expense.rate);
  }

  await trip.save();
  sendTrip(res, trip);
});

/** DELETE /api/trips/:id/expenses/:expenseId */
tripsRouter.delete('/:id/expenses/:expenseId', async (req, res) => {
  const trip = await loadTrip(req.auth!.userId, req.params.id);
  const expense = findIn(trip.expenses, req.params.expenseId, 'Expense');
  trip.expenses.pull(expense._id);
  await trip.save();
  sendTrip(res, trip);
});

/* ---------------- Packing ---------------- */

/** POST /api/trips/:id/packing — add one item. */
tripsRouter.post('/:id/packing', async (req, res) => {
  const input = parse(createPackingSchema, req.body);
  const trip = await loadTrip(req.auth!.userId, req.params.id);

  if (trip.packing.length >= TRIP_LIMITS.packingPerTrip) {
    throw new HttpError(400, `A list can hold up to ${TRIP_LIMITS.packingPerTrip} items`, 'LIMIT_REACHED');
  }
  checkUniqueLabel(trip, input.label);

  trip.packing.push({ ...input, packed: false });
  await trip.save();
  sendTrip(res, trip, 201);
});

/** POST /api/trips/:id/packing/template — add a ready-made list (skips items already there). */
tripsRouter.post('/:id/packing/template', async (req, res) => {
  const { template } = parse(packingTemplateSchema, req.body);
  const trip = await loadTrip(req.auth!.userId, req.params.id);
  addTemplate(trip, template);
  await trip.save();
  sendTrip(res, trip);
});

/** POST /api/trips/:id/packing/unpack-all — untick everything (handy for the trip home). */
tripsRouter.post('/:id/packing/unpack-all', async (req, res) => {
  const trip = await loadTrip(req.auth!.userId, req.params.id);
  for (const item of trip.packing) item.packed = false;
  await trip.save();
  sendTrip(res, trip);
});

/** PATCH /api/trips/:id/packing/:itemId — tick, untick or rename. */
tripsRouter.patch('/:id/packing/:itemId', async (req, res) => {
  const changes = parse(updatePackingSchema, req.body);
  const trip = await loadTrip(req.auth!.userId, req.params.id);
  const item = findIn(trip.packing, req.params.itemId, 'Item');

  if (changes.label !== undefined) checkUniqueLabel(trip, changes.label, item._id.toString());
  item.set(changes);
  await trip.save();
  sendTrip(res, trip);
});

/** DELETE /api/trips/:id/packing/:itemId */
tripsRouter.delete('/:id/packing/:itemId', async (req, res) => {
  const trip = await loadTrip(req.auth!.userId, req.params.id);
  const item = findIn(trip.packing, req.params.itemId, 'Item');
  trip.packing.pull(item._id);
  await trip.save();
  sendTrip(res, trip);
});
