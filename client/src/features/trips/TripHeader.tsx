import { CalendarPlus, Pencil, Trash2, Users } from 'lucide-react';
import { tripLength, tripPhase, type Trip } from '@tt/shared';
import { Stamp } from '@/components/ui';
import { cn } from '@/lib/cn';
import { countryFlag, formatDateRange, plural, tripCountdown } from '@/lib/format';
import { COVER_STYLES } from './covers';
import { PHASE_LABEL, stampName } from './display';

interface TripHeaderProps {
  trip: Trip;
  onEdit: () => void;
  onExport: () => void;
  onDelete: () => void;
  exporting?: boolean;
}

/** The big cover at the top of a trip, with its stamp and countdown. */
export function TripHeader({ trip, onEdit, onExport, onDelete, exporting }: TripHeaderProps) {
  const phase = tripPhase(trip.startDate, trip.endDate);
  const actions = [
    { label: 'Edit trip', icon: Pencil, onClick: onEdit },
    { label: exporting ? 'Preparing…' : 'Add to calendar', icon: CalendarPlus, onClick: onExport },
    { label: 'Delete trip', icon: Trash2, onClick: onDelete },
  ];

  return (
    <header
      className={cn(
        'relative overflow-hidden rounded-[2rem] p-6 text-white shadow-lift sm:p-8',
        COVER_STYLES[trip.cover].className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.16)_1px,transparent_1px)] bg-size-[18px_18px]"
      />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-white/85">
            <span className="text-xl tracking-normal" aria-hidden>
              {countryFlag(trip.countryCode) || '🧭'}
            </span>
            {trip.destination || 'Trip'}
          </p>
          <h1 className="text-4xl font-semibold text-white sm:text-5xl">{trip.title}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-white/90">
            <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
            <span aria-hidden>·</span>
            <span>{plural(tripLength(trip.startDate, trip.endDate), 'day')}</span>
            {trip.travelers > 1 && (
              <>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1">
                  <Users className="size-4" /> {trip.travelers}
                </span>
              </>
            )}
          </p>
          <p className="mt-4 inline-flex rounded-full bg-white px-4 py-1.5 text-sm font-bold text-ink">
            {tripCountdown(trip.startDate, trip.endDate)}
          </p>
        </div>

        <Stamp
          title={stampName(trip)}
          label={PHASE_LABEL[phase]}
          caption={formatDateRange(trip.startDate, trip.startDate)}
          size="lg"
          rotate={-10}
          animate
          className="hidden shrink-0 text-white mix-blend-normal sm:inline-flex"
        />
      </div>

      <div className="relative mt-6 flex flex-wrap gap-2">
        {actions.map(({ label, icon: Icon, onClick }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-white/15 px-4 text-sm font-semibold backdrop-blur-sm transition-colors hover:bg-white/25"
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>
    </header>
  );
}
