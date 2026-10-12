import { Link, NavLink } from 'react-router';
import { motion } from 'motion/react';
import { LogIn, Plus, Wrench } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { buttonVariants } from '@/components/ui';
import { cn } from '@/lib/cn';
import { NAV_ITEMS } from './nav';
import { ThemeToggle } from './ThemeToggle';
import { useToolkit } from './toolkit';

/** Desktop navigation (hidden on phones). */
export function Sidebar() {
  const { setOpen } = useToolkit();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-line bg-surface/80 px-5 py-6 backdrop-blur-xl md:flex">
      <Link to="/" className="mb-8 px-2" aria-label="Travel Tracker home">
        <Logo />
      </Link>

      <Link to="/trips" className={cn(buttonVariants({ block: true }), 'mb-6')}>
        <Plus /> Plan a trip
      </Link>

      <nav aria-label="Main" className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'relative flex h-12 items-center gap-3 rounded-2xl px-4 font-semibold transition-colors',
                isActive ? 'text-primary' : 'text-muted hover:bg-surface-2 hover:text-ink',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-2xl bg-primary-soft"
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}
                <Icon className="relative size-5" />
                <span className="relative">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 flex h-12 items-center gap-3 rounded-2xl px-4 font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink"
      >
        <Wrench className="size-5" /> Toolkit
      </button>

      <div className="mt-auto flex items-center justify-between rounded-2xl border border-line bg-surface p-2 pl-3">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-primary"
        >
          <LogIn className="size-4" /> Log in
        </Link>
        <ThemeToggle />
      </div>
    </aside>
  );
}
