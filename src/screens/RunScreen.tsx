import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { runRepo } from '../db/repositories';
import { useHistoryStore } from '../store/historyStore';
import { todayISO, formatLongDate } from '../lib/dates';
import { planForDate } from '../lib/schedule';
import type { RunSurface, RunType } from '../data/types';

/**
 * Run logging screen (KICKOFF_BRIEF.md 4.7 / Step 8).
 *
 * Logs a RunEntry for today. The run type is derived from the day (Wednesday /
 * Saturday / other); the user records duration, optional distance, surface,
 * effort (RPE), and notes. Saved via runRepo and reflected on the Today card.
 */

const SURFACES: RunSurface[] = ['treadmill', 'road', 'trail', 'track'];

function runTypeForToday(): { type: RunType; label: string } {
  const t = planForDate(todayISO()).type;
  if (t === 'wednesday_run') return { type: 'wednesday', label: 'Wednesday run' };
  if (t === 'saturday_long_run') return { type: 'saturday', label: 'Saturday long run' };
  return { type: 'other', label: 'Run' };
}

export default function RunScreen() {
  const navigate = useNavigate();
  const date = todayISO();
  const { type, label } = runTypeForToday();

  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [surface, setSurface] = useState<RunSurface>('road');
  const [rpe, setRpe] = useState(5);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const durationMin = Number(duration);
  const canSave = duration.trim() !== '' && Number.isFinite(durationMin) && durationMin > 0;

  async function save() {
    if (!canSave) return;
    setSaving(true);
    const distanceMiles = distance.trim() ? Number(distance) : undefined;
    await runRepo.create({
      date,
      type,
      durationMin,
      ...(distanceMiles && distanceMiles > 0 ? { distanceMiles } : {}),
      surface,
      rpe,
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    });
    await useHistoryStore.getState().loadAll();
    navigate('/');
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-6">
      <header>
        <button type="button" onClick={() => navigate('/')} className="mb-2 text-sm text-text-muted">
          ← Today
        </button>
        <h1 className="text-xl font-semibold text-text-primary">{label}</h1>
        <p className="text-sm text-text-secondary">{formatLongDate(date)}</p>
      </header>

      <label className="flex items-center justify-between rounded-card bg-ink-card p-4">
        <span className="text-sm text-text-secondary">Duration (min)</span>
        <input
          type="number"
          inputMode="numeric"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="—"
          className="w-24 rounded-md bg-ink px-2 py-1 text-right text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
        />
      </label>

      <label className="flex items-center justify-between rounded-card bg-ink-card p-4">
        <span className="text-sm text-text-secondary">Distance (mi) — optional</span>
        <input
          type="number"
          inputMode="decimal"
          value={distance}
          onChange={(e) => setDistance(e.target.value)}
          placeholder="—"
          className="w-24 rounded-md bg-ink px-2 py-1 text-right text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
        />
      </label>

      <section className="rounded-card bg-ink-card p-4">
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-text-secondary">Surface</h2>
        <div className="flex flex-wrap gap-2">
          {SURFACES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSurface(s)}
              className={`rounded-pill px-4 py-1.5 text-sm font-medium capitalize ${
                surface === s ? 'bg-accent text-ink' : 'bg-ink text-text-secondary'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-card bg-ink-card p-4">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-sm text-text-secondary">Effort (RPE)</span>
          <span className="text-sm font-semibold text-text-primary">{rpe}</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={rpe}
          onChange={(e) => setRpe(Number(e.target.value))}
          className="w-full accent-accent"
        />
      </section>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-text-secondary">Notes (optional)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Route, how it felt…"
          className="w-full resize-none rounded-md bg-ink-card p-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-border-focus"
        />
      </label>

      <button
        type="button"
        onClick={save}
        disabled={!canSave || saving}
        className="rounded-card bg-accent py-3 text-base font-semibold text-ink disabled:opacity-50"
      >
        Save run
      </button>
    </main>
  );
}
