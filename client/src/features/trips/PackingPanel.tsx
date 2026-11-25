import { useState, type FormEvent } from 'react';
import { Backpack, Check, Plus, RotateCcw, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  PACKING_CATEGORIES,
  PACKING_CATEGORY_IDS,
  PACKING_TEMPLATES,
  type PackingCategory,
  type PackingItem,
  type PackingTemplate,
  type Trip,
} from '@tt/shared';
import { Select } from '@/components/forms/Field';
import { Button, Card, CardContent, EmptyState, Input, Stamp } from '@/components/ui';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { useTripAction } from './useTrips';

const TEMPLATE_IDS = Object.keys(PACKING_TEMPLATES) as PackingTemplate[];

/** A checklist you tick off while packing. Ticks show instantly and save in the background. */
export function PackingPanel({ trip }: { trip: Trip }) {
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState<PackingCategory>('other');
  const [error, setError] = useState<string>();

  const toggle = useTripAction(
    trip.id,
    ({ id, packed }: { id: string; packed: boolean }) => api.trips.updatePacking(trip.id, id, { packed }),
    {
      optimistic: (t, { id, packed }) => ({
        ...t,
        packing: t.packing.map((p) => (p.id === id ? { ...p, packed } : p)),
      }),
      toastErrors: true,
    },
  );
  const remove = useTripAction(trip.id, (id: string) => api.trips.removePacking(trip.id, id), {
    optimistic: (t, id) => ({ ...t, packing: t.packing.filter((p) => p.id !== id) }),
    toastErrors: true,
  });
  const add = useTripAction(trip.id, (data: { label: string; category: PackingCategory }) =>
    api.trips.addPacking(trip.id, data),
  );
  const template = useTripAction(
    trip.id,
    (name: PackingTemplate) => api.trips.addPackingTemplate(trip.id, { template: name }),
    { toastErrors: true },
  );
  const unpackAll = useTripAction(trip.id, () => api.trips.unpackAll(trip.id), { toastErrors: true });

  const total = trip.packing.length;
  const packed = trip.packing.filter((p) => p.packed).length;
  const allPacked = total > 0 && packed === total;

  const onAdd = (e: FormEvent) => {
    e.preventDefault();
    const clean = label.trim();
    if (!clean) return setError('Name the item');
    add.mutate(
      { label: clean, category },
      {
        onSuccess: () => {
          setLabel('');
          setError(undefined);
        },
        onError: (err) => setError(err.message),
      },
    );
  };

  const onTemplate = (name: PackingTemplate) => {
    const before = trip.packing.length;
    template.mutate(name, {
      onSuccess: ({ trip: updated }) => {
        const added = updated.packing.length - before;
        toast.success(added > 0 ? `Added ${added} items` : 'You already have all of these');
      },
    });
  };

  const groups = PACKING_CATEGORIES.map((c) => ({
    ...c,
    items: trip.packing.filter((p) => p.category === c.id),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex flex-col gap-4">
        {/* Progress */}
        <Card className="overflow-hidden">
          <CardContent className="relative flex items-center gap-5">
            <div className="flex-1">
              <p className="text-sm font-semibold text-muted">Packed</p>
              <p className="font-display text-4xl font-bold">
                {packed}
                <span className="text-2xl text-muted"> / {total}</span>
              </p>
              <div
                className="mt-3 h-3 overflow-hidden rounded-full bg-surface-2"
                role="progressbar"
                aria-label="Items packed"
                aria-valuenow={total ? Math.round((packed / total) * 100) : 0}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-500"
                  style={{ width: `${total ? (packed / total) * 100 : 0}%` }}
                />
              </div>
            </div>
            {allPacked ? (
              <Stamp title="Ready" label="All packed" tone="accent" rotate={-10} size="sm" animate />
            ) : (
              <span className="grid size-20 place-items-center rounded-full bg-accent-soft text-accent">
                <Backpack className="size-9" />
              </span>
            )}
          </CardContent>
        </Card>

        {/* Add an item */}
        <form onSubmit={onAdd} className="flex flex-col gap-2 sm:flex-row sm:items-start" noValidate>
          <div className="flex-1">
            <Input
              aria-label="New item"
              placeholder="Add an item, e.g. Rain jacket"
              maxLength={80}
              value={label}
              error={error}
              onChange={(e) => {
                setLabel(e.target.value);
                setError(undefined);
              }}
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1 sm:w-44">
              <Select
                aria-label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value as PackingCategory)}
              >
                {PACKING_CATEGORY_IDS.map((id) => (
                  <option key={id} value={id}>
                    {PACKING_CATEGORIES.find((c) => c.id === id)?.label}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" size="icon" className="size-12" aria-label="Add item" loading={add.isPending}>
              {!add.isPending && <Plus />}
            </Button>
          </div>
        </form>

        {/* The list */}
        {total === 0 ? (
          <EmptyState
            icon={<Backpack />}
            title="Nothing on the list yet"
            description="Add items one by one, or start with a ready-made list."
          />
        ) : (
          groups.map((group) => (
            <Card key={group.id}>
              <CardContent className="py-4 sm:py-5">
                <h3 className="mb-2 flex items-center justify-between text-lg font-semibold">
                  {group.label}
                  <span className="text-sm font-semibold text-muted">
                    {group.items.filter((i) => i.packed).length}/{group.items.length}
                  </span>
                </h3>
                <ul className="flex flex-col">
                  {group.items.map((item) => (
                    <PackingRow
                      key={item.id}
                      item={item}
                      onToggle={() => toggle.mutate({ id: item.id, packed: !item.packed })}
                      onRemove={() => remove.mutate(item.id)}
                    />
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Templates */}
      <Card className="lg:sticky lg:top-24">
        <CardContent className="flex flex-col gap-4">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Sparkles className="size-5 text-sun" /> Quick lists
            </h3>
            <p className="text-sm text-muted">Adds what you don&apos;t have yet. Themed lists include the essentials.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {TEMPLATE_IDS.map((id) => (
              <Button
                key={id}
                size="sm"
                variant="secondary"
                disabled={template.isPending}
                onClick={() => onTemplate(id)}
              >
                <Plus /> {PACKING_TEMPLATES[id].label}
              </Button>
            ))}
          </div>
          {packed > 0 && (
            <Button variant="ghost" size="sm" className="self-start" loading={unpackAll.isPending} onClick={() => unpackAll.mutate(undefined)}>
              <RotateCcw /> Untick everything
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PackingRow({ item, onToggle, onRemove }: { item: PackingItem; onToggle: () => void; onRemove: () => void }) {
  return (
    <li className="group flex items-center gap-2">
      <button
        type="button"
        role="checkbox"
        aria-checked={item.packed}
        onClick={onToggle}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-2.5 text-left hover:bg-surface-2/60"
      >
        <span
          className={cn(
            'grid size-6 shrink-0 place-items-center rounded-lg border-2 transition-colors',
            item.packed ? 'border-accent bg-accent text-white dark:text-bg' : 'border-line',
          )}
        >
          {item.packed && <Check className="size-4" strokeWidth={3} />}
        </span>
        <span className={cn('truncate', item.packed && 'text-muted line-through')}>{item.label}</span>
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${item.label}`}
        className="grid size-8 shrink-0 place-items-center rounded-full text-muted opacity-100 transition-opacity hover:bg-surface-2 hover:text-ink sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
      >
        <X className="size-4" />
      </button>
    </li>
  );
}
