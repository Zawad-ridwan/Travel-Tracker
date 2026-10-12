import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/** Grey shape shown while content loads. Size it with classes: <Skeleton className="h-6 w-40" /> */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-xl bg-surface-2', className)}
      {...props}
    />
  );
}
