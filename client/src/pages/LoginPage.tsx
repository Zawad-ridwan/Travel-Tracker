import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { loginSchema, type LoginInput } from '@tt/shared';
import { PasswordInput } from '@/components/forms/PasswordInput';
import { Button, Input } from '@/components/ui';
import { useSetUser } from '@/features/auth/useAuth';
import { api } from '@/lib/api';
import { firstName } from '@/lib/format';
import { showServerErrors } from '@/lib/forms';

export default function LoginPage() {
  const setUser = useSetUser();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const login = useMutation({
    mutationFn: api.auth.login,
    onSuccess: ({ user }) => {
      // Saving the user makes the GuestOnly guard move on to the right page
      setUser(user);
      toast.success(`Welcome back, ${firstName(user.name)}!`);
    },
    onError: (error) => showServerErrors(error, setError),
  });

  return (
    <>
      <h1 className="text-4xl font-semibold">Welcome back</h1>
      <p className="mt-2 text-muted">Log in to continue your journey.</p>

      <form
        onSubmit={handleSubmit((data) => login.mutate(data))}
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
        <PasswordInput
          label="Password"
          autoComplete="current-password"
          placeholder="Your password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Link
          to="/forgot-password"
          className="self-end text-sm font-semibold text-primary hover:underline"
        >
          Forgot password?
        </Link>
        <Button type="submit" size="lg" block loading={login.isPending}>
          Log in
        </Button>
      </form>

      <p className="mt-8 text-center text-muted">
        New here?{' '}
        <Link to="/signup" className="font-semibold text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
