import { Link, Outlet } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { Photo } from '@/components/Photo';
import { Stamp } from '@/components/ui';
import { AUTH_PHOTO } from '@/data/sample';
import { ThemeToggle } from './ThemeToggle';

/** Full-screen layout for log in and sign up: photo on the left (desktop), form on the right. */
export function AuthLayout() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <Photo src={AUTH_PHOTO} alt="A traveller looking out over mountains" className="absolute inset-0 size-full" />
        <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <h2 className="max-w-md text-5xl font-semibold leading-tight text-white">
            Every trip deserves a stamp.
          </h2>
          <p className="mt-3 max-w-sm text-lg text-white/85">
            Plan, track and remember your journeys in one place.
          </p>
        </div>
        <Stamp
          title="Welcome"
          label="Entry"
          caption="All travellers"
          size="lg"
          rotate={-12}
          className="absolute right-12 top-12 text-white mix-blend-normal"
          animate
        />
      </div>

      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-ink"
          >
            <ArrowLeft className="size-4" /> Back
          </Link>
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <Logo className="mb-8" />
          <Outlet />
        </div>
      </div>
    </div>
  );
}
