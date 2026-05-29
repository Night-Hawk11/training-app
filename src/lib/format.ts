/** Formatting helpers shared across screens. */
import type { Prescription } from '../data/types';

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
