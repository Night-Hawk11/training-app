/**
 * Session templates (2026-08-13 neuromuscular-first overhaul).
 *
 * The program was rebuilt around correcting dynamic knee valgus through motor-
 * control re-education rather than strength/impact work. The evidence base:
 * changing the valgus MOVEMENT pattern is a neuromuscular problem, not a strength
 * one (raw hip-abductor strength gains don't fix the collapse), while real-time
 * feedback + external-focus cueing reduce valgus quickly. So the week is built
 * foot → hip → integrated single-leg control, all LOW-LOAD and NON-IMPACT while
 * the bilateral reactive synovitis/effusion is active.
 *
 * Each day pairs the daily foundation (morning isos + re-education + reactive
 * coordination, in the Daily routine) with one themed focus session:
 *   - Mon  Foot & Ankle Foundation   — the base of the chain
 *   - Tue  Glute & Hip Control        — the hip governor of the knee
 *   - Wed  Integrated Control         — mirror/feedback single-leg work (centrepiece)
 *   - Thu  Core & Coordination        — trunk control that keeps the knee stacked
 *   - Fri  Lower-Chain Integration    — quad iso (AMI) → integrated control → capped tempo
 *   - Sat  Movement Quality           — multiplanar single-leg control; impact locked
 *   - Sun  Regeneration               — no gym plan; rest day
 *
 * Upper-body strength, plyometrics, jumps, landings and running were removed from
 * the active program. Impact returns only in Phase 5, gated (see blockGate) — it
 * stays OFF until the effusion is long resolved. The SessionType KEYS are legacy
 * weekday identifiers kept stable so old logged sessions still resolve; the
 * meaning is the title/blurb in schedule.ts and the plan here, not the key name.
 */

import type { SessionType } from '../data/types';
import { getExercise } from '../data/exercises';

export interface PlanBlock {
  id: string; // stored as CompletedBlock.blockId
  title: string;
  exerciseIds: string[];
  /**
   * Earliest phase (1..5) this block becomes active. Defaults to 1 (always on).
   * In earlier phases the block shows as a dimmed/held preview of what's coming.
   * Used here to keep impact locked away until Phase 5.
   */
  minPhase?: number;
  /**
   * True for knee-impact work (landings, hops, jumps). Impact blocks are held on
   * knee-flare days AND are gated to Phase 5 while the joint is settling. Foot,
   * hip, core, iso, tempo and balance work are NOT impact and stay available.
   */
  impact?: boolean;
}

// Shared building blocks ------------------------------------------------------
// Non-impact mobility prep. Ankle dorsiflexion (knee-to-wall) leads — reduced
// dorsiflexion is a well-established valgus contributor and is safe to train now.
const MOBILITY_WARMUP = [
  'wu_greatest_stretch',
  'wu_walking_lunge_rotation',
  'wu_cossack_squat',
  'fa_knee_to_wall',
];
const COOLDOWN = ['cool_glute_stretch'];

const GYM_SESSION_PLANS: Partial<Record<SessionType, PlanBlock[]>> = {
  // Mon — Foot & Ankle Foundation. Build the base of the chain: active foot
  // tripod, intrinsic/toe control, ankle dorsiflexion mobility, calf/tibialis
  // balance, and single-leg balance. [legacy key: monday_upper]
  monday_upper: [
    { id: 'warmup', title: 'Warm-up (mobility)', exerciseIds: MOBILITY_WARMUP },
    {
      id: 'foot',
      title: 'Foot control — tripod & intrinsics',
      // Windlass arch load closes the block: big-toe extension tensions the
      // plantar fascia and lifts the arch — the foot's own supportive fascia.
      exerciseIds: ['fa_tripod_stand', 'fa_toe_yoga', 'fa_short_foot_sl', 'fa_windlass_arch_load'],
    },
    {
      id: 'ankle',
      title: 'Ankle — mobility & balanced strength',
      exerciseIds: ['fa_knee_to_wall', 'ei_8', 'ei_9', 'fa_calf_tempo', 'ath_sl_calf_raise_iso'],
    },
    { id: 'balance', title: 'Single-leg balance', exerciseIds: ['nm_sl_balance'] },
    { id: 'cooldown', title: 'Cool-down', exerciseIds: COOLDOWN },
  ],

  // Tue — Glute & Hip Control. The hip governs the knee: glute-medius activation
  // and controlled hip abduction/rotation, then single-leg pelvic control and a
  // controlled hinge. All cued for a still pelvis and knees-out. [legacy key:
  // tuesday_lower_athletic]
  tuesday_lower_athletic: [
    { id: 'warmup', title: 'Warm-up (mobility)', exerciseIds: MOBILITY_WARMUP },
    {
      id: 'activate',
      title: 'Glute activation',
      exerciseIds: ['ei_2', 'gh_clamshell_control', 'gh_side_lying_abduction'],
    },
    {
      id: 'hip_control',
      title: 'Hip control — knees out, pelvis level',
      exerciseIds: ['gh_lateral_band_walk', 'gh_pelvic_control_sl_stance'],
    },
    {
      id: 'hinge',
      title: 'Controlled hinge & rotation',
      // Long-line hinge loads the plantar-fascia→Achilles→hamstring→lumbar
      // continuity with the knees straight (where chain transmission is
      // greatest). Hip airplane is advanced rotational control — it enters once
      // single-leg control is solid (Phase 3+).
      exerciseIds: ['ei_5', 'gh_long_line_hinge', 'gh_hip_airplane'],
    },
    { id: 'cooldown', title: 'Cool-down', exerciseIds: COOLDOWN },
  ],

  // Wed — Integrated Control (feedback). The centrepiece: mirror single-leg squats
  // with external-focus cueing, plus tactile step-downs and wall single-leg squats
  // — the drills with the strongest, fastest evidence for reducing valgus. Preceded
  // by a knee-out isometric primer. [legacy key: wednesday_run]
  wednesday_run: [
    { id: 'warmup', title: 'Warm-up (mobility)', exerciseIds: MOBILITY_WARMUP },
    {
      id: 'prime',
      title: 'Knee-tracking primer (iso)',
      exerciseIds: ['ei_4', 'nm_wall_sit_knee_track'],
    },
    {
      id: 'feedback',
      title: 'Mirror single-leg control (external focus)',
      // Watch the knee track over the 2nd toe; small perfect range beats depth.
      exerciseIds: ['nm_mirror_sl_squat', 'reed_1', 'reed_2'],
    },
    { id: 'dynamic', title: 'Dynamic balance — multi-direction reach', exerciseIds: ['nm_sl_reach_star'] },
    { id: 'cooldown', title: 'Cool-down', exerciseIds: COOLDOWN },
  ],

  // Thu — Core & Coordination. Trunk control that keeps the knee stacked: lateral
  // chain (side plank) and anti-rotation (Pallof), then dead bug / bird dog
  // coordination and the rotary ball connection. [legacy key: thursday_upper_athletic]
  thursday_upper_athletic: [
    {
      id: 'warmup',
      title: 'Warm-up (mobility)',
      exerciseIds: ['wu_greatest_stretch', 'wu_walking_lunge_rotation'],
    },
    {
      id: 'lateral',
      title: 'Lateral chain & anti-rotation',
      exerciseIds: ['core_side_plank', 'core_pallof_press'],
    },
    {
      id: 'coordination',
      title: 'Trunk coordination',
      exerciseIds: ['core_dead_bug', 'core_bird_dog', 'core_stir_the_pot'],
    },
    { id: 'connect', title: 'Legs–hips–core connection', exerciseIds: ['reed_ball_rotation'] },
    { id: 'cooldown', title: 'Cool-down', exerciseIds: COOLDOWN },
  ],

  // Fri — Lower-Chain Integration. Lead with quad isometrics (the best tool to
  // reverse swelling-related quad inhibition / AMI), then integrate the week's
  // single-leg control, then optional capped-depth controlled tempo squatting for
  // capacity — low load, no bounce, smooth drive, relax between reps. [legacy key:
  // friday_lower_athletic]
  friday_lower_athletic: [
    { id: 'warmup', title: 'Warm-up (mobility)', exerciseIds: MOBILITY_WARMUP },
    {
      id: 'iso_prime',
      title: 'Quad activation (contract, then fully relax)',
      exerciseIds: ['ath_loaded_iso_split_squat', 'ath_loaded_iso_parallel_squat'],
    },
    {
      id: 'integrate',
      title: 'Integrated single-leg control',
      exerciseIds: ['nm_mirror_sl_squat', 'reed_3', 'reed_4'],
    },
    {
      id: 'capacity',
      title: 'Controlled tempo squat — capped depth, low load',
      // Optional capacity work: paused tempo, no bounce, submaximal, only to a
      // depth where the knee tracks cleanly. Enters in Phase 2 once activation and
      // control are established.
      minPhase: 2,
      exerciseIds: ['str_smith_squat'],
    },
    { id: 'cooldown', title: 'Cool-down', exerciseIds: COOLDOWN },
  ],

  // Sat — Movement Quality. Multiplanar single-leg control and controlled
  // deceleration, non-impact. The impact ladder is previewed here but LOCKED to
  // Phase 5 (and held on flare days) — it stays off until the knee is long clear.
  // [legacy key: saturday_long_run]
  saturday_long_run: [
    { id: 'warmup', title: 'Warm-up (mobility)', exerciseIds: MOBILITY_WARMUP },
    {
      id: 'multiplanar',
      title: 'Multiplanar single-leg control',
      exerciseIds: ['wu_cossack_squat', 'gh_lateral_band_walk', 'nm_sl_reach_star'],
    },
    {
      id: 'decelerate',
      title: 'Controlled deceleration & rotation',
      exerciseIds: ['reed_3', 'gh_hip_airplane'],
    },
    {
      // Locked preview: the first rung of the eventual return-to-impact ramp. Gated
      // to Phase 5 and flagged as impact so it also holds on any knee-flare day.
      id: 'impact_preview',
      title: 'Return to impact — soft landings',
      minPhase: 5,
      impact: true,
      exerciseIds: ['ath_step_down_landing', 'ath_depth_drop_stick'],
    },
    { id: 'cooldown', title: 'Cool-down', exerciseIds: COOLDOWN },
  ],
};

/** The gym plan for a session type, or null for rest days. */
export function getSessionPlan(type: SessionType): PlanBlock[] | null {
  return GYM_SESSION_PLANS[type] ?? null;
}

/** Whether a session type is a gym day (has a plan). */
export function isGymSession(type: SessionType): boolean {
  return getSessionPlan(type) !== null;
}

// ── Block gating ─────────────────────────────────────────────────────────────
// A block can be "gated" (shown held, not counted) for two reasons:
//   1. Phase lock — the current phase hasn't reached the block's minPhase yet, so
//      it's previewed as an upcoming rung of the program.
//   2. Knee flare — it's impact work and today's readiness knee score is low, so
//      impact is held for the day to avoid re-flaring the joint.

/** Readiness knee score (1–10) at or below which impact work is held for the day. */
export const KNEE_FLARE_THRESHOLD = 4;

export interface BlockGate {
  gated: boolean;
  /** Short pill text, e.g. "Phase 5" or "Knee flare". */
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
    return { gated: true, label: `Phase ${minPhase}`, reason: `Unlocks in Phase ${minPhase}` };
  }
  if (block.impact && kneeScore != null && kneeScore <= KNEE_FLARE_THRESHOLD) {
    return {
      gated: true,
      label: 'Knee flare',
      reason: `Held today — knees flagged ${kneeScore}/10. Keep it non-impact: foot, hip, core and iso control.`,
    };
  }
  return { gated: false };
}

// No supplemental home work in the current build — the daily routine plus the
// themed session cover the load. Kept as a stable no-op so the Today screen's
// getHomeWork() call still resolves.
const HOME_WORK: Partial<Record<SessionType, PlanBlock[]>> = {};

/** The supplemental home-work blocks for a day, or null if the day has none. */
export function getHomeWork(type: SessionType): PlanBlock[] | null {
  return HOME_WORK[type] ?? null;
}

/**
 * Dev-time check: every exercise id referenced by a plan exists in the database.
 * Returns the list of unknown ids (empty if all resolve).
 */
export function validateSessionPlans(): string[] {
  const missing: string[] = [];
  const allBlocks = [...Object.values(GYM_SESSION_PLANS), ...Object.values(HOME_WORK)];
  for (const blocks of allBlocks) {
    for (const block of blocks ?? []) {
      for (const id of block.exerciseIds) {
        if (!getExercise(id)) missing.push(id);
      }
    }
  }
  return missing;
}
