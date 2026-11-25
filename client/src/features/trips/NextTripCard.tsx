import { Link } from 'react-router';
import { ArrowRight, Plus } from 'lucide-react';
import { daysBetween, todayIso, tripLength, tripPhase } from '@tt/shared';
import { Badge, buttonVariants, Card, CardContent, Skeleton } from '@/components/ui';
import { useAuth } from '@/features/auth/useAuth';
import { cn } from '@/lib/cn';
import { countryFlag, formatDateRange } from '@/lib/format';
import { COVER_STYLES } from './covers';
import { pickNextTrip } from './display';
import { useTripList } from './useTrips';

/** "Next trip" on Explore: a big countdown, or an invitation to plan one. */
export function NextTripCard() {
  const { isLoggedIn } = useAuth();
  const { data: trips, isPending } = useTripList();

  if (isLoggedIn && isPending) return <Skeleton className="h-full min-h-56 rounded-3xl" />;

  const trip = trips ? pickNextTrip(trips) : undefined;

  if (!trip) {
    return (
      <Card>
        <CardContent className="flex h-full flex-col">
          <Badge tone="primary" className="self-start">
            Next trip
          </Badge>
          <h2 className="mt-4 text-2xl font-semibold">No trip planned yet</h2>
          <p className="mt-1 text-muted">Your countdown appears here once you plan one.</p>
          <Link
            to={isLoggedIn ? '/trips?new=1' : '/trips'}
            className={cn(buttonVariants({ variant: 'soft' }), 'mt-auto self-start')}
          >
            <Plus /> Plan a trip
          </Link>
        </CardContent>
      </Card>
    );
  }

  const today = todayIso();
  const ongoing = tripPhase(trip.startDate, trip.endDate, today) === 'ongoing';
  const number = ongoing ? daysBetween(trip.startDate, today) + 1 : daysBetween(today, trip.startDate);

  return (
    <Link to={`/trips/${trip.id}`} className="group block h-full rounded-3xl">
      <Card interactive className={cn('relative h-full overflow-hidden border-0 text-white', COVER_STYLES[trip.cover].className)}>
        <CardContent className="flex h-full flex-col gap-3">
          <span className="self-start rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
            {ongoing ? 'On the road' : 'Next trip'}
          </span>
          <div className="flex items-end gap-3">
            <span className="font-display text-6xl font-black leading-none">{number}</span>
            <span className="pb-1 font-semibold leading-tight text-white/90">
              {ongoing
                ? `day of ${tripLength(trip.startDate, trip.endDate)}`
                : number === 1
                  ? 'day to go'
                  : 'days to go'}
            </span>
          </div>
          <div className="mt-auto">
            <h2 className="flex items-center gap-2 truncate text-2xl font-semibold text-white">
              <span aria-hidden>{countryFlag(trip.countryCode)}</span> {trip.title}
            </h2>
            <p className="flex items-center justify-between text-sm text-white/85">
              {formatDateRange(trip.startDate, trip.endDate)}
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
