import { forwardRef, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Input, type InputProps } from '@/components/ui/Input';
import { cn } from '@/lib/cn';

interface PasswordInputProps extends Omit<InputProps, 'type' | 'icon'> {
  /** Pass the current value to show a strength bar under the field (for new passwords). */
  strengthOf?: string;
}

/** Rough strength score from 0 to 4. Only a hint; the real rules live in the shared schema. */
function strength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const LABELS = ['Too short', 'Weak', 'Okay', 'Strong', 'Excellent'];
const COLORS = ['bg-danger', 'bg-danger', 'bg-sun', 'bg-accent', 'bg-success'];

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ strengthOf, className, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const score = strength(strengthOf ?? '');

    return (
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Input
            ref={ref}
            type={visible ? 'text' : 'password'}
            icon={<Lock />}
            className={cn('pr-12', className)}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            className={cn(
              'absolute right-2 grid size-9 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink',
              // Line up with the input whether or not it has a label above it
              props.label ? 'top-8' : 'top-1.5',
            )}
          >
            {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
        {strengthOf !== undefined && strengthOf.length > 0 && (
          <div className="flex items-center gap-3" aria-live="polite">
            <div className="flex flex-1 gap-1" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-colors',
                    i < Math.max(1, score) ? COLORS[score] : 'bg-surface-2',
                  )}
                />
              ))}
            </div>
            <span className="w-20 text-right text-xs font-semibold text-muted">{LABELS[score]}</span>
          </div>
        )}
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';
