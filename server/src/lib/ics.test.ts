import { describe, expect, it } from 'vitest';
import type { Trip, TripItem } from '@tt/shared';
import { buildTripCalendar, calendarFileName, escapeText, foldLine } from './ics';

function item(overrides: Partial<TripItem>): TripItem {
  return {
    id: 'i1',
    date: '2026-11-02',
    order: 0,
    kind: 'place',
    title: 'Plan',
    time: null,
    endTime: null,
    location: '',
    notes: '',
    cost: null,
    ...overrides,
  };
}

const TRIP: Trip = {
  id: 't1',
  title: 'Japan',
  destination: 'Kyoto, Japan',
  countryCode: 'JP',
  startDate: '2026-11-01',
  endDate: '2026-11-03',
  currency: 'JPY',
  budget: 0,
  travelers: 1,
  cover: 'sunset',
  notes: '',
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
  expenses: [],
  packing: [],
  items: [
    item({ id: 'late', title: 'Night ramen', time: '23:30' }),
    item({ id: 'show', title: 'Show', time: '19:00', endTime: '21:15', order: 1 }),
    item({ id: 'idea', title: 'Maybe Nara', date: null }),
  ],
};

describe('calendar export', () => {
  const ics = buildTripCalendar(TRIP, new Date('2026-10-13T08:15:00.000Z'));
  const lines = ics.split('\r\n');

  it('wraps everything in a calendar with CRLF line endings', () => {
    expect(lines[0]).toBe('BEGIN:VCALENDAR');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });

  it('adds the trip as an all-day event ending the day after the last day', () => {
    expect(ics).toContain('DTSTART;VALUE=DATE:20261101');
    expect(ics).toContain('DTEND;VALUE=DATE:20261104');
    expect(ics).toContain('LOCATION:Kyoto\\, Japan');
  });

  it('uses the end time, or one hour later (past midnight if needed)', () => {
    expect(ics).toContain('DTSTART:20261102T190000');
    expect(ics).toContain('DTEND:20261102T211500');
    expect(ics).toContain('DTSTART:20261102T233000');
    expect(ics).toContain('DTEND:20261103T003000');
  });

  it('leaves out ideas that are not on a day', () => {
    expect(ics).not.toContain('Maybe Nara');
  });

  it('keeps every line within 75 bytes', () => {
    const long = buildTripCalendar({ ...TRIP, notes: 'Long note '.repeat(40) + '東京 '.repeat(20) });
    for (const line of long.split('\r\n')) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
  });
});

describe('helpers', () => {
  it('escapes special characters', () => {
    expect(escapeText('a, b; c\\d\nnext')).toBe('a\\, b\\; c\\\\d\\nnext');
  });

  it('folds long lines with a leading space', () => {
    const folded = foldLine('x'.repeat(100));
    expect(folded).toBe(`${'x'.repeat(75)}\r\n ${'x'.repeat(25)}`);
  });

  it('makes safe file names', () => {
    expect(calendarFileName('Japan in Autumn!')).toBe('japan-in-autumn.ics');
    expect(calendarFileName('🌴🌴')).toBe('trip.ics');
  });
});
