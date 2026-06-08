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
// What each phase is aiming to accomplish. INFERRED from the progression hints
// embedded in exercises.json (load ceilings, step-off → depth-drop → rebound,
// two-foot → single-leg → approach jumps, the Phase 3+ tests) — there's no
// program brief in the repo. Adjust the copy here if the brief says otherwise.

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
    theme: 'Calibration & soft landings',
    summary:
      'Lay the foundation: groove the daily morning routine, learn to land soft with the quad relaxed, and calibrate your loads. Step off boxes — no rebound yet.',
    goals: [
      'Do the morning routine (EI · Re-education · Rapid Response) every day',
      'Land soft and absorb — step-downs to a soft landing, no jump after',
      'Calibrate iso holds and lifts (≈40–50% 1RM ceiling)',
      'Low pogos and hops — chase stiffness, not height',
    ],
  },
  {
    phase: 2,
    theme: 'Rebound & depth',
    summary:
      'Add elasticity. Progress the step-offs into true depth drops with a controlled rebound, and let the upper-body plyos get springier. Landings stay soft and balanced.',
    goals: [
      'Depth drops with a controlled rebound (vs. just stepping off)',
      'Clap / release plyo push-ups once control is solid',
      'Lifts to ≈60–65% 1RM',
      'Keep two-foot landings soft and even',
    ],
  },
  {
    phase: 3,
    theme: 'Single-leg & approach intro',
    summary:
      'Introduce single-leg power and the approach jump at sub-max effort. Amplitude can start to grow, and the approach / single-leg measurements come online.',
    goals: [
      'Single-leg broad jumps (start ≈50% max distance), stick the landing',
      'One-step approach jumps to a low, sub-max target',
      'Lifts to ≈70–80% 1RM',
      'Begin tracking approach-vertical and single-leg test markers',
    ],
  },
  {
    phase: 4,
    theme: 'Full approach, full effort',
    summary:
      'Express the power you built. Move to a three-step approach at full effort and intensify the single-leg work, while landings stay clean.',
    goals: [
      'Three-step approach jumps at full effort',
      'Heavier, faster single-leg landings and broad jumps',
      'Push athletic output without losing soft, controlled landings',
    ],
  },
  {
    phase: 5,
    theme: 'Peak & retest',
    summary:
      'Sharpen and measure. Peak the jump qualities you developed, then retest every marker to confirm the rewire held.',
    goals: [
      'Peak the approach and single-leg jump expression',
      'Full retest: vertical, broad jump, balance, landing quality, approach',
      'Compare against your baseline and lock in the gains',
    ],
  },
];

/** Overview for a given phase number (1..5), or undefined if out of range. */
export function phaseOverview(phase: number): PhaseOverview | undefined {
  return PHASE_OVERVIEWS.find((p) => p.phase === phase);
}
