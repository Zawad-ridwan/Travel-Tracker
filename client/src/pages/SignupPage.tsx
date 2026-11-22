import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router';
import { Mail, User } from 'lucide-react';
import { toast } from 'sonner';
import { signupSchema, type SignupInput } from '@tt/shared';
import { PasswordInput } from '@/components/forms/PasswordInput';
import { Button, Input } from '@/components/ui';
import { useSetUser } from '@/features/auth/useAuth';
import { api } from '@/lib/api';
import { firstName } from '@/lib/format';
import { showServerErrors } from '@/lib/forms';

export default function SignupPage() {
  const setUser = useSetUser();

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const signup = useMutation({
    mutationFn: api.auth.signup,
    onSuccess: ({ user }) => {
      // Saving the user makes the GuestOnly guard move on to /onboarding
      setUser(user);
      toast.success(`Welcome, ${firstName(user.name)}! Your passport is ready.`);
    },
    onError: (error) => showServerErrors(error, setError),
  });

  return (
    <>
      <h1 className="text-4xl font-semibold">Start your passport</h1>
      <p className="mt-2 text-muted">Free forever. Your first stamp is waiting.</p>

      <form
        onSubmit={handleSubmit((data) => signup.mutate(data))}
        className="mt-8 flex flex-col gap-4"
        noValidate
      >
        <Input
          label="Name"
          autoComplete="name"
          placeholder="What should we call you?"
          icon={<User />}
          error={errors.name?.message}
          {...register('name')}
        />
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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint="8 or more characters, with at least one letter and one number."
          error={errors.password?.message}
          strengthOf={watch('password')}
          {...register('password')}
        />
        <Button type="submit" size="lg" block loading={signup.isPending} className="mt-2">
          Create account
        </Button>
        <p className="text-center text-xs text-muted">
          By signing up you agree to use Travel Tracker kindly and honestly.
        </p>
      </form>

      <p className="mt-8 text-center text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}
