import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

const control =
  'w-full rounded-2xl border border-line bg-surface-2/60 px-4 text-ink placeholder:text-muted/70 transition-[border-color,box-shadow,background-color] focus:border-primary focus:bg-surface focus:outline-none focus:ring-4 focus:ring-primary/15';

interface FieldShellProps {
  id: string;
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

function FieldShell({ id, label, hint, error, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          {label}
        </label>
      )}
      {children}
      {(error || hint) && (
        <p id={`${id}-help`} className={cn('text-sm', error ? 'text-danger' : 'text-muted')}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

/** A styled native <select>: works with keyboards, screen readers and phone pickers. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, className, id, children, ...props }, ref) => {
    const autoId = useId();
    const selectId = id ?? autoId;
    return (
      <FieldShell id={selectId} label={label} hint={hint} error={error}>
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={error ? true : undefined}
            aria-describedby={error || hint ? `${selectId}-help` : undefined}
            className={cn(control, 'h-12 appearance-none pr-10', error && 'border-danger', className)}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
        </div>
      </FieldShell>
    );
  },
);
Select.displayName = 'Select';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className, id, ...props }, ref) => {
    const autoId = useId();
    const areaId = id ?? autoId;
    return (
      <FieldShell id={areaId} label={label} hint={hint} error={error}>
        <textarea
          ref={ref}
          id={areaId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${areaId}-help` : undefined}
          className={cn(control, 'min-h-24 resize-y py-3', error && 'border-danger', className)}
          {...props}
        />
      </FieldShell>
    );
  },
);
Textarea.displayName = 'Textarea';
