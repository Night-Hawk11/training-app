import { useMemo } from 'react';
import { EXERCISES, validateExercises } from '../data/exercises';
import StickFigure from '../components/StickFigure';
import type { DefaultPrescription, Exercise, ExerciseCategory } from '../data/types';

// Stable display order for the category groupings.
const CATEGORY_ORDER: ExerciseCategory[] = [
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
];

function prettyCategory(c: ExerciseCategory): string {
  return c.replace(/_/g, ' ');
}

function formatPrescription(p: DefaultPrescription): string {
  const parts: string[] = [];
  if (p.sets != null) parts.push(`${p.sets} set${p.sets === 1 ? '' : 's'}`);
  if (p.reps != null) parts.push(`${p.reps} reps`);
  if (p.durationSec != null) parts.push(`${p.durationSec}s`);
  if (p.restSec != null) parts.push(`${p.restSec}s rest`);
  return parts.join(' · ') || '—';
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-pill bg-ink px-2 py-0.5 text-xs text-text-secondary">
      {children}
    </span>
  );
}

function ExerciseRow({ ex }: { ex: Exercise }) {
  return (
    <article className="flex gap-3 rounded-card bg-ink-card p-3">
      <div className="h-20 w-28 flex-shrink-0 rounded-md bg-ink p-1 text-accent">
        <StickFigure svg={ex.svg} label={ex.name} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="truncate font-semibold text-text-primary">{ex.name}</h3>
          <code className="flex-shrink-0 text-xs text-text-muted">{ex.id}</code>
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          <Chip>{ex.equipment}</Chip>
          <Chip>{ex.measurement}</Chip>
          <Chip>{formatPrescription(ex.defaultPrescription)}</Chip>
        </div>
        <p className="mt-2 text-sm text-text-secondary">{ex.description}</p>
        <p className="mt-1 text-xs text-text-muted">
          <span className="font-medium">Setup:</span> {ex.setup}
        </p>
        {ex.cues.length > 0 && (
          <ul className="mt-1 list-inside list-disc text-xs text-text-muted">
            {ex.cues.map((cue, i) => (
              <li key={i}>{cue}</li>
            ))}
          </ul>
        )}
        {ex.defaultPrescription.notes && (
          <p className="mt-1 text-xs italic text-text-muted">{ex.defaultPrescription.notes}</p>
        )}
      </div>
    </article>
  );
}

export default function ExercisesDebugScreen() {
  const problems = useMemo(() => validateExercises(), []);
  const grouped = useMemo(() => {
    const map = new Map<ExerciseCategory, Exercise[]>();
    for (const ex of EXERCISES) {
      const list = map.get(ex.category) ?? [];
      list.push(ex);
      map.set(ex.category, list);
    }
    return map;
  }, []);

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <header className="mb-4">
        <h1 className="text-xl font-semibold text-text-primary">Exercises (debug)</h1>
        <p className="text-sm text-text-secondary">
          {EXERCISES.length} exercises loaded ·{' '}
          {problems.length === 0 ? (
            <span className="text-success">schema OK</span>
          ) : (
            <span className="text-danger">{problems.length} problem(s)</span>
          )}
        </p>
        {problems.length > 0 && (
          <ul className="mt-2 list-inside list-disc rounded-md bg-ink-card p-2 text-xs text-danger">
            {problems.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        )}
      </header>

      {CATEGORY_ORDER.map((category) => {
        const list = grouped.get(category);
        if (!list || list.length === 0) return null;
        return (
          <section key={category} className="mb-6">
            <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-text-secondary">
              {prettyCategory(category)} · {list.length}
            </h2>
            <div className="flex flex-col gap-2">
              {list.map((ex) => (
                <ExerciseRow key={ex.id} ex={ex} />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
