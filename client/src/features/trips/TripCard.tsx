import { Link } from 'react-router';
import { Backpack, ListChecks, Users } from 'lucide-react';
import { tripLength, tripPhase, type TripSummary } from '@tt/shared';
import { Card, Stamp } from '@/components/ui';
import { cn } from '@/lib/cn';
import { countryFlag, formatDateRange, plural, tripCountdown } from '@/lib/format';
import { formatMoney } from '@/lib/money';
import { COVER_STYLES } from './covers';
import { PHASE_LABEL, stampName } from './display';

/** A trip in the list: cover, countdown and progress at a glance. */
export function TripCard({ trip }: { trip: TripSummary }) {
  const phase = tripPhase(trip.startDate, trip.endDate);
  const spentShare = trip.budget > 0 ? Math.min(100, (trip.spent / trip.budget) * 100) : 0;

  return (
    <Link to={`/trips/${trip.id}`} className="group block rounded-3xl">
      <Card interactive className="h-full overflow-hidden">
        <div className={cn('relative h-36 overflow-hidden p-4 text-white', COVER_STYLES[trip.cover].className)}>
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.18)_1px,transparent_1px)] bg-size-[16px_16px]" />
          <div className="relative flex items-start justify-between gap-3">
            <span className="text-4xl drop-shadow-sm" aria-hidden>
              {countryFlag(trip.countryCode) || '🧭'}
            </span>
            <span
              className={cn(
                'rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur-sm',
                phase === 'ongoing' && 'bg-white text-ink',
              )}
            >
              {tripCountdown(trip.startDate, trip.endDate)}
            </span>
          </div>
          <Stamp
            title={stampName(trip)}
            label={PHASE_LABEL[phase]}
            caption={String(new Date(`${trip.startDate}T12:00:00Z`).getUTCFullYear())}
            size="sm"
            rotate={-12}
            className="absolute -bottom-3 right-4 text-white mix-blend-normal"
          />
        </div>

        <div className="flex flex-col gap-3 p-5">
          <div>
            <h3 className="truncate text-xl font-semibold">{trip.title}</h3>
            <p className="text-sm text-muted">
              {formatDateRange(trip.startDate, trip.endDate)} · {plural(tripLength(trip.startDate, trip.endDate), 'day')}
            </p>
          </div>

          {trip.budget > 0 && (
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-semibold">{formatMoney(trip.spent, trip.currency, { compact: true })}</span>
                <span className="text-muted">of {formatMoney(trip.budget, trip.currency, { compact: true })}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                <div
                  className={cn('h-full rounded-full', trip.spent > trip.budget ? 'bg-primary' : 'bg-accent')}
                  style={{ width: `${spentShare}%` }}
                />
              </div>
            </div>
          )}

          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            <li className="inline-flex items-center gap-1.5">
              <ListChecks className="size-4" /> {plural(trip.itemCount, 'plan')}
            </li>
            {trip.packing.total > 0 && (
              <li className="inline-flex items-center gap-1.5">
                <Backpack className="size-4" /> {trip.packing.packed}/{trip.packing.total} packed
              </li>
            )}
            {trip.travelers > 1 && (
              <li className="inline-flex items-center gap-1.5">
                <Users className="size-4" /> {trip.travelers}
              </li>
            )}
          </ul>
        </div>
      </Card>
    </Link>
  );
}
