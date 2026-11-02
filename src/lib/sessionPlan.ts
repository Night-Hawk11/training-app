/**
 * Session templates (2026-11-01 "fresh-first + DUP" rebuild).
 *
 * ONE fixed daily template, run every day, with only two things undulating
 * across the week (reactive tier + the day's emphasis). This is textbook Daily
 * Undulating Periodization: train the same patterns at high frequency, vary the
 * stimulus so no quality is maxed two days running, and — the non-negotiable —
 * do the reactive/explosive work FRESH, because pre-fatigue measurably degrades
 * motor-skill learning (greasing-the-groove / neural-adaptation literature).
 *
 * The session reads top-to-bottom as five ordered phases:
 *   1. PRIME — lean switch-on: hips (rotation + glute switch) then feet
 *      (arch-lock + ankle range). Wake the system; do NOT fatigue it.
 *   2. REACTIVE & EXPLOSIVE — done on FRESH legs. Fast, quiet ground contact
 *      (pogos → hops → landing-sticks) + upper-body explosive on upper days.
 *      This moved to the FRONT: the old build buried it at the end of the
 *      circuit, which is exactly what produced the fatigue-dependent knee signal.
 *   3. STRENGTH & CONTROL — the generated "obscure setup of the day", the day's
 *      featured instability station, the rotating emphasis, and the posterior
 *      chain. A menu you flow through (~15 min; pick 2–3).
 *   4. LONG ISOMETRIC HOLDS — Schroeder/Archuleta-style positional holds, built
 *      by time. Low-skill and fatigue-tolerant, so they belong LAST.
 *   5. DOWN-REGULATE — close it out.
 *
 * Organizing principle: **prime → fire (fresh) → build → hold**. Two hard rules
 * are baked in (see memory: training-safety-rules):
 *   1. FEET & HIPS FIRST — the session opens with the prime before anything
 *      reactive. The knee is a victim joint; trained downstream, never early.
 *   2. CLOSED CHAIN ONLY at the knee — the library carries a `chain` tag and
 *      contains zero open-chain knee-extension movements. validateSessionPlans()
 *      fails if an open-chain exercise is ever scheduled OR generated.
 *
 * Impact is tiered (see ImpactTier). MINOR reactive work (ankle hops, pogos, low
 * drop-to-stick, low SL landings) is OPEN at any phase — low-force, the base
 * tolerates it — held only on a knee-flare day. HIGH-amplitude impact (depth
 * drops, box jumps, bounding, broad/distance jumps) stays phase-gated (P3,
 * earn-it) AND held on a flare day: impact is the one quality where subjective
 * feel outruns tissue tolerance, so it opens on landing quality, not calendar.
 * UPPER-body explosive (plyo push-up, push jerk, explosive pull-up) is OPEN now
 * — it carries no knee risk, so it is not gated.
 *
 * The weekly DUP wave (SessionType keys are LEGACY weekday identifiers kept
 * stable so old logged sessions still resolve — meaning lives in the title/blurb
 * in schedule.ts and the spec here, NOT the key name):
 *   Mon  HIGH reactive (vertical) + upper PUSH      Tue  microdose + single-leg & lateral
 *   Wed  microdose + core & rotary                  Thu  HIGH reactive (horizontal/land) + upper PULL
 *   Fri  microdose + single-leg & perturbation      Sat  HIGH reactive (multidirectional variety)
 *   Sun  Regeneration (no reactive)
 * HIGH lower-body reactive lands Mon/Thu/Sat — ~3×/week, every bout ≥48h apart,
 * inside plyometric-frequency guidelines; the other days microdose (low-force
 * grooving, recoverable daily).
 */

import type { ImpactTier, SessionType } from '../data/types';
import { getExercise, isKneeSafe } from '../data/exercises';
import { generateSetup, GENERATOR_BASE_IDS } from './instability';

export type BlockSection = 'prime' | 'reactive' | 'strength' | 'iso' | 'close';

export interface PlanBlock {
  id: string; // stored as CompletedBlock.blockId
  title: string;
  exerciseIds: string[];
  /** Which part of the session this block belongs to (drives grouping). */
  section?: BlockSection;
  /**
   * Earliest phase (1..4) this block becomes active. Defaults to 1 (always on).
   * Used to gate the HIGH-impact ramp; everything else leaves this at 1 so it is
   * never phase-locked.
   */
  minPhase?: number;
  /**
   * Impact tier for reactive/plyometric work. Absent = non-impact. 'minor' is
   * open at any phase (held only on a flare day); 'high' is phase-gated + flared.
   */
  impactTier?: ImpactTier;
  /**
   * Generator annotation (the dialed-up setup twists) shown under the base
   * movement for the "obscure setup of the day" station.
   */
  variationNote?: string;
}

// ── 1 · PRIME (lean switch-on, leads every day) ───────────────────────────────
// Hips first, then feet — a wake-up, not a loading session. One movement per
// limb of the safety-critical hip triad (glute/ER switch, rotation, positional
// reset) then the two foot keystones (arch-lock + ankle range). Kept lean so the
// reactive work that follows lands on fresh legs (see training-dose-model).
const PRIME_HIP: PlanBlock = {
  id: 'prime_hip',
  title: 'Prime — hip switch-on',
  section: 'prime',
  exerciseIds: ['hip_clamshell', 'mob_90_90', 'hip_flexor_active_hold'],
};
const PRIME_FEET: PlanBlock = {
  id: 'prime_feet',
  title: 'Prime — foot & ankle spring',
  section: 'prime',
  exerciseIds: ['fa_hyperarch_hold', 'mob_knee_to_wall'],
};

// ── 1 · Ball & core connection (early switch-on, with the hip/foot prime) ─────
// Dead bug + glute-bridge iso live here, up front with the day's other ball work
// (stir-the-pot on Wed, hamstring bridge on Thu) rather than buried late — they
// are low-fatigue connection/activation, so they belong with the switch-on and
// don't compromise the fresh reactive slot that follows.
const BALL_EXTRA: Partial<Record<SessionType, string[]>> = {
  wednesday_run: ['ball_stir_the_pot'],
  thursday_upper_athletic: ['ball_hamstring_curl_iso'],
};
function connectBlock(type: SessionType): PlanBlock {
  return {
    id: 'connect',
    title: 'Ball & core connection',
    section: 'prime',
    exerciseIds: ['ball_dead_bug', 'hip_glute_bridge_iso', ...(BALL_EXTRA[type] ?? [])],
  };
}

// ── 3 · STRENGTH anchors (shared across working days) ─────────────────────────
// Posterior chain (foot→glute long line) rides every working day — the fascial
// connection the whole program hangs off.
const CHAIN_ANCHOR: PlanBlock = {
  id: 'chain',
  title: 'Posterior chain (foot→glute)',
  section: 'strength',
  exerciseIds: ['pc_long_line_hinge'],
};

// ── 4 · LONG ISOMETRIC HOLDS (last — fatigue-tolerant, built by time) ─────────
// Positional menus (pick 2–3), progressing hold time toward the long-duration
// method. Durations/overrides live on the exercises themselves.
const ISO_STANDARD = ['iso_spanish_squat', 'iso_wall_sit', 'iso_squat_hold', 'iso_split_squat_hold'];
const ISO_SINGLE_LEG = ['iso_sl_squat_hold', 'iso_wall_sl_squat_hold', 'iso_split_squat_hold'];
const ISO_POSTERIOR = ['iso_sl_rdl_hold', 'iso_squat_hold', 'iso_split_squat_hold'];
function isoBlock(ids: string[]): PlanBlock {
  return { id: 'iso', title: 'Long isometric holds — build the time', section: 'iso', exerciseIds: ids };
}

// ── 5 · DOWN-REGULATE ─────────────────────────────────────────────────────────
const DOWN: PlanBlock = { id: 'down', title: 'Down-regulate', section: 'close', exerciseIds: ['regen_crocodile_breathing'] };

// ── Per-day spec: the two things that undulate (reactive + emphasis) ──────────
interface DaySpec {
  /** Reactive/explosive blocks, section 'reactive' — done fresh. */
  reactive: PlanBlock[];
  /** Featured instability station id (also excluded from the generator). */
  instabilityId: string;
  instabilityTitle: string;
  /** The day's rotating emphasis blocks, section 'strength'. */
  emphasis: PlanBlock[];
  /** The long-iso hold menu for the day. */
  iso: string[];
}

// Minor-reactive helper (open at any phase, held only on a flare day).
function reactive(id: string, title: string, ids: string[]): PlanBlock {
  return { id, title, section: 'reactive', impactTier: 'minor', exerciseIds: ids };
}

const DAY: Record<Exclude<SessionType, 'sunday_rest_walk'>, DaySpec> = {
  // Mon — HIGH reactive (vertical stiffness) + upper PUSH. Bodyweight logged.
  monday_upper: {
    reactive: [
      reactive('reactive', 'Reactive — vertical stiffness (fresh)', ['ply_pogo_double', 'ply_pogo_single', 'ply_sl_landing_stick']),
      // Upper explosive — OPEN now (no knee risk, not gated). Done fresh. Includes
      // the upper-body depth drop (depth-drop push-up) alongside the plyo push-up
      // and push jerk.
      { id: 'upper_explosive', title: 'Upper — push explosive (fresh)', section: 'reactive', exerciseIds: ['ub_plyo_pushup', 'ub_depth_pushup', 'ub_push_jerk'] },
    ],
    instabilityId: 'inst_bosu_inv_sl_balance',
    instabilityTitle: 'Instability — balance base',
    emphasis: [
      { id: 'upper_push', title: 'Upper — push iso & speed', section: 'strength', exerciseIds: ['ub_iso_pushup_hold', 'ub_iso_overhead_hold', 'ub_speed_bench'] },
      // Swapped the slow isolation delt raises (not explosive/athletic) for an
      // athletic posterior-chain + perturbation station under load.
      { id: 'emphasis_bosu', title: 'Emphasis — SL-RDL on bosu (KB)', section: 'strength', exerciseIds: ['inst_bosu_sl_rdl_kb'] },
      { id: 'emphasis', title: 'Emphasis — adductor', section: 'strength', exerciseIds: ['hip_copenhagen', 'hip_adductor_ball_squeeze'] },
    ],
    iso: ISO_STANDARD,
  },
  // Tue — microdose reactive + loaded single-leg & lateral.
  tuesday_lower_athletic: {
    reactive: [reactive('reactive', 'Reactive — groove (microdose)', ['ply_ankle_hops', 'ply_pogo_double'])],
    instabilityId: 'inst_foam_tandem_reach',
    instabilityTitle: 'Instability — narrow base',
    emphasis: [
      { id: 'emphasis', title: 'Emphasis — loaded single-leg & lateral', section: 'strength', exerciseIds: ['sl_step_down', 'sl_mirror_squat', 'inst_kb_offset_carry_turf'] },
    ],
    iso: ISO_STANDARD,
  },
  // Wed — microdose reactive + core & rotary deep-dive. (Legacy "run" day — pair
  // with easy cardio after.)
  wednesday_run: {
    reactive: [reactive('reactive', 'Reactive — groove (microdose)', ['ply_ankle_hops', 'ply_pogo_double'])],
    instabilityId: 'inst_ball_rotational_trunk',
    instabilityTitle: 'Instability — rotary trunk',
    emphasis: [
      { id: 'emphasis', title: 'Emphasis — anti-rotation core', section: 'strength', exerciseIds: ['core_pallof_press', 'core_side_plank'] },
    ],
    iso: ['iso_wall_sit', 'iso_squat_hold', 'iso_split_squat_hold'],
  },
  // Thu — HIGH reactive (horizontal & landing) + upper PULL.
  thursday_upper_athletic: {
    reactive: [
      reactive('reactive', 'Reactive — horizontal & landing (fresh)', ['ply_pogo_directional', 'ply_drop_stick', 'ply_sl_landing_stick']),
      { id: 'upper_explosive', title: 'Upper — pull explosive (fresh)', section: 'reactive', exerciseIds: ['ub_explosive_pullup'] },
    ],
    instabilityId: 'pc_sl_rdl',
    instabilityTitle: 'Instability — single-leg hinge',
    emphasis: [
      { id: 'upper_pull', title: 'Upper — pull iso & speed', section: 'strength', exerciseIds: ['ub_iso_chin_hold', 'ub_explosive_band_row', 'ub_biceps_curl'] },
      { id: 'emphasis', title: 'Emphasis — posterior chain', section: 'strength', exerciseIds: ['core_bird_dog'] },
    ],
    iso: ISO_POSTERIOR,
  },
  // Fri — microdose reactive + single-leg & max perturbation. Bodyweight logged.
  friday_lower_athletic: {
    reactive: [reactive('reactive', 'Reactive — groove (microdose)', ['ply_ankle_hops', 'ply_pogo_single'])],
    instabilityId: 'inst_oscillating_kb_antisway',
    instabilityTitle: 'Instability — max perturbation',
    emphasis: [
      { id: 'emphasis', title: 'Emphasis — hip rotary control', section: 'strength', exerciseIds: ['hip_airplane', 'inst_bosu_hip_airplane'] },
      { id: 'emphasis2', title: 'Emphasis — loaded single-leg', section: 'strength', exerciseIds: ['sl_step_down', 'sl_ecc_sit_to_stand'] },
      { id: 'emphasis3', title: 'Emphasis — kneeling-ball rotary', section: 'strength', exerciseIds: ['inst_ball_kneeling_hold', 'inst_ball_kneeling_hip_wiper'] },
    ],
    iso: ISO_SINGLE_LEG,
  },
  // Sat — HIGH reactive, multidirectional variety. The high-impact ramp earns in
  // at P3 on top of it. (Legacy "long run" day — pair with longer easy cardio.)
  saturday_long_run: {
    reactive: [
      // Achilles spring prep (non-impact, so it stays available on a flare day).
      { id: 'spring_prep', title: 'Achilles spring prep', section: 'reactive', exerciseIds: ['fa_calf_iso'] },
      reactive('reactive', 'Reactive — multidirectional variety (fresh)', ['ply_pogo_directional', 'ply_pogo_sl_directional', 'ply_sl_landing_stick', 'ply_drop_stick']),
      { id: 'reactive_high', title: 'Reactive — high-impact ramp (earn-it)', section: 'reactive', minPhase: 3, impactTier: 'high', exerciseIds: ['ply_lateral_bound', 'ply_bound', 'ply_box_jump', 'ply_depth_drop', 'ply_broad_jump'] },
    ],
    instabilityId: 'inst_bottoms_up_kb_hold',
    instabilityTitle: 'Instability — reflexive core',
    emphasis: [],
    iso: ['iso_spanish_squat', 'iso_squat_hold', 'iso_split_squat_hold'],
  },
};

// A stable seed for callers that don't supply a date (e.g. validation).
const DEFAULT_SEED = '0000-00-00';

/** Build the generated "obscure setup of the day" as a strength-section block. */
function generatedBlock(phase: number, seedISO: string, kneeScore?: number, excludeBaseId?: string): PlanBlock {
  const g = generateSetup(phase, seedISO, kneeScore, excludeBaseId);
  return {
    id: 'generated',
    title: `Obscure setup of the day — ${g.title}`,
    section: 'strength',
    exerciseIds: [g.baseExerciseId],
    variationNote: g.variationNote,
  };
}

/**
 * Sun — Regeneration: lean prime + easy instability + restorative mobility. No
 * reactive, no impact. [legacy key: sunday_rest_walk]
 */
function sundayPlan(phase: number, seedISO: string, kneeScore?: number): PlanBlock[] {
  const instabilityId = 'inst_bosu_inv_sl_balance';
  return [
    PRIME_HIP,
    { id: 'prime_feet', title: 'Prime — foot & ankle (light)', section: 'prime', exerciseIds: ['fa_short_foot', 'fa_sl_balance'] },
    generatedBlock(phase, seedISO, kneeScore, instabilityId),
    { id: 'instability', title: 'Instability — single-leg balance', section: 'strength', exerciseIds: [instabilityId] },
    { id: 'restore', title: 'Restore — active mobility', section: 'strength', exerciseIds: ['mob_hip_cars', 'mob_deep_squat_sit', 'mob_worlds_greatest', 'mob_90_90'] },
    { id: 'down', title: 'Down-regulate', section: 'close', exerciseIds: ['regen_crocodile_breathing', 'regen_glute_figure4'] },
  ];
}

/**
 * The session plan for a session type in a given phase. `seedISO` seeds the
 * generated setup (pass today's / the previewed date); `kneeScore` lets the
 * generator pull instability back on a tender-knee day.
 */
export function getSessionPlan(
  type: SessionType,
  phase = 1,
  seedISO: string = DEFAULT_SEED,
  kneeScore?: number
): PlanBlock[] | null {
  if (type === 'sunday_rest_walk') return sundayPlan(phase, seedISO, kneeScore);
  const spec = DAY[type];
  if (!spec) return null;
  return [
    // 1 · Prime (hips → feet, lean) + ball/core connection
    PRIME_HIP,
    PRIME_FEET,
    connectBlock(type),
    // 2 · Reactive & explosive — FRESH
    ...spec.reactive,
    // 3 · Strength & control — generated setup → featured instability → emphasis
    //     → posterior chain anchor. A menu; pick 2–3.
    generatedBlock(phase, seedISO, kneeScore, spec.instabilityId),
    { id: 'instability', title: spec.instabilityTitle, section: 'strength', exerciseIds: [spec.instabilityId] },
    ...spec.emphasis,
    CHAIN_ANCHOR,
    // 4 · Long isometric holds — last
    isoBlock(spec.iso),
    // 5 · Down-regulate
    DOWN,
  ];
}

/** Whether a session type has a plan. */
export function isGymSession(type: SessionType): boolean {
  return getSessionPlan(type) !== null;
}

// ── Block gating ─────────────────────────────────────────────────────────────
// A block is held for two reasons:
//   1. Phase lock — the current phase hasn't reached the block's minPhase yet.
//      Only the HIGH-impact ramp sets minPhase > 1.
//   2. Knee flare — it's impact work (minor OR high) and today's readiness knee
//      score is low, so impact is held for the day to protect the joint.

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
 * Decide whether a block is available right now. Phase locks apply to whatever
 * sets `minPhase` (only the high-impact ramp does). The knee-flare gate applies
 * to any impact block (minor or high) when a knee score is supplied — pass
 * `kneeScore` undefined to skip it (e.g. previewing a future day).
 */
export function blockGate(block: PlanBlock, phase: number, kneeScore?: number): BlockGate {
  const minPhase = block.minPhase ?? 1;
  if (phase < minPhase) {
    return { gated: true, label: `Phase ${minPhase}`, reason: `Unlocks in Phase ${minPhase} — earn it first` };
  }
  if (block.impactTier && kneeScore != null && kneeScore <= KNEE_FLARE_THRESHOLD) {
    return {
      gated: true,
      label: 'Knee flare',
      reason: `Held today — knees flagged ${kneeScore}/10. Keep it non-impact: mobility, iso, balance, perturbation and control work.`,
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
 * Dev-time check: every referenced exercise id (scheduled OR generatable) exists
 * AND is knee-safe (no open-chain knee work ever reaches a session plan). Returns
 * the list of problems.
 */
export function validateSessionPlans(): string[] {
  const problems: string[] = [];
  const allTypes: SessionType[] = [
    'monday_upper',
    'tuesday_lower_athletic',
    'wednesday_run',
    'thursday_upper_athletic',
    'friday_lower_athletic',
    'saturday_long_run',
    'sunday_rest_walk',
  ];
  // Build every day's plan across phases 1–4 and a couple of seeds so the
  // generated block's possible base movements are covered too.
  const seeds = [DEFAULT_SEED, '2026-11-01', '2026-11-02'];
  const allBlocks: (PlanBlock[] | null)[] = [];
  for (const t of allTypes)
    for (let phase = 1; phase <= 4; phase++) for (const s of seeds) allBlocks.push(getSessionPlan(t, phase, s));
  allBlocks.push(...Object.values(HOME_WORK));

  const check = (id: string) => {
    const ex = getExercise(id);
    if (!ex) problems.push(`unknown exercise: ${id}`);
    else if (!isKneeSafe(ex)) problems.push(`OPEN-CHAIN KNEE exercise scheduled: ${id}`);
  };

  for (const blocks of allBlocks)
    for (const block of blocks ?? []) for (const id of block.exerciseIds) check(id);

  // Belt-and-braces: every id the generator could ever emit must also be safe,
  // even if a seed above didn't surface it.
  for (const id of GENERATOR_BASE_IDS) check(id);

  return problems;
}
