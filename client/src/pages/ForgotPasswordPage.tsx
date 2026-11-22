import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router';
import { Mail, MailCheck } from 'lucide-react';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@tt/shared';
import { Button, Input } from '@/components/ui';
import { api } from '@/lib/api';
import { showServerErrors } from '@/lib/forms';

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const request = useMutation({
    mutationFn: api.auth.forgotPassword,
    onError: (error) => showServerErrors(error, setError),
  });

  if (request.isSuccess) {
    return (
      <div className="text-center">
        <div className="mx-auto grid size-16 animate-float place-items-center rounded-2xl bg-accent-soft text-accent">
          <MailCheck className="size-8" />
        </div>
        <h1 className="mt-6 text-4xl font-semibold">Check your inbox</h1>
        <p className="mt-3 text-muted">
          If an account exists for <strong className="text-ink">{getValues('email')}</strong>, a
          reset link is on its way. It works for 1 hour. Check your spam folder too.
        </p>
        <Link to="/login" className="mt-8 inline-block font-semibold text-primary hover:underline">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-4xl font-semibold">Forgot your password?</h1>
      <p className="mt-2 text-muted">
        It happens to every traveller. Enter your email and we&apos;ll send you a reset link.
      </p>

      <form
        onSubmit={handleSubmit((data) => request.mutate(data))}
        className="mt-8 flex flex-col gap-4"
        noValidate
      >
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          icon={<Mail />}
          error={errors.email?.message}
          {...register('email')}
        />
        <Button type="submit" size="lg" block loading={request.isPending}>
          Send reset link
        </Button>
      </form>

      <p className="mt-8 text-center text-muted">
        Remembered it?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}
