import { Link } from 'react-router-dom';
import { useHistoryStore } from '../store/historyStore';
import { todayISO } from '../lib/dates';
import { computeStreakStats, recentDays, type DayStatus } from '../lib/streak';

/**
 * Compact morning-routine streak card for the Today screen (Step 9 follow-up).
 *
 * Surfaces the keystone metric — consecutive days the full morning routine was
 * done — plus a 14-day status strip, so the foundational work that produces no
 * pump still has visible, rewarding feedback. Taps through to the full Progress
 * screen.
 */

const DOT: Record<DayStatus, string> = {
  complete: 'bg-success',
  partial: 'bg-warning',
  none: 'bg-border-subtle',
};

export default function StreakCard() {
  const dailyEntries = useHistoryStore((s) => s.dailyEntries);
  const today = todayISO();
  const stats = computeStreakStats(dailyEntries, today);
  const strip = recentDays(dailyEntries, today, 14);

  const fresh = stats.currentStreak === 0 && stats.completedDays === 0;

  return (
    <Link to="/progress" className="block rounded-card bg-ink-card p-4">
      <div className="flex items-center justify-between">
        <div>
          {fresh ? (
            <>
              <p className="text-lg font-semibold text-text-primary">Start your streak</p>
              <p className="text-sm text-text-secondary">Do today’s morning routine to begin.</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-text-primary">
                🔥 {stats.currentStreak} day{stats.currentStreak === 1 ? '' : 's'}
              </p>
              <p className="text-sm text-text-secondary">
                Best {stats.longestStreak} · {stats.completedDays} routine
                {stats.completedDays === 1 ? '' : 's'} done
              </p>
            </>
          )}
        </div>
        <span className="text-text-muted">›</span>
      </div>

      <div className="mt-3 flex items-center gap-1">
        {strip.map((d) => (
          <span
            key={d.date}
            title={d.date}
            className={`h-3 flex-1 rounded-sm ${DOT[d.status]} ${d.date === today ? 'ring-1 ring-accent' : ''}`}
          />
        ))}
      </div>
    </Link>
  );
}
