import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Trip, TripResponse } from '@tt/shared';
import { ME_KEY, useAuth } from '@/features/auth/useAuth';
import { api, ApiError } from '@/lib/api';

/** Cache keys. The list and each trip are cached separately. */
export const tripKeys = {
  list: ['trips', 'list'] as const,
  detail: (id: string) => ['trips', 'detail', id] as const,
};

/** The logged-in user's trips (nothing for visitors). */
export function useTripList() {
  const { isLoggedIn } = useAuth();
  return useQuery({
    queryKey: tripKeys.list,
    queryFn: async () => (await api.trips.list()).trips,
    enabled: isLoggedIn,
  });
}

export function useTrip(id: string) {
  return useQuery({
    queryKey: tripKeys.detail(id),
    queryFn: async () => (await api.trips.get(id)).trip,
  });
}

/** Saves a trip the server sent back and refreshes the list behind the scenes. */
function useStoreTrip() {
  const queryClient = useQueryClient();
  return (trip: Trip) => {
    queryClient.setQueryData(tripKeys.detail(trip.id), trip);
    void queryClient.invalidateQueries({ queryKey: tripKeys.list, exact: true });
  };
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  const storeTrip = useStoreTrip();
  return useMutation({
    mutationFn: api.trips.create,
    onSuccess: ({ trip }) => {
      storeTrip(trip);
      // Planning a trip earns XP
      void queryClient.invalidateQueries({ queryKey: ME_KEY });
    },
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.trips.remove(id),
    onSuccess: (_data, id) => {
      // Forget the trip after the page has moved away (removing it now would make the open page reload it)
      setTimeout(() => queryClient.removeQueries({ queryKey: tripKeys.detail(id) }), 0);
      void queryClient.invalidateQueries({ queryKey: tripKeys.list, exact: true });
      void queryClient.invalidateQueries({ queryKey: ME_KEY });
    },
  });
}

/** Trips that had several changes saving at once (their answers may arrive out of order). */
const overlapping = new Set<string>();

interface TripActionOptions<TVars> {
  /** Shows the change straight away, before the server answers (undone if it fails). */
  optimistic?: (trip: Trip, vars: TVars) => Trip;
  /** Show a toast for errors (forms show their own errors instead). */
  toastErrors?: boolean;
}

/**
 * Any change to one trip: every trip endpoint answers with the whole updated trip,
 * which replaces the cached copy.
 *
 * Quick taps (like ticking several packing items) can send changes at the same time.
 * Their answers may arrive in any order, so while others are still saving an answer is
 * not used; once the last one finishes, the trip is reloaded to be sure it is right.
 */
export function useTripAction<TVars>(
  tripId: string,
  send: (vars: TVars) => Promise<TripResponse>,
  { optimistic, toastErrors = false }: TripActionOptions<TVars> = {},
) {
  const queryClient = useQueryClient();
  const storeTrip = useStoreTrip();
  const key = tripKeys.detail(tripId);
  const mutationKey = ['trip-action', tripId];
  /** True if other changes to this trip are still saving (this one counts itself). */
  const othersPending = () => queryClient.isMutating({ mutationKey }) > 1;

  const finishOverlap = () => {
    if (overlapping.delete(tripId)) {
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({ queryKey: tripKeys.list, exact: true });
      return true;
    }
    return false;
  };

  return useMutation({
    mutationKey,
    mutationFn: send,
    onMutate: async (vars: TVars) => {
      if (!optimistic) return { previous: undefined };
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Trip>(key);
      if (previous) queryClient.setQueryData(key, optimistic(previous, vars));
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (toastErrors) toast.error(error.message);
      if (othersPending()) {
        overlapping.add(tripId);
        return;
      }
      if (finishOverlap()) return;
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      // Someone changed the trip elsewhere: load the latest version
      if (error instanceof ApiError && error.status === 409) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
    },
    onSuccess: ({ trip }) => {
      if (othersPending()) {
        overlapping.add(tripId);
        return;
      }
      if (!finishOverlap()) storeTrip(trip);
    },
  });
}
