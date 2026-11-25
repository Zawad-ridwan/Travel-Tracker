import { describe, expect, it, vi } from 'vitest';
import { clearRatesForTests } from '../lib/currency';
import { newAgent } from '../test/helpers';
import { TEST_RATES } from '../test/rates';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

const EXCHANGE_RATE_API = {
  result: 'success',
  time_last_update_unix: 1_791_849_600,
  base_code: 'USD',
  rates: { USD: 1, BDT: 121.5, EUR: 0.86, XAU: 0.0004 },
};

const FRANKFURTER = { amount: 1, base: 'USD', date: '2026-10-12', rates: { EUR: 0.87, JPY: 151 } };

describe('GET /api/currency/rates', () => {
  it('works without logging in', async () => {
    const res = await newAgent().get('/api/currency/rates');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ base: 'USD', rates: { USD: 1, ...TEST_RATES } });
  });

  it('downloads rates and keeps only supported currencies', async () => {
    clearRatesForTests();
    const fetchMock = vi.fn(async () => json(EXCHANGE_RATE_API));
    vi.stubGlobal('fetch', fetchMock);

    const res = await newAgent().get('/api/currency/rates');
    expect(res.status).toBe(200);
    expect(res.body.source).toBe('exchangerate-api');
    expect(res.body.rates).toEqual({ USD: 1, BDT: 121.5, EUR: 0.86 });

    // The second request is answered from memory
    await newAgent().get('/api/currency/rates');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to Frankfurter when the first provider fails', async () => {
    clearRatesForTests();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => (url.includes('frankfurter') ? json(FRANKFURTER) : json({ result: 'error' }))),
    );

    const res = await newAgent().get('/api/currency/rates');
    expect(res.body.source).toBe('frankfurter');
    expect(res.body.rates).toEqual({ USD: 1, EUR: 0.87, JPY: 151 });
  });

  it('answers 503 when no provider works', async () => {
    clearRatesForTests();
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new Error('offline'))));

    const res = await newAgent().get('/api/currency/rates');
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('RATES_UNAVAILABLE');
  });
});
