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
// KNEE DELOAD: warm-ups are in a no-impact form — jump rope, A/B-skips, and light
// pogos are removed (repeated foot-strikes load the knee). To restore the impact
// versions when the knees are healthy:
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

const GYM_SESSION_PLANS: Partial<Record<SessionType, PlanBlock[]>> = {
  // Mon — Strength, Upper. Pure max strength: 6 lifts, two all-out sets each.
  monday_upper: [
    { id: 'warmup', title: 'Warm-up', exerciseIds: [...UPPER_WARMUP, 'wu_inchworm'] },
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

  // Tue — Lower DELOAD (knees have reactive effusion): impact is held. This is an
  // isometric + controlled-tempo day that builds connective-tissue tolerance
  // WITHOUT impact. The absorb/generate (impact) blocks are kept but GATED until
  // the knees recover — reintroduce gradually, absorb block first.
  tuesday_lower_athletic: [
    { id: 'warmup', title: 'Warm-up', exerciseIds: LOWER_WARMUP },
    {
      id: 'priming',
      title: 'Quad isometrics (priority)',
      exerciseIds: ['ath_loaded_iso_split_squat', 'ath_loaded_iso_parallel_squat'],
    },
    {
      id: 'tempo',
      title: 'Controlled tempo squat (capped depth)',
      // Slow eccentric + dead-stop pause + smooth drive — trains owning the
      // eccentric→concentric reversal so load stays on the muscle, not the knee.
      exerciseIds: ['str_smith_squat'],
    },
    { id: 'accessory', title: 'Accessory (iso)', exerciseIds: ['ath_sl_calf_raise_iso'] },
    {
      id: 'upper_power',
      title: 'Upper — explosive & tendon',
      // Home: bodyweight + 1 band. Supplements Monday's hypertrophy day —
      // explosive intent + tendon (eccentric) work, low reps, full recovery.
      exerciseIds: [
        'ath_plyo_pushup',
        'ath_band_explosive_pushup',
        'ath_explosive_band_row',
        'str_slow_eccentric_pushup',
      ],
    },
    {
      id: 'core',
      title: 'Core & shoulder health',
      exerciseIds: ['str_face_pull', 'core_stir_the_pot', 'core_ball_rollout', 'core_ball_pike'],
    },
    {
      id: 'absorb',
      title: 'Absorb force (landings) — HOLD until knees recover',
      exerciseIds: [
        'ath_marinovich_squat_catch',
        'ath_depth_drop_stick',
        'ath_step_down_landing',
        'ath_sl_landing_stick',
      ],
    },
    {
      id: 'generate',
      title: 'Generate force (jumps) — HOLD until knees recover',
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
      exerciseIds: ['wu_greatest_stretch', 'wu_scap_pushup', 'wu_pushup_downdog'],
    },
    {
      id: 'quickness',
      title: 'Reaction / quickness',
      // Low/zero-impact reactive CNS work — safe to do while the knee settles.
      // (Explosive reaction-starts + hill sprints get added once it's healthy.)
      exerciseIds: ['ath_reaction_catch', 'ath_fast_feet'],
    },
    {
      id: 'reactive',
      title: 'Rapid response — HOLD until knees recover',
      exerciseIds: ['ath_ankle_hops', 'ath_pogos', 'ath_sl_pogos_low', 'ath_box_step_up_jump'],
    },
    {
      id: 'starts',
      title: 'Explosive starts — HOLD until knee is healthy',
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
    {
      id: 'core',
      title: 'Core & shoulder health',
      exerciseIds: ['str_face_pull', 'core_stir_the_pot', 'core_ball_rollout', 'core_ball_pike'],
    },
    { id: 'cooldown', title: 'Cool-down', exerciseIds: ['cool_glute_stretch'] },
  ],

  // Thu — Power, Upper. Iso prime → ballistic pressing and throws.
  thursday_upper_athletic: [
    { id: 'warmup', title: 'Warm-up', exerciseIds: UPPER_WARMUP },
    {
      id: 'priming',
      title: 'Loaded-iso priming',
      exerciseIds: ['ath_loaded_iso_overhead_press'],
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
      title: 'Quad isometrics (priority)',
      // Lead the day. The split squat iso is per-side — give the inhibited side
      // extra focus to wake the quad back up.
      exerciseIds: ['ath_loaded_iso_split_squat', 'ath_loaded_iso_parallel_squat'],
    },
    {
      id: 'strength',
      title: 'Controlled strength (capped depth)',
      // Paused tempo, no bounce, submaximal (2–3 reps in reserve), only to a depth
      // where the knee stays stable.
      exerciseIds: ['str_smith_squat', 'str_db_rdl'],
    },
    {
      id: 'accessory',
      title: 'Posterior / accessory',
      exerciseIds: ['ath_nordic_hamstring', 'ath_sl_calf_raise_iso'],
    },
    {
      id: 'upper_power',
      title: 'Upper — explosive & tendon',
      exerciseIds: [
        'ath_plyo_pushup',
        'ath_band_explosive_pushup',
        'ath_explosive_band_row',
        'str_slow_eccentric_pushup',
      ],
    },
    {
      id: 'core',
      title: 'Core & shoulder health',
      exerciseIds: ['str_face_pull', 'core_stir_the_pot', 'core_ball_rollout', 'core_ball_pike'],
    },
    { id: 'cooldown', title: 'Cool-down', exerciseIds: ['cool_glute_stretch'] },
  ],

  // Sat — Athletic Expression (Marinovich): full-body explosive output.
  // [legacy key: saturday_long_run]
  saturday_long_run: [
    { id: 'warmup', title: 'Warm-up', exerciseIds: LOWER_WARMUP },
    {
      id: 'sprints',
      title: 'Hill sprints (garage) — HOLD until knee is healthy',
      exerciseIds: ['ath_hill_sprint'],
    },
    {
      id: 'expression',
      title: 'Athletic expression — HOLD until knees recover',
      // Lower-body jumps held during the knee deload; upper-body throws below stay
      // active. These return once the knees are calm and impact is rebuilt.
      exerciseIds: [
        'ath_marinovich_jump_squat',
        'ath_standing_vertical_jump',
        'ath_two_foot_approach_jump',
        'ath_box_jump',
      ],
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
    {
      id: 'core',
      title: 'Core & shoulder health',
      exerciseIds: ['str_face_pull', 'core_stir_the_pot', 'core_ball_rollout', 'core_ball_pike'],
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
