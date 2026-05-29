/**
 * Morning EI sequence builder (KICKOFF_BRIEF.md 4.3).
 *
 * The morning routine is the `morning_ei` exercises (in JSON order), each an
 * isometric *hold*. This expands the prescriptions into a flat list of timed
 * "segments" — one per hold the user actually performs — so the player can just
 * step through them. Per-side holds become two segments (Left, then Right).
 */

import { getExercisesByCategory, getPrescription } from '../data/exercises';
import type { Exercise } from '../data/types';

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

/** The morning EI exercises, in routine order. */
export function morningEiExercises(): Exercise[] {
  return getExercisesByCategory('morning_ei');
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
