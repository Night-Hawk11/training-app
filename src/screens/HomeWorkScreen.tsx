import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StickFigure from '../components/StickFigure';
import { useSettingsStore } from '../store/settingsStore';
import { useDailyEntryStore } from '../store/dailyEntryStore';
import { getExercise, getPrescription } from '../data/exercises';
import { todayISO } from '../lib/dates';
import { planForDate } from '../lib/schedule';
import { getHomeWork } from '../lib/sessionPlan';
import { formatTarget } from '../lib/format';

/**
 * Home work — the supplemental at-home explosive/tendon + core work, done
 * SEPARATELY from the gym session. Reached from the Today screen's Daily-routine
 * section on its days (Tue/Wed/Fri/Sat). Read-only follow-along with a single
 * done toggle that feeds the daily-routine status.
 */
export default function HomeWorkScreen() {
  const navigate = useNavigate();
  const phase = useSettingsStore((s) => s.settings?.currentPhase ?? 1);
  const entry = useDailyEntryStore((s) => s.entry);
  const update = useDailyEntryStore((s) => s.update);

  const date = todayISO();
  const plan = planForDate(date);
  const blocks = getHomeWork(plan.type);
  const done = entry?.homeWorkCompleted ?? false;

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (!blocks) {
    return (
      <main className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-xl font-semibold text-text-primary">No home work today</h1>
        <p className="text-text-secondary">The supplemental home work runs on Tue, Wed, Fri, and Sat.</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="rounded-card bg-accent px-6 py-2.5 text-sm font-semibold text-ink"
        >
          Back to Today
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-6 pb-24">
      <header>
        <button type="button" onClick={() => navigate('/')} className="mb-2 text-sm text-text-muted">
          ← Today
        </button>
        <h1 className="text-xl font-semibold text-text-primary">Home work</h1>
        <p className="text-sm text-text-secondary">
          Bodyweight + exercise ball + band — separate from the gym session, do it at home.
        </p>
      </header>

      {blocks.map((block) => (
        <section key={block.id} className="flex flex-col gap-2">
          <h2 className="text-sm font-medium uppercase tracking-wide text-text-secondary">
            {block.title}
          </h2>
          {block.exerciseIds.map((id) => {
            const ex = getExercise(id);
            if (!ex) return null;
            const p = getPrescription(ex, phase);
            const isOpen = expanded.has(id);
            return (
              <article key={id} className="rounded-card bg-ink-card p-3">
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-start gap-3 text-left"
                >
                  <div className="h-14 w-16 flex-shrink-0 rounded-md bg-ink p-1 text-accent">
                    <StickFigure svg={ex.svg} label={ex.name} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-text-primary">{ex.name}</h3>
                      <span className="flex-shrink-0 text-text-muted">{isOpen ? '⌄' : '›'}</span>
                    </div>
                    <p className="text-xs text-accent">{formatTarget(ex.measurement, p)}</p>
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-2 border-t border-border-subtle pt-2">
                    <p className="text-sm text-text-secondary">{ex.description}</p>
                    {ex.setup.length > 0 && (
                      <ol className="mt-1 list-inside list-decimal text-xs text-text-muted">
                        {ex.setup.map((step, si) => (
                          <li key={si}>{step}</li>
                        ))}
                      </ol>
                    )}
                    {ex.cues.length > 0 && (
                      <ul className="mt-1 list-inside list-disc text-xs text-text-muted">
                        {ex.cues.map((cue, ci) => (
                          <li key={ci}>{cue}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </section>
      ))}

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md p-4">
        <button
          type="button"
          onClick={async () => {
            await update({ homeWorkCompleted: !done });
            navigate('/');
          }}
          className={`w-full rounded-card py-3 text-base font-semibold shadow-lg ${
            done ? 'bg-ink-card text-text-secondary' : 'bg-accent text-ink'
          }`}
        >
          {done ? 'Mark not done' : 'Mark done'}
        </button>
      </div>
    </main>
  );
}
