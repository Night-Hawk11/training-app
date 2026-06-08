/**
 * Program phase schedule.
 *
 * The Athletic Reset program is 5 phases of 4 weeks each, run from a fixed
 * start date (Settings.startDate). This derives the planned milestone dates —
 * when each phase should begin and end — purely from that start date, so the
 * calendar shows the schedule you *should* be on regardless of the manually-set
 * current phase.
 */

import { addDays, daysBetween } from './dates';

export const PHASE_COUNT = 5;
export const WEEKS_PER_PHASE = 4;
export const DAYS_PER_PHASE = WEEKS_PER_PHASE * 7; // 28
export const PROGRAM_DAYS = PHASE_COUNT * DAYS_PER_PHASE; // 140

export interface PhaseRange {
  phase: number; // 1..5
  startISO: string; // inclusive
  endISO: string; // inclusive
}

/** Date ranges for all 5 phases, counted from the program start date. */
export function phaseRanges(startISO: string): PhaseRange[] {
  const ranges: PhaseRange[] = [];
  for (let i = 0; i < PHASE_COUNT; i++) {
    ranges.push({
      phase: i + 1,
      startISO: addDays(startISO, i * DAYS_PER_PHASE),
      endISO: addDays(startISO, (i + 1) * DAYS_PER_PHASE - 1),
    });
  }
  return ranges;
}

/** Which phase a date falls in (1..5), or null if outside the program window. */
export function phaseForDate(startISO: string, iso: string): number | null {
  const offset = daysBetween(startISO, iso);
  if (offset < 0 || offset >= PROGRAM_DAYS) return null;
  return Math.floor(offset / DAYS_PER_PHASE) + 1;
}

/** Last day of the program (inclusive). */
export function programEndISO(startISO: string): string {
  return addDays(startISO, PROGRAM_DAYS - 1);
}
