import { describe, expect, it } from 'vitest';
import type { Trip, TripItem } from '@tt/shared';
import { applyBoard, boardToColumns, buildBoard, findColumn, IDEAS, moveItem, sameBoard } from './itinerary';

function item(id: string, date: string | null, order: number): TripItem {
  return { id, date, order, kind: 'place', title: id, time: null, endTime: null, location: '', notes: '', cost: null };
}

const TRIP = {
  startDate: '2026-11-01',
  endDate: '2026-11-03',
  items: [item('b', '2026-11-01', 1), item('a', '2026-11-01', 0), item('idea', null, 0), item('c', '2026-11-02', 0)],
} as Trip;

describe('itinerary board', () => {
  const board = buildBoard(TRIP);

  it('has Ideas and one column per day, with plans in order', () => {
    expect(board.keys).toEqual([IDEAS, '2026-11-01', '2026-11-02', '2026-11-03']);
    expect(board.columns['2026-11-01']).toEqual(['a', 'b']);
    expect(board.columns[IDEAS]).toEqual(['idea']);
    expect(board.columns['2026-11-03']).toEqual([]);
  });

  it('finds the column of a plan or a column id', () => {
    expect(findColumn(board, 'c')).toBe('2026-11-02');
    expect(findColumn(board, '2026-11-03')).toBe('2026-11-03');
    expect(findColumn(board, 'nope')).toBeNull();
  });

  it('moves a plan down and up within a day', () => {
    expect(moveItem(board, 'a', 'b').columns['2026-11-01']).toEqual(['b', 'a']);
    expect(moveItem(board, 'b', 'a').columns['2026-11-01']).toEqual(['b', 'a']);
  });

  it('moves a plan onto another day, before the plan it is dropped on', () => {
    const next = moveItem(board, 'idea', 'c');
    expect(next.columns[IDEAS]).toEqual([]);
    expect(next.columns['2026-11-02']).toEqual(['idea', 'c']);
  });

  it('moves a plan onto an empty day', () => {
    const next = moveItem(board, 'a', '2026-11-03');
    expect(next.columns['2026-11-01']).toEqual(['b']);
    expect(next.columns['2026-11-03']).toEqual(['a']);
  });

  it('leaves the board alone for unknown ids, and does not change the original', () => {
    expect(moveItem(board, 'nope', 'a')).toBe(board);
    moveItem(board, 'a', '2026-11-03');
    expect(board.columns['2026-11-01']).toEqual(['a', 'b']);
  });

  it('turns the board into the API body and back into a trip', () => {
    const next = moveItem(board, 'c', '2026-11-03');
    expect(boardToColumns(next)[0]).toEqual({ date: null, itemIds: ['idea'] });
    const moved = applyBoard(TRIP, next).items.find((i) => i.id === 'c')!;
    expect(moved.date).toBe('2026-11-03');
    expect(moved.order).toBe(0);
    expect(sameBoard(board, buildBoard(TRIP))).toBe(true);
    expect(sameBoard(board, next)).toBe(false);
  });
});
