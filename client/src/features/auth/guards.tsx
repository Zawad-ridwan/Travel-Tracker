import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router';
import type { UserRole } from '@tt/shared';
import { Skeleton } from '@/components/ui';
import { useAuth } from './useAuth';

function FullPageLoader() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 py-16" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

/** Pages inside need a logged-in user; visitors go to /login and come back afterwards. */
export function RequireAuth({ children }: { children?: ReactNode }) {
  const { isLoading, isLoggedIn } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageLoader />;
  if (!isLoggedIn) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return children ?? <Outlet />;
}

/** Pages inside need a specific role, e.g. admin. */
export function RequireRole({ role, children }: { role: UserRole; children?: ReactNode }) {
  const { isLoading, isLoggedIn, user } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageLoader />;
  if (!isLoggedIn) {
    const next = encodeURIComponent(location.pathname);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  if (user?.role !== role) return <Navigate to="/" replace />;
  return children ?? <Outlet />;
}

/**
 * Log in / sign up pages: logged-in users are sent onwards instead.
 * This is also how a successful login or sign-up moves on: the page saves the user,
 * and this guard picks the destination (so there is only one redirect, never two racing).
 */
export function GuestOnly({ children }: { children?: ReactNode }) {
  const { isLoading, isLoggedIn, isAdmin } = useAuth();
  const location = useLocation();
  const [params] = useSearchParams();

  if (isLoading) return <FullPageLoader />;
  if (isLoggedIn) {
    const target =
      location.pathname === '/signup'
        ? '/onboarding'
        : safeNext(params.get('next'), isAdmin ? '/admin' : '/');
    return <Navigate to={target} replace />;
  }
  return children ?? <Outlet />;
}

/** Only allows redirects to pages on this site (never to another website). */
export function safeNext(next: string | null, fallback = '/') {
  if (!next) return fallback;
  return next.startsWith('/') && !next.startsWith('//') ? next : fallback;
}
