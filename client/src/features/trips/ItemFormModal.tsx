import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { ITEM_KIND_IDS, tripDates, type ItemKind, type Trip, type TripItem } from '@tt/shared';
import { ChipGroup } from '@/components/forms/ChipGroup';
import { Select, Textarea } from '@/components/forms/Field';
import { Button, Input, Modal } from '@/components/ui';
import { api } from '@/lib/api';
import { formatDay } from '@/lib/format';
import { showServerErrors } from '@/lib/forms';
import { KIND_META } from './kinds';
import { useTripAction } from './useTrips';

const itemFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Give it a name').max(120, 'Use 120 characters or fewer'),
    kind: z.enum(ITEM_KIND_IDS),
    /** "" means Ideas */
    date: z.string(),
    time: z.string(),
    endTime: z.string(),
    location: z.string().trim().max(160, 'Use 160 characters or fewer'),
    cost: z
      .string()
      .refine((v) => v.trim() === '' || (Number.isFinite(Number(v)) && Number(v) >= 0), 'Use 0 or more'),
    notes: z.string().trim().max(1000, 'Use 1000 characters or fewer'),
  })
  .superRefine((v, ctx) => {
    if (v.endTime && !v.time) {
      ctx.addIssue({ code: 'custom', path: ['time'], message: 'Add a start time too' });
    } else if (v.time && v.endTime && v.endTime <= v.time) {
      ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'End after it starts' });
    }
  });
type ItemForm = z.infer<typeof itemFormSchema>;

const KIND_OPTIONS = ITEM_KIND_IDS.map((id) => ({ id, label: KIND_META[id].label, icon: KIND_META[id].icon }));

function toForm(item: TripItem | undefined, date: string | null): ItemForm {
  return {
    title: item?.title ?? '',
    kind: item?.kind ?? 'place',
    date: (item ? item.date : date) ?? '',
    time: item?.time ?? '',
    endTime: item?.endTime ?? '',
    location: item?.location ?? '',
    cost: item?.cost != null ? String(item.cost) : '',
    notes: item?.notes ?? '',
  };
}

function toInput(v: ItemForm) {
  return {
    title: v.title,
    kind: v.kind as ItemKind,
    date: v.date || null,
    time: v.time || null,
    endTime: v.endTime || null,
    location: v.location,
    cost: v.cost.trim() === '' ? null : Number(v.cost),
    notes: v.notes,
  };
}

export interface ItemEditorState {
  /** The plan to edit; leave out to add a new one. */
  item?: TripItem;
  /** Day for a new plan (null = Ideas). */
  date: string | null;
}

interface ItemFormModalProps {
  trip: Trip;
  state: ItemEditorState | null;
  onClose: () => void;
}

/** Add or edit one plan in the itinerary. Also the keyboard- and phone-friendly way to move it to another day. */
export function ItemFormModal({ trip, state, onClose }: ItemFormModalProps) {
  const item = state?.item;
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ItemForm>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: toForm(item, state?.date ?? null),
  });

  useEffect(() => {
    if (state) {
      reset(toForm(state.item, state.date));
      setConfirmDelete(false);
    }
  }, [state, reset]);

  const add = useTripAction(trip.id, (data: ReturnType<typeof toInput>) => api.trips.addItem(trip.id, data));
  const update = useTripAction(trip.id, (data: ReturnType<typeof toInput>) =>
    api.trips.updateItem(trip.id, item!.id, data),
  );
  const remove = useTripAction(trip.id, () => api.trips.removeItem(trip.id, item!.id), { toastErrors: true });

  const onSubmit = handleSubmit((values) => {
    const action = item ? update : add;
    action.mutate(toInput(values), {
      onSuccess: () => {
        toast.success(item ? 'Plan updated' : 'Added to your plan');
        onClose();
      },
      onError: (error) => showServerErrors(error, setError),
    });
  });

  const onDelete = () => {
    if (!confirmDelete) return setConfirmDelete(true);
    remove.mutate(undefined, {
      onSuccess: () => {
        toast('Plan removed');
        onClose();
      },
    });
  };

  const days = tripDates(trip.startDate, trip.endDate);

  return (
    <Modal
      open={state !== null}
      onOpenChange={(open) => !open && onClose()}
      title={item ? 'Edit plan' : 'Add a plan'}
      className="max-w-xl"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        <Input
          label="What"
          placeholder="e.g. Fushimi Inari shrine"
          maxLength={120}
          autoFocus
          error={errors.title?.message}
          {...register('title')}
        />

        <Controller
          control={control}
          name="kind"
          render={({ field }) => (
            <ChipGroup label="Type" options={KIND_OPTIONS} value={field.value} onChange={field.onChange} />
          )}
        />

        <div className="grid gap-4 sm:grid-cols-[1fr_8rem_8rem]">
          <Select label="Day" error={errors.date?.message} {...register('date')}>
            <option value="">💡 Ideas (no day yet)</option>
            {days.map((date, i) => (
              <option key={date} value={date}>
                Day {i + 1} · {formatDay(date)}
              </option>
            ))}
          </Select>
          <Input label="From" type="time" error={errors.time?.message} {...register('time')} />
          <Input label="To" type="time" error={errors.endTime?.message} {...register('endTime')} />
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
          <Input
            label="Where"
            placeholder="Address or area"
            maxLength={160}
            error={errors.location?.message}
            {...register('location')}
          />
          <Input
            label={`Cost (${trip.currency})`}
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            placeholder="0"
            error={errors.cost?.message}
            {...register('cost')}
          />
        </div>

        <Textarea
          label="Notes"
          placeholder="Opening hours, booking number, tips…"
          maxLength={1000}
          error={errors.notes?.message}
          {...register('notes')}
        />

        <div className="flex flex-wrap items-center gap-3">
          {item && (
            <Button variant={confirmDelete ? 'danger' : 'ghost'} onClick={onDelete} loading={remove.isPending}>
              <Trash2 /> {confirmDelete ? 'Tap again to delete' : 'Delete'}
            </Button>
          )}
          <div className="ml-auto flex gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={add.isPending || update.isPending}>
              {item ? 'Save' : 'Add plan'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
