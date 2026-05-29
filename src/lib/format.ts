/** Formatting helpers shared across screens. */

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
