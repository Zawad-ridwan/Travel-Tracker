import { addDays, APP_NAME, ITEM_KINDS, type Trip, type TripItem } from '@tt/shared';

/**
 * Builds an .ics calendar file (RFC 5545) for a trip, which Google Calendar,
 * Apple Calendar and Outlook can all import.
 *
 * Times are "floating" (no time zone): 09:00 stays 09:00 in whatever time zone
 * the traveller's calendar is set to, which is what you want for local plans abroad.
 */

const CRLF = '\r\n';

/** Escapes text values: backslash, semicolon, comma and new lines. */
export function escapeText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Splits lines longer than 75 bytes, as the standard requires (never inside a character). */
export function foldLine(line: string) {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = '';
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    // Continuation lines start with a space, which counts towards their 75 bytes
    const limit = parts.length === 0 ? 75 : 74;
    if (bytes + size > limit) {
      parts.push(current);
      current = '';
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join(`${CRLF} `);
}

/** "2026-11-02" → "20261102" */
function icsDate(date: string) {
  return date.replace(/-/g, '');
}

/** "2026-11-02" + "09:30" → "20261102T093000" */
function icsDateTime(date: string, time: string) {
  return `${icsDate(date)}T${time.replace(':', '')}00`;
}

/** UTC timestamp for DTSTAMP, e.g. "20261013T081500Z" */
function icsStamp(now: Date) {
  return now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** End of a timed plan: its end time, or one hour later (moving to the next day after midnight). */
function endOf(date: string, time: string, endTime: string | null) {
  if (endTime) return icsDateTime(date, endTime);
  const [h = 0, m = 0] = time.split(':').map(Number);
  const totalMinutes = h * 60 + m + 60;
  const day = totalMinutes >= 24 * 60 ? addDays(date, 1) : date;
  const minutes = totalMinutes % (24 * 60);
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mm = String(minutes % 60).padStart(2, '0');
  return icsDateTime(day, `${hh}:${mm}`);
}

function kindLabel(kind: TripItem['kind']) {
  return ITEM_KINDS.find((k) => k.id === kind)?.label ?? 'Plan';
}

function itemDescription(item: TripItem, currency: string) {
  const lines = [kindLabel(item.kind)];
  if (item.cost !== null) lines.push(`Planned cost: ${item.cost} ${currency}`);
  if (item.notes) lines.push('', item.notes);
  return lines.join('\n');
}

export function buildTripCalendar(trip: Trip, now = new Date()) {
  const stamp = icsStamp(now);
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${APP_NAME}//Trips//EN`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(trip.title)}`,
  ];

  // The whole trip as one all-day event (DTEND is the day after the last day)
  const summaryLines = [trip.destination ? `Trip to ${trip.destination}` : 'Trip'];
  if (trip.notes) summaryLines.push('', trip.notes);
  lines.push(
    'BEGIN:VEVENT',
    `UID:trip-${trip.id}@travel-tracker`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${icsDate(trip.startDate)}`,
    `DTEND;VALUE=DATE:${icsDate(addDays(trip.endDate, 1))}`,
    `SUMMARY:${escapeText(`✈️ ${trip.title}`)}`,
    ...(trip.destination ? [`LOCATION:${escapeText(trip.destination)}`] : []),
    `DESCRIPTION:${escapeText(summaryLines.join('\n'))}`,
    'TRANSP:TRANSPARENT',
    'END:VEVENT',
  );

  // Every plan that is on a day (ideas without a day are left out)
  const scheduled = trip.items
    .filter((item): item is TripItem & { date: string } => item.date !== null)
    .sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order);

  for (const item of scheduled) {
    const timing = item.time
      ? [`DTSTART:${icsDateTime(item.date, item.time)}`, `DTEND:${endOf(item.date, item.time, item.endTime)}`]
      : [`DTSTART;VALUE=DATE:${icsDate(item.date)}`, `DTEND;VALUE=DATE:${icsDate(addDays(item.date, 1))}`];

    lines.push(
      'BEGIN:VEVENT',
      `UID:item-${item.id}@travel-tracker`,
      `DTSTAMP:${stamp}`,
      ...timing,
      `SUMMARY:${escapeText(item.title)}`,
      ...(item.location ? [`LOCATION:${escapeText(item.location)}`] : []),
      `DESCRIPTION:${escapeText(itemDescription(item, trip.currency))}`,
      // All-day plans don't block the day as busy
      `TRANSP:${item.time ? 'OPAQUE' : 'TRANSPARENT'}`,
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join(CRLF) + CRLF;
}

/** A safe file name: "Japan in Autumn!" → "japan-in-autumn.ics" */
export function calendarFileName(title: string) {
  const slug = title
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '-')
    .slice(0, 50);
  return `${slug || 'trip'}.ics`;
}
