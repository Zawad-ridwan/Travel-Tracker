import { Link } from 'react-router';
import { LogIn, Shield, Wrench } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { Avatar } from '@/components/ui';
import { useAuth } from '@/features/auth/useAuth';
import { ThemeToggle } from './ThemeToggle';
import { useToolkit } from './toolkit';

const iconButton =
  'grid size-10 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink';

/** Phone header (hidden on desktop, where the sidebar takes over). */
export function TopBar() {
  const { setOpen } = useToolkit();
  const { user, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line/70 bg-bg/80 px-4 backdrop-blur-xl md:hidden">
      <Link to="/" aria-label="Travel Tracker home">
        <Logo />
      </Link>
      <div className="flex items-center gap-1">
        {isAdmin && (
          <Link to="/admin" aria-label="Admin dashboard" className={iconButton}>
            <Shield className="size-5" />
          </Link>
        )}
        <button type="button" onClick={() => setOpen(true)} aria-label="Open toolkit" className={iconButton}>
          <Wrench className="size-5" />
        </button>
        <ThemeToggle />
        {user ? (
          <Link to="/me" aria-label="My profile" className="ml-1">
            <Avatar name={user.name} src={user.avatarUrl} size="sm" />
          </Link>
        ) : (
          <Link to="/login" aria-label="Log in" className={iconButton}>
            <LogIn className="size-5" />
          </Link>
        )}
      </div>
    </header>
  );
}
