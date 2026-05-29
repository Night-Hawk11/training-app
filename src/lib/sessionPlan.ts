/**
 * Gym session templates (KICKOFF_BRIEF.md Section 5 / Step 7).
 *
 * Each gym SessionType is a set of ordered blocks, each block an ordered list of
 * exercise ids. The full per-day exercise lists from the brief aren't in the
 * repo, so these are INFERRED from the session-type names, exercise categories,
 * and the explicit hints embedded in exercises.json:
 *   - depth-drop curl is Monday; the weighted dip "mirrors Monday" → Thursday
 *   - nordic hamstring is a Friday accessory
 *   - pec stretch is the upper-day cooldown; glute stretch the lower-day one
 *   - dead hang is the upper-day finisher
 * Adjust the lists here when the brief is available — this is the single source
 * the gym screen renders from. Run/rest days have no gym plan (null).
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
  // Monday — pure upper-body strength.
  monday_upper: [
    { id: 'warmup', title: 'Warm-up', exerciseIds: [...UPPER_WARMUP, 'wu_inchworm'] },
    {
      id: 'main',
      title: 'Strength',
      exerciseIds: ['str_db_incline', 'str_barbell_row', 'str_hammer_pulldown', 'str_depth_drop_curl'],
    },
    { id: 'finisher', title: 'Finisher', exerciseIds: ['str_dead_hang'] },
    { id: 'cooldown', title: 'Cool-down', exerciseIds: ['cool_pec_stretch'] },
  ],

  // Tuesday — lower body + primary (bilateral) athletic power.
  tuesday_lower_athletic: [
    { id: 'warmup', title: 'Warm-up', exerciseIds: LOWER_WARMUP },
    {
      id: 'athletic',
      title: 'Athletic / Power',
      exerciseIds: [
        'ath_ankle_hops',
        'ath_pogos',
        'ath_standing_vertical_jump',
        'ath_two_foot_approach_jump',
        'ath_box_jump',
        'ath_bilateral_broad_single_landing_left',
        'ath_bilateral_broad_single_landing_right',
      ],
    },
    { id: 'accessory', title: 'Accessory', exerciseIds: ['ath_sl_calf_raise_iso'] },
    { id: 'cooldown', title: 'Cool-down', exerciseIds: ['cool_glute_stretch'] },
  ],

  // Thursday — upper body + upper-driven athletic power.
  thursday_upper_athletic: [
    { id: 'warmup', title: 'Warm-up', exerciseIds: UPPER_WARMUP },
    {
      id: 'athletic',
      title: 'Athletic / Power',
      exerciseIds: [
        'ath_med_ball_chest_pass',
        'ath_med_ball_overhead_throw',
        'ath_plyo_pushup',
        'ath_smith_ballistic_bench',
        'ath_loaded_iso_overhead_press',
      ],
    },
    {
      id: 'main',
      title: 'Strength',
      exerciseIds: ['str_db_incline', 'str_barbell_row', 'str_hammer_pulldown', 'str_weighted_dip'],
    },
    { id: 'finisher', title: 'Finisher', exerciseIds: ['str_dead_hang'] },
    { id: 'cooldown', title: 'Cool-down', exerciseIds: ['cool_pec_stretch'] },
  ],

  // Friday — lower body: loaded-iso priming + single-leg / approach athletic work.
  friday_lower_athletic: [
    { id: 'warmup', title: 'Warm-up', exerciseIds: LOWER_WARMUP },
    {
      id: 'priming',
      title: 'Loaded-iso priming',
      exerciseIds: ['ath_loaded_iso_split_squat', 'ath_loaded_iso_parallel_squat'],
    },
    {
      id: 'athletic',
      title: 'Athletic / Power',
      exerciseIds: [
        'ath_box_step_up_jump',
        'ath_sl_pogos_low',
        'ath_step_down_landing',
        'ath_sl_broad_jump_left',
        'ath_one_step_approach_left',
        'ath_one_step_approach_right',
      ],
    },
    { id: 'accessory', title: 'Accessory', exerciseIds: ['ath_nordic_hamstring', 'ath_sl_calf_raise_iso'] },
    { id: 'cooldown', title: 'Cool-down', exerciseIds: ['cool_glute_stretch'] },
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
