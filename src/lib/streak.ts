/**
 * Morning-routine streak & adherence stats (Step 9 follow-up).
 *
 * The daily Foundation (the single ~8-min primer, tracked via
 * morningEICompleted) is the keystone of the program, and the user's named
 * obstacle is that it gives no in-the-moment feedback. This module turns the
 * DailyEntry history into the numbers that make that invisible daily work
 * visible: streaks, days done, banked hold-time, and a recent-day status strip.
 *
 * A day "counts" when the Foundation is done (readiness is a quick log, not the
 * work, so it isn't required). The streak is forgiving: it only breaks after a
 * fully missed day, so an as-yet-undone *today* doesn't reset it.
 *
 * NOTE: reEducation/rapidResponse were folded into the Foundation in the
 * 2026-08-13 restructure. Their DailyEntry flags and the perComponent counts
 * remain for historical entries logged under the old three-flow routine.
 */

import type { DailyEntry } from '../data/types';
import { addDays } from './dates';

export type DayStatus = 'complete' | 'partial' | 'none';

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  completedDays: number;
  /** Total banked Morning EI hold time across all days, in seconds. */
  totalEiSeconds: number;
  /** Per-component completion counts, to surface which flow lags. */
  perComponent: { ei: number; reEducation: number; rapidResponse: number };
  todayStatus: DayStatus;
}

/** The daily Foundation is done. */
export function isRoutineComplete(e: DailyEntry | undefined): boolean {
  return !!e && e.morningEICompleted;
}

function dayStatus(e: DailyEntry | undefined): DayStatus {
  if (!e) return 'none';
  return e.morningEICompleted ? 'complete' : 'none';
}

export function computeStreakStats(entries: DailyEntry[], todayISO: string): StreakStats {
  const byDate = new Map(entries.map((e) => [e.date, e]));
  const complete = (iso: string) => isRoutineComplete(byDate.get(iso));

  // Current streak: walk back from today. If today isn't done yet, the run
  // hasn't broken — start the count from yesterday instead.
  let currentStreak = 0;
  let cursor = complete(todayISO) ? todayISO : addDays(todayISO, -1);
  while (complete(cursor)) {
    currentStreak += 1;
    cursor = addDays(cursor, -1);
  }

  // Longest streak: scan completed dates in order, counting consecutive days.
  const completeDates = entries
    .filter((e) => isRoutineComplete(e))
    .map((e) => e.date)
    .sort();
  let longestStreak = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of completeDates) {
    run = prev !== null && addDays(prev, 1) === d ? run + 1 : 1;
    if (run > longestStreak) longestStreak = run;
    prev = d;
  }

  const perComponent = { ei: 0, reEducation: 0, rapidResponse: 0 };
  let totalEiSeconds = 0;
  for (const e of entries) {
    if (e.morningEICompleted) perComponent.ei += 1;
    if (e.reEducationCompleted) perComponent.reEducation += 1;
    if (e.rapidResponseCompleted) perComponent.rapidResponse += 1;
    totalEiSeconds += e.morningEIDurationSec ?? 0;
  }

  return {
    currentStreak,
    longestStreak,
    completedDays: completeDates.length,
    totalEiSeconds,
    perComponent,
    todayStatus: dayStatus(byDate.get(todayISO)),
  };
}

/** Status for the last `n` days (oldest→newest), ending today, for a dot strip. */
export function recentDays(
  entries: DailyEntry[],
  todayISO: string,
  n: number
): { date: string; status: DayStatus }[] {
  const byDate = new Map(entries.map((e) => [e.date, e]));
  const out: { date: string; status: DayStatus }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = addDays(todayISO, -i);
    out.push({ date, status: dayStatus(byDate.get(date)) });
  }
  return out;
}
