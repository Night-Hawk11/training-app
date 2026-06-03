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

/** ISO date `n` days from the given one (n may be negative). */
export function addDays(iso: string, n: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

/**
 * Whole calendar days from `startISO` to `endISO` (end − start). Computed off
 * the date parts (UTC) so daylight-saving shifts can't produce a fractional or
 * off-by-one result.
 */
export function daysBetween(startISO: string, endISO: string): number {
  const [ay, am, ad] = startISO.split('-').map(Number);
  const [by, bm, bd] = endISO.split('-').map(Number);
  const a = Date.UTC(ay, am - 1, ad);
  const b = Date.UTC(by, bm - 1, bd);
  return Math.round((b - a) / 86_400_000);
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
