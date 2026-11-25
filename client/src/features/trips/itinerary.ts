import { tripDates, type Trip, type TripItem } from '@tt/shared';

/**
 * The itinerary as a "board": one column per day plus "Ideas" (plans without a day),
 * each holding plan ids in order. Drag and drop rearranges the board, then saves it.
 */

export const IDEAS = 'ideas';

export interface Board {
  /** Column keys in display order: "ideas", then each date. */
  keys: string[];
  columns: Record<string, string[]>;
}

export function columnKey(date: string | null) {
  return date ?? IDEAS;
}

export function buildBoard(trip: Pick<Trip, 'startDate' | 'endDate' | 'items'>): Board {
  const keys = [IDEAS, ...tripDates(trip.startDate, trip.endDate)];
  const columns: Record<string, string[]> = Object.fromEntries(keys.map((k) => [k, []]));
  const sorted = [...trip.items].sort((a, b) => a.order - b.order);
  for (const item of sorted) {
    const key = columnKey(item.date);
    // Plans on a day outside the trip (shouldn't happen) show under Ideas
    (columns[key] ?? columns[IDEAS])!.push(item.id);
  }
  return { keys, columns };
}

/** The column an id belongs to: the id itself if it is a column, else the column holding that plan. */
export function findColumn(board: Board, id: string): string | null {
  if (id in board.columns) return id;
  return board.keys.find((key) => board.columns[key]!.includes(id)) ?? null;
}

/**
 * Moves a plan next to another plan (or onto an empty column), possibly into another column.
 * Returns a new board; the old one is not changed.
 */
export function moveItem(board: Board, activeId: string, overId: string): Board {
  const from = findColumn(board, activeId);
  const to = findColumn(board, overId);
  if (!from || !to || activeId === overId) return board;

  const source = board.columns[from]!.filter((id) => id !== activeId);
  const target = from === to ? source : [...board.columns[to]!];

  // Dropped on the column itself → goes last; dropped on a plan → takes its place
  let index = overId === to ? target.length : target.indexOf(overId);
  if (index < 0) index = target.length;
  if (from === to) {
    const oldIndex = board.columns[from]!.indexOf(activeId);
    const overIndex = board.columns[from]!.indexOf(overId);
    // Moving down: land after the plan we are over
    if (overId !== to && oldIndex < overIndex) index = overIndex;
  }
  target.splice(index, 0, activeId);

  return {
    keys: board.keys,
    columns: { ...board.columns, [from]: from === to ? target : source, [to]: target },
  };
}

export function sameBoard(a: Board, b: Board) {
  return a.keys.every((key) => (a.columns[key] ?? []).join() === (b.columns[key] ?? []).join());
}

/** The body for PUT /api/trips/:id/itinerary */
export function boardToColumns(board: Board) {
  return board.keys.map((key) => ({
    date: key === IDEAS ? null : key,
    itemIds: board.columns[key] ?? [],
  }));
}

/** The trip as it will look once the board is saved (for showing it straight away). */
export function applyBoard(trip: Trip, board: Board): Trip {
  const placement = new Map<string, Pick<TripItem, 'date' | 'order'>>();
  for (const key of board.keys) {
    board.columns[key]!.forEach((id, order) => {
      placement.set(id, { date: key === IDEAS ? null : key, order });
    });
  }
  return {
    ...trip,
    items: trip.items.map((item) => ({ ...item, ...placement.get(item.id) })),
  };
}
