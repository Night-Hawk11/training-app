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
  /**
   * Felt readiness cues — what should feel CONSISTENT (not one good day) before
   * advancing to the next phase. Written in body-sensation language, kept in step
   * with the tick-box selfChecks in phaseGate.ts (this is the fuller "what to feel
   * for", those are the confirm-to-advance gate). The top phase frames these as
   * "you've arrived / how to sustain" since there's no next gate.
   */
  readyToAdvance: string[];
}

export const PHASE_OVERVIEWS: PhaseOverview[] = [
  {
    phase: 1,
    theme: 'Foundation & Connection',
    summary:
      'Build the base from the ends inward — feet and hips first, the knee downstream. Most work is isometric (yielding first) and low-level: active hip mobility, foot tripod, windlass and arch-lock (hyperarch), isometric calf stiffness, glute-medius and adductor activation, and dynamic isometrics on the ball. The foot is trained as a tensioned spring, not isolated toes, and that arch-lock is carried up through balance and single-leg work. Single-leg work stays balance- and reach-only here: loaded knee work — wall sits, squat holds, step-downs, sit-to-ball — is deliberately deferred to Phase 2 so the hips and ankles lead and a long-standing quad-dominant pattern isn’t re-triggered before the base is in. The one bit of reactive work is low ankle hops — the gentlest stiffness primer; pogos, landings and bounds are still earned later. Everything closed-chain at the knee.',
    goals: [
      'Do the daily session every morning — motor patterning wants frequency',
      'Own the foundation: foot tripod + windlass + arch-lock (hyperarch), knee-to-wall ankle range, 90/90 and hip CARs',
      'Wake the hip: glute-medius, adductor (Copenhagen), and the glute-driven bridge',
      'Build connection on the ball: dead-bug, stir-the-pot, hamstring bridge — all symptom-free',
      'Introduce low ankle hops — light, quiet, quick contacts, driven from the hips rolling forward over a locked arch',
      'Keep single-leg work to balance and reach — no loaded knee work yet (that earns in at Phase 2); hips and ankles lead',
      'Live it off the mat: barefoot time at home, easy forefoot-first running, ankles kept stiff — connection is a daily practice, not just a drill',
      'Clean single-leg balance and quiet foot; no knee flare all week before advancing',
    ],
    readyToAdvance: [
      'Single-leg balance holds ~30s eyes-open feeling genuinely steady with a quiet, domed foot — not a fight to stay up',
      'The arch-lock (hyperarch) shows up on its own — in the holds and in easy walking/running you’re not manufacturing it each time',
      'The foot & calf holds no longer trigger the constant left-adductor grip — the inner thigh can stay soft while the lateral hip does the stabilising',
      'The left leg feels like it can relax at rest — no low-grade "always-on" guarding through the day',
      'Low ankle hops land light, quiet and quick, driven from the hips over a locked arch',
      'Foundation work is fully pain- and swelling-free across the whole week, not just on good days',
    ],
  },
  {
    phase: 2,
    theme: 'Dynamic Control',
    summary:
      'With the base connected, add through-range dynamic isometrics and progress the plyo ladder. This is also where loaded knee work reappears — now that the hips and ankles lead, wall/Spanish/single-leg squat holds and step-downs earn back in, introduced gradually to respect the quad-dominant history. Overcoming isometrics build tendon stiffness (ankle, wall/Spanish squat); Copenhagen and long-line hinge load the adductor and posterior chain. Building on Phase 1’s ankle hops, double-leg pogo and stepping off the curb to a silent stick now unlock.',
    goals: [
      'Progress hold times and add overcoming isometrics for tendon stiffness',
      'Load the foot→glute line: long-line hinge and single-leg RDL',
      'Progress the plyo ladder — double pogo and curb drop-to-stick — silent and controlled',
      'Every landing lands soft with the knee tracking over the foot',
    ],
    readyToAdvance: [
      'Double-leg pogo and curb drop-to-stick land silent and controlled, knee tracking over the foot every rep',
      'The re-introduced loaded knee work (wall/Spanish/single-leg squat holds, step-downs) feels strong and knee-quiet — no kneecap unease, no VMO-gripping, no next-day flare',
      'Adductor and posterior-chain work reads as capacity/effort, not as guarding — the burn shows up during the work and lets go after',
      'The hips set the pelvis level automatically in single-leg work — no cave-in, no reaching for the inner thigh to hold you',
      'No knee flare across ~10 days despite the added load',
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
    readyToAdvance: [
      'Single-leg landings are quiet and symmetrical L vs R — the left genuinely matches the right, not "close enough"',
      'Lateral bounds stick without the knee caving, and you trust the deceleration rather than bracing for it',
      'Single-leg control holds up as speed and amplitude climb — knee stays stacked over the foot',
      'No flare or next-day swelling after reactive sessions across a couple of weeks',
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
    readyToAdvance: [
      'This is the top phase — there’s no next gate. These are the "you’ve arrived / keep it here" signals:',
      'Multidirectional and reactive work feels athletic and repeatable, knee stacked, with no flare',
      'The foundation runs on autopilot underneath the athleticism — you don’t have to think the hip/foot chain on',
      'Sport exposure builds week to week without swelling; back off at the first sign and it settles quickly',
    ],
  },
];

/** Overview for a given phase number (1..5), or undefined if out of range. */
export function phaseOverview(phase: number): PhaseOverview | undefined {
  return PHASE_OVERVIEWS.find((p) => p.phase === phase);
}
