import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { ArrowLeft, Backpack, CalendarDays, NotebookPen, Wallet, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants, Card, CardContent, EmptyState, Modal, Skeleton } from '@/components/ui';
import { BudgetPanel } from '@/features/trips/BudgetPanel';
import { ItineraryBoard } from '@/features/trips/ItineraryBoard';
import { PackingPanel } from '@/features/trips/PackingPanel';
import { TripFormModal } from '@/features/trips/TripFormModal';
import { TripHeader } from '@/features/trips/TripHeader';
import { useDeleteTrip, useTrip } from '@/features/trips/useTrips';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { XP_REWARDS } from '@tt/shared';

const TABS = ['plan', 'budget', 'packing'] as const;
type Tab = (typeof TABS)[number];

const TAB_META: Record<Tab, { label: string; icon: LucideIcon }> = {
  plan: { label: 'Plan', icon: CalendarDays },
  budget: { label: 'Budget', icon: Wallet },
  packing: { label: 'Packing', icon: Backpack },
};

/** One trip: itinerary, budget and packing list, in tabs. */
export default function TripPage() {
  const { tripId = '' } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { data: trip, isPending, error } = useTrip(tripId);
  const deleteTrip = useDeleteTrip();

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [exporting, setExporting] = useState(false);

  const tabParam = params.get('tab');
  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : 'plan';
  const autoAddExpense = params.get('add') === 'expense';

  // "?add=expense" opens the expense form once; then it is removed from the address
  useEffect(() => {
    if (autoAddExpense && trip) {
      setParams(
        (p) => {
          p.delete('add');
          return p;
        },
        { replace: true },
      );
    }
  }, [autoAddExpense, trip, setParams]);

  const selectTab = (next: Tab) =>
    setParams(
      (p) => {
        if (next === 'plan') p.delete('tab');
        else p.set('tab', next);
        return p;
      },
      { replace: true },
    );

  if (isPending) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading trip">
        <Skeleton className="h-64 w-full rounded-[2rem]" />
        <Skeleton className="h-12 w-80" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !trip) {
    const missing = error instanceof ApiError && error.status === 404;
    return (
      <EmptyState
        icon={<CalendarDays />}
        title={missing ? 'Trip not found' : 'Could not load this trip'}
        description={missing ? 'It may have been deleted.' : error?.message}
        action={
          <Link to="/trips" className={buttonVariants()}>
            Back to your trips
          </Link>
        }
      />
    );
  }

  const exportCalendar = async () => {
    setExporting(true);
    try {
      await api.trips.downloadCalendar(trip.id);
      toast.success('Calendar file downloaded', {
        description: 'Open it to add the trip to Google, Apple or Outlook Calendar.',
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create the calendar file');
    } finally {
      setExporting(false);
    }
  };

  const onDelete = () =>
    deleteTrip.mutate(trip.id, {
      onSuccess: () => {
        toast(`"${trip.title}" deleted`, { description: `${XP_REWARDS.planTrip} XP was taken back.` });
        navigate('/trips', { replace: true });
      },
      onError: (err) => toast.error(err.message),
    });

  const spent = trip.expenses.reduce((sum, e) => sum + e.convertedAmount, 0);
  const packed = trip.packing.filter((p) => p.packed).length;
  const counts: Record<Tab, string> = {
    plan: String(trip.items.length),
    budget: trip.budget > 0 ? `${Math.round((spent / trip.budget) * 100)}%` : '',
    packing: trip.packing.length ? `${packed}/${trip.packing.length}` : '',
  };

  return (
    <div className="flex flex-col gap-6">
      <Link to="/trips" className="inline-flex items-center gap-2 self-start text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> All trips
      </Link>

      <TripHeader
        trip={trip}
        onEdit={() => setEditing(true)}
        onExport={() => void exportCalendar()}
        onDelete={() => setConfirmDelete(true)}
        exporting={exporting}
      />

      {trip.notes && (
        <Card>
          <CardContent className="flex gap-3 py-4 sm:py-4">
            <NotebookPen className="mt-0.5 size-5 shrink-0 text-sun" />
            <p className="whitespace-pre-line text-muted">{trip.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div role="tablist" aria-label="Trip sections" className="flex gap-1 self-start rounded-full border border-line bg-surface p-1 shadow-soft">
        {TABS.map((id) => {
          const { label, icon: Icon } = TAB_META[id];
          const selected = id === tab;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={selected}
              aria-controls={`panel-${id}`}
              onClick={() => selectTab(id)}
              className={cn(
                'inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors',
                selected ? 'bg-ink text-bg' : 'text-muted hover:text-ink',
              )}
            >
              <Icon className="size-4" />
              {label}
              {counts[id] && (
                <span className={cn('rounded-full px-1.5 text-xs', selected ? 'bg-bg/20' : 'bg-surface-2')}>
                  {counts[id]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'plan' && <ItineraryBoard trip={trip} />}
        {tab === 'budget' && <BudgetPanel trip={trip} autoAdd={autoAddExpense} />}
        {tab === 'packing' && <PackingPanel trip={trip} />}
      </div>

      <TripFormModal open={editing} onOpenChange={setEditing} trip={trip} />

      <Modal
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this trip?"
        description={`"${trip.title}" and all its plans, expenses and packing list will be gone for good.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Keep it
            </Button>
            <Button variant="danger" loading={deleteTrip.isPending} onClick={onDelete}>
              Delete trip
            </Button>
          </>
        }
      />
    </div>
  );
}
