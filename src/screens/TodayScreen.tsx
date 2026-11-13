import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Settings as SettingsIcon, Play, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { useDailyEntryStore } from '../store/dailyEntryStore';
import { useSessionStore } from '../store/sessionStore';
import { useHistoryStore } from '../store/historyStore';
import { formatLongDate, addDays } from '../lib/dates';
import { planForDate } from '../lib/schedule';
import { getSessionPlan } from '../lib/sessionPlan';
import { maybeMorningReminder } from '../lib/notifications';
import { computeStreakStats } from '../lib/streak';
import { evaluatePhaseGate } from '../lib/phaseGate';

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

  // Phase advancement gate — surfaces a banner when the log-based criteria are met.
  const phaseGate = settings ? evaluatePhaseGate(settings.currentPhase, dailyEntries, date) : null;
  const phaseReady = !!phaseGate && phaseGate.autoMet && phaseGate.nextPhase != null;

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
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-6 pb-28">
      {/* Top row — date, streak, phase, settings. */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-text-secondary">{formatLongDate(date)}</p>
        <div className="flex items-center gap-2">
          <Link
            to="/progress"
            aria-label={`${streak}-day session streak`}
            className="chip text-text-primary"
          >
            <Flame size={13} className="text-warning" aria-hidden /> {streak}
          </Link>
          {settingsLoaded && settings && (
            <Link
              to="/phase-check"
              aria-label="Phase check-in"
              className={`pill ${phaseReady ? 'bg-accent-grad text-white shadow-glow' : 'chip'}`}
            >
              Phase {settings.currentPhase}
            </Link>
          )}
          <Link
            to="/settings"
            aria-label="Settings"
            className="flex h-8 w-8 items-center justify-center rounded-pill bg-white/[0.06] text-text-secondary"
          >
            <SettingsIcon size={16} aria-hidden />
          </Link>
        </div>
      </div>

      {/* Readiness check-in — kept at the top until it's logged. */}
      {entryLoaded && !readiness && (
        <Link to="/readiness" className="surface-tap flex items-center justify-between p-4">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Morning check-in</h2>
            <p className="text-xs text-text-secondary">Log how you slept and how the joints feel.</p>
          </div>
          <span className="pill bg-accent-grad text-white shadow-glow">Check in</span>
        </Link>
      )}

      {/* Phase advancement — shown once the log-based criteria are met. */}
      {phaseReady && phaseGate && (
        <Link
          to="/phase-check"
          className="surface-tap flex items-center justify-between border-accent/30 bg-accent/10 p-3"
        >
          <div>
            <p className="text-sm font-semibold text-text-primary">
              You’ve hit the marks for Phase {phaseGate.nextPhase}
            </p>
            <p className="text-xs text-text-secondary">Review the check-in and advance.</p>
          </div>
          <ChevronRight size={18} className="text-accent" aria-hidden />
        </Link>
      )}

      {/* HERO — today's session, the centerpiece. */}
      <section className="hero p-5">
        <div className="flex items-center justify-between">
          <p className="eyebrow">Today’s session</p>
          {sessionLoggedToday && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
              <CheckCircle2 size={14} aria-hidden /> Done
            </span>
          )}
        </div>
        <h1 className="mt-2 text-2xl font-bold leading-tight text-text-primary">{plan.title}</h1>
        <p className="mt-1 text-sm text-text-secondary">{plan.blurb}</p>

        {hasPlan && !sessionLoggedToday && (
          <Link to="/session" className="btn-primary mt-4 w-full">
            <Play size={17} aria-hidden />
            {sessionInProgress ? 'Resume session' : 'Start session'}
          </Link>
        )}
        {sessionLoggedToday && (
          <p className="mt-4 text-sm text-text-secondary">
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
      <Link to={`/preview/${tomorrowDate}`} className="surface-tap block p-4">
        <div className="flex items-center justify-between">
          <p className="eyebrow">Coming up</p>
          <ChevronRight size={16} className="text-text-muted" aria-hidden />
        </div>
        <p className="mt-1.5 text-xs text-text-muted">Tomorrow · {formatLongDate(tomorrowDate)}</p>
        <p className="text-base font-semibold text-text-primary">{tomorrow.title}</p>
        <p className="text-sm text-text-secondary">{tomorrow.blurb}</p>
      </Link>
    </main>
  );
}
