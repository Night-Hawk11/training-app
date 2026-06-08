import { type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../store/settingsStore';
import { todayISO, fromISODate, toISODate, formatLongDate, formatShortDate } from '../lib/dates';
import { phaseRanges, phaseForDate, programEndISO } from '../lib/phases';

/**
 * Program calendar (the "Coming up" milestones the user asked for).
 *
 * Renders a month-by-month grid across the whole program, each day tinted by
 * its phase, with phase-start days bordered and today outlined. The legend
 * doubles as the milestone-date list. Read-only: derived from the start date in
 * Settings; nothing here changes state.
 */

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

// Five distinct phase colors, readable on the dark theme.
const PHASE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444'];

export default function CalendarScreen() {
  const navigate = useNavigate();
  const startISO = useSettingsStore((s) => s.settings?.startDate);
  const today = todayISO();

  if (!startISO) {
    return (
      <main className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-text-secondary">Loading your program…</p>
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

  const endISO = programEndISO(startISO);
  const ranges = phaseRanges(startISO);
  const phaseStartISOs = new Set(ranges.map((r) => r.startISO));
  const todayPhase = phaseForDate(startISO, today);

  // Enumerate every month from the start month through the end month.
  const startD = fromISODate(startISO);
  const endD = fromISODate(endISO);
  const months: { year: number; month: number }[] = [];
  let y = startD.getFullYear();
  let m = startD.getMonth();
  while (y < endD.getFullYear() || (y === endD.getFullYear() && m <= endD.getMonth())) {
    months.push({ year: y, month: m });
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-6">
      <header>
        <button type="button" onClick={() => navigate('/')} className="mb-2 text-sm text-text-muted">
          ← Today
        </button>
        <h1 className="text-xl font-semibold text-text-primary">Program calendar</h1>
        <p className="text-sm text-text-secondary">
          {formatLongDate(startISO)} → {formatLongDate(endISO)} · 20 weeks
        </p>
      </header>

      {/* Phase milestones — the legend doubles as the date list. */}
      <section className="rounded-card bg-ink-card p-4">
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-text-secondary">
          Phase milestones
        </h2>
        <ul className="flex flex-col gap-2">
          {ranges.map((r) => (
            <li key={r.phase} className="flex items-center gap-2 text-sm">
              <span
                className="h-3 w-3 flex-shrink-0 rounded-sm"
                style={{ backgroundColor: PHASE_COLORS[r.phase - 1] }}
              />
              <span className="font-medium text-text-primary">Phase {r.phase}</span>
              <span className="text-text-secondary">
                {formatShortDate(r.startISO)} – {formatShortDate(r.endISO)}
              </span>
              {r.phase === todayPhase && (
                <span className="ml-auto text-xs font-medium text-accent">you are here</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Month grids */}
      {months.map(({ year, month }) => {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const lead = new Date(year, month, 1).getDay();
        const cells: (string | null)[] = [];
        for (let i = 0; i < lead; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(toISODate(new Date(year, month, d)));

        return (
          <section key={`${year}-${month}`} className="rounded-card bg-ink-card p-3">
            <h3 className="mb-2 text-sm font-semibold text-text-primary">
              {MONTHS[month]} {year}
            </h3>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase text-text-muted">
              {WEEKDAYS.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {cells.map((iso, i) => {
                if (!iso) return <span key={`blank-${i}`} aria-hidden />;
                const phase = phaseForDate(startISO, iso);
                const color = phase ? PHASE_COLORS[phase - 1] : null;
                const isStart = phaseStartISOs.has(iso);
                const isToday = iso === today;

                const style: CSSProperties = {};
                if (color) style.backgroundColor = `${color}3d`; // ~24% alpha tint
                if (isStart && color) style.border = `2px solid ${color}`;
                if (isToday) style.outline = '2px solid #ffffff';

                return (
                  <span
                    key={iso}
                    title={`${iso}${phase ? ` · Phase ${phase}` : ''}${isStart ? ' · phase start' : ''}`}
                    style={style}
                    className={`flex aspect-square items-center justify-center rounded-md text-xs ${
                      phase ? 'text-text-primary' : 'text-text-muted'
                    } ${isStart ? 'font-bold' : ''}`}
                  >
                    {Number(iso.slice(8, 10))}
                  </span>
                );
              })}
            </div>
          </section>
        );
      })}

      <p className="text-xs text-text-muted">
        White outline = today · colored border = phase start. Dates are the planned schedule from
        your start date (change it in Settings).
      </p>
    </main>
  );
}
