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

// The JSON's inferred type widens unions (category/measurement) to `string`;
// assert to our schema once here.
export const EXERCISES = exercisesJson as unknown as Exercise[];

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
  'foot_ankle',
  'glute_hip',
  'core',
  'neuromuscular',
  'morning_ei',
  're_education',
  'rapid_response',
  'warmup',
  'strength',
  'accessory',
  'athletic',
  'running',
]);

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
