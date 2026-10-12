import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { Lock, Mail, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Input } from '@/components/ui';

export default function SignupPage() {
  const [loading, setLoading] = useState(false);

  // Phase 1 replaces this with a real call to POST /api/auth/signup
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
      <h1 className="text-4xl font-semibold">Start your passport</h1>
      <p className="mt-2 text-muted">Free forever. Your first stamp is waiting.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <Input
          label="Name"
          name="name"
          autoComplete="name"
          placeholder="What should we call you?"
          icon={<User />}
          required
        />
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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint="Use 8 or more characters with a mix of letters and numbers."
          icon={<Lock />}
          minLength={8}
          required
        />
        <Button type="submit" size="lg" block loading={loading} className="mt-2">
          Create account
        </Button>
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
