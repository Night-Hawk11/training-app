import exercisesJson from './exercises.json';
import type {
  Exercise,
  ExerciseCategory,
  ExerciseMeasurement,
  Prescription,
} from './types';

/**
 * Exercise database loader (KICKOFF_BRIEF.md Step 3).
 *
 * `exercises.json` is the single source of truth (62 exercises). We import it
 * directly so it loads into memory at startup, then expose typed accessors.
 * Per the brief, exercise data is never duplicated into TypeScript — this module
 * only types and indexes the JSON.
 */

// Demo videos (the user's saved Instagram references), mapped onto the exercise
// they best represent. Kept here rather than in exercises.json so all demo links
// live in one reviewable place. Surfaced as a "Watch demo" link in the session UI.
const DEMO_VIDEOS: Record<string, string> = {
  mob_hip_cars: 'https://www.instagram.com/p/DCZuGRPNJ6y/', // ground-up realignment
  fa_short_foot: 'https://www.instagram.com/p/C_IvKmINLlH/', // "back to the ground"
  fa_calf_iso: 'https://www.instagram.com/p/DB-G_uYyPq4/', // ankle stability series
  hip_clamshell: 'https://www.instagram.com/p/Dath06ztY2U/', // banded knee-health series
  pc_long_line_hinge: 'https://www.instagram.com/p/DcxZX78ukcJ/', // ground-up fascia prep
  sl_mirror_squat: 'https://www.instagram.com/p/C_i48afousc/', // knee-stability drills
  ply_drop_stick: 'https://www.instagram.com/p/DbSv55nPFyg/', // jump "dropping phase"
  ply_lateral_bound: 'https://www.instagram.com/p/DCorla0xRDT/', // reactive / speed
};

// The JSON's inferred type widens unions (category/measurement) to `string`;
// assert to our schema once here, then attach demo-video links.
export const EXERCISES = (exercisesJson as unknown as Exercise[]).map((e) =>
  DEMO_VIDEOS[e.id] ? { ...e, videoUrl: DEMO_VIDEOS[e.id] } : e
);

const byId: Map<string, Exercise> = new Map(EXERCISES.map((e) => [e.id, e]));

export function getExercise(id: string): Exercise | undefined {
  return byId.get(id);
}

/** Resolve a list of ids to exercises, skipping any that are missing. */
export function getExercises(ids: string[]): Exercise[] {
  return ids.map((id) => byId.get(id)).filter((e): e is Exercise => e !== undefined);
}

export function getExercisesByCategory(category: ExerciseCategory): Exercise[] {
  return EXERCISES.filter((e) => e.category === category);
}

/**
 * Returns the effective prescription for an exercise in a given phase: the
 * per-phase override if one exists, otherwise the default.
 */
export function getPrescription(exercise: Exercise, phase: number): Prescription {
  const override = exercise.phasePrescriptions?.[String(phase)];
  return override ?? exercise.defaultPrescription;
}

// Allowed enum values, kept in sync with the unions in types.ts.
const CATEGORIES: ReadonlySet<ExerciseCategory> = new Set([
  'mobility',
  'foot_ankle',
  'hip',
  'isometric',
  'ball',
  'posterior_chain',
  'single_leg',
  'plyometric',
  'core',
  'regen',
]);

const CHAINS: ReadonlySet<string> = new Set(['open', 'closed', 'na']);

/**
 * SAFETY: open-chain knee-extension work is contraindicated (left patellar
 * subluxation history). Any exercise wired into a session plan must pass this;
 * `validateSessionPlans()` fails loudly if an open-chain-knee exercise is scheduled.
 */
export function isKneeSafe(exercise: Exercise): boolean {
  return exercise.chain !== 'open';
}

const MEASUREMENTS: ReadonlySet<ExerciseMeasurement> = new Set([
  'time',
  'sets_reps_weight',
  'distance',
]);

/**
 * Sanity-checks the exercise database and returns a list of problems (empty if
 * clean). Called from main.tsx in dev so schema drift in exercises.json surfaces
 * as console warnings rather than runtime surprises later.
 */
export function validateExercises(list: Exercise[] = EXERCISES): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();

  for (const e of list) {
    const where = e.id || '(missing id)';
    if (!e.id) problems.push('Exercise with no id');
    else if (seen.has(e.id)) problems.push(`Duplicate id: ${e.id}`);
    else seen.add(e.id);

    if (!e.name) problems.push(`${where}: missing name`);
    if (!CATEGORIES.has(e.category)) problems.push(`${where}: unknown category "${e.category}"`);
    if (!CHAINS.has(e.chain)) problems.push(`${where}: unknown/missing chain "${e.chain}"`);
    if (!MEASUREMENTS.has(e.measurement))
      problems.push(`${where}: unknown measurement "${e.measurement}"`);
    if (!Array.isArray(e.equipment) || e.equipment.length === 0)
      problems.push(`${where}: equipment is not a non-empty array`);
    if (!Array.isArray(e.setup)) problems.push(`${where}: setup is not an array`);
    if (!Array.isArray(e.cues)) problems.push(`${where}: cues is not an array`);
    if (!e.svg || !e.svg.includes('<svg')) problems.push(`${where}: missing or invalid svg`);
    if (!e.defaultPrescription) problems.push(`${where}: missing defaultPrescription`);
  }

  return problems;
}

/** Dev startup hook: validates and logs a one-line summary. */
export function initExercises(): void {
  const problems = validateExercises();
  if (problems.length === 0) {
    console.info(`[exercises] Loaded ${EXERCISES.length} exercises, schema OK ✓`);
  } else {
    console.warn(`[exercises] Loaded ${EXERCISES.length} exercises with ${problems.length} problem(s):`);
    for (const p of problems) console.warn(`  • ${p}`);
  }
}
