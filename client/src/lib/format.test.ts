import { describe, expect, it } from 'vitest';
import { plural, tripCountdown } from './format';

describe('trip countdown', () => {
  const today = '2026-10-13';

  it('counts down to a trip', () => {
    expect(tripCountdown('2026-10-14', '2026-10-20', today)).toBe('Tomorrow');
    expect(tripCountdown('2026-10-25', '2026-10-30', today)).toBe('In 12 days');
  });

  it('shows the day of a trip in progress', () => {
    expect(tripCountdown('2026-10-11', '2026-10-15', today)).toBe('Day 3 of 5');
    expect(tripCountdown('2026-10-13', '2026-10-13', today)).toBe('Day 1 of 1');
  });

  it('says when a trip ended', () => {
    expect(tripCountdown('2026-10-01', '2026-10-12', today)).toBe('Ended yesterday');
    expect(tripCountdown('2026-09-01', '2026-10-03', today)).toBe('Ended 10 days ago');
  });

  it('pluralises', () => {
    expect(plural(1, 'day')).toBe('1 day');
    expect(plural(3, 'day')).toBe('3 days');
  });
});
