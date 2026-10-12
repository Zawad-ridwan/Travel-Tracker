import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  /** An icon shown inside the field on the left. */
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, icon, className, id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const helpId = `${inputId}-help`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-ink">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted [&_svg]:size-5">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={error || hint ? helpId : undefined}
            className={cn(
              'h-12 w-full rounded-2xl border border-line bg-surface-2/60 px-4 text-ink placeholder:text-muted/70',
              'transition-[border-color,box-shadow,background-color] focus:border-primary focus:bg-surface focus:outline-none focus:ring-4 focus:ring-primary/15',
              icon && 'pl-12',
              error && 'border-danger focus:border-danger focus:ring-danger/15',
              className,
            )}
            {...props}
          />
        </div>
        {(error || hint) && (
          <p id={helpId} className={cn('text-sm', error ? 'text-danger' : 'text-muted')}>
            {error ?? hint}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';
