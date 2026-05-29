/**
 * Rapid Response interval builder (KICKOFF_BRIEF.md 4.5).
 *
 * The rapid-response drills are interval work: each prescribes `bouts` of
 * `workSec` on / `restSec` off. This expands the routine into a flat list of
 * timed segments (work, rest, work, rest, …) so the player just steps through
 * them. Rest auto-flows into the next work bout; only a new *exercise* pauses,
 * giving the user a moment to set up the next position.
 */

import { getExercisesByCategory, getPrescription } from '../data/exercises';
import type { Exercise } from '../data/types';

export type SegmentKind = 'work' | 'rest';

export interface RrSegment {
  exerciseIndex: number;
  exercise: Exercise;
  boutNumber: number; // 1-based
  boutCount: number;
  kind: SegmentKind;
  durationSec: number;
  /** Pause before this segment (true at the first work bout of each exercise
   *  except the very first) so the user can get into position. */
  pauseBefore: boolean;
}

/** The rapid-response exercises, in routine order. */
export function rapidResponseExercises(): Exercise[] {
  return getExercisesByCategory('rapid_response');
}

/** Flattens the routine into ordered work/rest segments for a phase. */
export function buildRrSegments(phase: number): RrSegment[] {
  const segments: RrSegment[] = [];
  const exercises = rapidResponseExercises();

  exercises.forEach((exercise, exerciseIndex) => {
    const p = getPrescription(exercise, phase);
    const boutCount = p.bouts ?? 1;
    const workSec = p.workSec ?? p.durationSec ?? 15;
    const restSec = p.restSec ?? 0;
    const isLastExercise = exerciseIndex === exercises.length - 1;

    for (let boutNumber = 1; boutNumber <= boutCount; boutNumber++) {
      segments.push({
        exerciseIndex,
        exercise,
        boutNumber,
        boutCount,
        kind: 'work',
        durationSec: workSec,
        pauseBefore: exerciseIndex > 0 && boutNumber === 1,
      });
      // Rest after every work bout except the very last bout of the routine.
      const isLastBoutOverall = isLastExercise && boutNumber === boutCount;
      if (restSec > 0 && !isLastBoutOverall) {
        segments.push({
          exerciseIndex,
          exercise,
          boutNumber,
          boutCount,
          kind: 'rest',
          durationSec: restSec,
          pauseBefore: false,
        });
      }
    }
  });

  return segments;
}

/** Total prescribed work time (excludes rest), in seconds, for a phase. */
export function totalWorkSeconds(phase: number): number {
  return buildRrSegments(phase)
    .filter((s) => s.kind === 'work')
    .reduce((sum, s) => sum + s.durationSec, 0);
}
