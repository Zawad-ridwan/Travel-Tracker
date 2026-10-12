import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Input } from '@/components/ui';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  // Phase 1 replaces this with a real call to POST /api/auth/login
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast('Real accounts arrive in Phase 1', {
        description: 'This form is ready; the server part comes next.',
      });
    }, 600);
  };

  return (
    <>
      <h1 className="text-4xl font-semibold">Welcome back</h1>
      <p className="mt-2 text-muted">Log in to continue your journey.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          icon={<Mail />}
          required
        />
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Your password"
          icon={<Lock />}
          required
        />
        <button
          type="button"
          className="self-end text-sm font-semibold text-primary hover:underline"
          onClick={() => toast('Password reset arrives in Phase 1')}
        >
          Forgot password?
        </button>
        <Button type="submit" size="lg" block loading={loading}>
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
