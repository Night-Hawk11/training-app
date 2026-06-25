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

export const PHASE_COUNT = 5;
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
// The program is a CONSERVATIVE return-to-impact ramp, rebuilt from the basics
// after the knee effusion settled (2026-06-21 restart). Impact is reintroduced
// one rung at a time and gated by phase in sessionPlan.ts (blockGate): double-leg
// landings (P1) → low pogos (P2) → rebound (P3) → single-leg + approach intro
// (P4) → full jumps, approach & hill sprints (P5). The principle throughout is
// Schroeder's: absorb force before you generate it, and earn each rung before the
// next. Keep these summaries in step with the minPhase gates in sessionPlan.ts.

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
    theme: 'Unlock & connect — absorb, not lock',
    summary:
      'Start from the floor, and from the nervous system. The priority is teaching the lower body to stop guarding and reconnect to the chain: relax-then-fire instead of tonic bracing, controlled absorption, and sub-maximal connected expression — plus ankle/tendon stiffness. NO pure power yet; lower-body force output is deliberately off the table and returns on its own once the lock releases.',
    goals: [
      'Morning routine every day, plus the daily rotary ball drill (controlled → faster) to reconnect legs–hips–core',
      'Relax-fire, not grind: contract then FULLY release on every iso and tempo rep — kill the tonic co-contraction',
      'Controlled double-leg absorption — soft, silent, stuck landings, no rebound',
      'Build ankle stiffness: low, stiff, quiet hops — sub-maximal, stiffness not height',
      'Keep quad activation for the knee; knee calm, connected, and swelling-free all week',
    ],
  },
  {
    phase: 2,
    theme: 'Build landing volume + first springs',
    summary:
      'Once landings are clean and the knee stays quiet, add a little springiness and more contacts. Two-foot pogos enter at low height. Still no max jumping or rebound off a drop — you are widening the base, not testing it.',
    goals: [
      'More landing reps, still soft and even on both feet',
      'Two-foot pogos — low height, fast ground contact, full reset between sets',
      'Confirm the knee handles repeated contacts with no next-day swelling',
      'Progress iso loads and controlled strength',
    ],
  },
  {
    phase: 3,
    theme: 'Reintroduce the rebound',
    summary:
      'Now bring back true elasticity: reactive rebounds off the ground (depth/step-up rebounds) where the leg absorbs and immediately gives the force back. Landings stay double-leg; amplitude grows only as control holds.',
    goals: [
      'Reactive rebounds — absorb then immediately return force, short ground time',
      'Springier upper-body plyos once knee work is solid',
      'Lifts climbing toward ≈70% 1RM with controlled tempo',
      'Still no single-leg jumping or max approaches',
    ],
  },
  {
    phase: 4,
    theme: 'Single-leg & approach intro',
    summary:
      'Introduce the single-leg work (the real weak link) and the approach jump at sub-max effort. Single-leg landings and pogos come online; the approach / single-leg test markers start being tracked.',
    goals: [
      'Single-leg landings and low single-leg pogos, stick every landing',
      'Sub-max two-foot approach jumps to a low target',
      'Begin tracking approach-vertical and single-leg markers',
      'Knee tracks over the toes on one leg with no cave-in or swelling',
    ],
  },
  {
    phase: 5,
    theme: 'Full expression, peak & retest',
    summary:
      'Express the power you rebuilt. Full jumping returns — standing and approach jumps at effort, box jumps, and hill sprints — then retest every marker to confirm the knee held through the full ramp.',
    goals: [
      'Full jump expression: standing/approach jumps, box jumps, hill sprints',
      'Sustain plyometric volume across the week without flaring the knee',
      'Full retest: vertical, broad jump, balance, landing quality, approach',
      'Compare against baseline and lock in the gains',
    ],
  },
];

/** Overview for a given phase number (1..5), or undefined if out of range. */
export function phaseOverview(phase: number): PhaseOverview | undefined {
  return PHASE_OVERVIEWS.find((p) => p.phase === phase);
}
