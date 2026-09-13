import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSettingsStore } from '../store/settingsStore';
import { useDailyEntryStore } from '../store/dailyEntryStore';
import { useSessionStore } from '../store/sessionStore';
import { useHistoryStore } from '../store/historyStore';
import { formatLongDate, addDays } from '../lib/dates';
import { planForDate } from '../lib/schedule';
import { getSessionPlan } from '../lib/sessionPlan';
import { maybeMorningReminder } from '../lib/notifications';
import { computeStreakStats } from '../lib/streak';

/**
 * Today screen — the app's home hub.
 *
 * 2026-09-12 pivot: one ~30-min morning session per day. The three-part daily
 * routine was collapsed into that single session, so this hub is now: date +
 * phase + streak, a readiness check-in, one session card (Start / Resume /
 * Done), and a peek at tomorrow.
 */

export default function TodayScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const settingsLoaded = useSettingsStore((s) => s.loaded);

  const date = useDailyEntryStore((s) => s.date);
  const entry = useDailyEntryStore((s) => s.entry);
  const entryLoaded = useDailyEntryStore((s) => s.loaded);

  const sessions = useHistoryStore((s) => s.sessions);
  const dailyEntries = useHistoryStore((s) => s.dailyEntries);
  const activeSession = useSessionStore((s) => s.active);

  const plan = planForDate(date);
  const readiness = entry?.readiness ?? null;

  // Consecutive days the daily session was completed (the keystone streak).
  const streak = computeStreakStats(dailyEntries, date).currentStreak;

  // A peek at tomorrow so the user can mentally prepare.
  const tomorrowDate = addDays(date, 1);
  const tomorrow = planForDate(tomorrowDate);

  // Session status for today's card.
  const sessionLoggedToday = sessions.some((s) => s.date === date && s.type === plan.type);
  const sessionInProgress = activeSession?.date === date && activeSession?.type === plan.type;
  const hasPlan = getSessionPlan(plan.type) !== null;

  const showSessionNudge = entryLoaded && hasPlan && !sessionLoggedToday && !sessionInProgress;

  // Best-effort morning reminder (background scheduling needs a server).
  useEffect(() => {
    if (!settings || !entryLoaded) return;
    maybeMorningReminder({
      enabled: settings.notificationsEnabled,
      notificationTime: settings.notificationTime,
      morningDone: sessionLoggedToday,
      todayISO: date,
    });
  }, [settings, entryLoaded, sessionLoggedToday, date]);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-6 pb-24">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-text-secondary">{formatLongDate(date)}</p>
            <Link
              to="/progress"
              aria-label={`${streak}-day session streak`}
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
              Phase {settings.currentPhase}
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

      {/* Readiness check-in — kept at the top until it's logged. */}
      {entryLoaded && !readiness && (
        <Link
          to="/readiness"
          className="flex items-center justify-between rounded-card bg-ink-card p-4"
        >
          <div>
            <h2 className="text-sm font-medium text-text-primary">Morning check-in</h2>
            <p className="text-xs text-text-secondary">Log how you slept and how the joints feel.</p>
          </div>
          <span className="rounded-pill bg-accent px-3 py-1 text-xs font-semibold text-ink">Check in</span>
        </Link>
      )}

      {/* Today's session — the single card. */}
      <section className="rounded-card bg-ink-card p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-text-secondary">
            Today’s session
          </h2>
          {sessionLoggedToday && <span className="text-xs font-medium text-success">✓ Done</span>}
        </div>
        <p className="mt-1 text-lg font-semibold text-text-primary">{plan.title}</p>
        <p className="text-sm text-text-secondary">{plan.blurb}</p>

        {hasPlan && !sessionLoggedToday && (
          <Link
            to="/session"
            className="mt-3 block rounded-card bg-accent py-2.5 text-center text-sm font-semibold text-ink"
          >
            {sessionInProgress ? 'Resume session' : 'Start session'}
          </Link>
        )}
        {sessionLoggedToday && (
          <p className="mt-3 text-sm text-text-secondary">
            Session logged. Nice work — see you tomorrow.
          </p>
        )}
      </section>

      {showSessionNudge && plan.kind === 'rest' && (
        <p className="px-1 text-xs text-text-muted">
          Regeneration day — keep it light, and pair it with an easy walk or jog if you feel good.
        </p>
      )}

      {/* Coming up tomorrow — tap to preview the full plan (read-only). */}
      <Link to={`/preview/${tomorrowDate}`} className="block rounded-card bg-ink-card p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-text-secondary">
            Coming up
          </h2>
          <span className="text-text-muted">›</span>
        </div>
        <p className="mt-1 text-xs text-text-muted">Tomorrow · {formatLongDate(tomorrowDate)}</p>
        <p className="text-base font-semibold text-text-primary">{tomorrow.title}</p>
        <p className="text-sm text-text-secondary">{tomorrow.blurb}</p>
      </Link>
    </main>
  );
}
