import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface ProgressRingProps {
  /** 0 to 100 */
  value: number;
  size?: number;
  stroke?: number;
  tone?: 'primary' | 'accent' | 'sun';
  /** Shown in the middle of the ring. */
  children?: ReactNode;
  label: string;
  className?: string;
}

const toneClass = { primary: 'text-primary', accent: 'text-accent', sun: 'text-sun' };

/** Circular progress, used for budgets, XP and "countries visited". */
export function ProgressRing({
  value,
  size = 96,
  stroke = 10,
  tone = 'primary',
  children,
  label,
  className,
}: ProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('relative inline-grid place-items-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-surface-2"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          className={cn('transition-[stroke-dashoffset] duration-700 ease-out', toneClass[tone])}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}
