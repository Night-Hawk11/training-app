import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StickFigure from '../components/StickFigure';
import { useSettingsStore } from '../store/settingsStore';
import { useHistoryStore } from '../store/historyStore';
import { getExercise, getPrescription } from '../data/exercises';
import { formatLongDate, formatShortDate, todayISO, addDays } from '../lib/dates';
import { planForDate } from '../lib/schedule';
import { getSessionPlan } from '../lib/sessionPlan';
import { formatTarget } from '../lib/format';
import { lastPerformance } from '../lib/lastPerformance';

/**
 * Read-only preview of a day's plan — the drill-down from the Today screen's
 * "Coming up" card. Shows the scheduled focus and, on gym days, the full
 * block/exercise list with expandable per-exercise detail.
 *
 * Deliberately offers NO way to start or log the session: it's for mentally
 * previewing an upcoming day only. Logging always happens from Today on the day.
 */
export default function PreviewScreen() {
  const navigate = useNavigate();
  const { date: dateParam } = useParams();
  // Default to tomorrow if no date is supplied.
  const date = dateParam ?? addDays(todayISO(), 1);
  const phase = useSettingsStore((s) => s.settings?.currentPhase ?? 1);
  const sessions = useHistoryStore((s) => s.sessions);

  const plan = planForDate(date);
  const gymPlan = getSessionPlan(plan.type);
  const isTomorrow = date === addDays(todayISO(), 1);

  // Which exercises are expanded to show their description / setup / cues.
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const kindLabel = plan.kind === 'gym' ? 'Gym' : 'Recovery';

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-6">
      <header>
        <button type="button" onClick={() => navigate('/')} className="mb-2 text-sm text-text-muted">
          ← Today
        </button>
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="text-xl font-semibold text-text-primary">{plan.title}</h1>
          <span className="rounded-pill bg-ink-card px-2 py-0.5 text-xs text-text-secondary">
            {kindLabel}
          </span>
        </div>
        <p className="text-sm text-text-secondary">
          {isTomorrow ? 'Tomorrow · ' : ''}
          {formatLongDate(date)}
        </p>
        <p className="mt-1 text-sm text-text-secondary">{plan.blurb}</p>
      </header>

      {/* Reinforce that this is a look-ahead only — nothing starts from here. */}
      <p className="rounded-card bg-ink-card px-3 py-2 text-xs text-text-muted">
        Preview only — come back on the day to start and log it.
      </p>

      {gymPlan ? (
        gymPlan.map((block) => (
          <section key={block.id} className="flex flex-col gap-2">
            <h2 className="text-sm font-medium uppercase tracking-wide text-text-secondary">
              {block.title}
            </h2>
            {block.exerciseIds.map((id) => {
              const ex = getExercise(id);
              if (!ex) return null;
              const p = getPrescription(ex, phase);
              const isOpen = expanded.has(id);
              // What you logged for this exercise last time (any day before).
              const last = lastPerformance(sessions, date, id, ex.measurement);
              return (
                <article key={id} className="rounded-card bg-ink-card p-3">
                  {/* Tap to expand details. No set rows, no done toggles. */}
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
                      {last && (
                        <p className="mt-0.5 text-xs text-text-muted">
                          Last ({formatShortDate(last.date)}): {last.summary}
                        </p>
                      )}
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
        ))
      ) : (
        <section className="rounded-card bg-ink-card p-4 text-sm text-text-secondary">
          An easy recovery day — an easy walk, nothing to log.
        </section>
      )}

      {/* Every day also carries the fixed morning routine. */}
      <section className="rounded-card bg-ink-card p-4">
        <h2 className="mb-1 text-sm font-medium uppercase tracking-wide text-text-secondary">
          Daily routine
        </h2>
        <p className="text-sm text-text-secondary">
          As every day, you’ll also run your morning routine: Morning EI · Re-education · Rapid
          Response.
        </p>
      </section>
    </main>
  );
}
