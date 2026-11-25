import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface ChipOption<T extends string> {
  id: T;
  label: string;
  icon?: LucideIcon;
}

interface ChipGroupProps<T extends string> {
  label: string;
  options: readonly ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Hide the label visually (it is still read by screen readers). */
  hideLabel?: boolean;
}

/** A row of pill buttons where exactly one is chosen (works like radio buttons). */
export function ChipGroup<T extends string>({ label, options, value, onChange, hideLabel }: ChipGroupProps<T>) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className={cn('text-sm font-semibold text-ink', hideLabel && 'sr-only')}>{label}</span>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map(({ id, label: optionLabel, icon: Icon }) => {
          const selected = id === value;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(id)}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-[background-color,border-color,color,scale] active:scale-[0.97]',
                selected
                  ? 'border-primary bg-primary-soft text-primary'
                  : 'border-line bg-surface text-muted hover:border-primary/40 hover:text-ink',
              )}
            >
              {Icon && <Icon className="size-4" />}
              {optionLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
