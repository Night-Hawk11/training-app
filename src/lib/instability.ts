/**
 * Instability setup generator (2026-10-11 perturbation pivot).
 *
 * The training principle this encodes: **destabilize the base, then demand
 * stability and reactive output** ("destabilize → fire"). Rather than a fixed
 * drill, a session's hero station is a *composed* setup built from four dials —
 * surface × stance × load × task — so the obscurity (e.g. single-leg on an
 * inverted bosu holding a band with a kettlebell dangling off it) is produced
 * fresh each day instead of hand-listed.
 *
 * Hard invariants (the generator must never violate):
 *   - Every base movement is CLOSED/NA at the knee and NON-IMPACT. The generator
 *     never emits a plyometric/impact row — instability pairs with balance and
 *     control, never with high-amplitude jumping. (See training-safety-rules.)
 *   - No-throw facility: the TASK dial only holds / reaches / rotates with no
 *     release; the oscillating LOAD is a dangling/bottoms-up kettlebell, not a
 *     throw.
 *   - Total dialed intensity is capped by phase and pulled back on a tender-knee
 *     day, so max instability never stacks before it's earned.
 *
 * Determinism: picks are seeded from the ISO date (small string-hash PRNG) so
 * "today's setup" is stable across reloads but rolls over each day. Browser
 * `Date` is used by callers to get the date — fine here (this is app code).
 */

import { getExercise } from '../data/exercises';

// ── Dials ─────────────────────────────────────────────────────────────────────
type DialKey = 'surface' | 'stance' | 'load' | 'task';

interface DialOption {
  key: string;
  intensity: number; // 0 = none/easiest … 3 = hardest
  /** Phrase folded into the setup note; empty for the neutral option. */
  note: string;
}

// The dome-up bosu is intentionally NOT an auto-generated rung: on a squishy
// dome the foot can't build a solid tripod, so it fights the arch-lock this
// program is built on. The INVERTED bosu (rigid platform that tilts as a unit)
// keeps the foot in solid contact and the arch locked while still destabilizing —
// so it's the standard bosu surface here. Dome-up stays available as a deliberate
// softer regression (see DOME_REGRESSION) but the generator won't send you there.
export const SURFACE: DialOption[] = [
  { key: 'floor', intensity: 0, note: '' },
  { key: 'foam', intensity: 1, note: 'on a foam pad' },
  { key: 'bosu_down', intensity: 3, note: 'on a flipped-over (inverted) bosu' },
];

/** Optional softer-surface regression, kept out of the auto-generated ladder. */
export const DOME_REGRESSION: DialOption = { key: 'bosu_up', intensity: 2, note: 'on the bosu dome (softer regression)' };

export const STANCE: DialOption[] = [
  { key: 'bilateral', intensity: 0, note: '' },
  { key: 'tandem', intensity: 1, note: 'in a heel-to-toe (tandem) stance' },
  { key: 'single', intensity: 2, note: 'on one leg' },
  { key: 'single_ec', intensity: 3, note: 'on one leg with the eyes closed' },
];

export const LOAD: DialOption[] = [
  { key: 'none', intensity: 0, note: '' },
  { key: 'fixed', intensity: 1, note: 'holding a light KB or med ball at the chest' },
  { key: 'offset', intensity: 2, note: 'holding a single-arm (offset) kettlebell' },
  {
    key: 'oscillating',
    intensity: 3,
    note: 'holding a band at arm’s length with a kettlebell dangling off it — let it sway, then damp it quiet',
  },
];

export const TASK: DialOption[] = [
  { key: 'static', intensity: 0, note: 'hold it still and quiet' },
  { key: 'reach', intensity: 1, note: 'reach slowly to the clock points and recover to centre' },
  { key: 'headturn', intensity: 2, note: 'add slow head turns and gaze shifts' },
  { key: 'rotation', intensity: 2, note: 'add slow controlled trunk rotations (no release)' },
];

const DIALS: Record<DialKey, DialOption[]> = { surface: SURFACE, stance: STANCE, load: LOAD, task: TASK };

// ── Base movements the generator may dial up ──────────────────────────────────
// All closed/na at the knee and non-impact. `fixedNotes` describe dials that are
// INTRINSIC to the base (so the generator won't also dial them and contradict).
interface Base {
  id: string; // must resolve in exercises.json
  verb: string; // short title fragment
  dials: DialKey[]; // dials that may be layered onto this base
}

const BASES: Base[] = [
  { id: 'fa_sl_balance', verb: 'quiet-foot balance', dials: ['surface', 'stance', 'load', 'task'] },
  { id: 'sl_reach_star', verb: 'single-leg star reach', dials: ['surface', 'load'] },
  { id: 'pc_sl_rdl', verb: 'single-leg RDL', dials: ['surface', 'load'] },
  { id: 'hip_airplane', verb: 'hip airplane', dials: ['surface'] },
  // Load is intrinsic to the anti-sway hold, so only surface/stance are dialed.
  { id: 'inst_oscillating_kb_antisway', verb: 'oscillating-KB anti-sway hold', dials: ['surface', 'stance'] },
  { id: 'inst_bottoms_up_kb_hold', verb: 'bottoms-up KB hold', dials: ['surface', 'stance'] },
  { id: 'inst_ball_rotational_trunk', verb: 'ball rotational trunk', dials: ['load'] },
];

/** The ids the generator can ever emit — exposed for validateSessionPlans(). */
export const GENERATOR_BASE_IDS = BASES.map((b) => b.id);

// ── Seeded PRNG (deterministic per day) ───────────────────────────────────────
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T>(arr: T[], rng: () => number): T => arr[Math.floor(rng() * arr.length)];

// ── Intensity budget ──────────────────────────────────────────────────────────
// Scales with phase so max instability isn't stacked before it's earned; a
// flagged knee pulls the cap right down for the day.
function intensityCap(phase: number, kneeScore?: number): number {
  const byPhase = [0, 3, 5, 7, 9][phase] ?? 5;
  if (kneeScore != null && kneeScore <= 5) return Math.min(byPhase, 3);
  return byPhase;
}

export interface GeneratedSetup {
  /** A real exercise id so the session screen can log sets against it. */
  baseExerciseId: string;
  /** Title fragment, e.g. "single-leg star reach on the bosu dome". */
  title: string;
  /** The dialed twists, shown under the base movement in the session UI. */
  variationNote: string;
  cues: string[];
  safety: string;
  intensity: number;
}

/**
 * Compose today's obscure instability setup. Deterministic for a given
 * (seedISO, phase, kneeScore). Always closed-chain and non-impact.
 */
export function generateSetup(
  phase: number,
  seedISO: string,
  kneeScore?: number,
  excludeBaseId?: string
): GeneratedSetup {
  const rng = mulberry32(hashString(`${seedISO}|p${phase}|k${kneeScore ?? '-'}`));
  // Don't let the generated "obscure setup" duplicate the day's featured station
  // (e.g. Thursday features the single-leg RDL, which is also a generator base).
  const pool = excludeBaseId ? BASES.filter((b) => b.id !== excludeBaseId) : BASES;
  const base = pick(pool.length ? pool : BASES, rng);
  const cap = intensityCap(phase, kneeScore);

  // Greedily dial each applicable axis within the remaining budget, in a
  // seed-shuffled order so no single axis always absorbs the budget.
  const order = [...base.dials].sort(() => rng() - 0.5);
  let spent = 0;
  const chosen: Partial<Record<DialKey, DialOption>> = {};
  for (const key of order) {
    const affordable = DIALS[key].filter((o) => spent + o.intensity <= cap);
    const opt = pick(affordable.length ? affordable : [DIALS[key][0]], rng);
    chosen[key] = opt;
    spent += opt.intensity;
  }

  const notes = (['surface', 'stance', 'load', 'task'] as DialKey[])
    .map((k) => chosen[k]?.note)
    .filter((n): n is string => !!n);
  const variationNote = notes.length ? notes.join('; ') : 'baseline — own it clean, then dial it up';

  const ex = getExercise(base.id);
  const title = notes.length
    ? `${base.verb} — ${[chosen.surface?.note, chosen.stance?.note].filter(Boolean).join(', ') || 'dialed up'}`
    : base.verb;

  return {
    baseExerciseId: base.id,
    title,
    variationNote,
    cues: [
      ...(ex?.cues ?? []).slice(0, 2),
      'Stabilise from the floor up — foot → hip → ribs; don’t fight it with the arms',
      'Smaller, faster corrections beat big saves; make the wobble go quiet',
    ],
    safety: 'Closed-chain, no impact. If the knee complains, drop one dial — easier surface, two feet, or lighter load.',
    intensity: spent,
  };
}
