import { type CSSProperties, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../store/settingsStore';
import { todayISO, fromISODate, toISODate, formatLongDate, formatShortDate } from '../lib/dates';
import { phaseRanges, phaseForDate, programEndISO, phaseOverview } from '../lib/phases';

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
  // Which phase's overview is expanded. null → default to the current phase;
  // 0 → explicitly none open. (Hook must run before the early return below.)
  const [openPhase, setOpenPhase] = useState<number | null>(null);

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

  // Default the open overview to the current phase until the user picks another.
  const shownPhase = openPhase === null ? todayPhase ?? 0 : openPhase;
  function togglePhase(p: number) {
    setOpenPhase((cur) => {
      const current = cur === null ? todayPhase ?? 0 : cur;
      return current === p ? 0 : p;
    });
  }

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

      {/* Phase milestones — tap a phase for its dates and what it's aiming for. */}
      <section className="rounded-card bg-ink-card p-4">
        <h2 className="mb-1 text-sm font-medium uppercase tracking-wide text-text-secondary">
          Phase milestones
        </h2>
        <p className="mb-2 text-xs text-text-muted">Tap a phase to see what it’s aiming for.</p>
        <ul className="flex flex-col">
          {ranges.map((r) => {
            const ov = phaseOverview(r.phase);
            const open = shownPhase === r.phase;
            return (
              <li key={r.phase} className="border-b border-border-subtle last:border-0">
                <button
                  type="button"
                  onClick={() => togglePhase(r.phase)}
                  aria-expanded={open}
                  className="flex w-full items-start gap-2 py-2 text-left"
                >
                  <span
                    className="mt-1 h-3 w-3 flex-shrink-0 rounded-sm"
                    style={{ backgroundColor: PHASE_COLORS[r.phase - 1] }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">
                        Phase {r.phase}
                        {ov ? ` — ${ov.theme}` : ''}
                      </span>
                      {r.phase === todayPhase && (
                        <span className="text-xs font-medium text-accent">now</span>
                      )}
                    </span>
                    <span className="block text-xs text-text-muted">
                      {formatShortDate(r.startISO)} – {formatShortDate(r.endISO)}
                    </span>
                  </span>
                  <span className="flex-shrink-0 text-text-muted">{open ? '⌄' : '›'}</span>
                </button>
                {open && ov && (
                  <div className="pb-3 pl-5 pr-1">
                    <p className="text-sm text-text-secondary">{ov.summary}</p>
                    <ul className="mt-2 list-inside list-disc text-sm text-text-secondary">
                      {ov.goals.map((g, i) => (
                        <li key={i}>{g}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
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
