import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';
import { passwordSchema } from '@tt/shared';
import { PasswordInput } from '@/components/forms/PasswordInput';
import { Button } from '@/components/ui';
import { api } from '@/lib/api';
import { showServerErrors } from '@/lib/forms';

const formSchema = z
  .object({
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    path: ['confirm'],
    error: 'The two passwords do not match',
  });
type FormValues = z.infer<typeof formSchema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: '', confirm: '' },
  });

  const reset = useMutation({
    mutationFn: (password: string) => api.auth.resetPassword({ token, password }),
    onSuccess: () => {
      toast.success('Password changed. Log in with your new password.');
      navigate('/login', { replace: true });
    },
    onError: (error) => showServerErrors(error, setError),
  });

  if (!token) {
    return (
      <>
        <h1 className="text-4xl font-semibold">This link is incomplete</h1>
        <p className="mt-3 text-muted">
          Open the link from your email again, or ask for a new one.
        </p>
        <Link to="/forgot-password" className="mt-8 inline-block font-semibold text-primary hover:underline">
          Send a new reset link
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-4xl font-semibold">Choose a new password</h1>
      <p className="mt-2 text-muted">You&apos;ll be logged out of every device for safety.</p>

      <form
        onSubmit={handleSubmit((data) => reset.mutate(data.password))}
        className="mt-8 flex flex-col gap-4"
        noValidate
      >
        <PasswordInput
          label="New password"
          autoComplete="new-password"
          error={errors.password?.message}
          strengthOf={watch('password')}
          {...register('password')}
        />
        <PasswordInput
          label="Type it again"
          autoComplete="new-password"
          error={errors.confirm?.message}
          {...register('confirm')}
        />
        <Button type="submit" size="lg" block loading={reset.isPending}>
          Save new password
        </Button>
      </form>
    </>
  );
}
