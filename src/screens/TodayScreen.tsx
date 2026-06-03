import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSettingsStore } from '../store/settingsStore';
import { useDailyEntryStore } from '../store/dailyEntryStore';
import { useSessionStore } from '../store/sessionStore';
import { useHistoryStore } from '../store/historyStore';
import { formatLongDate } from '../lib/dates';
import { planForDate } from '../lib/schedule';
import { maybeMorningReminder } from '../lib/notifications';
import StreakCard from '../components/StreakCard';
import type { Readiness } from '../data/types';

/**
 * Today screen — the app's home hub (KICKOFF_BRIEF.md 4.1).
 *
 * Shows the current date / phase / week, the day's scheduled focus, the
 * morning readiness status (with a check-in CTA), and the daily-routine
 * progress. The routine flows themselves are built in Steps 5–6; here they
 * render as status rows reflecting today's DailyEntry.
 */

function kindLabel(kind: ReturnType<typeof planForDate>['kind']): string {
  return kind === 'gym' ? 'Gym' : kind === 'run' ? 'Run' : 'Recovery';
}

// Average the three joint scores for a compact readiness summary.
function jointAvg(r: Readiness): number {
  const { knees, ankles, hips } = r.jointCheck;
  return Math.round(((knees + ankles + hips) / 3) * 10) / 10;
}

function StatusDot({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden
      className={`h-2.5 w-2.5 rounded-pill ${done ? 'bg-success' : 'bg-border-subtle'}`}
    />
  );
}

function RoutineRow({ label, done, to }: { label: string; done: boolean; to?: string }) {
  const status = (
    <div className="flex items-center gap-2">
      <span className={`text-xs ${done ? 'text-success' : 'text-text-muted'}`}>
        {done ? 'Done' : 'Not yet'}
      </span>
      <StatusDot done={done} />
      {to && <span className="text-text-muted">›</span>}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="flex items-center justify-between py-2">
        <span className="text-sm text-text-primary">{label}</span>
        {status}
      </Link>
    );
  }

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-text-primary">{label}</span>
      {status}
    </div>
  );
}

export default function TodayScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const settingsLoaded = useSettingsStore((s) => s.loaded);

  const date = useDailyEntryStore((s) => s.date);
  const entry = useDailyEntryStore((s) => s.entry);
  const entryLoaded = useDailyEntryStore((s) => s.loaded);

  const sessions = useHistoryStore((s) => s.sessions);
  const runs = useHistoryStore((s) => s.runs);
  const activeSession = useSessionStore((s) => s.active);

  const plan = planForDate(date);
  const readiness = entry?.readiness ?? null;

  // Gym-day session status, for the focus-card CTA.
  const sessionLoggedToday = sessions.some((s) => s.date === date && s.type === plan.type);
  const sessionInProgress = activeSession?.date === date && activeSession?.type === plan.type;
  // Run-day status.
  const runLoggedToday = runs.some((r) => r.date === date);

  // Morning routine reminder: a reliable in-app banner, plus a best-effort
  // notification (see lib/notifications — background scheduling needs a server).
  const morningDone = entry?.morningEICompleted ?? false;
  const readinessDone = !!readiness;
  const showMorningNudge = entryLoaded && (!readinessDone || !morningDone);

  useEffect(() => {
    if (!settings || !entryLoaded) return;
    maybeMorningReminder({
      enabled: settings.notificationsEnabled,
      notificationTime: settings.notificationTime,
      morningDone,
      todayISO: date,
    });
  }, [settings, entryLoaded, morningDone, date]);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-text-secondary">{formatLongDate(date)}</p>
          <h1 className="text-2xl font-semibold text-text-primary">Today</h1>
        </div>
        <div className="flex items-center gap-2">
          {settingsLoaded && settings && (
            <Link
              to="/settings"
              className="rounded-pill bg-ink-card px-3 py-1 text-xs font-medium text-text-secondary"
            >
              Phase {settings.currentPhase} · Week {settings.currentWeek}
            </Link>
          )}
          <Link
            to="/settings"
            aria-label="Settings"
            className="rounded-pill bg-ink-card px-2.5 py-1 text-base text-text-secondary"
          >
            ⚙
          </Link>
        </div>
      </header>

      {showMorningNudge && (
        <Link
          to={readinessDone ? '/morning-ei' : '/readiness'}
          className="flex items-center justify-between rounded-card bg-accent-dark/20 p-3 text-sm"
        >
          <span className="text-text-primary">
            {readinessDone ? 'Finish your Morning EI' : 'Start your morning: readiness check'}
          </span>
          <span className="text-accent">›</span>
        </Link>
      )}

      <StreakCard />

      {/* Day's focus */}
      <section className="rounded-card bg-ink-card p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-text-secondary">
            Today’s focus
          </h2>
          <span className="rounded-pill bg-ink px-2 py-0.5 text-xs text-text-secondary">
            {kindLabel(plan.kind)}
          </span>
        </div>
        <p className="mt-1 text-lg font-semibold text-text-primary">{plan.title}</p>
        <p className="text-sm text-text-secondary">{plan.blurb}</p>

        {plan.kind === 'gym' &&
          (sessionLoggedToday ? (
            <p className="mt-3 text-sm font-medium text-success">✓ Session logged</p>
          ) : (
            <Link
              to="/session"
              className="mt-3 block rounded-card bg-accent py-2.5 text-center text-sm font-semibold text-ink"
            >
              {sessionInProgress ? 'Resume session' : 'Start session'}
            </Link>
          ))}

        {plan.kind === 'run' &&
          (runLoggedToday ? (
            <p className="mt-3 text-sm font-medium text-success">✓ Run logged</p>
          ) : (
            <Link
              to="/run"
              className="mt-3 block rounded-card bg-accent py-2.5 text-center text-sm font-semibold text-ink"
            >
              Log run
            </Link>
          ))}
      </section>

      {/* Readiness */}
      <section className="rounded-card bg-ink-card p-4">
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-text-secondary">
          Readiness
        </h2>
        {!entryLoaded ? (
          <p className="text-sm text-text-muted">Loading…</p>
        ) : readiness ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span className="text-text-secondary">
                Sleep <span className="font-semibold text-text-primary">{readiness.sleepHours}h</span>
              </span>
              <span className="text-text-secondary">
                Energy <span className="font-semibold text-text-primary">{readiness.energy}/10</span>
              </span>
              <span className="text-text-secondary">
                Joints <span className="font-semibold text-text-primary">{jointAvg(readiness)}/10</span>
              </span>
              <span className="text-text-secondary">
                Ate normally{' '}
                <span className="font-semibold text-text-primary">
                  {readiness.ateNormally ? 'Yes' : 'No'}
                </span>
              </span>
            </div>
            <Link
              to="/readiness"
              className="self-start text-sm font-medium text-accent"
            >
              Edit check-in
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-text-secondary">
              No check-in yet. Log how you slept and feel to start the day.
            </p>
            <Link
              to="/readiness"
              className="rounded-card bg-accent py-2.5 text-center text-sm font-semibold text-ink"
            >
              Check in
            </Link>
          </div>
        )}
      </section>

      {/* Daily routine */}
      <section className="rounded-card bg-ink-card p-4">
        <h2 className="mb-1 text-sm font-medium uppercase tracking-wide text-text-secondary">
          Daily routine
        </h2>
        <div className="divide-y divide-border-subtle">
          <RoutineRow label="Morning EI" done={entry?.morningEICompleted ?? false} to="/morning-ei" />
          <RoutineRow label="Re-education" done={entry?.reEducationCompleted ?? false} to="/re-education" />
          <RoutineRow label="Rapid Response" done={entry?.rapidResponseCompleted ?? false} to="/rapid-response" />
        </div>
      </section>

      <Link
        to="/history"
        className="flex items-center justify-between rounded-card bg-ink-card p-4 text-sm font-medium text-text-primary"
      >
        History
        <span className="text-text-muted">›</span>
      </Link>
    </main>
  );
}
