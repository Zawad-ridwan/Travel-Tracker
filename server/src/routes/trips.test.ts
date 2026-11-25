import { describe, expect, it, vi } from 'vitest';
import type { Trip } from '@tt/shared';
import { clearRatesForTests } from '../lib/currency';
import { Trip as TripModel } from '../models/Trip';
import { User } from '../models/User';
import { CLIENT_HEADER, newAgent, signUp, VALID_USER } from '../test/helpers';

const H = CLIENT_HEADER;
type Agent = ReturnType<typeof newAgent>;

const JAPAN = {
  title: 'Autumn in Japan',
  destination: 'Kyoto',
  countryCode: 'JP',
  startDate: '2026-11-01',
  endDate: '2026-11-05',
  currency: 'BDT',
  budget: 150000,
};

async function createTrip(agent: Agent, overrides: Record<string, unknown> = {}): Promise<Trip> {
  const res = await agent.post('/api/trips').set(H, 't').send({ ...JAPAN, ...overrides });
  if (res.status !== 201) throw new Error(`Create failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.trip as Trip;
}

async function addItem(agent: Agent, tripId: string, item: Record<string, unknown>): Promise<Trip> {
  const res = await agent.post(`/api/trips/${tripId}/items`).set(H, 't').send(item);
  if (res.status !== 201) throw new Error(`Add item failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.trip as Trip;
}

function onDay(trip: Trip, date: string | null) {
  return trip.items.filter((i) => i.date === date).map((i) => i.title);
}

describe('creating and listing trips', () => {
  it('creates a trip with defaults and a packing list, and awards 20 XP', async () => {
    const { agent } = await signUp();
    const res = await agent
      .post('/api/trips')
      .set(H, 't')
      .send({ ...JAPAN, packingTemplate: 'beach' });

    expect(res.status).toBe(201);
    expect(res.body.trip).toMatchObject({ ...JAPAN, travelers: 1, cover: 'sunset', notes: '' });
    const labels = (res.body.trip as Trip).packing.map((p) => p.label);
    expect(labels).toContain('Passport / ID'); // essentials come with every template
    expect(labels).toContain('Swimwear');

    const user = await User.findOne({ email: VALID_USER.email });
    expect(user!.xp).toBe(20);
  });

  it('rejects a trip that ends before it starts', async () => {
    const { agent } = await signUp();
    const res = await agent
      .post('/api/trips')
      .set(H, 't')
      .send({ ...JAPAN, startDate: '2026-11-05', endDate: '2026-11-01' });
    expect(res.status).toBe(400);
    expect(res.body.error.fields.endDate).toBeDefined();
  });

  it('rejects unknown currencies and extra fields', async () => {
    const { agent } = await signUp();
    const bad = await agent.post('/api/trips').set(H, 't').send({ ...JAPAN, currency: 'XYZ' });
    expect(bad.body.error.fields.currency).toBeDefined();
    const extra = await agent.post('/api/trips').set(H, 't').send({ ...JAPAN, ownerId: 'abc' });
    expect(extra.status).toBe(400);
  });

  it('requires login', async () => {
    const res = await newAgent().get('/api/trips');
    expect(res.status).toBe(401);
  });

  it('lists trips soonest first with totals', async () => {
    const { agent } = await signUp();
    const later = await createTrip(agent, { title: 'Later', startDate: '2027-01-01', endDate: '2027-01-03' });
    const sooner = await createTrip(agent, { title: 'Sooner', packingTemplate: 'essentials' });

    await addItem(agent, sooner.id, { title: 'Temple', date: '2026-11-02', cost: 500 });
    await agent
      .post(`/api/trips/${sooner.id}/expenses`)
      .set(H, 't')
      .send({ title: 'Train', category: 'transport', amount: 1000, currency: 'BDT', date: '2026-11-01' });
    const firstItem = (await TripModel.findById(sooner.id))!.packing[0]!;
    await agent.patch(`/api/trips/${sooner.id}/packing/${firstItem._id}`).set(H, 't').send({ packed: true });

    const res = await agent.get('/api/trips');
    expect(res.status).toBe(200);
    expect(res.body.trips.map((t: { title: string }) => t.title)).toEqual(['Sooner', 'Later']);
    expect(res.body.trips[0]).toMatchObject({
      spent: 1000,
      plannedCost: 500,
      itemCount: 1,
      packing: { total: 12, packed: 1 },
    });
    expect(res.body.trips[1]).toMatchObject({ id: later.id, spent: 0, itemCount: 0 });
    expect(res.body.trips[0].items).toBeUndefined();
  });
});

describe('privacy', () => {
  it("keeps other people's trips hidden", async () => {
    const { agent: owner } = await signUp();
    const trip = await createTrip(owner);
    const { agent: stranger } = await signUp(newAgent(), {
      name: 'Someone Else',
      email: 'else@example.com',
      password: 'travel123',
    });

    expect((await stranger.get(`/api/trips/${trip.id}`)).status).toBe(404);
    expect((await stranger.patch(`/api/trips/${trip.id}`).set(H, 't').send({ title: 'Mine' })).status).toBe(404);
    expect((await stranger.delete(`/api/trips/${trip.id}`).set(H, 't')).status).toBe(404);
    expect((await stranger.get('/api/trips')).body.trips).toEqual([]);
  });

  it('answers 404 for ids that are not valid', async () => {
    const { agent } = await signUp();
    expect((await agent.get('/api/trips/not-an-id')).status).toBe(404);
    const trip = await createTrip(agent);
    const res = await agent.patch(`/api/trips/${trip.id}/items/nope`).set(H, 't').send({ title: 'x' });
    expect(res.status).toBe(404);
  });
});

describe('editing and deleting trips', () => {
  it('moves plans to Ideas when their day is no longer in the trip', async () => {
    const { agent } = await signUp();
    const trip = await createTrip(agent);
    await addItem(agent, trip.id, { title: 'Day 1 plan', date: '2026-11-01' });
    await addItem(agent, trip.id, { title: 'Day 5 plan', date: '2026-11-05' });

    const res = await agent
      .patch(`/api/trips/${trip.id}`)
      .set(H, 't')
      .send({ startDate: '2026-11-01', endDate: '2026-11-03' });

    expect(res.status).toBe(200);
    expect(onDay(res.body.trip, '2026-11-01')).toEqual(['Day 1 plan']);
    expect(onDay(res.body.trip, null)).toEqual(['Day 5 plan']);
  });

  it('checks a new start date against the existing end date', async () => {
    const { agent } = await signUp();
    const trip = await createTrip(agent);
    const res = await agent.patch(`/api/trips/${trip.id}`).set(H, 't').send({ startDate: '2026-12-01' });
    expect(res.status).toBe(400);
    expect(res.body.error.fields.endDate).toBeDefined();
  });

  it('converts expenses, planned costs and (if asked) the budget when the currency changes', async () => {
    const { agent } = await signUp();
    const trip = await createTrip(agent, { currency: 'BDT', budget: 12000 });
    await addItem(agent, trip.id, { title: 'Dinner', date: '2026-11-01', cost: 2400 });
    await agent
      .post(`/api/trips/${trip.id}/expenses`)
      .set(H, 't')
      .send({ title: 'Taxi', category: 'transport', amount: 1500, currency: 'JPY', date: '2026-11-01' });

    const res = await agent
      .patch(`/api/trips/${trip.id}`)
      .set(H, 't')
      .send({ currency: 'USD', convertBudget: true });

    expect(res.status).toBe(200);
    const updated = res.body.trip as Trip;
    expect(updated.currency).toBe('USD');
    expect(updated.budget).toBe(100); // 12000 BDT ÷ 120
    expect(updated.items[0]!.cost).toBe(20); // 2400 BDT ÷ 120
    expect(updated.expenses[0]).toMatchObject({ amount: 1500, currency: 'JPY', convertedAmount: 10 });
  });

  it('deletes a trip and takes back its XP', async () => {
    const { agent } = await signUp();
    const trip = await createTrip(agent);
    expect((await User.findOne({ email: VALID_USER.email }))!.xp).toBe(20);

    const res = await agent.delete(`/api/trips/${trip.id}`).set(H, 't');
    expect(res.status).toBe(200);
    expect(await TripModel.countDocuments()).toBe(0);
    expect((await User.findOne({ email: VALID_USER.email }))!.xp).toBe(0);
  });

  it('removes all trips when the account is deleted', async () => {
    const { agent } = await signUp();
    await createTrip(agent);
    await agent.delete('/api/users/me').set(H, 't').send({ password: VALID_USER.password }).expect(200);
    expect(await TripModel.countDocuments()).toBe(0);
  });
});

describe('itinerary', () => {
  it('adds plans to the end of a day', async () => {
    const { agent } = await signUp();
    const trip = await createTrip(agent);
    await addItem(agent, trip.id, { title: 'Breakfast', date: '2026-11-02', kind: 'food', time: '08:00' });
    const updated = await addItem(agent, trip.id, { title: 'Museum', date: '2026-11-02' });

    expect(updated.items.map((i) => [i.title, i.order])).toEqual([
      ['Breakfast', 0],
      ['Museum', 1],
    ]);
    expect(updated.items[0]).toMatchObject({ kind: 'food', time: '08:00', endTime: null, cost: null });
  });

  it('refuses a day outside the trip and bad times', async () => {
    const { agent } = await signUp();
    const trip = await createTrip(agent);
    const outside = await agent
      .post(`/api/trips/${trip.id}/items`)
      .set(H, 't')
      .send({ title: 'Too late', date: '2026-12-25' });
    expect(outside.status).toBe(400);
    expect(outside.body.error.fields.date).toBeDefined();

    const times = await agent
      .post(`/api/trips/${trip.id}/items`)
      .set(H, 't')
      .send({ title: 'Backwards', time: '10:00', endTime: '09:00' });
    expect(times.body.error.fields.endTime).toBeDefined();
  });

  it('edits a plan and moves it to another day', async () => {
    const { agent } = await signUp();
    const trip = await createTrip(agent);
    await addItem(agent, trip.id, { title: 'A', date: '2026-11-01' });
    const withB = await addItem(agent, trip.id, { title: 'B', date: '2026-11-01' });
    await addItem(agent, trip.id, { title: 'C', date: '2026-11-02' });
    const a = withB.items.find((i) => i.title === 'A')!;

    const res = await agent
      .patch(`/api/trips/${trip.id}/items/${a.id}`)
      .set(H, 't')
      .send({ date: '2026-11-02', title: 'A (moved)', time: '18:00' });

    expect(res.status).toBe(200);
    expect(onDay(res.body.trip, '2026-11-01')).toEqual(['B']);
    expect(onDay(res.body.trip, '2026-11-02')).toEqual(['C', 'A (moved)']);
    const b = (res.body.trip as Trip).items.find((i) => i.title === 'B')!;
    expect(b.order).toBe(0);
  });

  it('checks a new end time against the saved start time', async () => {
    const { agent } = await signUp();
    const trip = await createTrip(agent);
    const added = await addItem(agent, trip.id, { title: 'Show', time: '20:00' });
    const url = `/api/trips/${trip.id}/items/${added.items[0]!.id}`;

    const before = await agent.patch(url).set(H, 't').send({ endTime: '19:00' });
    expect(before.status).toBe(400);
    expect(before.body.error.fields.endTime).toBeDefined();

    const after = await agent.patch(url).set(H, 't').send({ endTime: '22:30' });
    expect(after.status).toBe(200);
    expect(after.body.trip.items[0]).toMatchObject({ time: '20:00', endTime: '22:30' });
  });

  it('saves a drag-and-drop arrangement', async () => {
    const { agent } = await signUp();
    const trip = await createTrip(agent);
    await addItem(agent, trip.id, { title: 'Idea' });
    await addItem(agent, trip.id, { title: 'One', date: '2026-11-01' });
    const full = await addItem(agent, trip.id, { title: 'Two', date: '2026-11-01' });
    const id = (title: string) => full.items.find((i) => i.title === title)!.id;

    const res = await agent
      .put(`/api/trips/${trip.id}/itinerary`)
      .set(H, 't')
      .send({
        columns: [
          { date: null, itemIds: [] },
          { date: '2026-11-01', itemIds: [id('Two'), id('Idea')] },
          { date: '2026-11-03', itemIds: [id('One')] },
        ],
      });

    expect(res.status).toBe(200);
    expect(onDay(res.body.trip, null)).toEqual([]);
    expect(onDay(res.body.trip, '2026-11-01')).toEqual(['Two', 'Idea']);
    expect(onDay(res.body.trip, '2026-11-03')).toEqual(['One']);
  });

  it('refuses an arrangement that is missing or repeats plans', async () => {
    const { agent } = await signUp();
    const trip = await createTrip(agent);
    await addItem(agent, trip.id, { title: 'One', date: '2026-11-01' });
    const full = await addItem(agent, trip.id, { title: 'Two', date: '2026-11-01' });
    const [one, two] = full.items;

    const missing = await agent
      .put(`/api/trips/${trip.id}/itinerary`)
      .set(H, 't')
      .send({ columns: [{ date: '2026-11-01', itemIds: [one!.id] }] });
    expect(missing.status).toBe(409);

    const twice = await agent
      .put(`/api/trips/${trip.id}/itinerary`)
      .set(H, 't')
      .send({ columns: [{ date: '2026-11-01', itemIds: [one!.id, two!.id, one!.id] }] });
    expect(twice.status).toBe(400);
  });

  it('deletes a plan and closes the gap', async () => {
    const { agent } = await signUp();
    const trip = await createTrip(agent);
    await addItem(agent, trip.id, { title: 'One', date: '2026-11-01' });
    await addItem(agent, trip.id, { title: 'Two', date: '2026-11-01' });
    const full = await addItem(agent, trip.id, { title: 'Three', date: '2026-11-01' });

    const res = await agent.delete(`/api/trips/${trip.id}/items/${full.items[0]!.id}`).set(H, 't');
    expect(res.status).toBe(200);
    expect((res.body.trip as Trip).items.map((i) => [i.title, i.order])).toEqual([
      ['Two', 0],
      ['Three', 1],
    ]);
  });

  it('exports a calendar file', async () => {
    const { agent } = await signUp();
    const trip = await createTrip(agent);
    await addItem(agent, trip.id, { title: 'Tea ceremony', date: '2026-11-02', time: '14:00' });

    const res = await agent.get(`/api/trips/${trip.id}/calendar.ics`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/calendar');
    expect(res.headers['content-disposition']).toContain('autumn-in-japan.ics');
    expect(res.text).toContain('SUMMARY:Tea ceremony');
    expect(res.text).toContain('DTSTART:20261102T140000');
  });
});

describe('budget', () => {
  it('records an expense in the trip currency as is', async () => {
    const { agent } = await signUp();
    const trip = await createTrip(agent);
    const res = await agent
      .post(`/api/trips/${trip.id}/expenses`)
      .set(H, 't')
      .send({ title: 'Hotel', category: 'accommodation', amount: 8000.555, currency: 'BDT', date: '2026-11-01' });

    expect(res.status).toBe(201);
    expect(res.body.trip.expenses[0]).toMatchObject({ amount: 8000.56, rate: 1, convertedAmount: 8000.56 });
  });

  it('converts an expense paid in another currency', async () => {
    const { agent } = await signUp();
    const trip = await createTrip(agent);
    const res = await agent
      .post(`/api/trips/${trip.id}/expenses`)
      .set(H, 't')
      .send({ title: 'Ramen', category: 'food', amount: 1500, currency: 'JPY', date: '2026-11-02' });

    // 1 USD = 150 JPY = 120 BDT, so 1 JPY = 0.8 BDT
    expect(res.body.trip.expenses[0]).toMatchObject({ currency: 'JPY', rate: 0.8, convertedAmount: 1200 });
  });

  it('keeps the original rate when only the amount changes, and re-converts a new currency', async () => {
    const { agent } = await signUp();
    const trip = await createTrip(agent);
    const added = await agent
      .post(`/api/trips/${trip.id}/expenses`)
      .set(H, 't')
      .send({ title: 'Ramen', category: 'food', amount: 1500, currency: 'JPY', date: '2026-11-02' });
    const expenseId = added.body.trip.expenses[0].id as string;

    const amount = await agent
      .patch(`/api/trips/${trip.id}/expenses/${expenseId}`)
      .set(H, 't')
      .send({ amount: 3000 });
    expect(amount.body.trip.expenses[0]).toMatchObject({ amount: 3000, rate: 0.8, convertedAmount: 2400 });

    const currency = await agent
      .patch(`/api/trips/${trip.id}/expenses/${expenseId}`)
      .set(H, 't')
      .send({ currency: 'USD', amount: 10 });
    expect(currency.body.trip.expenses[0]).toMatchObject({ currency: 'USD', rate: 120, convertedAmount: 1200 });
  });

  it('explains when rates are unavailable', async () => {
    clearRatesForTests();
    vi.stubGlobal('fetch', vi.fn(async () => new Response('down', { status: 503 })));
    const { agent } = await signUp();
    const trip = await createTrip(agent);

    const res = await agent
      .post(`/api/trips/${trip.id}/expenses`)
      .set(H, 't')
      .send({ title: 'Ramen', category: 'food', amount: 1500, currency: 'JPY', date: '2026-11-02' });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('RATES_UNAVAILABLE');

    // Same-currency expenses still work offline
    const same = await agent
      .post(`/api/trips/${trip.id}/expenses`)
      .set(H, 't')
      .send({ title: 'Snacks', category: 'food', amount: 200, currency: 'BDT', date: '2026-11-02' });
    expect(same.status).toBe(201);
  });

  it('deletes an expense', async () => {
    const { agent } = await signUp();
    const trip = await createTrip(agent);
    const added = await agent
      .post(`/api/trips/${trip.id}/expenses`)
      .set(H, 't')
      .send({ title: 'Hotel', category: 'accommodation', amount: 100, currency: 'BDT', date: '2026-11-01' });
    const res = await agent
      .delete(`/api/trips/${trip.id}/expenses/${added.body.trip.expenses[0].id}`)
      .set(H, 't');
    expect(res.body.trip.expenses).toEqual([]);
  });
});

describe('packing', () => {
  it('adds, ticks, renames and deletes items', async () => {
    const { agent } = await signUp();
    const trip = await createTrip(agent);
    const added = await agent
      .post(`/api/trips/${trip.id}/packing`)
      .set(H, 't')
      .send({ label: 'Camera', category: 'tech' });
    expect(added.status).toBe(201);
    const itemId = added.body.trip.packing[0].id as string;

    const ticked = await agent
      .patch(`/api/trips/${trip.id}/packing/${itemId}`)
      .set(H, 't')
      .send({ packed: true, label: 'Camera + lenses' });
    expect(ticked.body.trip.packing[0]).toMatchObject({ packed: true, label: 'Camera + lenses' });

    const removed = await agent.delete(`/api/trips/${trip.id}/packing/${itemId}`).set(H, 't');
    expect(removed.body.trip.packing).toEqual([]);
  });

  it('refuses duplicates, ignoring capital letters', async () => {
    const { agent } = await signUp();
    const trip = await createTrip(agent);
    await agent.post(`/api/trips/${trip.id}/packing`).set(H, 't').send({ label: 'Camera' });
    const res = await agent.post(`/api/trips/${trip.id}/packing`).set(H, 't').send({ label: 'camera' });
    expect(res.status).toBe(409);
    expect(res.body.error.fields.label).toBeDefined();
  });

  it('adds a template once and unticks everything', async () => {
    const { agent } = await signUp();
    const trip = await createTrip(agent);
    const first = await agent.post(`/api/trips/${trip.id}/packing/template`).set(H, 't').send({ template: 'hiking' });
    const count = first.body.trip.packing.length as number;
    expect(count).toBeGreaterThan(12);

    const again = await agent.post(`/api/trips/${trip.id}/packing/template`).set(H, 't').send({ template: 'hiking' });
    expect(again.body.trip.packing).toHaveLength(count);

    const itemId = again.body.trip.packing[0].id as string;
    await agent.patch(`/api/trips/${trip.id}/packing/${itemId}`).set(H, 't').send({ packed: true });
    const reset = await agent.post(`/api/trips/${trip.id}/packing/unpack-all`).set(H, 't');
    expect(reset.body.trip.packing.every((p: { packed: boolean }) => !p.packed)).toBe(true);
  });
});
