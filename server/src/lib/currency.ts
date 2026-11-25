import { z } from 'zod';
import { CURRENCY_CODES, crossRate, type ExchangeRates } from '@tt/shared';
import { HttpError } from '../middleware/errors';

/**
 * Exchange rates from free providers that need no account or key:
 *  1. ExchangeRate-API's open endpoint (160+ currencies, including BDT), updated daily.
 *     Its terms ask for a visible "Rates by Exchange Rate API" link, which the converter shows.
 *  2. Frankfurter (European Central Bank rates, about 30 currencies) if the first one is down.
 *
 * Rates are kept in memory for 6 hours, so the providers are called a few times a day at most.
 * If both are down, the last rates (up to 7 days old) are used.
 */

const FRESH_MS = 6 * 60 * 60 * 1000;
const STALE_OK_MS = 7 * 24 * 60 * 60 * 1000;

interface Snapshot extends ExchangeRates {
  fetchedAt: number;
}

let cache: Snapshot | null = null;
let inflight: Promise<Snapshot> | null = null;

const exchangeRateApiSchema = z.object({
  result: z.literal('success'),
  time_last_update_unix: z.number(),
  rates: z.record(z.string(), z.number()),
});

const frankfurterSchema = z.object({
  date: z.string(),
  rates: z.record(z.string(), z.number()),
});

interface Provider {
  source: ExchangeRates['source'];
  url: string;
  read: (json: unknown) => { rates: Record<string, number>; updatedAt: string };
}

const PROVIDERS: Provider[] = [
  {
    source: 'exchangerate-api',
    url: 'https://open.er-api.com/v6/latest/USD',
    read: (json) => {
      const data = exchangeRateApiSchema.parse(json);
      return { rates: data.rates, updatedAt: new Date(data.time_last_update_unix * 1000).toISOString() };
    },
  },
  {
    source: 'frankfurter',
    url: 'https://api.frankfurter.dev/v1/latest?base=USD',
    read: (json) => {
      const data = frankfurterSchema.parse(json);
      // The ECB publishes around 16:00 CET
      return { rates: { ...data.rates, USD: 1 }, updatedAt: new Date(`${data.date}T15:00:00Z`).toISOString() };
    },
  },
];

/** Keeps only the currencies the app supports, with sensible numbers. */
function cleanRates(rates: Record<string, number>) {
  const clean: Record<string, number> = { USD: 1 };
  for (const code of CURRENCY_CODES) {
    const rate = rates[code];
    if (typeof rate === 'number' && Number.isFinite(rate) && rate > 0) clean[code] = rate;
  }
  return clean;
}

async function download(): Promise<Snapshot> {
  let lastError: unknown;
  for (const provider of PROVIDERS) {
    try {
      const res = await fetch(provider.url, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(8_000),
      });
      if (!res.ok) throw new Error(`${provider.source} answered ${res.status}`);
      const { rates, updatedAt } = provider.read(await res.json());
      return {
        base: 'USD',
        rates: cleanRates(rates),
        updatedAt,
        source: provider.source,
        fetchedAt: Date.now(),
      };
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error('No exchange-rate provider answered');
}

/** "1 US dollar = x" for every supported currency. Throws a 503 if no rates can be found. */
export async function getRates(): Promise<ExchangeRates> {
  if (cache && Date.now() - cache.fetchedAt < FRESH_MS) return publicPart(cache);

  // Many requests at once share one download
  inflight ??= download().finally(() => {
    inflight = null;
  });

  let snapshot = cache;
  try {
    snapshot = await inflight;
    cache = snapshot;
  } catch (err) {
    if (!snapshot || Date.now() - snapshot.fetchedAt > STALE_OK_MS) {
      console.error('Exchange rates unavailable:', err instanceof Error ? err.message : err);
      throw new HttpError(
        503,
        'Exchange rates are unavailable right now. Try again in a few minutes.',
        'RATES_UNAVAILABLE',
      );
    }
    // Old rates are better than none
  }
  return publicPart(snapshot);
}

function publicPart({ base, rates, updatedAt, source }: Snapshot): ExchangeRates {
  return { base, rates, updatedAt, source };
}

/**
 * Converts money between currencies. Same currency needs no rates (and works offline).
 * Throws a 422 if a currency has no rate today.
 */
export async function convert(amount: number, from: string, to: string) {
  if (from === to) return { rate: 1, converted: amount };
  const { rates } = await getRates();
  const rate = crossRate(rates, from, to);
  if (rate === null) {
    throw new HttpError(
      422,
      `There is no exchange rate for ${from} to ${to} right now`,
      'NO_RATE',
      { currency: [`No rate for ${from} right now. Enter it in ${to} instead.`] },
    );
  }
  return { rate, converted: Math.round(amount * rate * 100) / 100 };
}

/* ---------------- For tests ---------------- */

/** Puts fixed rates in the cache so tests never call the internet. */
export function setRatesForTests(rates: Record<string, number>) {
  cache = {
    base: 'USD',
    rates: { USD: 1, ...rates },
    updatedAt: new Date().toISOString(),
    source: 'exchangerate-api',
    fetchedAt: Date.now(),
  };
}

export function clearRatesForTests() {
  cache = null;
  inflight = null;
}
