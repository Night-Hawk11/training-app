/**
 * Morning EI sequence builder (KICKOFF_BRIEF.md 4.3).
 *
 * The morning routine is the `morning_ei` exercises (in JSON order), each an
 * isometric *hold*. This expands the prescriptions into a flat list of timed
 * "segments" — one per hold the user actually performs — so the player can just
 * step through them. Per-side holds become two segments (Left, then Right).
 */

import { getExercises, getPrescription } from '../data/exercises';
import type { Exercise } from '../data/types';

// Lean daily FOUNDATION (2026-08-13 restructure): this single ~8-min flow replaced
// the old three-part daily routine (Morning EI + Re-education + Rapid Response),
// which duplicated the themed sessions now that those are also lower/foot/core
// work. It's kept as the highest daily-frequency value: a breathing down-regulator,
// the AMI-reversal activation (glute + quad/VMO), the foot foundation, and the
// mirror single-leg squat — the actual rewiring rep, which motor learning wants
// done DAILY. The themed sessions carry the volume; this is the everyday minimum.
// All items are timed so they run in the timer player. Edit this list to re-tune.
const MORNING_CORE_IDS = [
  'ei_1', // crocodile breathing — relax/down-regulate primer
  'ei_2', // glute bridge iso — glute activation (AMI)
  'ei_oc_terminal_ext', // open-chain terminal-extension VMO lock — quad activation (AMI)
  'ei_3', // short foot activation — the foot foundation
  'nm_mirror_sl_squat_tempo', // mirror single-leg squats, external focus — the rewiring rep
];

export type Side = 'Left' | 'Right';

export interface EiSegment {
  /** Index of the exercise within the routine (0-based). */
  exerciseIndex: number;
  exercise: Exercise;
  /** 1-based set number and total sets, for "Set 2 of 3" labelling. */
  setNumber: number;
  setCount: number;
  /** Which side, or null for bilateral holds. */
  side: Side | null;
  durationSec: number;
}

/** The morning EI exercises, in routine order (curated core — see above). */
export function morningEiExercises(): Exercise[] {
  return getExercises(MORNING_CORE_IDS);
}

/** Flattens the routine into the ordered list of timed holds for a phase. */
export function buildEiSegments(phase: number): EiSegment[] {
  const segments: EiSegment[] = [];
  morningEiExercises().forEach((exercise, exerciseIndex) => {
    const p = getPrescription(exercise, phase);
    const setCount = p.sets ?? 1;
    const durationSec = p.durationSec ?? 30;
    const sides: (Side | null)[] = p.perSide ? ['Left', 'Right'] : [null];
    for (let setNumber = 1; setNumber <= setCount; setNumber++) {
      for (const side of sides) {
        segments.push({ exerciseIndex, exercise, setNumber, setCount, side, durationSec });
      }
    }
  });
  return segments;
}

/** Total prescribed hold time across the whole routine, in seconds. */
export function totalHoldSeconds(phase: number): number {
  return buildEiSegments(phase).reduce((sum, s) => sum + s.durationSec, 0);
}
