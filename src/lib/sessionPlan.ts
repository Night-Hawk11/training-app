/**
 * Session templates (2026-10-11 instability / perturbation pivot;
 * 2026-10-12 re-sequenced into explicit priming phases).
 *
 * The session reads top-to-bottom as four ordered phases, so it never feels
 * "all over the place":
 *   1. HIP PRIME & ROTATION — mobility + end-range rotation, then rotary control
 *      / position, then glute & abductor activation. Hips lead, every day.
 *   2. FOOT & ANKLE PRIME — dorsiflexion range → foot-spring (HFT) stiffness.
 *      The base that the hips and everything reactive ride on.
 *   3. STABILITY & MOVEMENT — a FREE CIRCUIT you flow through for the bulk of the
 *      session (~20–30 min): the generated "obscure setup of the day" (see
 *      src/lib/instability.ts), the day's featured instability station + its new
 *      perturbation cues, the rotating emphasis, the connection anchors, and
 *      minor-impact reactive stiffness. A menu, not a lockstep list — log what
 *      you get to; finishing is never gated on completing every set.
 *   4. DOWN-REGULATE — close it out.
 *
 * Organizing principle: **prime → destabilize → fire**. Open and switch on the
 * hips and feet first, then wreck the base (unstable surface + offset/oscillating
 * load) and demand stability and reactive output on top of it.
 *
 * Two hard rules are baked in (see memory: training-safety-rules):
 *   1. FEET & HIPS FIRST — the session opens with the hip prime then the foot/
 *      ankle prime, before any movement or reactive work. The knee is a victim
 *      joint; trained downstream, never the early target.
 *   2. CLOSED CHAIN ONLY at the knee — the library carries a `chain` tag and
 *      contains zero open-chain knee-extension movements. validateSessionPlans()
 *      fails if an open-chain exercise is ever scheduled OR generated.
 *
 * Impact is tiered (see ImpactTier). MINOR reactive work (ankle hops, pogos, low
 * curb drop-to-stick, low SL landings) is OPEN now regardless of phase — today's
 * discovery was that it's low-force and the base tolerates it — held only on a
 * knee-flare day. HIGH-amplitude impact (depth drops, box jumps, bounding,
 * broad/distance jumps) stays phase-gated (earn-it) AND held on a flare day.
 *
 * Rotating featured emphasis (SessionType keys are LEGACY weekday identifiers
 * kept stable so old logged sessions still resolve — the meaning is the
 * title/blurb in schedule.ts and the plan here, NOT the key name):
 *   Mon  Adductor (Copenhagen)        Tue  Abductor & lateral hip
 *   Wed  Ball & core                  Thu  Posterior chain
 *   Fri  Single-leg & perturbation    Sat  Reactive & plyo (earn-it)
 *   Sun  Regeneration (no impact)
 */

import type { ImpactTier, SessionType } from '../data/types';
import { getExercise, isKneeSafe } from '../data/exercises';
import { generateSetup, GENERATOR_BASE_IDS } from './instability';

export type BlockSection = 'hips' | 'feet' | 'circuit' | 'close';

export interface PlanBlock {
  id: string; // stored as CompletedBlock.blockId
  title: string;
  exerciseIds: string[];
  /** Which part of the hybrid session this block belongs to (drives grouping). */
  section?: BlockSection;
  /**
   * Earliest phase (1..4) this block becomes active. Defaults to 1 (always on).
   * Used to gate the HIGH-impact ramp; minor-impact and non-impact blocks leave
   * this at 1 so they are never phase-locked.
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

// ── Phase 1 — Hip prime & rotation (fixed, leads every day) ───────────────────
// Hips first. Mobility + end-range rotation (CARs, the 90/90 switch, and
// end-range rotational lift-off holds so the internal/external rotation you leak
// on every cut is trained daily), then rotary control + position, then glute &
// abductor activation — the full hip prime, consolidated up front instead of
// scattered through the circuit.
const A_HIP_MOBILITY: PlanBlock = {
  id: 'prime',
  title: 'Hip prime — mobility & rotation',
  section: 'hips',
  exerciseIds: ['mob_hip_cars', 'mob_90_90', 'hip_90_90_liftoff'],
};
// Rotary control (airplane) + an active positional hold (half-kneeling extension)
// to walk the pelvis out of anterior tilt toward a better-functioning neutral.
const A_HIP_ROTATION: PlanBlock = { id: 'hip_rotation', title: 'Hip prime — rotation & position', section: 'hips', exerciseIds: ['hip_airplane', 'hip_flexor_active_hold'] };
const A_HIP: PlanBlock = { id: 'hip', title: 'Hip prime — glute & abductor', section: 'hips', exerciseIds: ['hip_glute_bridge_iso', 'hip_clamshell'] };

// ── Phase 2 — Foot & ankle prime (fixed, after the hips) ──────────────────────
// Dorsiflexion range → foot-spring (HFT) stiffness. The base everything reactive
// rides on. Short and non-negotiable.
const A_ANKLE_HFT: PlanBlock = {
  id: 'foot_ankle',
  title: 'Foot & ankle prime — stiffness & HFT',
  section: 'feet',
  exerciseIds: ['mob_knee_to_wall', 'fa_windlass', 'fa_hyperarch_hold', 'fa_calf_iso'],
};

// ── Phase 3 — Stability & movement circuit (menu, not lockstep) ───────────────
// Connection anchors shared across working days.
const A_CHAIN: PlanBlock = { id: 'chain', title: 'Posterior chain (foot→glute)', section: 'circuit', exerciseIds: ['pc_long_line_hinge'] };
const A_BALL: PlanBlock = { id: 'ball', title: 'Ball connection', section: 'circuit', exerciseIds: ['ball_dead_bug'] };
const A_SL: PlanBlock = { id: 'single_leg', title: 'Single-leg balance', section: 'circuit', exerciseIds: ['sl_reach_star'] };
// Minor-impact reactive stiffness — open at any phase, held only on a flare day.
const A_REACTIVE_MINOR: PlanBlock = {
  id: 'reactive_minor',
  title: 'Reactive stiffness (minor impact)',
  section: 'circuit',
  impactTier: 'minor',
  exerciseIds: ['ply_ankle_hops', 'ply_pogo_double'],
};
const A_DOWN: PlanBlock = { id: 'down', title: 'Down-regulate', section: 'close', exerciseIds: ['regen_crocodile_breathing'] };

// ── Per-day featured instability stations (the curated obscurity) ─────────────
// Signature unstable setups that give each day its flavour, alongside the
// generated setup. All closed/na at the knee, non-impact.
const DAY_INSTABILITY: Record<SessionType, PlanBlock> = {
  monday_upper: { id: 'instability', title: 'Instability — balance base', section: 'circuit', exerciseIds: ['inst_bosu_sl_balance'] },
  tuesday_lower_athletic: { id: 'instability', title: 'Instability — narrow base', section: 'circuit', exerciseIds: ['inst_foam_tandem_reach'] },
  wednesday_run: { id: 'instability', title: 'Instability — rotary trunk', section: 'circuit', exerciseIds: ['inst_ball_rotational_trunk', 'inst_med_ball_rotation_control'] },
  thursday_upper_athletic: { id: 'instability', title: 'Instability — hinge on a dome', section: 'circuit', exerciseIds: ['inst_bosu_sl_rdl'] },
  friday_lower_athletic: { id: 'instability', title: 'Instability — max perturbation', section: 'circuit', exerciseIds: ['inst_bosu_inv_sl_balance', 'inst_oscillating_kb_antisway'] },
  saturday_long_run: { id: 'instability', title: 'Instability — reflexive core', section: 'circuit', exerciseIds: ['inst_bottoms_up_kb_hold'] },
  sunday_rest_walk: { id: 'instability', title: 'Instability — easy balance', section: 'circuit', exerciseIds: ['inst_bosu_sl_balance'] },
};

// ── Per-day featured emphasis (the rotating quality) ──────────────────────────
const DAY_EMPHASIS: Partial<Record<SessionType, PlanBlock[]>> = {
  // Mon — adductor (Copenhagen).
  monday_upper: [
    { id: 'emphasis', title: 'Emphasis — adductor (Copenhagen)', section: 'circuit', exerciseIds: ['hip_copenhagen', 'hip_adductor_ball_squeeze', 'hip_psoas_march'] },
  ],
  // Tue — abductor & lateral hip.
  tuesday_lower_athletic: [
    { id: 'emphasis', title: 'Emphasis — abductor & lateral hip', section: 'circuit', exerciseIds: ['hip_side_lying_abduction', 'hip_lateral_band_walk', 'sl_reach_star'] },
  ],
  // Wed — ball & core deep-dive.
  wednesday_run: [
    { id: 'emphasis', title: 'Emphasis — ball & core', section: 'circuit', exerciseIds: ['ball_stir_the_pot', 'ball_hamstring_curl_iso', 'core_side_plank'] },
  ],
  // Thu — posterior chain.
  thursday_upper_athletic: [
    { id: 'emphasis', title: 'Emphasis — posterior chain', section: 'circuit', exerciseIds: ['pc_sl_rdl', 'ball_hamstring_curl_iso', 'core_bird_dog'] },
  ],
  // Fri — single-leg & hip control. Loaded knee work earns in at Phase 2.
  friday_lower_athletic: [
    { id: 'emphasis', title: 'Emphasis — single-leg & hip control', section: 'circuit', exerciseIds: ['hip_airplane', 'fa_sl_balance', 'inst_bosu_hip_airplane'] },
    { id: 'emphasis2', title: 'Emphasis — loaded knee control (earn-it)', section: 'circuit', minPhase: 2, exerciseIds: ['iso_wall_sl_squat_hold', 'sl_step_down', 'sl_ecc_sit_to_stand'] },
  ],
  // Sat — reactive & plyo. Minor reactive variety is open; the high-amplitude
  // ramp (bounds, box/depth/broad jumps) is phase-gated (P3) + flare-held.
  saturday_long_run: [
    { id: 'emphasis', title: 'Emphasis — minor reactive variety', section: 'circuit', impactTier: 'minor', exerciseIds: ['ply_pogo_single', 'ply_drop_stick', 'ply_sl_landing_stick'] },
    { id: 'emphasis2', title: 'Emphasis — high-impact ramp (earn-it)', section: 'circuit', minPhase: 3, impactTier: 'high', exerciseIds: ['ply_lateral_bound', 'ply_bound', 'ply_box_jump', 'ply_depth_drop', 'ply_broad_jump'] },
  ],
};

/**
 * The daily connection anchor stations (menu), shared across working days. Hip
 * activation now leads the session (Phase 1), so the circuit anchor is the
 * posterior-chain / ball / single-leg connection work plus minor reactive.
 */
const CIRCUIT_ANCHOR: PlanBlock[] = [A_CHAIN, A_BALL, A_SL, A_REACTIVE_MINOR];

// A stable seed for callers that don't supply a date (e.g. validation): still
// deterministic, just not day-varying.
const DEFAULT_SEED = '0000-00-00';

/** Build the generated "obscure setup of the day" as a circuit block. */
function generatedBlock(phase: number, seedISO: string, kneeScore?: number): PlanBlock {
  const g = generateSetup(phase, seedISO, kneeScore);
  return {
    id: 'generated',
    title: `Obscure setup of the day — ${g.title}`,
    section: 'circuit',
    exerciseIds: [g.baseExerciseId],
    variationNote: g.variationNote,
  };
}

/**
 * Sun — Regeneration: spine + light foot/ball + easy instability + restorative
 * mobility. No impact. [legacy key: sunday_rest_walk]
 */
function sundayPlan(phase: number, seedISO: string, kneeScore?: number): PlanBlock[] {
  return [
    // Phase 1 — Hip prime & rotation
    A_HIP_MOBILITY,
    A_HIP_ROTATION,
    A_HIP,
    // Phase 2 — Foot & ankle prime (light)
    { id: 'foot_ankle', title: 'Foot & ankle prime — light', section: 'feet', exerciseIds: ['fa_short_foot', 'fa_sl_balance'] },
    // Phase 3 — Stability & movement (easy, no impact) + restorative mobility
    generatedBlock(phase, seedISO, kneeScore),
    DAY_INSTABILITY.sunday_rest_walk,
    A_CHAIN,
    A_BALL,
    { id: 'emphasis', title: 'Restore — active mobility', section: 'circuit', exerciseIds: ['mob_deep_squat_sit', 'mob_worlds_greatest', 'mob_90_90'] },
    // Phase 4 — Down-regulate
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
  const emphasis = DAY_EMPHASIS[type];
  if (!emphasis) return null;
  return [
    // Phase 1 — Hip prime & rotation (hips lead)
    A_HIP_MOBILITY,
    A_HIP_ROTATION,
    A_HIP,
    // Phase 2 — Foot & ankle prime
    A_ANKLE_HFT,
    // Phase 3 — Stability & movement circuit (menu): generated hero setup →
    // curated featured instability + its perturbation cues → the day's emphasis
    // → connection anchors + minor reactive.
    generatedBlock(phase, seedISO, kneeScore),
    DAY_INSTABILITY[type],
    ...emphasis,
    ...CIRCUIT_ANCHOR,
    // Phase 4 — Down-regulate
    A_DOWN,
  ];
}

/** Whether a session type has a plan. */
export function isGymSession(type: SessionType): boolean {
  return getSessionPlan(type) !== null;
}

// ── Block gating ─────────────────────────────────────────────────────────────
// A block is held for two reasons:
//   1. Phase lock — the current phase hasn't reached the block's minPhase yet.
//      Only the HIGH-impact ramp sets minPhase > 1 (minor/non-impact stay open).
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
  const seeds = [DEFAULT_SEED, '2026-10-11', '2026-10-12'];
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
