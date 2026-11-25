import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { addDays, todayIso, type TripSummary } from '@tt/shared';
import { mockApi } from '@/test/mockApi';
import { renderAt, TEST_USER } from '@/test/render';

const today = todayIso();

function summary(id: string, title: string, startOffset: number, length: number): TripSummary {
  return {
    id,
    title,
    destination: 'Kyoto',
    countryCode: 'JP',
    startDate: addDays(today, startOffset),
    endDate: addDays(today, startOffset + length - 1),
    currency: 'BDT',
    budget: 100000,
    travelers: 2,
    cover: 'ocean',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    spent: 25000,
    plannedCost: 0,
    itemCount: 3,
    packing: { total: 10, packed: 4 },
  };
}

describe('trips page', () => {
  it('invites visitors to sign up', async () => {
    renderAt('/trips');
    expect(await screen.findByText(/trips live in your free account/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create a free account/i })).toHaveAttribute('href', '/signup');
  });

  it('groups trips into now, coming up and past', async () => {
    mockApi({
      '/auth/me': { body: { user: TEST_USER } },
      '/trips': {
        body: {
          trips: [
            summary('t1', 'Old trip', -40, 5),
            summary('t2', 'Japan now', -1, 4),
            summary('t3', 'Nepal soon', 10, 3),
          ],
        },
      },
    });
    renderAt('/trips');

    expect(await screen.findByRole('heading', { name: /on the road/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /coming up/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /past trips/i })).toBeInTheDocument();
    expect(screen.getByText('Day 2 of 4')).toBeInTheDocument();
    expect(screen.getByText('In 10 days')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /nepal soon/i })).toHaveAttribute('href', '/trips/t3');
    expect(screen.getAllByText('4/10 packed')).toHaveLength(3);
  });

  it('suggests planning the first trip when there are none', async () => {
    mockApi({ '/auth/me': { body: { user: TEST_USER } }, '/trips': { body: { trips: [] } } });
    renderAt('/trips');
    expect(await screen.findByText(/your passport is waiting/i)).toBeInTheDocument();
  });

  it('opens the new-trip form from ?new=1', async () => {
    mockApi({ '/auth/me': { body: { user: TEST_USER } }, '/trips': { body: { trips: [] } } });
    renderAt('/trips?new=1');
    expect(await screen.findByRole('dialog', { name: /plan a trip/i })).toBeInTheDocument();
    // Budget currency starts as the home currency (Bangladesh → BDT)
    expect(screen.getByLabelText('Budget currency')).toHaveValue('BDT');
  });
});
