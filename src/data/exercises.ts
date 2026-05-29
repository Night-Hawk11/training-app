import exercisesJson from './exercises.json';
import type {
  Exercise,
  ExerciseCategory,
  Equipment,
  ExerciseMeasurement,
} from './types';

/**
 * Exercise database loader (KICKOFF_BRIEF.md Step 3).
 *
 * `exercises.json` is the single source of truth (62 exercises). We import it
 * directly so it loads into memory at startup, then expose typed accessors.
 * Per the brief, exercise data is never duplicated into TypeScript — this module
 * only types and indexes the JSON.
 */

// The JSON's inferred type widens unions to `string`; assert to our schema.
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

// Allowed values, kept in sync with the unions in types.ts, used for validation.
const CATEGORIES: ReadonlySet<ExerciseCategory> = new Set([
  'morning_ei',
  'morning_re_education',
  'morning_rapid_response',
  'warmup',
  'gym_main',
  'gym_accessory',
  'gym_jump',
  'gym_iso',
  'run',
  'cooldown',
  'mobility',
]);

const EQUIPMENT: ReadonlySet<Equipment> = new Set([
  'none',
  'bodyweight',
  'barbell',
  'dumbbell',
  'kettlebell',
  'trap_bar',
  'cable',
  'resistance_band',
  'medicine_ball',
  'box',
  'foam_roller',
  'marinovich_machine',
]);

const MEASUREMENTS: ReadonlySet<ExerciseMeasurement> = new Set([
  'duration',
  'reps',
  'distance',
  'load_duration',
  'load_reps',
  'bodyweight_reps',
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
    if (!EQUIPMENT.has(e.equipment)) problems.push(`${where}: unknown equipment "${e.equipment}"`);
    if (!MEASUREMENTS.has(e.measurement))
      problems.push(`${where}: unknown measurement "${e.measurement}"`);
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
