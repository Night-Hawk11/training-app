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

export const PHASE_COUNT = 4;
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

// ── Phase overviews ──────────────────────────────────────────────────────────
// The program (2026-09-12 pivot) builds an athletic foundation for a return to
// court sport through the connect→control→express ladder. Phases advance on
// CRITERIA, not the calendar (currentPhase is set manually in Settings). The
// plyometric Express blocks unlock by phase in sessionPlan.ts (blockGate):
//   P1 Foundation — isometrics, mobility, ball/single-leg control + low ankle hops.
//   P2 Dynamic Control — double pogo and curb drop-to-stick unlock.
//   P3 Reactive & Multidirectional — single-leg pogo, landings, lateral bounds.
//   P4 Return to Court — bridge the ramp toward real multidirectional play.
// Keep these summaries in step with those gates.

export interface PhaseOverview {
  phase: number;
  /** Short theme, e.g. "Calibration & soft landings". */
  theme: string;
  /** One or two sentences on the phase's intent. */
  summary: string;
  /** A few concrete aims for the phase. */
  goals: string[];
}

export const PHASE_OVERVIEWS: PhaseOverview[] = [
  {
    phase: 1,
    theme: 'Foundation & Connection',
    summary:
      'Build the base from the ends inward — feet and hips first, the knee downstream. Most work is isometric (yielding first) and low-level: active hip mobility, foot tripod and windlass, isometric calf stiffness, glute-medius and adductor activation, and dynamic isometrics on the ball. The one bit of reactive work is low ankle hops — the gentlest stiffness primer; pogos, landings and bounds are still earned later. Everything closed-chain at the knee.',
    goals: [
      'Do the daily session every morning — motor patterning wants frequency',
      'Own the foundation: foot tripod + windlass, knee-to-wall ankle range, 90/90 and hip CARs',
      'Wake the hip: glute-medius, adductor (Copenhagen), and the glute-driven bridge',
      'Build connection on the ball: dead-bug, stir-the-pot, hamstring bridge — all symptom-free',
      'Introduce low ankle hops — light, quiet, quick contacts (isometric calf stiffness underneath)',
      'Clean single-leg balance and quiet foot; no knee flare all week before advancing',
    ],
  },
  {
    phase: 2,
    theme: 'Dynamic Control',
    summary:
      'With the base connected, add through-range dynamic isometrics and progress the plyo ladder. Overcoming isometrics build tendon stiffness (ankle, wall/Spanish squat); Copenhagen and long-line hinge load the adductor and posterior chain. Building on Phase 1’s ankle hops, double-leg pogo and stepping off the curb to a silent stick now unlock.',
    goals: [
      'Progress hold times and add overcoming isometrics for tendon stiffness',
      'Load the foot→glute line: long-line hinge and single-leg RDL',
      'Progress the plyo ladder — double pogo and curb drop-to-stick — silent and controlled',
      'Every landing lands soft with the knee tracking over the foot',
    ],
  },
  {
    phase: 3,
    theme: 'Reactive & Multidirectional',
    summary:
      'Take the elastic qualities single-leg and sideways. Single-leg pogo and landing sticks build unilateral stiffness and symmetry; lateral bounds train the deceleration and direction-change the court demands. Mirror-feedback single-leg control keeps the knee honest as speed grows. Advance only when landing quality, symmetry, and symptom response stay clean.',
    goals: [
      'Single-leg pogo and landing sticks — quiet, symmetrical, knee stacked',
      'Lateral bound to a stuck landing — own the sideways deceleration',
      'Single-leg control at speed with clean knee tracking',
      'Confirm symmetry and no flare before pushing amplitude',
    ],
  },
  {
    phase: 4,
    theme: 'Return to Court',
    summary:
      'Bridge the earn-it ramp toward real play: higher-amplitude and more reactive multidirectional work, layered on top of everything below it. The foundation, isometrics and control work stay in — athletic expression is built on top of connection, not instead of it. Reintroduce your sport progressively, backing off at any sign of flare.',
    goals: [
      'Raise plyo amplitude and reactivity while landings stay clean',
      'Blend cutting and change-of-direction prep into the reactive day',
      'Keep the daily foundation — connection underpins the athleticism',
      'Reintroduce court play progressively; drop back at the first sign of swelling',
    ],
  },
];

/** Overview for a given phase number (1..5), or undefined if out of range. */
export function phaseOverview(phase: number): PhaseOverview | undefined {
  return PHASE_OVERVIEWS.find((p) => p.phase === phase);
}
