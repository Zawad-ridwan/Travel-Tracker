import { XP_PER_LEVEL } from '@tt/shared';

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
