import type { CSSProperties } from 'react';
import { cn } from '@/lib/cn';

type StampTone = 'primary' | 'accent' | 'sun';

export interface StampProps {
  /** Big word in the middle, e.g. a country or badge name. */
  title: string;
  /** Small text above the title, e.g. "Visited" or "Badge". */
  label?: string;
  /** Small text under the title, e.g. a date. */
  caption?: string;
  tone?: StampTone;
  shape?: 'circle' | 'rect';
  /** Tilt in degrees. Real stamps are never straight. */
  rotate?: number;
  /** Play the "thunk" animation when it appears. */
  animate?: boolean;
  /** Greyed out, for stamps not earned yet. */
  locked?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const toneClass: Record<StampTone, string> = {
  primary: 'text-primary',
  accent: 'text-accent',
  sun: 'text-sun',
};

const sizeClass = {
  circle: { sm: 'size-20', md: 'size-28', lg: 'size-36' },
  rect: { sm: 'min-w-24 px-3 py-2', md: 'min-w-32 px-4 py-3', lg: 'min-w-40 px-5 py-4' },
};

const titleSize = { sm: 'text-sm', md: 'text-lg', lg: 'text-2xl' };

/** A passport-style ink stamp — used for visited countries, badges and achievements. */
export function Stamp({
  title,
  label,
  caption,
  tone = 'primary',
  shape = 'circle',
  rotate = -8,
  animate = false,
  locked = false,
  size = 'md',
  className,
}: StampProps) {
  const style = { '--stamp-rotate': `${rotate}deg`, rotate: animate ? undefined : `${rotate}deg` };

  return (
    <div
      role="img"
      aria-label={[label, title, caption].filter(Boolean).join(', ') + (locked ? ' (locked)' : '')}
      style={style as CSSProperties}
      className={cn(
        'relative inline-flex shrink-0 flex-col items-center justify-center border-[3px] text-center uppercase',
        'mix-blend-multiply dark:mix-blend-normal',
        shape === 'circle' ? 'rounded-full' : 'rounded-xl',
        sizeClass[shape][size],
        locked ? 'border-dashed text-muted/50' : toneClass[tone],
        animate && 'animate-stamp',
        className,
      )}
    >
      {/* Inner ring, like a real rubber stamp */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-1 border border-current opacity-70',
          shape === 'circle' ? 'rounded-full' : 'rounded-lg',
        )}
      />
      {label && (
        <span className="text-[0.6rem] font-bold tracking-[0.2em] opacity-80">{label}</span>
      )}
      <span
        className={cn(
          'max-w-[90%] font-display font-black leading-tight tracking-wide',
          titleSize[size],
        )}
      >
        {title}
      </span>
      {caption && (
        <span className="mt-0.5 text-[0.6rem] font-semibold tracking-[0.15em] opacity-80">
          {caption}
        </span>
      )}
    </div>
  );
}
