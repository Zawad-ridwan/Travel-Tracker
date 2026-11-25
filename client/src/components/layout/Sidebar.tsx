import { Link, NavLink, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { LogIn, LogOut, Plus, Shield, Wrench, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '@/components/brand/Logo';
import { Avatar, buttonVariants } from '@/components/ui';
import { useAuth, useLogout } from '@/features/auth/useAuth';
import { cn } from '@/lib/cn';
import { firstName } from '@/lib/format';
import { NAV_ITEMS } from './nav';
import { ThemeToggle } from './ThemeToggle';
import { useToolkit } from './toolkit';

function SideLink({ to, label, icon: Icon }: { to: string; label: string; icon: LucideIcon }) {
  return (
    <NavLink
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
  );
}

/** Desktop navigation (hidden on phones). */
export function Sidebar() {
  const { setOpen } = useToolkit();
  const { user, isAdmin } = useAuth();
  const logout = useLogout();
  const navigate = useNavigate();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-line bg-surface/80 px-5 py-6 backdrop-blur-xl md:flex">
      <Link to="/" className="mb-8 px-2" aria-label="Travel Tracker home">
        <Logo />
      </Link>

      <Link to={user ? '/trips?new=1' : '/trips'} className={cn(buttonVariants({ block: true }), 'mb-6')}>
        <Plus /> Plan a trip
      </Link>

      <nav aria-label="Main" className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <SideLink key={item.to} {...item} />
        ))}
        {isAdmin && <SideLink to="/admin" label="Admin" icon={Shield} />}
      </nav>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 flex h-12 items-center gap-3 rounded-2xl px-4 font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink"
      >
        <Wrench className="size-5" /> Toolkit
      </button>

      <div className="mt-auto flex items-center gap-2 rounded-2xl border border-line bg-surface p-2">
        {user ? (
          <>
            <Link
              to="/me"
              className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1 hover:bg-surface-2"
            >
              <Avatar name={user.name} src={user.avatarUrl} size="md" />
              <span className="min-w-0">
                <span className="block truncate font-semibold">{firstName(user.name)}</span>
                <span className="block text-xs text-muted">
                  Level {user.level} · {user.xp} XP
                </span>
              </span>
            </Link>
            <button
              type="button"
              aria-label="Log out"
              title="Log out"
              onClick={() =>
                logout.mutate(undefined, {
                  onSettled: () => {
                    toast('Logged out. Safe travels!');
                    navigate('/');
                  },
                })
              }
              className="grid size-10 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
            >
              <LogOut className="size-5" />
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="inline-flex flex-1 items-center gap-2 pl-2 text-sm font-semibold text-ink hover:text-primary"
          >
            <LogIn className="size-4" /> Log in
          </Link>
        )}
        <ThemeToggle />
      </div>
    </aside>
  );
}
