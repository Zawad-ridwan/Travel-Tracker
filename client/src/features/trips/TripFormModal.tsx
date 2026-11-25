import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  BUDGET_STYLES,
  COUNTRIES,
  countryName,
  currencyForCountry,
  isValidIsoDate,
  PACKING_TEMPLATES,
  TRIP_COVERS,
  TRIP_LIMITS,
  tripLength,
  XP_REWARDS,
  type PackingTemplate,
  type Trip,
} from '@tt/shared';
import { ChipGroup } from '@/components/forms/ChipGroup';
import { CurrencySelect } from '@/components/forms/CurrencySelect';
import { Select, Textarea } from '@/components/forms/Field';
import { Button, Input, Modal } from '@/components/ui';
import { useRates } from '@/features/currency/useRates';
import { useAuth } from '@/features/auth/useAuth';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { countryFlag } from '@/lib/format';
import { showServerErrors } from '@/lib/forms';
import { convertMoney, formatMoney, tidyAmount } from '@/lib/money';
import { COVER_STYLES } from './covers';
import { useCreateTrip, useTripAction } from './useTrips';

const numberText = (check: (n: number) => boolean, message: string) =>
  z.string().refine((v) => v.trim() === '' || (Number.isFinite(Number(v)) && check(Number(v))), message);

const tripFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Give your trip a name').max(80, 'Use 80 characters or fewer'),
    destination: z.string().trim().max(80, 'Use 80 characters or fewer'),
    countryCode: z.string(),
    startDate: z.string().refine(isValidIsoDate, 'Pick a start date'),
    endDate: z.string().refine(isValidIsoDate, 'Pick an end date'),
    currency: z.string().min(1, 'Choose a currency'),
    budget: numberText((n) => n >= 0 && n <= TRIP_LIMITS.maxAmount, 'Use 0 or more'),
    travelers: numberText(
      (n) => Number.isInteger(n) && n >= 1 && n <= TRIP_LIMITS.maxTravelers,
      `1 to ${TRIP_LIMITS.maxTravelers} travellers`,
    ),
    notes: z.string().trim().max(2000, 'Use 2000 characters or fewer'),
    cover: z.enum(TRIP_COVERS),
    packingTemplate: z.string(),
    convertBudget: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (!isValidIsoDate(v.startDate) || !isValidIsoDate(v.endDate)) return;
    if (v.endDate < v.startDate) {
      ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'The trip must end on or after it starts' });
    } else if (tripLength(v.startDate, v.endDate) > TRIP_LIMITS.maxDays) {
      ctx.addIssue({ code: 'custom', path: ['endDate'], message: `Trips can be up to ${TRIP_LIMITS.maxDays} days long` });
    }
  });
type TripForm = z.infer<typeof tripFormSchema>;

const TEMPLATE_OPTIONS = [
  { id: '', label: 'No list' },
  ...Object.entries(PACKING_TEMPLATES).map(([id, t]) => ({ id, label: t.label })),
];

function toForm(trip: Trip | undefined, defaultCurrency: string): TripForm {
  return {
    title: trip?.title ?? '',
    destination: trip?.destination ?? '',
    countryCode: trip?.countryCode ?? '',
    startDate: trip?.startDate ?? '',
    endDate: trip?.endDate ?? '',
    currency: trip?.currency ?? defaultCurrency,
    budget: trip ? String(trip.budget || '') : '',
    travelers: String(trip?.travelers ?? 1),
    notes: trip?.notes ?? '',
    cover: trip?.cover ?? 'sunset',
    packingTemplate: 'essentials',
    convertBudget: true,
  };
}

function toInput(v: TripForm) {
  return {
    title: v.title,
    destination: v.destination,
    countryCode: v.countryCode || null,
    startDate: v.startDate,
    endDate: v.endDate,
    currency: v.currency,
    budget: v.budget.trim() === '' ? 0 : Number(v.budget),
    travelers: Number(v.travelers || 1),
    notes: v.notes,
    cover: v.cover,
  };
}

interface TripFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edit this trip; leave out to plan a new one. */
  trip?: Trip;
}

/** Plan a new trip, or edit an existing one. */
export function TripFormModal({ open, onOpenChange, trip }: TripFormModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: rates } = useRates();
  const defaultCurrency = currencyForCountry(user?.homeCountry) ?? 'USD';

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    getValues,
    reset,
    watch,
    formState: { errors },
  } = useForm<TripForm>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: toForm(trip, defaultCurrency),
  });

  // Fresh values every time the dialog opens
  useEffect(() => {
    if (open) reset(toForm(trip, defaultCurrency));
  }, [open, trip, defaultCurrency, reset]);

  const create = useCreateTrip();
  const update = useTripAction(trip?.id ?? '', (data: ReturnType<typeof toInput> & { convertBudget?: boolean }) =>
    api.trips.update(trip!.id, data),
  );
  const saving = create.isPending || update.isPending;

  const onSubmit = handleSubmit((values) => {
    const input = toInput(values);
    if (trip) {
      const currencyChanged = values.currency !== trip.currency;
      update.mutate(
        { ...input, ...(currencyChanged ? { convertBudget: values.convertBudget } : {}) },
        {
          onSuccess: () => {
            toast.success('Trip updated');
            onOpenChange(false);
          },
          onError: (error) => showServerErrors(error, setError),
        },
      );
      return;
    }
    create.mutate(
      {
        ...input,
        ...(values.packingTemplate ? { packingTemplate: values.packingTemplate as PackingTemplate } : {}),
      },
      {
        onSuccess: ({ trip: created }) => {
          toast.success('Trip planned!', { description: `+${XP_REWARDS.planTrip} XP for your passport` });
          onOpenChange(false);
          navigate(`/trips/${created.id}`);
        },
        onError: (error) => showServerErrors(error, setError),
      },
    );
  });

  const [startDate, endDate, travelers, currency] = watch(['startDate', 'endDate', 'travelers', 'currency']);
  const days =
    isValidIsoDate(startDate) && isValidIsoDate(endDate) && endDate >= startDate ? tripLength(startDate, endDate) : 0;
  const people = Math.max(1, Number(travelers) || 1);

  /** Rough budgets in the chosen currency, from a daily spend per person in US dollars. */
  const estimates = BUDGET_STYLES.map((style) => {
    const usd = style.perDayUsd * days * people;
    const amount = convertMoney(usd, 'USD', currency, rates?.rates);
    return { ...style, amount: amount === null ? null : tidyAmount(amount) };
  });

  const onCountryChange = (code: string) => {
    // Fill in the destination if it is still empty
    if (code && !getValues('destination').trim()) {
      setValue('destination', countryName(code) ?? '', { shouldDirty: true });
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={trip ? 'Edit trip' : 'Plan a trip'}
      description={trip ? undefined : 'Just the basics. You can change everything later.'}
      className="max-w-xl"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        <Input
          label="Trip name"
          placeholder="e.g. Autumn in Japan"
          maxLength={80}
          autoFocus
          error={errors.title?.message}
          {...register('title')}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Country"
            error={errors.countryCode?.message}
            {...register('countryCode', { onChange: (e) => onCountryChange(e.target.value as string) })}
          >
            <option value="">Several / not set</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {countryFlag(c.code)} {c.name}
              </option>
            ))}
          </Select>
          <Input
            label="Destination"
            placeholder="City or region"
            maxLength={80}
            error={errors.destination?.message}
            {...register('destination')}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="First day" type="date" error={errors.startDate?.message} {...register('startDate')} />
          <Input
            label="Last day"
            type="date"
            min={startDate || undefined}
            error={errors.endDate?.message}
            {...register('endDate')}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_7rem]">
          <CurrencySelect label="Budget currency" error={errors.currency?.message} {...register('currency')} />
          <Input
            label="Budget"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            placeholder="0"
            error={errors.budget?.message}
            {...register('budget')}
          />
          <Input
            label="Travellers"
            type="number"
            inputMode="numeric"
            min={1}
            max={TRIP_LIMITS.maxTravelers}
            error={errors.travelers?.message}
            {...register('travelers')}
          />
        </div>

        {trip && currency !== trip.currency && (
          <label className="-mt-2 flex items-start gap-3 rounded-2xl bg-sun-soft/60 p-3 text-sm">
            <input type="checkbox" className="mt-0.5 size-4 accent-primary" {...register('convertBudget')} />
            <span>
              Convert the budget from {trip.currency} to {currency} too. Expenses and planned costs are converted
              automatically.
            </span>
          </label>
        )}

        {days > 0 && (
          <div className="-mt-2 flex flex-col gap-2">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-muted">
              <Sparkles className="size-4 text-sun" /> Not sure? Tap an estimate for {days} {days === 1 ? 'day' : 'days'}
              {people > 1 ? ` × ${people} people` : ''}
            </span>
            <div className="flex flex-wrap gap-2">
              {estimates.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  disabled={e.amount === null}
                  title={e.description}
                  onClick={() => e.amount !== null && setValue('budget', String(e.amount), { shouldDirty: true })}
                  className="rounded-2xl border border-line bg-surface px-3 py-2 text-left text-sm transition-[border-color,translate] hover:-translate-y-0.5 hover:border-primary/50 disabled:opacity-50"
                >
                  <span className="block font-semibold">{e.label}</span>
                  <span className="block text-muted">
                    {e.amount === null ? 'Rates unavailable' : formatMoney(e.amount, currency)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <Controller
          control={control}
          name="cover"
          render={({ field }) => (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">Cover</span>
              <div role="radiogroup" aria-label="Cover" className="flex flex-wrap gap-3">
                {TRIP_COVERS.map((cover) => (
                  <button
                    key={cover}
                    type="button"
                    role="radio"
                    aria-checked={field.value === cover}
                    aria-label={COVER_STYLES[cover].label}
                    title={COVER_STYLES[cover].label}
                    onClick={() => field.onChange(cover)}
                    className={cn(
                      'grid size-11 place-items-center rounded-2xl text-white ring-offset-2 ring-offset-surface transition-[scale] active:scale-95',
                      COVER_STYLES[cover].className,
                      field.value === cover && 'ring-2 ring-ink',
                    )}
                  >
                    {field.value === cover && <Check className="size-5" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        />

        {!trip && (
          <Controller
            control={control}
            name="packingTemplate"
            render={({ field }) => (
              <ChipGroup
                label="Start a packing list"
                options={TEMPLATE_OPTIONS}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        )}

        <Textarea
          label="Notes"
          placeholder="Booking numbers, ideas, who's coming…"
          maxLength={2000}
          error={errors.notes?.message}
          {...register('notes')}
        />

        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {trip ? 'Save changes' : 'Create trip'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
