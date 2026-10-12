import { Link } from 'react-router';
import { Wrench } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from './ThemeToggle';
import { useToolkit } from './toolkit';

/** Phone header (hidden on desktop, where the sidebar takes over). */
export function TopBar() {
  const { setOpen } = useToolkit();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line/70 bg-bg/80 px-4 backdrop-blur-xl md:hidden">
      <Link to="/" aria-label="Travel Tracker home">
        <Logo />
      </Link>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open toolkit"
          className="grid size-10 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <Wrench className="size-5" />
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
