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
// The program (2026-08-13 overhaul) is a neuromuscular-first progression for
// correcting dynamic knee valgus — LOW-LOAD and NON-IMPACT while the bilateral
// reactive synovitis/effusion is active. It climbs the chain and the difficulty
// of control, not load: settle the joint & wake the muscles (P1) → static
// alignment control (P2) → dynamic slow control (P3) → loaded & multiplanar
// control (P4) → and only then, if the knee is long clear, return to impact (P5).
// Impact is gated to Phase 5 in sessionPlan.ts (blockGate) and stays off until
// the effusion is fully resolved. Keep these summaries in step with those gates.

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
    theme: 'Settle & wake up — de-swell, reconnect',
    summary:
      'Start from the joint and the nervous system. The priorities are calming the effusion and reversing the swelling-driven quad/glute shutdown (arthrogenic muscle inhibition), then re-establishing the foundations of the chain: an active foot tripod, ankle dorsiflexion mobility, and glute activation. Everything is low-load and non-impact. No jumping, landing or running — that is deliberately off the table.',
    goals: [
      'Morning routine every day, plus the daily re-education and rotary ball drill to reconnect foot–knee–hip–core',
      'Wake the quad and glute: quad-set + iso holds, contract then FULLY relax — beat the swelling-driven shutdown',
      'Build the base: foot tripod, toe control, and knee-to-wall ankle mobility',
      'Single-leg balance, eyes open — quiet foot, knee soft over the toes',
      'Keep the knee calm and swelling-free all week; that gate must be green before Phase 2',
    ],
  },
  {
    phase: 2,
    theme: 'Static alignment control',
    summary:
      'With the joint quiet and the muscles switching on, groove the anti-valgus pattern under body weight — held and slow. Mirror single-leg mini-squats with external-focus cueing become the centrepiece: the knee learns to track over the foot with real-time feedback. Add capped-depth controlled tempo squatting for capacity. Still fully non-impact.',
    goals: [
      'Mirror single-leg mini-squats: knee tracks over the 2nd toe, small perfect range',
      'Hold single-leg balance eyes-closed; add the banded wall sit with knees driving out',
      'Glute-medius control under load: lateral band walks and single-leg pelvic-level control',
      'Introduce capped-depth tempo squats — low load, no bounce, clean knee line',
    ],
  },
  {
    phase: 3,
    theme: 'Dynamic slow control',
    summary:
      'Take the grooved alignment into movement — still slow, still non-impact. Tempo single-leg squats and step-downs through range, controlled deceleration (eccentric sit-to-stands), the hip airplane for rotational control, and multi-directional single-leg reaches. The knee must hold its line as the range and speed grow.',
    goals: [
      'Tempo single-leg squats and step-downs through fuller range, knee tracking throughout',
      'Hip airplane: control hip rotation on one leg without the knee caving',
      'Multi-directional single-leg reaches — dynamic balance in every plane',
      'Harder balance: cushion and eyes-closed; controlled slow deceleration',
    ],
  },
  {
    phase: 4,
    theme: 'Loaded & multiplanar control',
    summary:
      'Progress the grooved patterns with more load, range and speed, still without impact. Multiplanar single-leg control under light load, faster (but still controlled) direction changes in walking, and heavier tempo work — provided the knee keeps its line and stays swelling-free. This is the bridge that earns the return to impact.',
    goals: [
      'Add load/range to single-leg control while the knee holds its track',
      'Multiplanar reaches and controlled walking direction-changes at speed',
      'Progress tempo squats and single-leg capacity work',
      'Knee tracks over the toes on one leg with no cave-in or swelling under everything',
    ],
  },
  {
    phase: 5,
    theme: 'Return to impact — only if clear',
    summary:
      'ONLY once the knee has been long clear — no effusion, clean single-leg control under load — reintroduce impact from the very bottom rung: soft, silent, stuck double-leg landings, absorbing before generating. This is gated and held on any flare day. If swelling returns, drop back. Athletic expression is rebuilt on top of the control, not instead of it.',
    goals: [
      'Confirm the green light: no swelling, clean loaded single-leg control',
      'Reintroduce soft double-leg landings — absorb only, no rebound, stick and hold',
      'Keep the knee tracking under the new impact; back off at the first sign of swelling',
      'Retest markers (balance, single-leg control, landing quality) against baseline',
    ],
  },
];

/** Overview for a given phase number (1..5), or undefined if out of range. */
export function phaseOverview(phase: number): PhaseOverview | undefined {
  return PHASE_OVERVIEWS.find((p) => p.phase === phase);
}
