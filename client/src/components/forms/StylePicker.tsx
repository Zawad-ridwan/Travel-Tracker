import {
  Backpack,
  Building2,
  Car,
  Compass,
  Crown,
  Landmark,
  Mountain,
  Palmtree,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { TRAVEL_STYLES, type TravelStyle } from '@tt/shared';
import { cn } from '@/lib/cn';

const ICONS: Record<TravelStyle, LucideIcon> = {
  adventure: Compass,
  relaxation: Palmtree,
  culture: Landmark,
  food: UtensilsCrossed,
  nature: Mountain,
  city: Building2,
  budget: Wallet,
  luxury: Crown,
  'road-trip': Car,
  backpacking: Backpack,
};

interface StylePickerProps {
  value: TravelStyle[];
  onChange: (value: TravelStyle[]) => void;
  max?: number;
}

/** Tappable cards for choosing travel styles (up to `max`). */
export function StylePicker({ value, onChange, max = 5 }: StylePickerProps) {
  const toggle = (id: TravelStyle) => {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else if (value.length < max) onChange([...value, id]);
  };

  return (
    <div role="group" aria-label="Travel styles" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {TRAVEL_STYLES.map(({ id, label }) => {
        const Icon = ICONS[id];
        const selected = value.includes(id);
        const disabled = !selected && value.length >= max;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => toggle(id)}
            className={cn(
              'flex items-center gap-3 rounded-2xl border-2 p-3 text-left font-semibold transition-[background-color,border-color,scale] active:scale-[0.97] disabled:opacity-40',
              selected
                ? 'border-primary bg-primary-soft text-primary'
                : 'border-line bg-surface text-ink hover:border-primary/40',
            )}
          >
            <Icon className="size-5 shrink-0" />
            <span className="text-sm leading-tight">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
