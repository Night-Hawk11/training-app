/**
 * Session templates (2026-09-12 athletic-foundation pivot).
 *
 * One ~30-min morning session per day, built on a constant 5-block skeleton so it
 * becomes a habit, with the theme rotating across the week:
 *   Prime → Connect → Control → Express → Down-regulate
 *
 * Two hard rules are baked in (see memory: training-safety-rules):
 *   1. FEET & HIPS FIRST — every day's Prime and Connect blocks lead with foot/
 *      ankle and hip work. The knee is a victim joint; it's trained downstream,
 *      never as the early direct target.
 *   2. CLOSED CHAIN ONLY at the knee — the library carries a `chain` tag and
 *      contains zero open-chain knee-extension movements (left patellar
 *      subluxation history). validateSessionPlans() also fails if an open-chain
 *      exercise is ever scheduled.
 *
 * Weekly theme rotation (SessionType keys are LEGACY weekday identifiers kept
 * stable so old logged sessions still resolve — the meaning is the title/blurb in
 * schedule.ts and the plan here, NOT the key name):
 *   Mon  Foot & Ankle Foundation
 *   Tue  Hips — Abductor / Adductor
 *   Wed  Ball Control (dynamic isometrics)
 *   Thu  Posterior Chain (foot → glute)
 *   Fri  Single-Leg Integration
 *   Sat  Reactive & Elastic (plyo emphasis)
 *   Sun  Regeneration
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
   * to gate the plyometric ramp (entry plyos P2, single-leg/reactive P3).
   */
  minPhase?: number;
  /**
   * True for plyometric / impact work (hops, landings, bounds). Impact blocks are
   * gated by phase AND held on any knee-flare day. Foot, hip, iso, ball, single-
   * leg control and mobility work are NOT impact and stay available.
   */
  impact?: boolean;
}

// ── Shared building blocks ───────────────────────────────────────────────────
// Prime always leads with hips + feet (regional interdependence). Kept short.
const PRIME_HIPS_FEET = ['mob_hip_cars', 'mob_knee_to_wall'];
const DOWN_BREATH = ['regen_crocodile_breathing'];
const DOWN_LONGLINE = ['regen_long_line_reach'];
const DOWN_GLUTE = ['regen_glute_figure4'];

const GYM_SESSION_PLANS: Partial<Record<SessionType, PlanBlock[]>> = {
  // Mon — Foot & Ankle Foundation. The base of the chain. [legacy key: monday_upper]
  monday_upper: [
    { id: 'prime', title: 'Prime — hips & ankles', exerciseIds: [...PRIME_HIPS_FEET, 'mob_90_90'] },
    {
      id: 'connect',
      title: 'Connect — foot & ankle isometrics',
      exerciseIds: ['fa_short_foot', 'fa_windlass', 'fa_calf_iso', 'fa_tibialis_raise', 'fa_ankle_band'],
    },
    { id: 'control', title: 'Control — balance & closed-chain', exerciseIds: ['fa_sl_balance', 'ball_wall_squat'] },
    { id: 'express', title: 'Express — ankle stiffness (earn-it)', minPhase: 2, impact: true, exerciseIds: ['ply_ankle_hops'] },
    { id: 'down', title: 'Down-regulate', exerciseIds: DOWN_LONGLINE },
  ],

  // Tue — Hips: abductor / adductor / psoas. The hip governs the knee. [legacy key: tuesday_lower_athletic]
  tuesday_lower_athletic: [
    { id: 'prime', title: 'Prime — hips & ankles', exerciseIds: [...PRIME_HIPS_FEET, 'mob_90_90', 'mob_cossack'] },
    {
      id: 'connect',
      title: 'Connect — abductor & glute',
      exerciseIds: ['hip_clamshell', 'hip_side_lying_abduction', 'hip_lateral_band_walk', 'hip_glute_bridge_iso'],
    },
    {
      id: 'control',
      title: 'Control — adductor & psoas (ball)',
      exerciseIds: ['hip_copenhagen', 'hip_adductor_ball_squeeze', 'hip_psoas_march'],
    },
    { id: 'express', title: 'Express — pogo (earn-it)', minPhase: 2, impact: true, exerciseIds: ['ply_pogo_double'] },
    { id: 'down', title: 'Down-regulate', exerciseIds: DOWN_GLUTE },
  ],

  // Wed — Ball Control: dynamic isometrics. [legacy key: wednesday_run]
  wednesday_run: [
    { id: 'prime', title: 'Prime — hips & ankles', exerciseIds: [...PRIME_HIPS_FEET, 'mob_deep_squat_sit'] },
    { id: 'connect', title: 'Connect — closed-chain isometrics', exerciseIds: ['iso_wall_sit', 'iso_spanish_squat'] },
    {
      id: 'control',
      title: 'Control — dynamic isometrics on the ball',
      exerciseIds: ['ball_dead_bug', 'ball_stir_the_pot', 'ball_hamstring_curl_iso', 'ball_wall_squat'],
    },
    { id: 'express', title: 'Express — ankle stiffness (earn-it)', minPhase: 2, impact: true, exerciseIds: ['ply_ankle_hops'] },
    { id: 'down', title: 'Down-regulate', exerciseIds: DOWN_BREATH },
  ],

  // Thu — Posterior Chain: foot → glute connection. [legacy key: thursday_upper_athletic]
  thursday_upper_athletic: [
    { id: 'prime', title: 'Prime — hips & ankles', exerciseIds: [...PRIME_HIPS_FEET, 'mob_worlds_greatest'] },
    { id: 'connect', title: 'Connect — foot, calf & glute', exerciseIds: ['fa_windlass', 'fa_calf_iso', 'hip_glute_bridge_iso'] },
    {
      id: 'control',
      title: 'Control — long-line chain',
      exerciseIds: ['pc_long_line_hinge', 'pc_sl_rdl', 'ball_hamstring_curl_iso'],
    },
    { id: 'express', title: 'Express — drop to stick (earn-it)', minPhase: 2, impact: true, exerciseIds: ['ply_drop_stick'] },
    { id: 'down', title: 'Down-regulate', exerciseIds: DOWN_LONGLINE },
  ],

  // Fri — Single-Leg Integration. [legacy key: friday_lower_athletic]
  friday_lower_athletic: [
    { id: 'prime', title: 'Prime — hips & ankles', exerciseIds: [...PRIME_HIPS_FEET, 'mob_cossack'] },
    { id: 'connect', title: 'Connect — single-leg isometrics', exerciseIds: ['iso_split_squat_hold', 'iso_wall_sl_squat_hold'] },
    {
      id: 'control',
      title: 'Control — single-leg control (feedback)',
      exerciseIds: ['sl_mirror_squat', 'sl_step_down', 'sl_reach_star', 'sl_ecc_sit_to_stand'],
    },
    { id: 'express', title: 'Express — single-leg landings (earn-it)', minPhase: 3, impact: true, exerciseIds: ['ply_sl_landing_stick'] },
    { id: 'down', title: 'Down-regulate', exerciseIds: DOWN_GLUTE },
  ],

  // Sat — Reactive & Elastic: the plyo-emphasis day, gated. [legacy key: saturday_long_run]
  saturday_long_run: [
    { id: 'prime', title: 'Prime — hips & ankles', exerciseIds: [...PRIME_HIPS_FEET, 'mob_90_90', 'mob_cossack'] },
    { id: 'connect', title: 'Connect — ankle & lateral hip', exerciseIds: ['fa_calf_iso', 'hip_lateral_band_walk'] },
    { id: 'control', title: 'Control — multiplanar balance', exerciseIds: ['sl_reach_star', 'ball_wall_squat'] },
    { id: 'express_entry', title: 'Express — pogo ladder (earn-it)', minPhase: 2, impact: true, exerciseIds: ['ply_ankle_hops', 'ply_pogo_double'] },
    {
      id: 'express_reactive',
      title: 'Express — reactive & multidirectional (earn-it)',
      minPhase: 3,
      impact: true,
      exerciseIds: ['ply_pogo_single', 'ply_lateral_bound'],
    },
    { id: 'down', title: 'Down-regulate', exerciseIds: DOWN_LONGLINE },
  ],

  // Sun — Regeneration: mobility, light iso, breathing. No impact. [legacy key: sunday_rest_walk]
  sunday_rest_walk: [
    { id: 'prime', title: 'Prime — hips & ankles', exerciseIds: [...PRIME_HIPS_FEET, 'mob_90_90'] },
    { id: 'connect', title: 'Reconnect — light iso & balance', exerciseIds: ['hip_glute_bridge_iso', 'fa_sl_balance'] },
    { id: 'control', title: 'Restore — active mobility', exerciseIds: ['mob_deep_squat_sit', 'mob_worlds_greatest'] },
    { id: 'down', title: 'Down-regulate', exerciseIds: [...DOWN_BREATH, ...DOWN_GLUTE] },
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
