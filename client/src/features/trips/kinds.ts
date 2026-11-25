import {
  BedDouble,
  Landmark,
  StickyNote,
  Ticket,
  TrainFront,
  Utensils,
  type LucideIcon,
} from 'lucide-react';
import {
  EXPENSE_CATEGORIES,
  ITEM_KINDS,
  PACKING_CATEGORIES,
  type ExpenseCategory,
  type ItemKind,
  type PackingCategory,
} from '@tt/shared';

export const KIND_META: Record<ItemKind, { label: string; icon: LucideIcon; tone: string }> = {
  place: { label: 'Sightseeing', icon: Landmark, tone: 'bg-primary-soft text-primary' },
  food: { label: 'Food & drink', icon: Utensils, tone: 'bg-sun-soft text-sun' },
  activity: { label: 'Activity', icon: Ticket, tone: 'bg-accent-soft text-accent' },
  transport: { label: 'Transport', icon: TrainFront, tone: 'bg-accent-soft text-accent' },
  stay: { label: 'Stay', icon: BedDouble, tone: 'bg-primary-soft text-primary' },
  note: { label: 'Note', icon: StickyNote, tone: 'bg-surface-2 text-muted' },
};

/** Bar colours for the budget breakdown. */
export const CATEGORY_TONE: Record<ExpenseCategory, string> = {
  accommodation: 'bg-primary',
  food: 'bg-sun',
  transport: 'bg-accent',
  activities: 'bg-success',
  shopping: 'bg-[#c46a8a]',
  other: 'bg-muted',
};

export function kindLabel(kind: ItemKind) {
  return ITEM_KINDS.find((k) => k.id === kind)?.label ?? kind;
}

export function categoryLabel(category: ExpenseCategory) {
  return EXPENSE_CATEGORIES.find((c) => c.id === category)?.label ?? category;
}

export function packingCategoryLabel(category: PackingCategory) {
  return PACKING_CATEGORIES.find((c) => c.id === category)?.label ?? category;
}
