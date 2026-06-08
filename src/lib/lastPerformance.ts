/**
 * "What you did last time" lookup for an exercise.
 *
 * Scans completed sessions for the most recent prior time a given exercise was
 * logged with usable sets, and returns a compact summary (weight × reps, hold
 * seconds, or distance). Looks across ALL session types on purpose — several
 * lifts recur on more than one day, so this reflects the genuinely last time the
 * movement was performed, not just the last same-named day.
 */

import type { ExerciseMeasurement, Session } from '../data/types';
import { formatCompletedSets } from './format';

/**
 * Most recent session strictly before `beforeISO` where `exerciseId` has logged
 * sets. `sessions` is assumed newest-first (as the history store provides).
 * Returns null when there's no prior record yet.
 */
export function lastPerformance(
  sessions: Session[],
  beforeISO: string,
  exerciseId: string,
  measurement: ExerciseMeasurement
): { date: string; summary: string } | null {
  for (const s of sessions) {
    if (s.date >= beforeISO) continue;
    for (const block of s.completedBlocks) {
      const ce = block.exercises.find((e) => e.exerciseId === exerciseId);
      if (!ce) continue;
      const summary = formatCompletedSets(measurement, ce.sets);
      if (summary) return { date: s.date, summary };
    }
  }
  return null;
}
