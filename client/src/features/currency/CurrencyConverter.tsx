import { useState } from 'react';
import { ArrowUpDown, RefreshCw } from 'lucide-react';
import { crossRate, currencyForCountry } from '@tt/shared';
import { CurrencySelect } from '@/components/forms/CurrencySelect';
import { Button, Input, Skeleton } from '@/components/ui';
import { useAuth } from '@/features/auth/useAuth';
import { formatDate } from '@/lib/format';
import { currencyFlag, formatMoney } from '@/lib/money';
import { useRates } from './useRates';

const QUICK_AMOUNTS = [10, 50, 100, 500, 1000];

const SOURCES = {
  'exchangerate-api': { label: 'Rates by Exchange Rate API', url: 'https://www.exchangerate-api.com' },
  frankfurter: { label: 'European Central Bank rates via Frankfurter', url: 'https://frankfurter.dev' },
} as const;

/** Live currency converter (Toolkit). Starts from US dollars to your home currency. */
export function CurrencyConverter() {
  const { user } = useAuth();
  const home = currencyForCountry(user?.homeCountry) ?? 'EUR';
  const [amount, setAmount] = useState('100');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState(home === 'USD' ? 'EUR' : home);
  const { data, isPending, error, refetch, isFetching } = useRates();

  const value = Number(amount);
  const valid = amount.trim() !== '' && Number.isFinite(value) && value >= 0;
  const rate = data ? crossRate(data.rates, from, to) : null;
  const result = valid && rate !== null ? value * rate : null;

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-3xl border border-line bg-surface-2/40 p-4">
        <Input
          label="Amount"
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={valid || amount === '' ? undefined : 'Enter a number'}
          className="font-display text-2xl font-semibold"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setAmount(String(n))}
              className="rounded-full border border-line bg-surface px-3 py-1 text-sm font-semibold text-muted hover:border-primary/40 hover:text-ink"
            >
              {n.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <CurrencySelect label="From" value={from} onChange={(e) => setFrom(e.target.value)} />
        <div className="-mb-2 flex justify-center">
          <Button variant="secondary" size="icon-sm" onClick={swap} aria-label="Swap currencies">
            <ArrowUpDown />
          </Button>
        </div>
        <CurrencySelect label="To" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      <div className="rounded-3xl bg-accent-soft p-5 text-accent" aria-live="polite">
        {isPending ? (
          <Skeleton className="h-16 w-full bg-accent/10" />
        ) : error ? (
          <div className="flex flex-col items-start gap-3">
            <p className="font-semibold">{error.message}</p>
            <Button size="sm" variant="secondary" onClick={() => void refetch()} loading={isFetching}>
              <RefreshCw /> Try again
            </Button>
          </div>
        ) : rate === null ? (
          <p className="font-semibold">No rate for this pair right now. Try another currency.</p>
        ) : (
          <>
            <p className="text-sm font-semibold opacity-80">
              {currencyFlag(from)} {valid ? formatMoney(value, from) : '—'} =
            </p>
            <p className="font-display text-4xl font-bold break-words">
              {currencyFlag(to)} {result === null ? '—' : formatMoney(result, to)}
            </p>
            <p className="mt-2 text-sm opacity-80">
              1 {from} = {rate.toLocaleString(undefined, { maximumSignificantDigits: 6 })} {to}
            </p>
          </>
        )}
      </div>

      {data && (
        <p className="text-xs text-muted">
          Updated {formatDate(data.updatedAt, { dateStyle: 'medium', timeStyle: 'short' })}. For planning only;
          banks and exchange shops add their own fees.{' '}
          <a
            href={SOURCES[data.source].url}
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline underline-offset-2 hover:text-ink"
          >
            {SOURCES[data.source].label}
          </a>
        </p>
      )}
    </div>
  );
}
