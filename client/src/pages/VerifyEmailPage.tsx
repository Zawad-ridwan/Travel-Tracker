import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router';
import { LoaderCircle } from 'lucide-react';
import { buttonVariants, Stamp } from '@/components/ui';
import { ME_KEY, useAuth } from '@/features/auth/useAuth';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const queryClient = useQueryClient();
  const { isLoggedIn } = useAuth();

  // A query (not a mutation) so React's double render in development sends the token only once
  const verify = useQuery({
    queryKey: ['verify-email', token],
    queryFn: () => api.auth.verifyEmail(token),
    enabled: token.length > 0,
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  useEffect(() => {
    if (verify.isSuccess) queryClient.invalidateQueries({ queryKey: ME_KEY });
  }, [verify.isSuccess, queryClient]);

  if (!token || verify.isError) {
    return (
      <div className="text-center">
        <Stamp title="Expired" label="Link" tone="sun" rotate={-8} animate />
        <h1 className="mt-8 text-4xl font-semibold">This link did not work</h1>
        <p className="mt-3 text-muted">
          {verify.error?.message ?? 'The link is incomplete.'} You can ask for a new one from your
          profile.
        </p>
        <Link
          to={isLoggedIn ? '/me' : '/login?next=/me'}
          className={cn(buttonVariants({ size: 'lg' }), 'mt-8')}
        >
          {isLoggedIn ? 'Go to my profile' : 'Log in'}
        </Link>
      </div>
    );
  }

  if (verify.isPending) {
    return (
      <div className="flex flex-col items-center gap-4 text-center text-muted" aria-live="polite">
        <LoaderCircle className="size-8 animate-spin text-primary" />
        Confirming your email…
      </div>
    );
  }

  return (
    <div className="text-center">
      <Stamp title="Verified" label="Email" caption="+25 XP" tone="accent" size="lg" rotate={-10} animate />
      <h1 className="mt-8 text-4xl font-semibold">You&apos;re verified!</h1>
      <p className="mt-3 text-muted">{verify.data.message}</p>
      <Link to={isLoggedIn ? '/' : '/login'} className={cn(buttonVariants({ size: 'lg' }), 'mt-8')}>
        {isLoggedIn ? 'Start exploring' : 'Log in'}
      </Link>
    </div>
  );
}
