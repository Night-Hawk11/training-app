import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StickFigure from '../components/StickFigure';
import { useSettingsStore } from '../store/settingsStore';
import { useDailyEntryStore } from '../store/dailyEntryStore';
import { getExercisesByCategory, getPrescription } from '../data/exercises';
import { formatSetsReps } from '../lib/format';

/**
 * Re-education flow (KICKOFF_BRIEF.md 4.4).
 *
 * The re-education drills are slow, deliberate motor-learning work (sets × reps,
 * not timed), so this is a guided checklist rather than a timer: each drill
 * shows its prescription and coaching cues, the user ticks it off as they go,
 * and on finishing the routine is marked complete on today's DailyEntry with
 * optional notes. Re-opening prefills the existing notes.
 */

function Check({ on }: { on: boolean }) {
  return (
    <span
      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-pill border-2 text-xs ${
        on ? 'border-success bg-success text-ink' : 'border-border-subtle text-transparent'
      }`}
    >
      ✓
    </span>
  );
}

export default function ReEducationScreen() {
  const navigate = useNavigate();
  const currentPhase = useSettingsStore((s) => s.settings?.currentPhase ?? 1);
  const entry = useDailyEntryStore((s) => s.entry);
  const setReEducation = useDailyEntryStore((s) => s.setReEducation);

  const exercises = useMemo(() => getExercisesByCategory('re_education'), []);
  const alreadyDone = entry?.reEducationCompleted ?? false;

  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState(entry?.reEducationNotes ?? '');
  const [saving, setSaving] = useState(false);

  const allChecked = exercises.every((ex) => checked.has(ex.id));

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function complete() {
    setSaving(true);
    await setReEducation(true, notes);
    navigate('/');
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-6">
      <header>
        <button type="button" onClick={() => navigate('/')} className="mb-2 text-sm text-text-muted">
          ← Today
        </button>
        <h1 className="text-xl font-semibold text-text-primary">Re-education</h1>
        <p className="text-sm text-text-secondary">
          {exercises.length} drills · slow and deliberate
          {alreadyDone && <span className="ml-2 text-success">· done today</span>}
        </p>
      </header>

      <ol className="flex flex-col gap-3">
        {exercises.map((ex, i) => {
          const p = getPrescription(ex, currentPhase);
          const on = checked.has(ex.id);
          return (
            <li key={ex.id}>
              <button
                type="button"
                onClick={() => toggle(ex.id)}
                className="w-full rounded-card bg-ink-card p-3 text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="h-16 w-20 flex-shrink-0 rounded-md bg-ink p-1 text-accent">
                    <StickFigure svg={ex.svg} label={ex.name} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-semibold text-text-primary">
                        {i + 1}. {ex.name}
                      </h2>
                      <Check on={on} />
                    </div>
                    <p className="text-sm font-medium text-accent">{formatSetsReps(p)}</p>
                  </div>
                </div>
                {ex.cues.length > 0 && (
                  <ul className="mt-2 list-inside list-disc text-xs text-text-muted">
                    {ex.cues.map((cue, c) => (
                      <li key={c}>{cue}</li>
                    ))}
                  </ul>
                )}
              </button>
            </li>
          );
        })}
      </ol>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-text-secondary">Notes (optional)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="How did the patterns feel today?"
          className="w-full resize-none rounded-md bg-ink-card p-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-border-focus"
        />
      </label>

      <button
        type="button"
        onClick={complete}
        disabled={saving}
        className="rounded-card bg-accent py-3 text-base font-semibold text-ink disabled:opacity-60"
      >
        {allChecked ? 'Complete' : 'Mark complete'}
      </button>
    </main>
  );
}
