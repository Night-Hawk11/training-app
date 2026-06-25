/**
 * Gym session templates.
 *
 * Each session is a set of ordered blocks (block = ordered list of exercise ids).
 * The week follows Marinovich (rapid response) + Schroeder (extreme iso +
 * ballistic absorb→generate force). The daily extreme-iso and rapid-response
 * foundation lives in the daily routine; these are the seven *main* sessions:
 *   - Mon  Strength — Upper      (2 all-out sets per lift)
 *   - Tue  Power — Lower         (iso prime → absorb landings → generate jumps)
 *   - Wed  Rapid Response        (reactive conditioning)        [key: wednesday_run]
 *   - Thu  Power — Upper         (iso prime → ballistic press/throws)
 *   - Fri  Strength — Lower      (2 all-out sets per lift)      [key: friday_lower_athletic]
 *   - Sat  Athletic Expression   (full-body explosive)          [key: saturday_long_run]
 *   - Sun  Regeneration          (no gym plan; rest day)
 * The SessionType KEYS are legacy weekday identifiers (kept so old logged
 * sessions still resolve) — the meaning is the title/blurb here, not the key.
 */

import type { SessionType } from '../data/types';
import { getExercise } from '../data/exercises';

export interface PlanBlock {
  id: string; // stored as CompletedBlock.blockId
  title: string;
  exerciseIds: string[];
  /**
   * Earliest phase (1..5) this block becomes active. Defaults to 1 (always on).
   * In earlier phases the block shows as a dimmed/held preview of what's coming —
   * this is how the return-to-impact ramp is staged across the program.
   */
  minPhase?: number;
  /**
   * True for knee-impact work (landings, hops, jumps, sprints). Impact blocks are
   * additionally held on knee-flare days — see blockGate(). Iso, tempo, strength
   * and upper-body work are NOT impact and stay available regardless.
   */
  impact?: boolean;
}

// Shared building blocks ------------------------------------------------------
// RETURN-TO-IMPACT RAMP: the knee is rebuilding tolerance from the basics up, so
// warm-ups stay in a low-impact form through the early phases — jump rope,
// A/B-skips, and pogos (repeated foot-strikes) are left out for now. Reintroduce
// the impact warm-up variants once the later phases of the ramp are reached:
//   UPPER_WARMUP = ['wu_jump_rope', 'wu_scap_pushup', 'wu_pushup_downdog', 'wu_med_ball_light']
//   LOWER_WARMUP = ['wu_jump_rope', 'wu_greatest_stretch', 'wu_walking_lunge_rotation',
//                   'wu_cossack_squat', 'wu_a_skip', 'wu_b_skip', 'wu_pogos_light']
//   Thursday warm-up: re-append 'wu_pogos_light'; Wednesday: restore rope + A/B-skips.
const UPPER_WARMUP = ['wu_scap_pushup', 'wu_pushup_downdog', 'wu_med_ball_light', 'wu_greatest_stretch'];
const LOWER_WARMUP = [
  'wu_greatest_stretch',
  'wu_walking_lunge_rotation',
  'wu_cossack_squat',
  'wu_inchworm',
];

// Supplemental HOME work (bodyweight + exercise ball + 1 band), done OUTSIDE the
// gym session. These are surfaced in the Today "Daily routine" section on their
// days via getHomeWork() / HOME_WORK below — they are NOT part of any gym plan.
const HOME_UPPER_POWER: PlanBlock = {
  id: 'upper_power',
  title: 'Upper — explosive & tendon',
  exerciseIds: [
    'ath_plyo_pushup',
    'ath_band_explosive_pushup',
    'ath_explosive_band_row',
    'str_slow_eccentric_pushup',
  ],
};
const HOME_CORE: PlanBlock = {
  id: 'core',
  title: 'Core & shoulder health',
  exerciseIds: ['str_face_pull', 'core_stir_the_pot', 'core_ball_rollout', 'core_ball_pike'],
};

const GYM_SESSION_PLANS: Partial<Record<SessionType, PlanBlock[]>> = {
  // Mon — Strength, Upper. Pure max strength: 6 lifts, two all-out sets each.
  monday_upper: [
    { id: 'warmup', title: 'Warm-up', exerciseIds: [...UPPER_WARMUP, 'wu_inchworm'] },
    {
      // Upper-body extreme isos, relocated off the daily morning routine (lean-out
      // 2026-06-23) — done on the two upper days instead. Tendon/position priming.
      id: 'iso_prime',
      title: 'Upper iso priming (tendon)',
      exerciseIds: ['ei_scap_hang', 'ei_pushup_iso', 'ei_overhead_iso'],
    },
    {
      id: 'main',
      title: 'Strength',
      exerciseIds: [
        'str_depth_drop_curl',
        'str_barbell_row',
        'str_hammer_pulldown',
        'str_bench_depth_drop',
        'str_db_incline',
        'str_db_overhead_press',
        'str_weighted_dip',
      ],
    },
    { id: 'finisher', title: 'Finisher', exerciseIds: ['str_dead_hang'] },
    { id: 'cooldown', title: 'Cool-down', exerciseIds: ['cool_pec_stretch'] },
  ],

  // Tue — Lower. Phase 1 reframes this day around UN-LOCKING the lower body:
  // controlled absorption + sub-maximal, connected expression, plus ankle
  // stiffness — NOT power. Quad work cycles contract→full-relax (don't grind into
  // global bracing). Impact still unlocks by phase — double-leg soft landings
  // (P1) → single-leg landings (P4) → jumps (P5); pure power stays gated to the
  // later phases. All impact blocks auto-hold on flare days.
  tuesday_lower_athletic: [
    { id: 'warmup', title: 'Warm-up', exerciseIds: LOWER_WARMUP },
    {
      id: 'priming',
      title: 'Quad activation (contract, then fully relax)',
      exerciseIds: ['ath_loaded_iso_split_squat', 'ath_loaded_iso_parallel_squat'],
    },
    {
      id: 'tempo',
      title: 'Controlled tempo squat — smooth drive, relax at the top',
      // Slow eccentric + dead-stop pause + smooth (not grinding) drive, then a
      // full relaxation each rep — trains owning the eccentric→concentric reversal
      // AND letting go between reps, so the leg learns to fire without locking.
      exerciseIds: ['str_smith_squat'],
    },
    { id: 'accessory', title: 'Calf / ankle iso', exerciseIds: ['ath_sl_calf_raise_iso'] },
    {
      // P1 priority: build ankle/tendon stiffness — low, stiff, quiet, sub-maximal.
      // Stiffness HERE is good (timed, reactive); it's the tonic knee/leg locking
      // we're removing, not this. Knee-impact, so it holds on flare days.
      id: 'ankle',
      title: 'Ankle stiffness (low, stiff, sub-max)',
      minPhase: 1,
      impact: true,
      exerciseIds: ['ath_ankle_hops'],
    },
    {
      // P1: the foundation of the whole ramp — learn to absorb on two feet, no
      // rebound, before any jumping is allowed back in.
      id: 'absorb',
      title: 'Absorb force — soft landings (double-leg)',
      minPhase: 1,
      impact: true,
      exerciseIds: ['ath_depth_drop_stick', 'ath_step_down_landing', 'ath_marinovich_squat_catch'],
    },
    {
      // P4: single-leg absorption — the weak link, gated until double-leg landings
      // are rock solid.
      id: 'single_leg',
      title: 'Single-leg landings',
      minPhase: 4,
      impact: true,
      exerciseIds: ['ath_sl_landing_stick'],
    },
    {
      // P5: only now do we generate force off the ground.
      id: 'generate',
      title: 'Generate force — jumps',
      minPhase: 5,
      impact: true,
      exerciseIds: ['ath_marinovich_jump_squat', 'ath_box_jump'],
    },
    { id: 'cooldown', title: 'Cool-down', exerciseIds: ['cool_glute_stretch'] },
  ],

  // Wed — Rapid Response (Marinovich): reactive, fast-twitch conditioning. The
  // plyometric ladder lives here, one rung per phase: low ankle hops (P1) →
  // two-foot pogos (P2) → reactive rebound (P3) → single-leg pogos (P4) →
  // explosive starts (P5). Quickness / press / throws are always on; the impact
  // rungs auto-hold on knee-flare days. [legacy key: wednesday_run]
  wednesday_run: [
    {
      id: 'warmup',
      title: 'Warm-up',
      exerciseIds: ['wu_greatest_stretch', 'wu_scap_pushup', 'wu_pushup_downdog'],
    },
    {
      id: 'quickness',
      title: 'Reaction / quickness',
      // Low/zero-impact reactive CNS work — always available.
      exerciseIds: ['ath_reaction_catch', 'ath_fast_feet'],
    },
    {
      // P1: the lowest rung of impact — stiff, springy, minimal knee bend.
      id: 'hops',
      title: 'Low ankle hops (stiff & springy)',
      minPhase: 1,
      impact: true,
      exerciseIds: ['ath_ankle_hops'],
    },
    {
      id: 'pogos',
      title: 'Pogo jumps (two-foot)',
      minPhase: 2,
      impact: true,
      exerciseIds: ['ath_pogos'],
    },
    {
      // P3: reintroduce a true rebound off the ground.
      id: 'reactive',
      title: 'Reactive rebound',
      minPhase: 3,
      impact: true,
      exerciseIds: ['ath_box_step_up_jump'],
    },
    {
      id: 'single_leg',
      title: 'Single-leg pogos',
      minPhase: 4,
      impact: true,
      exerciseIds: ['ath_sl_pogos_low'],
    },
    {
      id: 'starts',
      title: 'Explosive starts',
      minPhase: 5,
      impact: true,
      exerciseIds: ['ath_reaction_start'],
    },
    {
      id: 'press',
      title: 'Rapid-response press (Marinovich)',
      exerciseIds: ['ath_marinovich_rr_press'],
    },
    {
      id: 'throws',
      title: 'Reactive throws',
      exerciseIds: ['ath_med_ball_chest_pass', 'ath_med_ball_overhead_throw'],
    },
    { id: 'cooldown', title: 'Cool-down', exerciseIds: ['cool_glute_stretch'] },
  ],

  // Thu — Power, Upper. Iso prime → ballistic pressing and throws.
  thursday_upper_athletic: [
    { id: 'warmup', title: 'Warm-up', exerciseIds: UPPER_WARMUP },
    {
      id: 'priming',
      title: 'Loaded-iso priming',
      // Includes the upper extreme isos relocated off the daily morning routine
      // (overhead is already covered by the loaded-iso press).
      exerciseIds: ['ath_loaded_iso_overhead_press', 'ei_scap_hang', 'ei_pushup_iso'],
    },
    {
      id: 'absorb',
      title: 'Absorb force',
      exerciseIds: ['ath_marinovich_press_catch', 'ath_depth_drop_pushup'],
    },
    {
      id: 'generate',
      title: 'Ballistic / power',
      exerciseIds: [
        'ath_db_push_jerk',
        'ath_marinovich_ballistic_press',
        'ath_smith_ballistic_bench',
        'ath_plyo_pushup',
        'ath_med_ball_supine_chest_throw',
        'ath_med_ball_overhead_throw',
      ],
    },
    { id: 'cooldown', title: 'Cool-down', exerciseIds: ['cool_pec_stretch'] },
  ],

  // Fri — Strength, Lower. ISO-DOMINANT during the knee deload: quad isometrics
  // lead (the best tool to reverse swelling-related quad inhibition / AMI), then
  // controlled capped-depth strength, then posterior/calf. Single-leg work stays
  // isometric (the loaded iso split squat) rather than dynamic split squats while
  // the knee is unstable. [legacy key: friday_lower_athletic]
  friday_lower_athletic: [
    { id: 'warmup', title: 'Warm-up', exerciseIds: LOWER_WARMUP },
    {
      id: 'iso',
      title: 'Quad activation (contract, then fully relax)',
      // Lead the day. The split squat iso is per-side — give the inhibited side
      // extra focus to wake the quad back up. Cycle contract→full release each
      // hold rather than grinding into a constant brace.
      exerciseIds: ['ath_loaded_iso_split_squat', 'ath_loaded_iso_parallel_squat'],
    },
    {
      id: 'strength',
      title: 'Controlled strength — smooth drive, relax between reps',
      // Paused tempo, no bounce, submaximal (2–3 reps in reserve), only to a depth
      // where the knee stays stable; fully relax between reps, no tonic bracing.
      exerciseIds: ['str_smith_squat', 'str_db_rdl'],
    },
    {
      id: 'accessory',
      title: 'Posterior / accessory',
      exerciseIds: ['ath_nordic_hamstring', 'ath_sl_calf_raise_iso'],
    },
    { id: 'cooldown', title: 'Cool-down', exerciseIds: ['cool_glute_stretch'] },
  ],

  // Sat — Athletic Expression (Marinovich): full-body explosive output. Upper-body
  // throws are always on; lower-body jump expression unlocks late in the ramp —
  // sub-max approach intro (P4), then full jumps and hill sprints (P5). Impact
  // blocks auto-hold on knee-flare days. [legacy key: saturday_long_run]
  saturday_long_run: [
    { id: 'warmup', title: 'Warm-up', exerciseIds: LOWER_WARMUP },
    {
      // P4: first reintroduction of an approach — kept sub-max.
      id: 'approach',
      title: 'Approach jump intro (sub-max)',
      minPhase: 4,
      impact: true,
      exerciseIds: ['ath_two_foot_approach_jump'],
    },
    {
      // P5: full jump expression.
      id: 'expression',
      title: 'Athletic expression — jumps',
      minPhase: 5,
      impact: true,
      exerciseIds: ['ath_marinovich_jump_squat', 'ath_standing_vertical_jump', 'ath_box_jump'],
    },
    {
      id: 'sprints',
      title: 'Hill sprints (garage)',
      minPhase: 5,
      impact: true,
      exerciseIds: ['ath_hill_sprint'],
    },
    {
      id: 'throws',
      title: 'Power throws',
      exerciseIds: [
        'ath_marinovich_ballistic_press',
        'ath_med_ball_overhead_throw',
        'ath_med_ball_supine_chest_throw',
        'ath_db_push_jerk',
      ],
    },
    { id: 'cooldown', title: 'Cool-down', exerciseIds: ['cool_glute_stretch', 'cool_pec_stretch'] },
  ],
};

/** The gym plan for a session type, or null for run/rest days. */
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
//      it's previewed as an upcoming rung of the return-to-impact ramp.
//   2. Knee flare — it's impact work and today's readiness knee score is low, so
//      impact is held for the day to avoid re-flaring the joint.

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
 * supplied — pass `kneeScore` undefined to skip it (e.g. previewing a future day,
 * where today's readiness is irrelevant).
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
      reason: `Held today — knees flagged ${kneeScore}/10. Stick to iso & controlled strength.`,
    };
  }
  return { gated: false };
}

// Supplemental home work by day — explosive & tendon (Tue/Fri) and core &
// shoulder (Tue/Wed/Fri/Sat). Done at home, separate from the gym session; the
// Today screen surfaces it in the Daily routine section on these days only.
const HOME_WORK: Partial<Record<SessionType, PlanBlock[]>> = {
  tuesday_lower_athletic: [HOME_UPPER_POWER, HOME_CORE],
  wednesday_run: [HOME_CORE],
  friday_lower_athletic: [HOME_UPPER_POWER, HOME_CORE],
  saturday_long_run: [HOME_CORE],
};

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
