import { describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import type { Trip } from '@tt/shared';
import { mockApi } from '@/test/mockApi';
import { renderAt, TEST_USER } from '@/test/render';

const TRIP: Trip = {
  id: 't1',
  title: 'Autumn in Japan',
  destination: 'Kyoto',
  countryCode: 'JP',
  startDate: '2030-11-01',
  endDate: '2030-11-03',
  currency: 'BDT',
  budget: 10000,
  travelers: 1,
  cover: 'sunset',
  notes: 'JR pass booked',
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
  items: [
    { id: 'i1', date: '2030-11-01', order: 0, kind: 'place', title: 'Fushimi Inari', time: '08:00', endTime: null, location: 'Kyoto', notes: '', cost: 500 },
    { id: 'i2', date: null, order: 0, kind: 'food', title: 'Try matcha', time: null, endTime: null, location: '', notes: '', cost: null },
  ],
  expenses: [
    { id: 'e1', title: 'Ramen', category: 'food', amount: 1500, currency: 'JPY', convertedAmount: 1200, rate: 0.8, date: '2030-11-01', createdAt: '2026-10-01T00:00:00.000Z' },
  ],
  packing: [{ id: 'p1', label: 'Passport / ID', category: 'documents', packed: false }],
};

const base = {
  '/auth/me': { body: { user: TEST_USER } },
  '/trips/t1': { body: { trip: TRIP } },
  '/currency/rates': { body: { base: 'USD', rates: { USD: 1, BDT: 120, JPY: 150 }, updatedAt: '2026-10-13T00:00:00Z', source: 'exchangerate-api' } },
};

describe('trip page', () => {
  it('shows the trip with its days and ideas', async () => {
    mockApi(base);
    renderAt('/trips/t1');

    expect(await screen.findByRole('heading', { level: 1, name: 'Autumn in Japan' })).toBeInTheDocument();
    expect(screen.getByText('JR pass booked')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ideas' })).toBeInTheDocument();
    expect(screen.getByText('Fushimi Inari')).toBeInTheDocument();
    expect(screen.getByText('Try matcha')).toBeInTheDocument();
    expect(screen.getAllByText('Free day')).toHaveLength(2);
  });

  it('shows the budget with converted expenses', async () => {
    mockApi(base);
    renderAt('/trips/t1?tab=budget');

    expect(await screen.findByText('Ramen')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /budget spent/i })).toHaveAttribute('aria-valuenow', '12');
    expect(screen.getByText(/¥1,500/)).toBeInTheDocument();
  });

  it('ticks a packing item straight away and saves it', async () => {
    const fetchMock = mockApi({
      ...base,
      'PATCH /trips/t1/packing/p1': {
        body: { trip: { ...TRIP, packing: [{ ...TRIP.packing[0]!, packed: true }] } },
      },
    });
    renderAt('/trips/t1?tab=packing');

    const box = await screen.findByRole('checkbox', { name: /passport/i });
    fireEvent.click(box);

    await waitFor(() => expect(box).toHaveAttribute('aria-checked', 'true'));
    const patch = fetchMock.mock.calls.find(([, init]) => init?.method === 'PATCH');
    expect(patch?.[0]).toContain('/trips/t1/packing/p1');
    expect(JSON.parse(String(patch?.[1]?.body))).toEqual({ packed: true });
  });

  it('says so when the trip does not exist', async () => {
    mockApi({
      '/auth/me': { body: { user: TEST_USER } },
      '/trips/zz': { status: 404, body: { error: { message: 'Trip not found', code: 'NOT_FOUND' } } },
    });
    renderAt('/trips/zz');
    expect(await screen.findByText('Trip not found')).toBeInTheDocument();
  });
});
