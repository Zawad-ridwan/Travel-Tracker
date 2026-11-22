import { APP_NAME } from '@tt/shared';
import { cn } from '@/lib/cn';

/**
 * The Travel Tracker emblem.
 * - Small sizes (nav bars): the simplified mark, /favicon.svg
 * - Large sizes (hero, auth pages): the full detailed logo, /logo.svg
 */
export function LogoMark({ className, detailed }: { className?: string; detailed?: boolean }) {
  return (
    <img
      src={detailed ? '/logo.svg' : '/favicon.svg'}
      alt=""
      aria-hidden
      draggable={false}
      className={cn('size-9 shrink-0 select-none', className)}
    />
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      {!compact && (
        <span className="font-display text-xl font-bold leading-none tracking-tight">
          {APP_NAME}
        </span>
      )}
    </span>
  );
}
