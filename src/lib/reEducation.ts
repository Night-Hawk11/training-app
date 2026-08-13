/**
 * Re-education routine builder.
 *
 * Lean rehab build (2026-06-23): the daily Re-education list is CURATED, not
 * "every `re_education` exercise". The four open-chain / connection drills run
 * EVERY day (they're the current priorities — AMI activation, open-chain control,
 * the rotary connection work). The four older closed-chain control drills are
 * still valuable but don't all need to be daily, so they ALTERNATE A/B by day —
 * two per day — to keep the routine focused without dropping them.
 */

import { getExercises } from '../data/exercises';
import type { Exercise } from '../data/types';

// Daily core: open-chain / connection work PLUS the mirror single-leg squat — the
// external-focus feedback drill with the strongest evidence for reducing valgus.
// It's here in the daily (not just the Wed/Fri sessions) because motor learning
// rewards frequent, short exposures more than occasional long ones.
const DAILY_CORE_IDS = [
  'reed_oc_quad_set_slr', // quad set + SLR — AMI/VMO activation
  'reed_oc_knee_position_sense', // proprioception / position sense
  'reed_oc_rhythmic_stab', // banded rhythmic stabilization
  'nm_mirror_sl_squat', // mirror single-leg squat, external focus — the rewiring rep
  'reed_ball_rotation', // dynamic rotating bridge — legs↔hips↔core connection
];

// Older closed-chain control drills — split into two pairs that alternate by day.
const ROTATING_A_IDS = ['reed_1', 'reed_3']; // tactile step-down + eccentric sit-to-stand
const ROTATING_B_IDS = ['reed_2', 'reed_4']; // wall single-leg squat + single-leg deadlift

/** Whole days since the Unix epoch for an ISO date — stable A/B alternation. */
function epochDay(iso: string): number {
  return Math.floor(Date.parse(`${iso}T00:00:00Z`) / 86_400_000);
}

/**
 * The curated Re-education drills for a given day: the daily core plus the
 * alternating closed-chain pair (A on even days, B on odd). Closed-chain control
 * runs first as groundwork, then the open-chain connection work.
 */
export function reEducationExercises(iso: string): Exercise[] {
  const rotating = epochDay(iso) % 2 === 0 ? ROTATING_A_IDS : ROTATING_B_IDS;
  return getExercises([...rotating, ...DAILY_CORE_IDS]);
}
