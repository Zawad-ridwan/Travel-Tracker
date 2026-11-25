import { crossRate, CURRENCIES, roundMoney } from '@tt/shared';
import { countryFlag } from './format';

const formatters = new Map<string, Intl.NumberFormat>();

function formatter(currency: string, compact: boolean) {
  const key = `${currency}:${compact}`;
  let f = formatters.get(key);
  if (!f) {
    try {
      f = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        ...(compact ? { notation: 'compact', maximumFractionDigits: 1 } : {}),
      });
    } catch {
      // Very old browsers or unknown codes: plain numbers
      f = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
    }
    formatters.set(key, f);
  }
  return f;
}

/** 1234.5 + "BDT" → "BDT 1,234.50" (or "৳1,234.50", depending on the browser's language). */
export function formatMoney(amount: number, currency: string, { compact = false } = {}) {
  return formatter(currency, compact).format(amount);
}

/** "BDT" → "🇧🇩 BDT · Bangladeshi Taka" */
export function currencyLabel(code: string) {
  const currency = CURRENCIES.find((c) => c.code === code);
  return currency ? `${countryFlag(currency.country)} ${code} · ${currency.name}` : code;
}

export function currencyFlag(code: string) {
  return countryFlag(CURRENCIES.find((c) => c.code === code)?.country);
}

/** Converts with a table of "1 USD = x" rates. Null if a currency has no rate. */
export function convertMoney(amount: number, from: string, to: string, rates: Record<string, number> | undefined) {
  if (from === to) return amount;
  if (!rates) return null;
  const rate = crossRate(rates, from, to);
  return rate === null ? null : roundMoney(amount * rate);
}

/** Rounds a suggested budget to 3 significant figures: 12,345 → 12,300; 4,567 → 4,570. */
export function tidyAmount(amount: number) {
  if (amount <= 0) return 0;
  const step = 10 ** Math.max(0, Math.floor(Math.log10(amount)) - 2);
  return Math.round(amount / step) * step;
}
