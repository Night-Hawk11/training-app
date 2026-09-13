/**
 * Session templates (2026-09-12 athletic-foundation pivot).
 *
 * One ~30-min morning session per day, HYBRID model: a shared daily ANCHOR (the
 * full ground-up chain, trained every day because connection wants frequency)
 * plus ONE rotating EMPHASIS block (the quality that needs a concentrated dose or
 * recovery spacing). See the ANCHOR definition below.
 *
 * Two hard rules are baked in (see memory: training-safety-rules):
 *   1. FEET & HIPS FIRST — the anchor leads with foot/ankle and hip work and the
 *      foot→glute chain. The knee is a victim joint; it's trained downstream,
 *      never as the early direct target.
 *   2. CLOSED CHAIN ONLY at the knee — the library carries a `chain` tag and
 *      contains zero open-chain knee-extension movements (left patellar
 *      subluxation history). validateSessionPlans() also fails if an open-chain
 *      exercise is ever scheduled.
 *
 * Rotating emphasis (SessionType keys are LEGACY weekday identifiers kept stable
 * so old logged sessions still resolve — the meaning is the title/blurb in
 * schedule.ts and the plan here, NOT the key name):
 *   Mon  Adductor (Copenhagen)
 *   Tue  Abductor & lateral hip
 *   Wed  Ball & core
 *   Thu  Posterior chain
 *   Fri  Single-leg control
 *   Sat  Reactive & plyo (earn-it)
 *   Sun  Regeneration (anchor without impact + restorative mobility)
 *
 * The Express (plyometric) blocks are gated on an EARN-IT ramp: they unlock by
 * phase (minPhase) and are held on any symptom-flare day (impact + low knee
 * score). Foot, hip, iso, ball and single-leg control work is never gated.
 */

import type { SessionType } from '../data/types';
import { getExercise, isKneeSafe } from '../data/exercises';

export interface PlanBlock {
  id: string; // stored as CompletedBlock.blockId
  title: string;
  exerciseIds: string[];
  /**
   * Earliest phase (1..4) this block becomes active. Defaults to 1 (always on).
   * In earlier phases the block shows as a locked preview of what's coming — used
   * to gate the plyometric ramp (low ankle hops P1, pogo/drop-stick P2, single-leg/reactive P3).
   */
  minPhase?: number;
  /**
   * True for plyometric / impact work (hops, landings, bounds). Impact blocks are
   * gated by phase AND held on any knee-flare day. Foot, hip, iso, ball, single-
   * leg control and mobility work are NOT impact and stay available.
   */
  impact?: boolean;
}

// ── Shared daily anchor ──────────────────────────────────────────────────────
// Hybrid model (2026-09-12): the ground-up chain below is trained EVERY day —
// connection is a skill that wants daily frequency, and it's low-load enough to
// repeat without recovery cost. Order runs the chain foot → posterior → hip →
// ball → single-leg control → ankle hops, bookended by prime mobility and a
// down-regulator. Each day then adds ONE rotating EMPHASIS block: the quality
// that benefits from a concentrated dose or recovery spacing (adductor,
// abductor, ball/core, posterior, single-leg, or the plyo ladder).
const A_PRIME: PlanBlock = { id: 'prime', title: 'Prime — hips & ankles', exerciseIds: ['mob_hip_cars', 'mob_knee_to_wall'] };
const A_FOOT: PlanBlock = { id: 'foot_ankle', title: 'Foot & ankle', exerciseIds: ['fa_windlass', 'fa_calf_iso'] };
const A_HIP: PlanBlock = { id: 'hip', title: 'Hip — glute & abductor', exerciseIds: ['hip_glute_bridge_iso', 'hip_clamshell'] };
const A_CHAIN: PlanBlock = { id: 'chain', title: 'Posterior chain (foot→glute)', exerciseIds: ['pc_long_line_hinge'] };
const A_BALL: PlanBlock = { id: 'ball', title: 'Ball connection', exerciseIds: ['ball_dead_bug'] };
const A_SL: PlanBlock = { id: 'single_leg', title: 'Single-leg control', exerciseIds: ['sl_mirror_squat'] };
const A_HOPS: PlanBlock = { id: 'express', title: 'Ankle hops (reactive stiffness)', minPhase: 1, impact: true, exerciseIds: ['ply_ankle_hops'] };
const A_DOWN: PlanBlock = { id: 'down', title: 'Down-regulate', exerciseIds: ['regen_crocodile_breathing'] };

/** The shared daily anchor, in order. */
const ANCHOR: PlanBlock[] = [A_PRIME, A_FOOT, A_HIP, A_CHAIN, A_BALL, A_SL, A_HOPS];

/** Compose a day: the shared anchor, then the day's emphasis block(s), then down-regulate. */
function day(...emphasis: PlanBlock[]): PlanBlock[] {
  return [...ANCHOR, ...emphasis, A_DOWN];
}

const GYM_SESSION_PLANS: Partial<Record<SessionType, PlanBlock[]>> = {
  // Mon — emphasis: adductor (Copenhagen). [legacy key: monday_upper]
  monday_upper: day({
    id: 'emphasis',
    title: 'Emphasis — adductor (Copenhagen)',
    exerciseIds: ['hip_copenhagen', 'hip_adductor_ball_squeeze', 'hip_psoas_march'],
  }),

  // Tue — emphasis: abductor & lateral hip. [legacy key: tuesday_lower_athletic]
  tuesday_lower_athletic: day({
    id: 'emphasis',
    title: 'Emphasis — abductor & lateral hip',
    exerciseIds: ['hip_side_lying_abduction', 'hip_lateral_band_walk', 'sl_reach_star'],
  }),

  // Wed — emphasis: ball & core deep-dive. [legacy key: wednesday_run]
  wednesday_run: day({
    id: 'emphasis',
    title: 'Emphasis — ball & core',
    exerciseIds: ['ball_stir_the_pot', 'ball_hamstring_curl_iso', 'ball_wall_squat', 'core_side_plank'],
  }),

  // Thu — emphasis: posterior chain. [legacy key: thursday_upper_athletic]
  thursday_upper_athletic: day({
    id: 'emphasis',
    title: 'Emphasis — posterior chain',
    exerciseIds: ['pc_sl_rdl', 'ball_hamstring_curl_iso', 'core_bird_dog'],
  }),

  // Fri — emphasis: single-leg control (feedback). [legacy key: friday_lower_athletic]
  friday_lower_athletic: day({
    id: 'emphasis',
    title: 'Emphasis — single-leg control',
    exerciseIds: ['iso_wall_sl_squat_hold', 'sl_step_down', 'sl_ecc_sit_to_stand', 'sl_reach_star'],
  }),

  // Sat — emphasis: reactive & plyo (earn-it). Anchor ankle hops → pogo/drop (P2)
  // → single-leg & lateral (P3). [legacy key: saturday_long_run]
  saturday_long_run: day(
    {
      id: 'emphasis',
      title: 'Emphasis — pogo & landings (earn-it)',
      minPhase: 2,
      impact: true,
      exerciseIds: ['ply_pogo_double', 'ply_drop_stick'],
    },
    {
      id: 'emphasis2',
      title: 'Emphasis — single-leg & lateral (earn-it)',
      minPhase: 3,
      impact: true,
      exerciseIds: ['ply_pogo_single', 'ply_sl_landing_stick', 'ply_lateral_bound'],
    }
  ),

  // Sun — Regeneration: the anchor without impact, plus restorative mobility.
  // [legacy key: sunday_rest_walk]
  sunday_rest_walk: [
    A_PRIME,
    { id: 'foot_ankle', title: 'Foot & ankle (light)', exerciseIds: ['fa_short_foot', 'fa_sl_balance'] },
    A_HIP,
    A_CHAIN,
    A_BALL,
    { id: 'emphasis', title: 'Restore — active mobility', exerciseIds: ['mob_deep_squat_sit', 'mob_worlds_greatest', 'mob_90_90'] },
    { id: 'down', title: 'Down-regulate', exerciseIds: ['regen_crocodile_breathing', 'regen_glute_figure4'] },
  ],
};

/** The session plan for a session type (all days have one now). */
export function getSessionPlan(type: SessionType): PlanBlock[] | null {
  return GYM_SESSION_PLANS[type] ?? null;
}

/** Whether a session type has a plan. */
export function isGymSession(type: SessionType): boolean {
  return getSessionPlan(type) !== null;
}

// ── Block gating ─────────────────────────────────────────────────────────────
// A plyometric block is held for two reasons:
//   1. Phase lock — the current phase hasn't reached the block's minPhase yet, so
//      it's previewed as an upcoming rung of the earn-it ramp.
//   2. Knee flare — it's impact work and today's readiness knee score is low, so
//      impact is held for the day to protect the joint.

/** Readiness knee score (1–10) at or below which impact work is held for the day. */
export const KNEE_FLARE_THRESHOLD = 4;

export interface BlockGate {
  gated: boolean;
  /** Short pill text, e.g. "Phase 3" or "Knee flare". */
  label?: string;
  /** One-line explanation of why it's held. */
  reason?: string;
}

/**
 * Decide whether a block is available right now. Phase locks always apply; the
 * knee-flare gate only applies to impact blocks and only when a knee score is
 * supplied — pass `kneeScore` undefined to skip it (e.g. previewing a future day).
 */
export function blockGate(block: PlanBlock, phase: number, kneeScore?: number): BlockGate {
  const minPhase = block.minPhase ?? 1;
  if (phase < minPhase) {
    return { gated: true, label: `Phase ${minPhase}`, reason: `Unlocks in Phase ${minPhase} — earn it first` };
  }
  if (block.impact && kneeScore != null && kneeScore <= KNEE_FLARE_THRESHOLD) {
    return {
      gated: true,
      label: 'Knee flare',
      reason: `Held today — knees flagged ${kneeScore}/10. Keep it non-impact: mobility, iso, ball and control work.`,
    };
  }
  return { gated: false };
}

// No supplemental home work — the single daily session covers everything. Kept as
// a stable no-op so callers (Today screen) still resolve.
const HOME_WORK: Partial<Record<SessionType, PlanBlock[]>> = {};

/** The supplemental home-work blocks for a day, or null if the day has none. */
export function getHomeWork(type: SessionType): PlanBlock[] | null {
  return HOME_WORK[type] ?? null;
}

/**
 * Dev-time check: every referenced exercise id exists AND is knee-safe (no open-
 * chain knee work ever reaches a session plan). Returns the list of problems.
 */
export function validateSessionPlans(): string[] {
  const problems: string[] = [];
  const allBlocks = [...Object.values(GYM_SESSION_PLANS), ...Object.values(HOME_WORK)];
  for (const blocks of allBlocks) {
    for (const block of blocks ?? []) {
      for (const id of block.exerciseIds) {
        const ex = getExercise(id);
        if (!ex) problems.push(`unknown exercise: ${id}`);
        else if (!isKneeSafe(ex)) problems.push(`OPEN-CHAIN KNEE exercise scheduled: ${id}`);
      }
    }
  }
  return problems;
}
