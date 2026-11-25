import { useMemo, useRef, useState, type ReactNode } from 'react';
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, GripVertical, Lightbulb, MapPin, Plus } from 'lucide-react';
import { todayIso, type Trip, type TripItem } from '@tt/shared';
import { Badge, Button } from '@/components/ui';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatDay } from '@/lib/format';
import { formatMoney } from '@/lib/money';
import { ItemFormModal, type ItemEditorState } from './ItemFormModal';
import {
  applyBoard,
  boardToColumns,
  buildBoard,
  findColumn,
  IDEAS,
  moveItem,
  sameBoard,
  type Board,
} from './itinerary';
import { KIND_META } from './kinds';
import { useTripAction } from './useTrips';

/** The day-by-day plan. Drag the handle to move plans between days, or tap a plan to edit it. */
export function ItineraryBoard({ trip }: { trip: Trip }) {
  const savedBoard = useMemo(() => buildBoard(trip), [trip]);
  // While dragging (and until the server answers), the board shown is a local copy
  const [draft, setDraft] = useState<Board | null>(null);
  const draftRef = useRef<Board | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editor, setEditor] = useState<ItemEditorState | null>(null);

  const board = draft ?? savedBoard;
  const itemsById = useMemo(() => new Map(trip.items.map((i) => [i.id, i])), [trip.items]);
  const dayNumber = useMemo(() => new Map(board.keys.map((key, i) => [key, i])), [board.keys]);
  const today = todayIso();

  const reorder = useTripAction(
    trip.id,
    (next: Board) => api.trips.reorder(trip.id, { columns: boardToColumns(next) }),
    { optimistic: applyBoard, toastErrors: true },
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const setBoard = (next: Board | null) => {
    draftRef.current = next;
    setDraft(next);
  };

  const columnLabel = (key: string) =>
    key === IDEAS ? 'Ideas' : `Day ${dayNumber.get(key) ?? ''}, ${formatDay(key)}`;
  const titleOf = (id: UniqueIdentifier) => itemsById.get(String(id))?.title ?? 'plan';
  const placeOf = (id: UniqueIdentifier) => {
    const key = findColumn(draftRef.current ?? savedBoard, String(id));
    return key ? columnLabel(key) : 'nowhere';
  };

  // Spoken by screen readers while dragging with the keyboard
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${titleOf(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `${titleOf(active.id)} is in ${placeOf(over.id)}.` : `${titleOf(active.id)} is not over a day.`,
    onDragEnd: ({ active, over }) =>
      over ? `${titleOf(active.id)} moved to ${placeOf(over.id)}.` : `${titleOf(active.id)} was dropped.`,
    onDragCancel: ({ active }) => `Moving ${titleOf(active.id)} was cancelled.`,
  };

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id));
    setBoard(savedBoard);
  };

  // Crossing into another day moves the plan there straight away, so the list makes room
  const onDragOver = ({ active, over }: DragOverEvent) => {
    const current = draftRef.current;
    if (!over || !current) return;
    const from = findColumn(current, String(active.id));
    const to = findColumn(current, String(over.id));
    if (from && to && from !== to) setBoard(moveItem(current, String(active.id), String(over.id)));
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    let next = draftRef.current ?? savedBoard;
    if (over && active.id !== over.id) next = moveItem(next, String(active.id), String(over.id));

    if (sameBoard(next, savedBoard)) {
      setBoard(null);
      return;
    }
    setBoard(next);
    reorder.mutate(next, { onSettled: () => setBoard(null) });
  };

  const onDragCancel = () => {
    setActiveId(null);
    setBoard(null);
  };

  const activeItem = activeId ? itemsById.get(activeId) : undefined;
  const ideas = board.columns[IDEAS] ?? [];
  const dayKeys = board.keys.filter((key) => key !== IDEAS);

  const renderItems = (ids: string[]) =>
    ids.map((id) => {
      const item = itemsById.get(id);
      return item ? (
        <SortableItem key={id} item={item} currency={trip.currency} onOpen={() => setEditor({ item, date: item.date })} />
      ) : null;
    });

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        accessibility={{
          announcements,
          screenReaderInstructions: {
            draggable:
              'To move a plan, press space or enter, use the arrow keys to move it, then press space or enter again. Press escape to cancel.',
          },
        }}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          {/* Ideas */}
          <Column
            id={IDEAS}
            itemIds={ideas}
            className="border-dashed bg-sun-soft/30 lg:sticky lg:top-24"
            header={
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sun-soft text-sun">
                  <Lightbulb className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold">Ideas</h3>
                  <p className="text-sm text-muted">Not on a day yet. Drag them onto one.</p>
                </div>
                <Button size="icon-sm" variant="soft" aria-label="Add an idea" onClick={() => setEditor({ date: null })}>
                  <Plus />
                </Button>
              </div>
            }
            empty="Places you might visit go here."
          >
            {renderItems(ideas)}
          </Column>

          {/* Days */}
          <ol className="flex flex-col gap-4">
            {dayKeys.map((date, index) => {
              const ids = board.columns[date] ?? [];
              const planned = ids.reduce((sum, id) => sum + (itemsById.get(id)?.cost ?? 0), 0);
              return (
                <li key={date}>
                  <Column
                    id={date}
                    itemIds={ids}
                    className={cn(date === today && 'border-primary/50 ring-4 ring-primary/10')}
                    header={
                      <div className="flex items-center gap-3">
                        <span className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-dashed border-primary/50 font-display text-lg font-bold text-primary">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="flex flex-wrap items-center gap-2 text-lg font-semibold">
                            {formatDay(date)}
                            {date === today && <Badge tone="primary">Today</Badge>}
                          </h3>
                          <p className="text-sm text-muted">
                            {ids.length === 0 ? 'Free day' : `${ids.length} ${ids.length === 1 ? 'plan' : 'plans'}`}
                            {planned > 0 && ` · ${formatMoney(planned, trip.currency)}`}
                          </p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => setEditor({ date })} aria-label={`Add a plan to day ${index + 1}`}>
                          <Plus /> <span className="hidden sm:inline">Add</span>
                        </Button>
                      </div>
                    }
                    empty="Drop a plan here, or add one."
                  >
                    {renderItems(ids)}
                  </Column>
                </li>
              );
            })}
          </ol>
        </div>

        <DragOverlay>
          {activeItem ? <ItemCard item={activeItem} currency={trip.currency} lifted /> : null}
        </DragOverlay>
      </DndContext>

      <ItemFormModal trip={trip} state={editor} onClose={() => setEditor(null)} />
    </>
  );
}

interface ColumnProps {
  id: string;
  itemIds: string[];
  header: ReactNode;
  empty: string;
  className?: string;
  children: ReactNode;
}

/** A day (or Ideas). The whole area accepts drops, so empty days work too. */
function Column({ id, itemIds, header, empty, className, children }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <section className={cn('rounded-3xl border border-line bg-surface p-4 shadow-soft sm:p-5', className)}>
      {header}
      <SortableContext id={id} items={itemIds} strategy={verticalListSortingStrategy}>
        <ul
          ref={setNodeRef}
          className={cn(
            'mt-4 flex min-h-16 flex-col gap-2 rounded-2xl transition-colors',
            itemIds.length === 0 && 'grid place-items-center border-2 border-dashed border-line p-4',
            isOver && 'bg-primary-soft/40',
          )}
        >
          {itemIds.length === 0 ? <li className="text-center text-sm text-muted">{empty}</li> : children}
        </ul>
      </SortableContext>
    </section>
  );
}

function SortableItem({ item, currency, onOpen }: { item: TripItem; currency: string; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && 'opacity-40')}
    >
      <ItemCard
        item={item}
        currency={currency}
        onOpen={onOpen}
        handle={
          <button
            ref={setActivatorNodeRef}
            type="button"
            aria-label={`Move ${item.title}`}
            className="grid size-9 shrink-0 cursor-grab touch-none place-items-center rounded-xl text-muted hover:bg-surface-2 hover:text-ink active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-5" />
          </button>
        }
      />
    </li>
  );
}

interface ItemCardProps {
  item: TripItem;
  currency: string;
  onOpen?: () => void;
  handle?: ReactNode;
  /** Shown under the pointer while dragging. */
  lifted?: boolean;
}

function ItemCard({ item, currency, onOpen, handle, lifted }: ItemCardProps) {
  const meta = KIND_META[item.kind];
  const Icon = meta.icon;
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-2xl border border-line bg-bg p-2 pr-3',
        lifted && 'rotate-1 cursor-grabbing bg-surface shadow-lift',
      )}
    >
      {handle ?? (
        <span className="grid size-9 place-items-center text-muted">
          <GripVertical className="size-5" />
        </span>
      )}
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1 text-left hover:bg-surface-2/60"
      >
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', meta.tone)}>
          <Icon className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{item.title}</span>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted">
            {item.time && (
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" />
                {item.time}
                {item.endTime && `–${item.endTime}`}
              </span>
            )}
            {item.location && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <MapPin className="size-3.5 shrink-0" />
                <span className="truncate">{item.location}</span>
              </span>
            )}
            {!item.time && !item.location && meta.label}
          </span>
        </span>
        {item.cost !== null && item.cost > 0 && (
          <span className="shrink-0 text-sm font-semibold">{formatMoney(item.cost, currency)}</span>
        )}
      </button>
    </div>
  );
}
