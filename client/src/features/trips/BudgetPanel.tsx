import { useEffect, useState } from 'react';
import { CalendarClock, ListChecks, Plus, Receipt, TriangleAlert, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import {
  daysBetween,
  EXPENSE_CATEGORIES,
  todayIso,
  tripLength,
  tripPhase,
  type Expense,
  type Trip,
} from '@tt/shared';
import { Badge, Button, Card, CardContent, EmptyState, ProgressRing } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatDay } from '@/lib/format';
import { formatMoney } from '@/lib/money';
import { ExpenseFormModal, type ExpenseEditorState } from './ExpenseFormModal';
import { CATEGORY_TONE, categoryLabel } from './kinds';

const totalSpent = (trip: Trip) => trip.expenses.reduce((sum, e) => sum + e.convertedAmount, 0);

/** Budget vs spending, a breakdown by category and every expense. */
export function BudgetPanel({ trip, autoAdd = false }: { trip: Trip; autoAdd?: boolean }) {
  const [editor, setEditor] = useState<ExpenseEditorState | null>(null);

  // Opened from "Add expense" elsewhere in the app
  useEffect(() => {
    if (autoAdd) setEditor({});
  }, [autoAdd]);

  const money = (amount: number) => formatMoney(amount, trip.currency);
  const spent = totalSpent(trip);
  const planned = trip.items.reduce((sum, i) => sum + (i.cost ?? 0), 0);
  const hasBudget = trip.budget > 0;
  const percent = hasBudget ? (spent / trip.budget) * 100 : 0;
  const left = trip.budget - spent;
  const over = hasBudget && left < 0;

  // How much is left per day for the rest of the trip
  const today = todayIso();
  const phase = tripPhase(trip.startDate, trip.endDate, today);
  const daysLeft =
    phase === 'upcoming'
      ? tripLength(trip.startDate, trip.endDate)
      : phase === 'ongoing'
        ? daysBetween(today, trip.endDate) + 1
        : 0;

  const byCategory = EXPENSE_CATEGORIES.map((c) => ({
    ...c,
    total: trip.expenses.filter((e) => e.category === c.id).reduce((sum, e) => sum + e.convertedAmount, 0),
  }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const groups = groupByDate(trip.expenses);

  /** The warnings from the original budget tracker: at 80% and when over. */
  const warn = (updated: Trip) => {
    if (updated.budget <= 0) return;
    const before = spent / updated.budget;
    const after = totalSpent(updated) / updated.budget;
    if (after > 1 && before <= 1) toast.error('Over budget', { description: 'This trip has now spent more than planned.' });
    else if (after >= 0.8 && before < 0.8) toast.warning("You've used 80% of your budget");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Ring */}
        <Card className="lg:col-span-2">
          <CardContent className="flex flex-col items-center gap-6 sm:flex-row">
            <ProgressRing
              value={percent}
              size={150}
              stroke={14}
              tone={over ? 'primary' : percent >= 80 ? 'sun' : 'accent'}
              label="Share of the budget spent"
            >
              <span>
                <span className="block font-display text-3xl font-bold">
                  {hasBudget ? `${Math.round(percent)}%` : '—'}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">spent</span>
              </span>
            </ProgressRing>
            <div className="flex w-full flex-col gap-3">
              <div>
                <p className="text-sm font-semibold text-muted">Spent so far</p>
                <p className="font-display text-4xl font-bold">{money(spent)}</p>
                <p className="text-muted">
                  {hasBudget ? <>of {money(trip.budget)} budget</> : 'No budget set yet. Add one with Edit trip.'}
                </p>
              </div>
              {hasBudget && (
                <div className="flex flex-wrap gap-2">
                  <Badge tone={over ? 'primary' : 'success'} className="text-sm">
                    {over ? <TriangleAlert /> : <Wallet />}
                    {over ? `${money(-left)} over` : `${money(left)} left`}
                  </Badge>
                  {daysLeft > 0 && !over && (
                    <Badge tone="neutral" className="text-sm">
                      <CalendarClock /> {money(left / daysLeft)} a day for {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Planned vs spent */}
        <Card>
          <CardContent className="flex h-full flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-sun-soft text-sun">
                <ListChecks className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-muted">Planned in the itinerary</p>
                <p className="font-display text-2xl font-bold">{money(planned)}</p>
              </div>
            </div>
            <p className="text-sm text-muted">
              {planned === 0
                ? 'Add costs to your plans to see what the trip will take.'
                : hasBudget && planned > trip.budget
                  ? `Your plans cost ${money(planned - trip.budget)} more than the budget.`
                  : hasBudget
                    ? `Your plans fit the budget with ${money(trip.budget - planned)} to spare.`
                    : 'Set a budget to compare.'}
            </p>
            <Button className="mt-auto" onClick={() => setEditor({})}>
              <Plus /> Add expense
            </Button>
          </CardContent>
        </Card>
      </div>

      {byCategory.length > 0 && (
        <Card>
          <CardContent>
            <h3 className="mb-4 text-xl font-semibold">Where it went</h3>
            {/* One stacked bar */}
            <div className="mb-5 flex h-4 overflow-hidden rounded-full bg-surface-2" aria-hidden>
              {byCategory.map((c) => (
                <div key={c.id} className={CATEGORY_TONE[c.id]} style={{ width: `${(c.total / spent) * 100}%` }} />
              ))}
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {byCategory.map((c) => (
                <li key={c.id} className="flex items-center gap-3">
                  <span className={cn('size-3 shrink-0 rounded-full', CATEGORY_TONE[c.id])} />
                  <span className="flex-1">{c.label}</span>
                  <span className="font-semibold">{money(c.total)}</span>
                  <span className="w-12 text-right text-sm text-muted">{Math.round((c.total / spent) * 100)}%</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {trip.expenses.length === 0 ? (
        <EmptyState
          icon={<Receipt />}
          title="No expenses yet"
          description="Log what you spend in any currency. It's converted to your budget currency for you."
          action={
            <Button onClick={() => setEditor({})}>
              <Plus /> Add the first one
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent>
            <h3 className="mb-2 text-xl font-semibold">Expenses</h3>
            {groups.map(([date, expenses]) => (
              <section key={date} className="mt-4">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-muted">{formatDay(date)}</h4>
                <ul className="flex flex-col divide-y divide-line">
                  {expenses.map((e) => (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => setEditor({ expense: e })}
                        className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-surface-2/60"
                      >
                        <span className={cn('size-2.5 shrink-0 rounded-full', CATEGORY_TONE[e.category])} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{e.title}</span>
                          <span className="text-sm text-muted">{categoryLabel(e.category)}</span>
                        </span>
                        <span className="text-right">
                          <span className="block font-semibold">{money(e.convertedAmount)}</span>
                          {e.currency !== trip.currency && (
                            <span className="block text-sm text-muted">{formatMoney(e.amount, e.currency)}</span>
                          )}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </CardContent>
        </Card>
      )}

      <ExpenseFormModal trip={trip} state={editor} onClose={() => setEditor(null)} onAdded={warn} />
    </div>
  );
}

/** Expenses grouped by day, newest day first. */
function groupByDate(expenses: Expense[]) {
  const groups = new Map<string, Expense[]>();
  for (const e of expenses) {
    const list = groups.get(e.date) ?? [];
    list.push(e);
    groups.set(e.date, list);
  }
  return [...groups.entries()].sort(([a], [b]) => b.localeCompare(a));
}
