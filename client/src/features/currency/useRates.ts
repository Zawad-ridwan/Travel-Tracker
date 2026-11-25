import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Today's exchange rates (1 US dollar = x). The server refreshes them a few times a day. */
export function useRates() {
  return useQuery({
    queryKey: ['currency', 'rates'],
    queryFn: api.currency.rates,
    staleTime: 60 * 60_000,
    retry: 1,
  });
}
