import { useMemo } from 'react';
import { EXERCISES, validateExercises } from '../data/exercises';
import StickFigure from '../components/StickFigure';
import type { Exercise, ExerciseCategory, Prescription } from '../data/types';

// Stable display order for the category groupings. The neuromuscular-first rehab
// categories lead (foot/ankle → glute/hip → core → integrated control), then the
// daily routine buckets, then the legacy/archived categories the active program
// no longer wires in (upper-body strength, plyometrics, running).
const CATEGORY_ORDER: ExerciseCategory[] = [
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
];

function prettyCategory(c: ExerciseCategory): string {
  return c.replace(/_/g, ' ');
}

function formatPrescription(p: Prescription): string {
  const parts: string[] = [];
  if (p.warmupSets != null) parts.push(`${p.warmupSets} warmup`);
  if (p.sets != null) parts.push(`${p.sets} set${p.sets === 1 ? '' : 's'}`);
  if (p.bouts != null) parts.push(`${p.bouts} bouts`);
  if (p.reps != null) parts.push(`${p.reps} reps`);
  if (p.durationSec != null) parts.push(`${p.durationSec}s`);
  if (p.workSec != null) parts.push(`${p.workSec}s work`);
  if (p.distanceFeet != null) parts.push(`${p.distanceFeet} ft`);
  if (p.weightLbs != null) parts.push(`${p.weightLbs} lb`);
  if (p.restSec != null) parts.push(`${p.restSec}s rest`);
  if (p.perSide) parts.push('per side');
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
  const phases = ex.phasePrescriptions ? Object.keys(ex.phasePrescriptions).sort() : [];

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
          <Chip>{ex.equipment.join(', ')}</Chip>
          <Chip>{ex.measurement}</Chip>
          <Chip>{formatPrescription(ex.defaultPrescription)}</Chip>
        </div>
        <p className="mt-2 text-sm text-text-secondary">{ex.description}</p>
        {ex.setup.length > 0 && (
          <ol className="mt-1 list-inside list-decimal text-xs text-text-muted">
            {ex.setup.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        )}
        {ex.cues.length > 0 && (
          <ul className="mt-1 list-inside list-disc text-xs text-text-muted">
            {ex.cues.map((cue, i) => (
              <li key={i}>{cue}</li>
            ))}
          </ul>
        )}
        {phases.length > 0 && (
          <div className="mt-1 text-xs text-text-muted">
            <span className="font-medium">Phase overrides:</span>{' '}
            {phases.map((ph) => (
              <span key={ph} className="mr-2">
                P{ph}: {formatPrescription(ex.phasePrescriptions![ph])}
              </span>
            ))}
          </div>
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
