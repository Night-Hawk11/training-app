import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettingsStore } from '../store/settingsStore';
import { useDailyEntryStore } from '../store/dailyEntryStore';
import { useSessionStore } from '../store/sessionStore';
import { useHistoryStore } from '../store/historyStore';
import { formatLongDate, addDays } from '../lib/dates';
import { planForDate, runDistanceTarget } from '../lib/schedule';
import { maybeMorningReminder } from '../lib/notifications';
import { computeStreakStats } from '../lib/streak';

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
  const dailyEntries = useHistoryStore((s) => s.dailyEntries);
  const activeSession = useSessionStore((s) => s.active);

  // Daily routine starts collapsed — tap the header to reveal the three flows.
  const [routineOpen, setRoutineOpen] = useState(false);

  const plan = planForDate(date);
  const readiness = entry?.readiness ?? null;

  // Consecutive days the full morning routine was completed (the keystone
  // streak), shown as a fire badge by the date.
  const streak = computeStreakStats(dailyEntries, date).currentStreak;

  // Rough mileage to aim for on run days, scaled to the current phase.
  const runTarget =
    plan.kind === 'run' && settings ? runDistanceTarget(plan.type, settings.currentPhase) : null;

  // A peek at tomorrow so the user can mentally prepare. Phase is assumed
  // unchanged overnight (it only advances on manual phase changes).
  const tomorrowDate = addDays(date, 1);
  const tomorrow = planForDate(tomorrowDate);
  const tomorrowRunTarget =
    tomorrow.kind === 'run' && settings
      ? runDistanceTarget(tomorrow.type, settings.currentPhase)
      : null;

  // Gym-day session status, for the focus-card CTA.
  const sessionLoggedToday = sessions.some((s) => s.date === date && s.type === plan.type);
  const sessionInProgress = activeSession?.date === date && activeSession?.type === plan.type;
  // Run-day status.
  const runLoggedToday = runs.some((r) => r.date === date);

  // Morning routine nudge: walk through all three flows (what the streak
  // counts), not just Morning EI, so it keeps nudging until the routine's done.
  // Readiness has its own card/CTA below, so it's not part of this banner.
  const morningEIDone = entry?.morningEICompleted ?? false;
  const reEducationDone = entry?.reEducationCompleted ?? false;
  const rapidResponseDone = entry?.rapidResponseCompleted ?? false;
  const routineComplete = morningEIDone && reEducationDone && rapidResponseDone;
  const routineDone = [morningEIDone, reEducationDone, rapidResponseDone].filter(Boolean).length;

  const nextFlow = !morningEIDone
    ? { to: '/morning-ei', label: 'Morning EI' }
    : !reEducationDone
      ? { to: '/re-education', label: 'Re-education' }
      : !rapidResponseDone
        ? { to: '/rapid-response', label: 'Rapid Response' }
        : null;
  const showMorningNudge = entryLoaded && nextFlow !== null;

  // Best-effort notification (see lib/notifications — background scheduling
  // needs a server). Fires until the full routine is done, not just EI.
  useEffect(() => {
    if (!settings || !entryLoaded) return;
    maybeMorningReminder({
      enabled: settings.notificationsEnabled,
      notificationTime: settings.notificationTime,
      morningDone: routineComplete,
      todayISO: date,
    });
  }, [settings, entryLoaded, routineComplete, date]);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-text-secondary">{formatLongDate(date)}</p>
            <Link
              to="/progress"
              aria-label={`${streak}-day routine streak`}
              className="text-sm font-semibold text-text-primary"
            >
              🔥 {streak}
            </Link>
          </div>
          <h1 className="text-2xl font-semibold text-text-primary">Today</h1>
        </div>
        <div className="flex items-center gap-2">
          {settingsLoaded && settings && (
            <Link
              to="/calendar"
              aria-label="Program calendar"
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

      {showMorningNudge && nextFlow && (
        <Link
          to={nextFlow.to}
          className="flex items-center justify-between rounded-card bg-accent-dark/20 p-3 text-sm"
        >
          <span className="text-text-primary">
            {morningEIDone ? `Next: ${nextFlow.label}` : 'Start your morning routine'}
          </span>
          <span className="text-accent">›</span>
        </Link>
      )}

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
        {runTarget && (
          <p className="mt-1 text-sm text-text-secondary">
            Target distance: <span className="font-semibold text-text-primary">~{runTarget}</span>
          </p>
        )}

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

      {/* Coming up tomorrow — tap to preview the full plan (read-only). */}
      <Link to={`/preview/${tomorrowDate}`} className="block rounded-card bg-ink-card p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-text-secondary">
            Coming up
          </h2>
          <span className="rounded-pill bg-ink px-2 py-0.5 text-xs text-text-secondary">
            {kindLabel(tomorrow.kind)}
          </span>
        </div>
        <p className="mt-1 text-xs text-text-muted">Tomorrow · {formatLongDate(tomorrowDate)}</p>
        <p className="text-base font-semibold text-text-primary">{tomorrow.title}</p>
        <p className="text-sm text-text-secondary">{tomorrow.blurb}</p>
        {tomorrowRunTarget && (
          <p className="mt-1 text-sm text-text-secondary">
            Target distance:{' '}
            <span className="font-semibold text-text-primary">~{tomorrowRunTarget}</span>
          </p>
        )}
        <p className="mt-2 text-sm font-medium text-accent">View tomorrow’s plan ›</p>
      </Link>

      {/* Readiness — check-in CTA only. Once logged for the day the block
          disappears (the data is saved); it returns with tomorrow's entry. */}
      {entryLoaded && !readiness && (
        <section className="rounded-card bg-ink-card p-4">
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-text-secondary">
            Readiness
          </h2>
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
        </section>
      )}

      {/* Daily routine — collapsed by default; tap the header to reveal. */}
      <section className="rounded-card bg-ink-card p-4">
        <button
          type="button"
          onClick={() => setRoutineOpen((o) => !o)}
          aria-expanded={routineOpen}
          className="flex w-full items-center justify-between"
        >
          <h2 className="text-sm font-medium uppercase tracking-wide text-text-secondary">
            Daily routine
          </h2>
          <span className="flex items-center gap-2 text-xs text-text-muted">
            {routineDone}/3 done
            <span>{routineOpen ? '⌄' : '›'}</span>
          </span>
        </button>
        {routineOpen && (
          <div className="mt-1 divide-y divide-border-subtle">
            <RoutineRow label="Morning EI" done={morningEIDone} to="/morning-ei" />
            <RoutineRow label="Re-education" done={reEducationDone} to="/re-education" />
            <RoutineRow label="Rapid Response" done={rapidResponseDone} to="/rapid-response" />
          </div>
        )}
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
