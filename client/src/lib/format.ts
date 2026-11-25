import { daysBetween, todayIso, tripLength, tripPhase, XP_PER_LEVEL } from '@tt/shared';

/** "BD" → 🇧🇩 (flag emoji built from the two letters). */
export function countryFlag(code: string | null | undefined) {
  if (!code || code.length !== 2) return '';
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** Progress inside the current level, 0–100. */
export function levelProgress(xp: number) {
  return ((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;
}

const LEVEL_TITLES = [
  'Curious Explorer',
  'Weekend Wanderer',
  'Seasoned Traveller',
  'Globetrotter',
  'Trailblazer',
  'World Legend',
];

export function levelTitle(level: number) {
  return LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length) - 1] ?? LEVEL_TITLES[0]!;
}

export function formatDate(iso: string, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }) {
  return new Intl.DateTimeFormat(undefined, options).format(new Date(iso));
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 5) return 'Up late';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ---------------- Trip dates (YYYY-MM-DD strings) ---------------- */

/** Calendar dates are formatted in UTC so they never shift a day in other time zones. */
function utcNoon(date: string) {
  return new Date(`${date}T12:00:00Z`);
}

const dayFormat = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

const rangeFormat = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** "2026-11-01" → "Sun, 1 Nov" */
export function formatDay(date: string) {
  return dayFormat.format(utcNoon(date));
}

/** "1 – 5 Nov 2026" */
export function formatDateRange(start: string, end: string) {
  if (start === end) return rangeFormat.format(utcNoon(start));
  return rangeFormat.formatRange(utcNoon(start), utcNoon(end));
}

/** "In 12 days", "Day 3 of 5", "Ended 2 days ago". */
export function tripCountdown(start: string, end: string, today = todayIso()) {
  const phase = tripPhase(start, end, today);
  if (phase === 'upcoming') {
    const days = daysBetween(today, start);
    return days === 1 ? 'Tomorrow' : `In ${days} days`;
  }
  if (phase === 'ongoing') {
    return `Day ${daysBetween(start, today) + 1} of ${tripLength(start, end)}`;
  }
  const ago = daysBetween(end, today);
  if (ago === 1) return 'Ended yesterday';
  if (ago < 30) return `Ended ${ago} days ago`;
  return `Ended ${rangeFormat.format(utcNoon(end))}`;
}

/** "1 day" / "5 days" */
export function plural(count: number, word: string, pluralWord = `${word}s`) {
  return `${count} ${count === 1 ? word : pluralWord}`;
}
