import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { Backpack, CalendarDays, Plane, Plus, Wallet } from 'lucide-react';
import { tripPhase, type TripSummary } from '@tt/shared';
import { PageHeader } from '@/components/PageHeader';
import { Button, buttonVariants, Card, CardContent, EmptyState, Skeleton, Stamp } from '@/components/ui';
import { useAuth } from '@/features/auth/useAuth';
import { TripCard } from '@/features/trips/TripCard';
import { TripFormModal } from '@/features/trips/TripFormModal';
import { useTripList } from '@/features/trips/useTrips';

const SECTIONS = [
  { phase: 'ongoing', title: 'On the road' },
  { phase: 'upcoming', title: 'Coming up' },
  { phase: 'past', title: 'Past trips' },
] as const;

export default function TripsPage() {
  const { user, isLoading } = useAuth();
  const [params, setParams] = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);

  // "?new=1" (from Explore and the sidebar) opens the form straight away
  const open = formOpen || (params.get('new') === '1' && Boolean(user));
  const setOpen = (next: boolean) => {
    setFormOpen(next);
    if (!next && params.has('new')) {
      setParams(
        (p) => {
          p.delete('new');
          return p;
        },
        { replace: true },
      );
    }
  };

  if (isLoading) return <ListSkeleton />;
  if (!user) return <VisitorTrips />;

  return (
    <>
      <PageHeader
        eyebrow="Trips"
        title="Your adventures"
        description="Plan day by day, keep your budget on track and pack without forgetting a thing."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus /> New trip
          </Button>
        }
      />
      <TripList onNew={() => setOpen(true)} />
      <TripFormModal open={open} onOpenChange={setOpen} />
    </>
  );
}

function TripList({ onNew }: { onNew: () => void }) {
  const { data: trips, isPending, error, refetch } = useTripList();

  if (isPending) return <ListSkeleton withHeader={false} />;
  if (error) {
    return (
      <EmptyState
        icon={<Plane />}
        title="Could not load your trips"
        description={error.message}
        action={<Button onClick={() => void refetch()}>Try again</Button>}
      />
    );
  }
  if (trips.length === 0) {
    return (
      <EmptyState
        icon={<Plane />}
        title="Your passport is waiting"
        description="Plan your first trip: pick the dates, add places day by day and set a budget. +20 XP."
        action={
          <Button size="lg" onClick={onNew}>
            <Plus /> Plan your first trip
          </Button>
        }
      />
    );
  }

  const byPhase = (phase: string) =>
    trips
      .filter((t) => tripPhase(t.startDate, t.endDate) === phase)
      // Past trips: most recent first
      .sort((a, b) => (phase === 'past' ? b.startDate.localeCompare(a.startDate) : 0));

  return (
    <div className="flex flex-col gap-10">
      {SECTIONS.map(({ phase, title }) => {
        const list: TripSummary[] = byPhase(phase);
        if (list.length === 0) return null;
        return (
          <section key={phase} aria-labelledby={`trips-${phase}`}>
            <h2 id={`trips-${phase}`} className="mb-4 text-2xl font-semibold">
              {title} <span className="text-lg text-muted">({list.length})</span>
            </h2>
            <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((trip, i) => (
                <motion.li
                  key={trip.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 6) * 0.04 }}
                >
                  <TripCard trip={trip} />
                </motion.li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function ListSkeleton({ withHeader = true }: { withHeader?: boolean }) {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading trips">
      {withHeader && <Skeleton className="h-14 w-72" />}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-72 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

/** What visitors see: what trips can do, and a way in. */
function VisitorTrips() {
  const perks = [
    { icon: CalendarDays, title: 'Day-by-day plans', text: 'Drag places between days and export to your calendar.' },
    { icon: Wallet, title: 'Budget in any currency', text: 'Spend in yen, track in taka. Live exchange rates.' },
    { icon: Backpack, title: 'Packing lists', text: 'Ready-made lists for beach, city, hiking and more.' },
  ];
  return (
    <>
      <PageHeader eyebrow="Trips" title="Plan your next adventure" />
      <Card className="paper-dots overflow-hidden">
        <CardContent className="flex flex-col items-center gap-8 py-10 text-center sm:py-14">
          <div className="flex gap-4" aria-hidden>
            <Stamp title="Plan" label="Step 1" tone="primary" rotate={-8} size="sm" />
            <Stamp title="Go" label="Step 2" tone="accent" rotate={6} size="sm" />
            <Stamp title="Stamp" label="Step 3" tone="sun" rotate={-3} size="sm" />
          </div>
          <div className="max-w-md">
            <h2 className="text-3xl font-semibold">Trips live in your free account</h2>
            <p className="mt-2 text-muted">Sign up to plan trips, track spending and keep your packing list.</p>
          </div>
          <ul className="grid w-full max-w-3xl gap-4 text-left sm:grid-cols-3">
            {perks.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-2xl border border-line bg-surface p-4">
                <Icon className="mb-2 size-6 text-primary" />
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-muted">{text}</p>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/signup" className={buttonVariants({ size: 'lg' })}>
              Create a free account
            </Link>
            <Link to="/login?next=%2Ftrips" className={buttonVariants({ size: 'lg', variant: 'secondary' })}>
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
