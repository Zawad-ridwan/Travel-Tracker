import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** Friendly placeholder for lists with nothing in them yet. Always suggests the next step. */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-3xl border-2 border-dashed border-line px-6 py-12 text-center',
        className,
      )}
    >
      {icon && (
        <div className="mb-4 grid size-16 animate-float place-items-center rounded-2xl bg-primary-soft text-primary [&_svg]:size-8">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-semibold">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
