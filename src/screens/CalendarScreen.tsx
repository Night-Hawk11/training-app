import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Lock, Target, ChevronDown, ChevronRight } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import BackButton from '../components/BackButton';
import { todayISO, daysBetween, formatLongDate } from '../lib/dates';
import { phaseOverview, PHASE_COUNT } from '../lib/phases';
import { SESSION_META, sessionTypeForDate } from '../lib/schedule';
import type { SessionType } from '../data/types';

/**
 * Plan / progress — a CRITERIA-GATED roadmap, not a date schedule.
 *
 * The program advances on movement criteria, not the calendar: currentPhase is
 * set manually (Settings / the Phase check-in) as it's earned. This screen shows
 * where you ACTUALLY are — the current phase and the 4-phase ladder with each
 * phase's unlock criteria — plus the weekly training rhythm. It deliberately does
 * NOT project phases onto dates or imply an end date, which previously made it
 * look like you "should" be returning to court by now when the gates (still held)
 * say otherwise.
 */

// The weekly DUP rhythm, Monday-first (keys are legacy; meaning is the title).
const WEEK: SessionType[] = [
  'monday_upper',
  'tuesday_lower_athletic',
  'wednesday_run',
  'thursday_upper_athletic',
  'friday_lower_athletic',
  'saturday_long_run',
  'sunday_rest_walk',
];
const WEEKDAY_LABEL = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const today = todayISO();
  const [openPhase, setOpenPhase] = useState<number | null>(null);

  if (!settings) {
    return (
      <main className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-text-secondary">Loading your program…</p>
        <Link to="/" className="btn-primary px-6">
          Back to Today
        </Link>
      </main>
    );
  }

  const currentPhase = settings.currentPhase;
  const current = phaseOverview(currentPhase);
  const dayInPhase = settings.phaseStartDate
    ? Math.max(1, daysBetween(settings.phaseStartDate, today) + 1)
    : null;
  const programDay = Math.max(1, daysBetween(settings.startDate, today) + 1);
  const todayType = sessionTypeForDate(today);

  // Default the open overview to the current phase until the user taps another.
  const shownPhase = openPhase ?? currentPhase;

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-6 pb-24">
      <header>
        <BackButton />
        <h1 className="text-2xl font-bold text-text-primary">Your plan</h1>
        <p className="text-sm text-text-secondary">Earned by movement, not by date.</p>
      </header>

      {/* You-are-here hero — the ACTUAL current phase, not a date projection. */}
      <section className="hero p-5">
        <p className="eyebrow">You’re in</p>
        <h2 className="mt-1 text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-text-primary">
          Phase {currentPhase}
          <span className="block text-lg font-semibold text-text-secondary">{current?.theme}</span>
        </h2>
        <span className="ground-tick mt-3" />
        <div className="mt-3 flex items-center gap-4 text-sm text-text-secondary">
          {dayInPhase != null && (
            <span>
              <span className="metric text-text-primary">{dayInPhase}</span> days in this phase
            </span>
          )}
          <span>
            Program day <span className="metric text-text-primary">{programDay}</span>
          </span>
        </div>
        {current?.summary && (
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">{current.summary}</p>
        )}
      </section>

      {/* Make the model explicit + route to the gate. */}
      <Link to="/phase-check" className="surface-tap flex items-center justify-between p-4">
        <div className="pr-3">
          <p className="text-sm font-semibold text-text-primary">Phases are earned, not dated</p>
          <p className="text-xs text-text-secondary">
            Advance from the check-in when the next phase’s marks feel consistent — not on a schedule.
          </p>
        </div>
        <ChevronRight size={18} className="flex-shrink-0 text-accent" aria-hidden />
      </Link>

      {/* The 4-phase ladder — done / current / locked, with unlock criteria. */}
      <section className="flex flex-col gap-2">
        <h2 className="eyebrow px-1">The ladder</h2>
        {Array.from({ length: PHASE_COUNT }, (_, i) => i + 1).map((p) => {
          const ov = phaseOverview(p);
          if (!ov) return null;
          const status = p < currentPhase ? 'done' : p === currentPhase ? 'current' : 'locked';
          const open = shownPhase === p;
          const isTop = p >= PHASE_COUNT;
          return (
            <div
              key={p}
              className={`surface overflow-hidden ${status === 'current' ? 'ring-1 ring-accent/50' : ''}`}
            >
              <button
                type="button"
                onClick={() => setOpenPhase(open ? -1 : p)}
                aria-expanded={open}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <span className="flex-shrink-0">
                  {status === 'done' ? (
                    <CheckCircle2 size={22} className="text-success" aria-hidden />
                  ) : status === 'current' ? (
                    <Target size={22} className="text-accent" aria-hidden />
                  ) : (
                    <Lock size={20} className="text-text-muted" aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">Phase {p}</span>
                    {status === 'current' && (
                      <span className="pill bg-accent text-[11px] text-white">now</span>
                    )}
                    {status === 'done' && <span className="text-xs text-success">done</span>}
                  </span>
                  <span className="block text-sm text-text-secondary">{ov.theme}</span>
                </span>
                <ChevronDown
                  size={18}
                  aria-hidden
                  className={`flex-shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
                />
              </button>
              {open && (
                <div className="border-t border-white/[0.06] px-4 pb-4 pt-3">
                  <p className="text-sm leading-relaxed text-text-secondary">{ov.summary}</p>
                  <p className="eyebrow mt-3">
                    {isTop ? 'You’ve arrived when' : 'Unlocks when — consistently, not one good day'}
                  </p>
                  <ul className="mt-1.5 flex flex-col gap-1.5">
                    {ov.readyToAdvance.map((c, ci) => (
                      <li key={ci} className="flex gap-2 text-sm text-text-secondary">
                        <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent/70" aria-hidden />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Weekly rhythm — the same every week; the tier/emphasis undulate (DUP). */}
      <section className="surface p-4">
        <h2 className="eyebrow mb-3">Your week</h2>
        <div className="flex flex-col gap-1.5">
          {WEEK.map((type, i) => {
            const meta = SESSION_META[type];
            const isToday = type === todayType;
            return (
              <div
                key={type}
                className={`flex items-center gap-3 rounded-[10px] px-2 py-1.5 ${
                  isToday ? 'bg-accent/12' : ''
                }`}
              >
                <span
                  className={`w-9 flex-shrink-0 text-xs font-semibold ${
                    isToday ? 'text-accent' : 'text-text-muted'
                  }`}
                >
                  {WEEKDAY_LABEL[i]}
                </span>
                <span className={`flex-1 text-sm ${isToday ? 'text-text-primary' : 'text-text-secondary'}`}>
                  {meta.title}
                </span>
                {isToday && <span className="pill bg-accent text-[11px] text-white">today</span>}
              </div>
            );
          })}
        </div>
      </section>

      <p className="px-1 text-xs text-text-muted">
        Started {formatLongDate(settings.startDate)}. Change your phase anytime in Settings or via the
        check-in — it tracks what you’ve earned, not the calendar.
      </p>
    </main>
  );
}
