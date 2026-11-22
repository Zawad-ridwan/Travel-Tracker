import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PublicUser } from '@tt/shared';
import { api, ApiError } from '@/lib/api';

export const ME_KEY = ['auth', 'me'] as const;

/** Loads the logged-in user once; null means "visitor". */
async function fetchMe(): Promise<PublicUser | null> {
  try {
    const { user } = await api.auth.me();
    return user;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

export function useAuth() {
  const { data, isPending } = useQuery({
    queryKey: ME_KEY,
    queryFn: fetchMe,
    staleTime: 5 * 60_000,
  });

  const user = data ?? null;
  return {
    user,
    isLoading: isPending,
    isLoggedIn: Boolean(user),
    isAdmin: user?.role === 'admin',
  };
}

/** Puts a fresh copy of the user into the cache after any call that returns { user }. */
export function useSetUser() {
  const queryClient = useQueryClient();
  return (user: PublicUser | null) => queryClient.setQueryData(ME_KEY, user);
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.auth.logout(),
    onSettled: () => {
      // Forget everything cached for this user
      queryClient.clear();
      queryClient.setQueryData(ME_KEY, null);
    },
  });
}
