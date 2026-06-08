/** Formatting helpers shared across screens. */
import type { CompletedSet, ExerciseMeasurement, Prescription } from '../data/types';

/** Seconds as m:ss (e.g. 90 -> "1:30", 8 -> "0:08"). */
export function mmss(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${String(rem).padStart(2, '0')}`;
}

/** Rough human duration, e.g. 130 -> "~2 min", 45 -> "45 sec". */
export function approxDuration(totalSec: number): string {
  if (totalSec < 90) return `${Math.round(totalSec)} sec`;
  return `~${Math.round(totalSec / 60)} min`;
}

/** Compact sets×reps line for rep-based drills, e.g. "2 × 5 · 20 lb /side". */
export function formatSetsReps(p: Prescription): string {
  const parts: string[] = [];
  if (p.sets != null && p.reps != null) parts.push(`${p.sets} × ${p.reps}`);
  else if (p.sets != null) parts.push(`${p.sets} set${p.sets === 1 ? '' : 's'}`);
  else if (p.reps != null) parts.push(`${p.reps} reps`);
  if (p.weightLbs != null) parts.push(`${p.weightLbs} lb`);
  let line = parts.join(' · ') || '—';
  if (p.perSide) line += ' /side';
  return line;
}

/**
 * Compact summary of what was actually logged for an exercise, one entry per
 * set, e.g. "5 @ 135 lb · 5 @ 135 lb · 4 @ 140 lb", "30s · 30s · 25s", or
 * "8 · 8 · 7" for bodyweight reps. Returns "" if nothing usable was recorded.
 */
export function formatCompletedSets(measurement: ExerciseMeasurement, sets: CompletedSet[]): string {
  const parts: string[] = [];
  for (const s of sets) {
    if (measurement === 'time') {
      if (s.durationSec != null) parts.push(`${s.durationSec}s`);
    } else if (measurement === 'distance') {
      if (s.distanceFeet != null) parts.push(`${s.distanceFeet} ft`);
    } else {
      if (s.reps == null && s.weightLbs == null) continue;
      const reps = s.reps ?? '—';
      parts.push(s.weightLbs != null ? `${reps} @ ${s.weightLbs} lb` : `${reps}`);
    }
  }
  return parts.join(' · ');
}

/** Target line for a gym set, shaped by the exercise's measurement mode. */
export function formatTarget(measurement: ExerciseMeasurement, p: Prescription): string {
  const sets = p.sets ?? 1;
  let core: string;
  if (measurement === 'time') core = `${sets} × ${p.durationSec ?? 0}s`;
  else if (measurement === 'distance') core = `${sets} × ${p.distanceFeet ?? 0} ft`;
  else {
    core = `${sets} × ${p.reps ?? 0}`;
    if (p.weightLbs != null) core += ` @ ${p.weightLbs} lb`;
  }
  if (p.perSide) core += ' /side';
  if (p.warmupSets) core += ` (+${p.warmupSets} warm-up)`;
  return core;
}
