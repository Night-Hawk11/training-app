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
}

// Shared building blocks ------------------------------------------------------
const UPPER_WARMUP = ['wu_jump_rope', 'wu_scap_pushup', 'wu_pushup_downdog', 'wu_med_ball_light'];
const LOWER_WARMUP = [
  'wu_jump_rope',
  'wu_greatest_stretch',
  'wu_walking_lunge_rotation',
  'wu_cossack_squat',
  'wu_a_skip',
  'wu_b_skip',
  'wu_pogos_light',
];

const GYM_SESSION_PLANS: Partial<Record<SessionType, PlanBlock[]>> = {
  // Mon — Strength, Upper. Pure max strength: 6 lifts, two all-out sets each.
  monday_upper: [
    { id: 'warmup', title: 'Warm-up', exerciseIds: [...UPPER_WARMUP, 'wu_inchworm'] },
    {
      id: 'main',
      title: 'Strength',
      exerciseIds: [
        'str_db_incline',
        'str_barbell_row',
        'str_hammer_pulldown',
        'str_db_overhead_press',
        'str_weighted_dip',
        'str_depth_drop_curl',
      ],
    },
    { id: 'finisher', title: 'Finisher', exerciseIds: ['str_dead_hang'] },
    { id: 'cooldown', title: 'Cool-down', exerciseIds: ['cool_pec_stretch'] },
  ],

  // Tue — Power, Lower. Schroeder sequence: iso prime → ABSORB (the priority
  // while the knees/tendons build capacity) → a small dose of generate. Jump
  // volume is deliberately low: absorption must precede heavy jumping.
  tuesday_lower_athletic: [
    { id: 'warmup', title: 'Warm-up', exerciseIds: LOWER_WARMUP },
    {
      id: 'priming',
      title: 'Loaded-iso priming',
      exerciseIds: ['ath_loaded_iso_split_squat', 'ath_loaded_iso_parallel_squat'],
    },
    {
      id: 'absorb',
      title: 'Absorb force (landings)',
      // Build eccentric/landing capacity first: bilateral stick, controlled
      // step-downs, then conservative single-leg landing skill.
      exerciseIds: ['ath_depth_drop_stick', 'ath_step_down_landing', 'ath_sl_landing_stick'],
    },
    {
      id: 'generate',
      title: 'Generate force (jumps)',
      // Low volume, knee-friendly: box jump lands ON the box (minimal eccentric).
      // High-impact jumps (vertical, approach, broad single-leg landings) return
      // once landings are solid and the knee is settled.
      exerciseIds: ['ath_marinovich_jump_squat', 'ath_box_jump'],
    },
    { id: 'cooldown', title: 'Cool-down', exerciseIds: ['cool_glute_stretch'] },
  ],

  // Wed — Rapid Response (Marinovich): reactive, fast-twitch conditioning.
  // [legacy key: wednesday_run]
  wednesday_run: [
    {
      id: 'warmup',
      title: 'Warm-up',
      exerciseIds: ['wu_jump_rope', 'wu_greatest_stretch', 'wu_a_skip', 'wu_b_skip'],
    },
    {
      id: 'reactive',
      title: 'Rapid response',
      exerciseIds: ['ath_ankle_hops', 'ath_pogos', 'ath_sl_pogos_low', 'ath_box_step_up_jump'],
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
    { id: 'warmup', title: 'Warm-up', exerciseIds: [...UPPER_WARMUP, 'wu_pogos_light'] },
    {
      id: 'priming',
      title: 'Loaded-iso priming',
      exerciseIds: ['ath_loaded_iso_overhead_press'],
    },
    {
      id: 'absorb',
      title: 'Absorb force',
      exerciseIds: ['ath_depth_drop_pushup'],
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

  // Fri — Strength, Lower. Pure max strength: two all-out sets each.
  // [legacy key: friday_lower_athletic]
  friday_lower_athletic: [
    { id: 'warmup', title: 'Warm-up', exerciseIds: LOWER_WARMUP },
    {
      id: 'main',
      title: 'Strength',
      exerciseIds: [
        'str_smith_squat',
        'str_db_rdl',
        'str_db_split_squat',
        'ath_nordic_hamstring',
        'ath_sl_calf_raise_iso',
      ],
    },
    { id: 'cooldown', title: 'Cool-down', exerciseIds: ['cool_glute_stretch'] },
  ],

  // Sat — Athletic Expression (Marinovich): full-body explosive output.
  // [legacy key: saturday_long_run]
  saturday_long_run: [
    { id: 'warmup', title: 'Warm-up', exerciseIds: LOWER_WARMUP },
    {
      id: 'expression',
      title: 'Athletic expression',
      // Bilateral jumps only for now — single-leg broad landings return once the
      // knee tolerates the Tuesday single-leg landing skill work.
      exerciseIds: [
        'ath_standing_vertical_jump',
        'ath_two_foot_approach_jump',
        'ath_box_jump',
      ],
    },
    {
      id: 'throws',
      title: 'Power throws',
      exerciseIds: [
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

/**
 * Dev-time check: every exercise id referenced by a plan exists in the database.
 * Returns the list of unknown ids (empty if all resolve).
 */
export function validateSessionPlans(): string[] {
  const missing: string[] = [];
  for (const blocks of Object.values(GYM_SESSION_PLANS)) {
    for (const block of blocks ?? []) {
      for (const id of block.exerciseIds) {
        if (!getExercise(id)) missing.push(id);
      }
    }
  }
  return missing;
}
