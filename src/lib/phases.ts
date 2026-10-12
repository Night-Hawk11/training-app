/**
 * Program phase schedule.
 *
 * The Athletic Reset program is 4 phases of 4 weeks each, run from a fixed
 * start date (Settings.startDate). This derives the planned milestone dates —
 * when each phase should begin and end — purely from that start date, so the
 * calendar shows the schedule you *should* be on regardless of the manually-set
 * current phase.
 */

import { addDays, daysBetween } from './dates';

export const PHASE_COUNT = 4;
export const WEEKS_PER_PHASE = 4;
export const DAYS_PER_PHASE = WEEKS_PER_PHASE * 7; // 28
export const PROGRAM_DAYS = PHASE_COUNT * DAYS_PER_PHASE; // 112

export interface PhaseRange {
  phase: number; // 1..4
  startISO: string; // inclusive
  endISO: string; // inclusive
}

/** Date ranges for all 4 phases, counted from the program start date. */
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

/** Which phase a date falls in (1..4), or null if outside the program window. */
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
// The program (2026-10-11 perturbation pivot) builds an athletic foundation for a
// return to court sport through the principle DESTABILIZE → FIRE: wreck the base
// (unstable surface + offset/oscillating load) then demand stability and reactive
// output. Phases advance on CRITERIA, not the calendar (currentPhase is set
// manually in Settings) and progress the instability dials (surface × stance ×
// load × task) and unlock the HIGH-impact ramp in sessionPlan.ts (blockGate):
//   P1 Foundation — base + stable→foam→bosu balance; MINOR reactive (ankle
//      hops/pogo) is open now; high-impact locked.
//   P2 Perturbation & Dynamic Control — crank the dials (inverted bosu,
//      oscillating/offset loads, eyes-closed) + dynamic iso; loaded knee work
//      earns back in; minor reactive broadened.
//   P3 Reactive & Multidirectional — HIGH-impact ramp unlocks (bounding, box/
//      depth/broad jumps, lateral bounds) fed by the instability base.
//   P4 Return to Court — highest amplitude + reactive + progressive sport.
// Minor impact is NEVER phase-locked (only held on a knee-flare day); only the
// high-impact ramp is gated. Keep these summaries in step with those gates.

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
      'Build the base from the ends inward — feet and hips first, the knee downstream — and start destabilizing it. The spine is short and fixed: hip mobility then the ankle→foot-spring (HFT) chain. Then a free circuit: balance progressed stable→foam→bosu dome, the foot trained as a tensioned arch-lock carried up through single-leg work, glute/adductor activation, and dynamic isometrics on the ball. Reactive work is open at the MINOR tier now — ankle hops and pogos are low-force and the base tolerates them — but true high-amplitude impact (depth drops, box jumps, bounding, broad jumps) is still earned later. Everything closed-chain at the knee.',
    goals: [
      'Do the daily session every morning — motor patterning wants frequency',
      'Own the spine: foot tripod + windlass + arch-lock (hyperarch), knee-to-wall ankle range, 90/90, hip CARs and 90/90 rotational lift-off holds',
      'Reposition the hip daily — rotational control (airplane), end-range IR/ER holds, and the half-kneeling extension hold to walk the pelvis out of anterior tilt',
      'Start the instability dials: single-leg balance stable → foam → bosu dome, quiet foot',
      'Wake the hip: glute-medius, adductor (Copenhagen), and the glute-driven bridge',
      'Keep the minor reactive work light and quiet — ankle hops and pogos driven from the hips over a locked arch',
      'Live it off the mat: barefoot time, easy forefoot-first running, ankles kept stiff — connection is a daily practice',
      'Clean single-leg balance and quiet foot; no knee flare all week before advancing',
    ],
    readyToAdvance: [
      'Single-leg balance holds ~30s eyes-open on the floor AND starts to settle on a bosu dome — steady, not a fight',
      'The arch-lock (hyperarch) shows up on its own in the holds and in easy walking/running — you’re not manufacturing it each time',
      'The foot & calf holds no longer trigger the constant left-adductor grip — the inner thigh can stay soft while the lateral hip stabilises',
      'The left leg feels like it can relax at rest — no low-grade "always-on" guarding through the day',
      'Minor reactive (ankle hops, low pogos) lands light, quiet and quick, driven from the hips over a locked arch',
      'Foundation work is fully pain- and swelling-free across the whole week, not just on good days',
    ],
  },
  {
    phase: 2,
    theme: 'Perturbation & Dynamic Control',
    summary:
      'With the base connected, crank the instability dials and add through-range dynamic isometrics. This is where the obscure setups bite: single-leg on an inverted bosu, offset and oscillating loads (the dangling-kettlebell anti-sway hold), eyes-closed and head-turn tasks — destabilize, then make it go quiet. Loaded knee work also earns back in now the hips and ankles lead: wall/Spanish/single-leg squat holds and step-downs, introduced gradually to respect the quad-dominant history. Minor reactive work broadens (single-leg pogo, low drop-to-stick); high-amplitude impact is still locked.',
    goals: [
      'Progress hold times and add overcoming isometrics for tendon stiffness',
      'Climb the instability dials: inverted bosu, offset/oscillating loads, eyes-closed and head-turn tasks',
      'Load the foot→glute line on an unstable base: single-leg RDL on a dome, long-line hinge',
      'Re-introduce loaded knee work gradually — knee-quiet, tracking over the foot',
      'Broaden minor reactive — single-leg pogo and low drop-to-stick, silent and controlled',
    ],
    readyToAdvance: [
      'Single-leg balance on an inverted bosu — even with an oscillating load — stays quiet-footed and knee-calm',
      'The re-introduced loaded knee work (wall/Spanish/single-leg squat holds, step-downs) feels strong and knee-quiet — no kneecap unease, no VMO-gripping, no next-day flare',
      'Offset and oscillating loads are damped from the floor up, not fought with the arms — the wobble goes quiet quickly',
      'The hips set the pelvis level automatically in single-leg work — no cave-in, no reaching for the inner thigh to hold you',
      'No knee flare across ~10 days despite the added load and perturbation',
    ],
  },
  {
    phase: 3,
    theme: 'Reactive & Multidirectional',
    summary:
      'The high-impact ramp unlocks, fed by the instability base you built. Single-leg landing sticks, lateral bounds, alternating bounds and box/depth/broad jumps build unilateral stiffness, symmetry and the deceleration and direction-change the court demands. The perturbation work continues underneath — reactive output is only as trustworthy as the base it fires from. Advance only when landing quality, symmetry and symptom response stay clean.',
    goals: [
      'Earn into the high-impact ramp — landing sticks, lateral/alternating bounds, box/depth/broad jumps',
      'Single-leg landings quiet, symmetrical and knee-stacked',
      'Own the sideways and forward deceleration — stick every landing',
      'Confirm symmetry and no flare before pushing amplitude',
    ],
    readyToAdvance: [
      'Single-leg landings are quiet and symmetrical L vs R — the left genuinely matches the right, not "close enough"',
      'Bounds and box/depth jumps stick without the knee caving, and you trust the deceleration rather than bracing for it',
      'Reactive output holds up as speed and amplitude climb — knee stays stacked over the foot',
      'No flare or next-day swelling after reactive sessions across a couple of weeks',
    ],
  },
  {
    phase: 4,
    theme: 'Return to Court',
    summary:
      'Bridge the earn-it ramp toward real play: higher-amplitude and more reactive multidirectional work, layered on top of everything below it. The spine, instability circuit and control work stay in — athletic expression is built on top of connection and a stable base, not instead of them. Reintroduce your sport progressively, backing off at any sign of flare.',
    goals: [
      'Raise impact amplitude and reactivity while landings stay clean',
      'Blend cutting and change-of-direction prep into the reactive day',
      'Keep the daily spine + instability circuit — connection underpins the athleticism',
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

/** Overview for a given phase number (1..4), or undefined if out of range. */
export function phaseOverview(phase: number): PhaseOverview | undefined {
  return PHASE_OVERVIEWS.find((p) => p.phase === phase);
}
