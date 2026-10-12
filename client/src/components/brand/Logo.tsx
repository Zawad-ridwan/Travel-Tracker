import { APP_NAME } from '@tt/shared';
import { cn } from '@/lib/cn';

/** The stamp-and-plane mark. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn('size-9 shrink-0', className)}>
      <circle
        cx="32"
        cy="32"
        r="29"
        fill="var(--surface)"
        stroke="var(--primary)"
        strokeWidth="4"
        strokeDasharray="6 3"
      />
      <circle cx="32" cy="32" r="21" fill="none" stroke="var(--primary)" strokeWidth="2.5" />
      <path d="M20 36 L44 26 L38 42 L33 36 Z" fill="var(--primary)" />
      <path d="M33 36 L44 26" stroke="var(--surface)" strokeWidth="1.5" />
    </svg>
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
