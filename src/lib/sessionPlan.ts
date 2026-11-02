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

// ── Shared blocks ─────────────────────────────────────────────────────────────
// PRIME (lean switch-on, every day): hips then feet — glute/ER switch + rotation,
// then the foot arch-lock + ankle range. Deliberately lean (not the time sink) so
// the fixed list that follows still finishes inside the ~45–60 min cap and the
// reactive work lands on fresh legs.
const PRIME: PlanBlock[] = [
  { id: 'prime_hip', title: 'Prime — hip switch-on', section: 'prime', exerciseIds: ['hip_clamshell', 'mob_90_90'] },
  { id: 'prime_feet', title: 'Prime — foot & ankle spring', section: 'prime', exerciseIds: ['fa_hyperarch_hold', 'mob_knee_to_wall'] },
];

// Posterior chain + glute connection (lower days) — the foot→glute line, with the
// glute-bridge iso riding along as the daily glute connection.
const CHAIN_ANCHOR: PlanBlock = {
  id: 'chain',
  title: 'Posterior chain & glute',
  section: 'strength',
  exerciseIds: ['pc_long_line_hinge', 'hip_glute_bridge_iso'],
};

// Long isometric hold (last — fatigue-tolerant, built by time). Shortened to 1–2
// positions per day, not a four-deep menu.
function isoBlock(ids: string[]): PlanBlock {
  return { id: 'iso', title: 'Long isometric hold', section: 'iso', exerciseIds: ids };
}

const DOWN: PlanBlock = { id: 'down', title: 'Down-regulate', section: 'close', exerciseIds: ['regen_crocodile_breathing'] };

// Minor-reactive helper (open at any phase, held only on a flare day).
function reactive(id: string, title: string, ids: string[]): PlanBlock {
  return { id, title, section: 'reactive', impactTier: 'minor', exerciseIds: ids };
}

// ── Per-day FIXED lists (do-it-all, ~45–60 min — NOT a pick-N menu) ───────────
// The week is split into dedicated UPPER days (Mon push / Thu pull, with the
// essential lower work folded in) and LOWER/athletic days (Tue/Wed/Fri/Sat).
// Every day keeps the mandatory core: prime (added in getSessionPlan), one fresh
// reactive piece, and a shortened iso hold. Each list is meant to be completed in
// full — kept tight so it actually ends inside the time cap.
function workingDayBlocks(
  type: SessionType,
  phase: number,
  seedISO: string,
  kneeScore?: number
): PlanBlock[] {
  switch (type) {
    // Mon — UPPER PUSH day (+ essential lower). Bodyweight logged.
    case 'monday_upper':
      return [
        reactive('reactive', 'Reactive — lower (fresh)', ['ply_pogo_double']),
        // Upper explosive, OPEN (no knee risk) — depth drop, push jerk, and the
        // reactive catch-and-stabilize (pop a plate/DB, catch it, freeze it solid).
        { id: 'upper_explosive', title: 'Upper — push explosive (fresh)', section: 'reactive', exerciseIds: ['ub_depth_pushup', 'ub_push_jerk', 'ub_db_catch_stabilize'] },
        { id: 'upper_push', title: 'Upper — push (EDI) & speed', section: 'strength', exerciseIds: ['ub_shoulder_press_edi', 'ub_speed_bench'] },
        { id: 'upper_shoulders', title: 'Upper — shoulders (Schroeder)', section: 'strength', exerciseIds: ['ub_rear_delt_iso'] },
        { id: 'lower', title: 'Lower — SL-RDL on bosu (KB)', section: 'strength', exerciseIds: ['inst_bosu_sl_rdl_kb'] },
        isoBlock(['iso_split_squat_hold']),
      ];
    // Thu — UPPER PULL day (+ essential lower).
    case 'thursday_upper_athletic':
      return [
        reactive('reactive', 'Reactive — lower (fresh)', ['ply_pogo_directional']),
        // Explosive pull + the reactive catch-and-redirect (catch a plate/DB out
        // of the air and drive it to a new position in one motion).
        { id: 'upper_explosive', title: 'Upper — pull explosive (fresh)', section: 'reactive', exerciseIds: ['ub_explosive_pullup', 'ub_db_catch_reposition'] },
        { id: 'upper_pull', title: 'Upper — pull iso & speed', section: 'strength', exerciseIds: ['ub_iso_chin_hold', 'ub_explosive_band_row', 'ub_biceps_curl'] },
        { id: 'lower', title: 'Lower — single-leg step-down', section: 'strength', exerciseIds: ['sl_step_down'] },
        isoBlock(['iso_sl_rdl_hold']),
      ];
    // Tue — LOWER: single-leg & lateral.
    case 'tuesday_lower_athletic':
      return [
        reactive('reactive', 'Reactive — fresh', ['ply_pogo_double']),
        generatedBlock(phase, seedISO, kneeScore),
        { id: 'emphasis', title: 'Lower — single-leg & lateral', section: 'strength', exerciseIds: ['sl_step_down', 'inst_kb_offset_carry_turf'] },
        CHAIN_ANCHOR,
        isoBlock(['iso_spanish_squat', 'iso_split_squat_hold']),
      ];
    // Wed — LOWER: core & rotary. (Legacy "run" day — pair with easy cardio.)
    case 'wednesday_run':
      return [
        reactive('reactive', 'Reactive — fresh', ['ply_pogo_double']),
        { id: 'instability', title: 'Perturbation — rotary trunk', section: 'strength', exerciseIds: ['inst_ball_rotational_trunk'] },
        { id: 'emphasis', title: 'Core & rotary', section: 'strength', exerciseIds: ['ball_dead_bug', 'ball_stir_the_pot', 'core_pallof_press'] },
        CHAIN_ANCHOR,
        isoBlock(['iso_wall_sit', 'iso_split_squat_hold']),
      ];
    // Fri — LOWER: single-leg & max perturbation. Bodyweight logged.
    case 'friday_lower_athletic':
      return [
        reactive('reactive', 'Reactive — fresh', ['ply_pogo_single']),
        { id: 'instability', title: 'Perturbation — max (oscillating KB)', section: 'strength', exerciseIds: ['inst_oscillating_kb_antisway'] },
        generatedBlock(phase, seedISO, kneeScore, 'inst_oscillating_kb_antisway'),
        { id: 'emphasis', title: 'Single-leg & hip control', section: 'strength', exerciseIds: ['sl_step_down', 'sl_ecc_sit_to_stand', 'hip_airplane'] },
        isoBlock(['iso_sl_squat_hold', 'iso_wall_sl_squat_hold']),
      ];
    // Sat — LOWER: reactive, multidirectional variety. High-impact ramp earns in
    // at P3. (Legacy "long run" day — pair with longer easy cardio.)
    case 'saturday_long_run':
      return [
        { id: 'spring_prep', title: 'Achilles spring prep', section: 'reactive', exerciseIds: ['fa_calf_iso'] },
        reactive('reactive', 'Reactive — multidirectional variety (fresh)', ['ply_pogo_directional', 'ply_pogo_sl_directional', 'ply_sl_landing_stick']),
        { id: 'reactive_high', title: 'Reactive — high-impact ramp (earn-it)', section: 'reactive', minPhase: 3, impactTier: 'high', exerciseIds: ['ply_lateral_bound', 'ply_bound', 'ply_box_jump', 'ply_depth_drop', 'ply_broad_jump'] },
        generatedBlock(phase, seedISO, kneeScore),
        CHAIN_ANCHOR,
        isoBlock(['iso_spanish_squat']),
      ];
    default:
      return [];
  }
}

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
    { id: 'prime_hip', title: 'Prime — hip switch-on', section: 'prime', exerciseIds: ['hip_clamshell', 'mob_90_90', 'hip_flexor_active_hold'] },
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
  const mid = workingDayBlocks(type, phase, seedISO, kneeScore);
  if (!mid.length) return null;
  // Prime (lean) → the day's fixed list (reactive fresh → strength → iso) → close.
  return [...PRIME, ...mid, DOWN];
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
