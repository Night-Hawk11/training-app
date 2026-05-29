/**
 * Date helpers (KICKOFF_BRIEF.md Section 7 utilities).
 *
 * The app keys DailyEntry rows by ISO date and shows the current day on the
 * Today screen, so "today" must mean the user's *local* day — not UTC. These
 * helpers centralise that so screens never reach for `new Date()` directly.
 */

/** Local-time ISO date (YYYY-MM-DD) for the given date (defaults to now). */
export function toISODate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Today's local ISO date (YYYY-MM-DD). */
export function todayISO(): string {
  return toISODate();
}

/** Parses a YYYY-MM-DD string as a *local* date (not UTC midnight). */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** Full weekday name for an ISO date, e.g. "Thursday". */
export function weekdayName(iso: string): string {
  return WEEKDAYS[fromISODate(iso).getDay()];
}

/** Human-friendly date, e.g. "Thursday, May 28". */
export function formatLongDate(iso: string): string {
  const d = fromISODate(iso);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}
