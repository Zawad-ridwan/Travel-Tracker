import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { MailWarning, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useAuth } from './useAuth';

/** A gentle reminder for logged-in users who have not confirmed their email yet. */
export function VerifyEmailBanner() {
  const { user } = useAuth();
  const [hidden, setHidden] = useState(false);

  const resend = useMutation({
    mutationFn: api.auth.resendVerification,
    onSuccess: ({ message }) => toast.success(message),
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Could not send it'),
  });

  if (!user || user.emailVerified || hidden) return null;

  return (
    <div
      role="status"
      className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-sun/30 bg-sun-soft px-4 py-3 text-sm"
    >
      <MailWarning className="size-5 shrink-0 text-sun" />
      <p className="flex-1 text-ink">
        Confirm your email (<strong>{user.email}</strong>) to secure your account and earn 25 XP.
      </p>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => resend.mutate()}
        loading={resend.isPending}
        disabled={resend.isSuccess}
      >
        {resend.isSuccess ? 'Sent' : 'Resend email'}
      </Button>
      <button
        type="button"
        onClick={() => setHidden(true)}
        aria-label="Hide this reminder"
        className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface hover:text-ink"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
