import { countryName, todayIso, tripPhase, type TripSummary } from '@tt/shared';

export const PHASE_LABEL = { upcoming: 'Planned', ongoing: 'On the road', past: 'Visited' } as const;

/** The name shown on a trip's stamp: the destination, else the country, else the trip name (kept short). */
export function stampName(trip: Pick<TripSummary, 'destination' | 'countryCode' | 'title'>) {
  const name = trip.destination || countryName(trip.countryCode) || trip.title;
  return name.length > 14 ? `${name.slice(0, 13).trimEnd()}…` : name;
}

/** The trip happening now, or else the next one coming up. */
export function pickNextTrip(trips: TripSummary[], today = todayIso()) {
  const ongoing = trips.find((t) => tripPhase(t.startDate, t.endDate, today) === 'ongoing');
  if (ongoing) return ongoing;
  return trips
    .filter((t) => tripPhase(t.startDate, t.endDate, today) === 'upcoming')
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
}
