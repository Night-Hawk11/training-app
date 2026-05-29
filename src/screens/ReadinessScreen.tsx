import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDailyEntryStore } from '../store/dailyEntryStore';
import { formatLongDate } from '../lib/dates';
import type { Readiness } from '../data/types';

/**
 * Morning readiness check (KICKOFF_BRIEF.md 4.2).
 *
 * Captures the Readiness fields (sleep, per-joint check, energy, ate normally,
 * notes) for today's DailyEntry, then returns to the Today screen. Re-opening
 * the check prefills the existing values so it doubles as an edit screen.
 */

// 1–10 scale slider with a live value readout.
function ScaleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-sm text-text-secondary">{label}</span>
        <span className="text-sm font-semibold text-text-primary">{value}</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
    </label>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card bg-ink-card p-4">
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-text-secondary">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function ReadinessScreen() {
  const navigate = useNavigate();
  const date = useDailyEntryStore((s) => s.date);
  const existing = useDailyEntryStore((s) => s.entry?.readiness ?? null);
  const saveReadiness = useDailyEntryStore((s) => s.saveReadiness);

  const [sleepHours, setSleepHours] = useState(existing?.sleepHours ?? 7);
  const [knees, setKnees] = useState(existing?.jointCheck.knees ?? 5);
  const [ankles, setAnkles] = useState(existing?.jointCheck.ankles ?? 5);
  const [hips, setHips] = useState(existing?.jointCheck.hips ?? 5);
  const [energy, setEnergy] = useState(existing?.energy ?? 5);
  const [ateNormally, setAteNormally] = useState(existing?.ateNormally ?? true);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const readiness: Readiness = {
      sleepHours,
      jointCheck: { knees, ankles, hips },
      energy,
      ateNormally,
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    };
    await saveReadiness(readiness);
    navigate('/');
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-6">
      <header>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mb-2 text-sm text-text-muted"
        >
          ← Today
        </button>
        <h1 className="text-xl font-semibold text-text-primary">Readiness check</h1>
        <p className="text-sm text-text-secondary">{formatLongDate(date)}</p>
      </header>

      <Card title="Sleep">
        <label className="block">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-sm text-text-secondary">Hours slept</span>
            <span className="text-sm font-semibold text-text-primary">{sleepHours}</span>
          </div>
          <input
            type="range"
            min={0}
            max={12}
            step={0.5}
            value={sleepHours}
            onChange={(e) => setSleepHours(Number(e.target.value))}
            className="w-full accent-accent"
          />
        </label>
      </Card>

      <Card title="Joint check (1–10)">
        <div className="flex flex-col gap-3">
          <ScaleField label="Knees" value={knees} onChange={setKnees} />
          <ScaleField label="Ankles" value={ankles} onChange={setAnkles} />
          <ScaleField label="Hips" value={hips} onChange={setHips} />
        </div>
      </Card>

      <Card title="Energy (1–10)">
        <ScaleField label="Overall energy" value={energy} onChange={setEnergy} />
      </Card>

      <Card title="Nutrition">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Ate normally yesterday?</span>
          <div className="flex gap-2" role="group" aria-label="Ate normally">
            {[
              { label: 'Yes', value: true },
              { label: 'No', value: false },
            ].map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => setAteNormally(opt.value)}
                className={`rounded-pill px-4 py-1.5 text-sm font-medium ${
                  ateNormally === opt.value
                    ? 'bg-accent text-ink'
                    : 'bg-ink text-text-secondary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card title="Notes (optional)">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Anything worth noting today…"
          className="w-full resize-none rounded-md bg-ink p-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-border-focus"
        />
      </Card>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded-card bg-accent py-3 text-base font-semibold text-ink disabled:opacity-60"
      >
        {existing ? 'Update check-in' : 'Save check-in'}
      </button>
    </main>
  );
}
