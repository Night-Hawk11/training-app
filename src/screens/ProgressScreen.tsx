import { useNavigate } from 'react-router-dom';
import { useHistoryStore } from '../store/historyStore';
import { useSettingsStore } from '../store/settingsStore';
import { todayISO, daysBetween } from '../lib/dates';
import { computeStreakStats, recentDays, type DayStatus } from '../lib/streak';

/**
 * Progress screen (Step 9 follow-up) — the full view of morning-routine
 * adherence: streaks, the 90-day keystone arc, banked EI hold-time, a 30-day
 * status grid, and which of the three flows is lagging. This is the app's
 * answer to "EI gives no feedback" — it makes the daily foundation visible.
 */

// The morning-routine rewiring commitment, in days (see program brief).
const ARC_DAYS = 90;

const DOT: Record<DayStatus, string> = {
  complete: 'bg-success',
  partial: 'bg-warning',
  none: 'bg-border-subtle',
};

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-card bg-ink-card p-4">
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-sm text-text-secondary">{label}</p>
      {sub && <p className="text-xs text-text-muted">{sub}</p>}
    </div>
  );
}

function ComponentBar({ label, done, total }: { label: string; done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="text-text-secondary">{label}</span>
        <span className="text-text-muted">
          {done}/{total}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-pill bg-border-subtle">
        <div className="h-full rounded-pill bg-accent" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ProgressScreen() {
  const navigate = useNavigate();
  const dailyEntries = useHistoryStore((s) => s.dailyEntries);
  const startDate = useSettingsStore((s) => s.settings?.startDate);

  const today = todayISO();
  const stats = computeStreakStats(dailyEntries, today);
  const strip = recentDays(dailyEntries, today, 30);

  // 90-day keystone arc. Day 1 is the program start date.
  const dayNumber = startDate ? Math.max(1, daysBetween(startDate, today) + 1) : 1;
  const arcDay = Math.min(dayNumber, ARC_DAYS);
  const arcPct = Math.round((arcDay / ARC_DAYS) * 100);
  const elapsed = Math.max(1, Math.min(dayNumber, ARC_DAYS));
  const adherence = Math.round((stats.completedDays / elapsed) * 100);

  const eiMinutes = Math.round(stats.totalEiSeconds / 60);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-6 pb-24">
      <header>
        <button type="button" onClick={() => navigate('/')} className="mb-2 text-sm text-text-muted">
          ← Today
        </button>
        <h1 className="text-xl font-semibold text-text-primary">Progress</h1>
        <p className="text-sm text-text-secondary">Daily foundation — your keystone</p>
      </header>

      {/* Streak hero */}
      <section className="rounded-card bg-ink-card p-5 text-center">
        <p className="text-5xl font-bold text-text-primary">🔥 {stats.currentStreak}</p>
        <p className="mt-1 text-sm text-text-secondary">
          day streak{stats.todayStatus !== 'complete' && stats.currentStreak > 0 ? ' · today still open' : ''}
        </p>
      </section>

      {/* 90-day arc */}
      <section className="rounded-card bg-ink-card p-4">
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-text-secondary">
            90-day rewire
          </h2>
          <span className="text-sm text-text-secondary">
            Day {arcDay} of {ARC_DAYS}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-pill bg-border-subtle">
          <div className="h-full rounded-pill bg-accent transition-all" style={{ width: `${arcPct}%` }} />
        </div>
        <p className="mt-2 text-xs text-text-muted">
          {stats.completedDays} routines completed so far · keep stacking days.
        </p>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Best streak" value={`${stats.longestStreak}`} sub="days in a row" />
        <Stat label="Days done" value={`${stats.completedDays}`} sub={`${adherence}% of days`} />
        <Stat label="Time banked" value={`${eiMinutes}`} sub="minutes of holds" />
        <Stat label="Today" value={stats.todayStatus === 'complete' ? '✓' : '—'} sub="routine complete" />
      </div>

      {/* Last 30 days */}
      <section className="rounded-card bg-ink-card p-4">
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-text-secondary">
          Last 30 days
        </h2>
        <div className="grid grid-cols-10 gap-1.5">
          {strip.map((d) => (
            <span
              key={d.date}
              title={d.date}
              className={`aspect-square rounded-sm ${DOT[d.status]} ${
                d.date === today ? 'ring-1 ring-accent' : ''
              }`}
            />
          ))}
        </div>
        <div className="mt-2 flex gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-success" /> done
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-border-subtle" /> missed
          </span>
        </div>
      </section>

      {/* Foundation adherence */}
      <section className="rounded-card bg-ink-card p-4">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-text-secondary">
          Adherence
        </h2>
        <ComponentBar label="Daily Foundation" done={stats.perComponent.ei} total={elapsed} />
      </section>

      <button
        type="button"
        onClick={() => navigate('/calendar')}
        className="flex items-center justify-between rounded-card bg-ink-card p-4 text-left text-sm font-medium text-text-primary"
      >
        Program calendar
        <span className="text-text-muted">›</span>
      </button>
    </main>
  );
}
