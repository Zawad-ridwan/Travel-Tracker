import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  currencyForCountry,
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_IDS,
  isValidIsoDate,
  TRIP_LIMITS,
  todayIso,
  type Expense,
  type ExpenseCategory,
  type Trip,
} from '@tt/shared';
import { ChipGroup } from '@/components/forms/ChipGroup';
import { CurrencySelect } from '@/components/forms/CurrencySelect';
import { Button, Input, Modal } from '@/components/ui';
import { useRates } from '@/features/currency/useRates';
import { api } from '@/lib/api';
import { showServerErrors } from '@/lib/forms';
import { convertMoney, formatMoney } from '@/lib/money';
import { useTripAction } from './useTrips';

const expenseFormSchema = z.object({
  title: z.string().trim().min(1, 'What was it for?').max(120, 'Use 120 characters or fewer'),
  amount: z
    .string()
    .refine((v) => {
      const n = Number(v);
      return v.trim() !== '' && Number.isFinite(n) && n > 0 && n <= TRIP_LIMITS.maxAmount;
    }, 'Enter an amount above 0'),
  currency: z.string().min(1, 'Choose a currency'),
  category: z.enum(EXPENSE_CATEGORY_IDS),
  date: z.string().refine(isValidIsoDate, 'Pick a date'),
});
type ExpenseForm = z.infer<typeof expenseFormSchema>;

/** Today if the trip is on, otherwise its first day. */
function defaultDate(trip: Trip) {
  const today = todayIso();
  return today >= trip.startDate && today <= trip.endDate ? today : trip.startDate;
}

function toForm(trip: Trip, expense: Expense | undefined): ExpenseForm {
  return {
    title: expense?.title ?? '',
    amount: expense ? String(expense.amount) : '',
    // New expenses default to the local money of the destination
    currency: expense?.currency ?? currencyForCountry(trip.countryCode) ?? trip.currency,
    category: expense?.category ?? 'food',
    date: expense?.date ?? defaultDate(trip),
  };
}

export interface ExpenseEditorState {
  expense?: Expense;
}

interface ExpenseFormModalProps {
  trip: Trip;
  state: ExpenseEditorState | null;
  onClose: () => void;
  /** Called after a new expense is saved, with the trip as the server returned it. */
  onAdded?: (trip: Trip) => void;
}

/** Log what you spent, in whatever currency you paid. */
export function ExpenseFormModal({ trip, state, onClose, onAdded }: ExpenseFormModalProps) {
  const expense = state?.expense;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { data: rates } = useRates();

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    watch,
    formState: { errors },
  } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: toForm(trip, expense),
  });

  useEffect(() => {
    if (state) {
      reset(toForm(trip, state.expense));
      setConfirmDelete(false);
    }
    // Only when the dialog opens, not every time the trip changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, reset]);

  type ExpenseInput = { title: string; amount: number; currency: string; category: ExpenseCategory; date: string };
  const add = useTripAction(trip.id, (data: ExpenseInput) => api.trips.addExpense(trip.id, data));
  const update = useTripAction(trip.id, (data: ExpenseInput) => api.trips.updateExpense(trip.id, expense!.id, data));
  const remove = useTripAction(trip.id, () => api.trips.removeExpense(trip.id, expense!.id), { toastErrors: true });

  const onSubmit = handleSubmit((values) => {
    const input: ExpenseInput = { ...values, amount: Number(values.amount) };
    const action = expense ? update : add;
    action.mutate(input, {
      onSuccess: ({ trip: updated }) => {
        toast.success(expense ? 'Expense updated' : 'Expense added');
        if (!expense) onAdded?.(updated);
        onClose();
      },
      onError: (error) => showServerErrors(error, setError),
    });
  });

  const onDelete = () => {
    if (!confirmDelete) return setConfirmDelete(true);
    remove.mutate(undefined, {
      onSuccess: () => {
        toast('Expense removed');
        onClose();
      },
    });
  };

  const [amountText, currency] = watch(['amount', 'currency']);
  const amount = Number(amountText);
  const preview =
    currency !== trip.currency && amount > 0 ? convertMoney(amount, currency, trip.currency, rates?.rates) : null;

  return (
    <Modal
      open={state !== null}
      onOpenChange={(open) => !open && onClose()}
      title={expense ? 'Edit expense' : 'Add an expense'}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
          <Input
            label="Amount"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            placeholder="0"
            autoFocus
            error={errors.amount?.message}
            {...register('amount')}
          />
          <CurrencySelect label="Paid in" error={errors.currency?.message} {...register('currency')} />
        </div>

        {currency !== trip.currency && amount > 0 && (
          <p className="-mt-2 flex items-center gap-2 rounded-2xl bg-accent-soft/60 px-3 py-2 text-sm font-semibold text-accent">
            {formatMoney(amount, currency)} <ArrowRight className="size-4" />
            {preview === null ? `converted to ${trip.currency} when saved` : `≈ ${formatMoney(preview, trip.currency)}`}
          </p>
        )}

        <Input
          label="What for"
          placeholder="e.g. Train to Osaka"
          maxLength={120}
          error={errors.title?.message}
          {...register('title')}
        />

        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <ChipGroup label="Category" options={EXPENSE_CATEGORIES} value={field.value} onChange={field.onChange} />
          )}
        />

        <Input label="Date" type="date" error={errors.date?.message} {...register('date')} />

        <div className="flex flex-wrap items-center gap-3">
          {expense && (
            <Button variant={confirmDelete ? 'danger' : 'ghost'} onClick={onDelete} loading={remove.isPending}>
              <Trash2 /> {confirmDelete ? 'Tap again to delete' : 'Delete'}
            </Button>
          )}
          <div className="ml-auto flex gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={add.isPending || update.isPending}>
              {expense ? 'Save' : 'Add expense'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
