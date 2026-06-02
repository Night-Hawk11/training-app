import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StickFigure from '../components/StickFigure';
import { useSettingsStore } from '../store/settingsStore';
import { useSessionStore } from '../store/sessionStore';
import { useDailyEntryStore } from '../store/dailyEntryStore';
import { useHistoryStore } from '../store/historyStore';
import { getExercise, getPrescription } from '../data/exercises';
import { todayISO, formatLongDate } from '../lib/dates';
import { planForDate } from '../lib/schedule';
import { getSessionPlan, type PlanBlock } from '../lib/sessionPlan';
import { formatTarget } from '../lib/format';
import { useWakeLock } from '../lib/useWakeLock';
import type { CompletedBlock, CompletedSet, Exercise, Prescription } from '../data/types';

/**
 * Gym session screen (KICKOFF_BRIEF.md 4.6 / Step 7).
 *
 * Renders today's gym plan (src/lib/sessionPlan.ts) as blocks of exercises,
 * each with prescribed sets to log (weight×reps, hold seconds, or distance) and
 * a per-set done toggle. Working state lives in the sessionStore draft so it
 * survives navigation within the app; on finish the session is persisted with
 * an overall RPE and notes (and bodyweight on Mon/Fri). The Today screen links
 * here on gym days and reflects completion.
 */

type Stage = 'log' | 'summary';

// Build the editable set rows for one exercise from its prescription:
// `warmupSets` light rows followed by the working sets.
function rowsFor(ex: Exercise, p: Prescription): CompletedSet[] {
  const warmups = p.warmupSets ?? 0;
  const working = p.sets ?? 1;
  const rows: CompletedSet[] = [];
  for (let i = 0; i < warmups + working; i++) {
    const isWarmup = i < warmups;
    const base: CompletedSet = { setNumber: i + 1, completed: false };
    if (ex.measurement === 'time') base.durationSec = p.durationSec;
    else if (ex.measurement === 'distance') base.distanceFeet = p.distanceFeet;
    else {
      base.reps = p.reps;
      if (!isWarmup) base.weightLbs = p.weightLbs;
    }
    rows.push(base);
  }
  return rows;
}

type Log = Record<string, CompletedSet[]>;

function buildBlocks(plan: PlanBlock[], log: Log): CompletedBlock[] {
  return plan.map((block) => ({
    blockId: block.id,
    exercises: block.exerciseIds.map((id) => ({ exerciseId: id, sets: log[id] ?? [] })),
  }));
}

export default function GymSessionScreen() {
  const navigate = useNavigate();
  const settings = useSettingsStore((s) => s.settings);
  const phase = settings?.currentPhase ?? 1;
  const week = settings?.currentWeek ?? 1;

  const startSession = useSessionStore((s) => s.startSession);
  const updateActive = useSessionStore((s) => s.updateActive);
  const finishSession = useSessionStore((s) => s.finishSession);
  const discardActive = useSessionStore((s) => s.discardActive);

  const date = todayISO();
  const meta = planForDate(date);
  const sessionType = meta.type;
  const plan = getSessionPlan(sessionType);

  // Number of warm-up rows per exercise, for labelling.
  const warmupCounts: Record<string, number> = {};
  for (const block of plan ?? [])
    for (const id of block.exerciseIds) {
      const ex = getExercise(id);
      if (ex) warmupCounts[id] = getPrescription(ex, phase).warmupSets ?? 0;
    }

  // Seed the log from an in-progress draft for today (resume), else from the
  // prescriptions. Lazy initializer so it runs once, without an effect.
  const [log, setLog] = useState<Log>(() => {
    const active = useSessionStore.getState().active;
    if (active && active.date === date && active.type === sessionType && active.completedBlocks.length) {
      const fromDraft: Log = {};
      for (const block of active.completedBlocks)
        for (const ce of block.exercises) fromDraft[ce.exerciseId] = ce.sets;
      return fromDraft;
    }
    const fresh: Log = {};
    for (const block of plan ?? [])
      for (const id of block.exerciseIds) {
        const ex = getExercise(id);
        if (ex) fresh[id] = rowsFor(ex, getPrescription(ex, phase));
      }
    return fresh;
  });

  const [stage, setStage] = useState<Stage>('log');
  const [rpe, setRpe] = useState(7);
  const [bodyweight, setBodyweight] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  // Which exercises are expanded to show their description / cues.
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Keep the screen awake during a gym session (you're not touching the phone
  // between sets). Only while actively logging, not on the summary.
  useWakeLock(!!plan && stage === 'log');

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Ensure there's an active draft for today (marks the session in progress and
  // holds the log across navigation). Runs once on mount.
  useEffect(() => {
    if (!plan) return;
    const active = useSessionStore.getState().active;
    const matches = active && active.date === date && active.type === sessionType;
    if (!matches) {
      startSession({ type: sessionType, phase, weekInPhase: week, date });
      updateActive({ completedBlocks: buildBlocks(plan, log) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!plan) {
    return (
      <main className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-xl font-semibold text-text-primary">No gym session today</h1>
        <p className="text-text-secondary">{meta.title} is not a gym day.</p>
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

  const totalSets = Object.values(log).reduce((sum, sets) => sum + sets.length, 0);
  const doneSets = Object.values(log).reduce((sum, sets) => sum + sets.filter((s) => s.completed).length, 0);

  // Apply a change to one set, mirror into the draft so it survives navigation.
  function mutateSet(exId: string, idx: number, patch: Partial<CompletedSet>) {
    setLog((prev) => {
      const next: Log = { ...prev, [exId]: prev[exId].map((s, i) => (i === idx ? { ...s, ...patch } : s)) };
      updateActive({ completedBlocks: buildBlocks(plan!, next) });
      return next;
    });
  }

  async function save() {
    setSaving(true);
    updateActive({
      completedBlocks: buildBlocks(plan!, log),
      sessionRPE: rpe,
      ...(notes.trim() ? { sessionNotes: notes.trim() } : {}),
    });
    await finishSession();
    const bw = Number(bodyweight);
    if (bodyweight && Number.isFinite(bw) && bw > 0) {
      await useDailyEntryStore.getState().update({ bodyweightLbs: bw });
    }
    await useHistoryStore.getState().loadAll();
    navigate('/');
  }

  function quit() {
    // Leave the draft intact so the user can resume; just go back.
    navigate('/');
  }

  function cancelSession() {
    discardActive();
    navigate('/');
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  if (stage === 'summary') {
    const logsBodyweight = sessionType === 'monday_upper' || sessionType === 'friday_lower_athletic';
    return (
      <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-6">
        <header>
          <button type="button" onClick={() => setStage('log')} className="mb-2 text-sm text-text-muted">
            ← Back to session
          </button>
          <h1 className="text-xl font-semibold text-text-primary">Finish session</h1>
          <p className="text-sm text-text-secondary">
            {meta.title} · {doneSets}/{totalSets} sets logged
          </p>
        </header>

        <section className="rounded-card bg-ink-card p-4">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-sm text-text-secondary">Session RPE</span>
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

        {logsBodyweight && (
          <label className="flex items-center justify-between rounded-card bg-ink-card p-4">
            <span className="text-sm text-text-secondary">Bodyweight (lb)</span>
            <input
              type="number"
              inputMode="decimal"
              value={bodyweight}
              onChange={(e) => setBodyweight(e.target.value)}
              placeholder="—"
              className="w-24 rounded-md bg-ink px-2 py-1 text-right text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
            />
          </label>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-sm text-text-secondary">Notes (optional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="How did it go?"
            className="w-full resize-none rounded-md bg-ink-card p-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-border-focus"
          />
        </label>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-card bg-accent py-3 text-base font-semibold text-ink disabled:opacity-60"
        >
          Save session
        </button>
        <button type="button" onClick={cancelSession} className="py-1 text-sm text-danger">
          Discard session
        </button>
      </main>
    );
  }

  // ── Logging ─────────────────────────────────────────────────────────────────
  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-6 pb-24">
      <header>
        <button type="button" onClick={quit} className="mb-2 text-sm text-text-muted">
          ← Today
        </button>
        <div className="flex items-baseline justify-between">
          <h1 className="text-xl font-semibold text-text-primary">{meta.title}</h1>
          <span className="text-sm text-text-secondary">
            {doneSets}/{totalSets} sets
          </span>
        </div>
        <p className="text-sm text-text-secondary">
          {formatLongDate(date)} · Phase {phase} · Week {week}
        </p>
      </header>

      {plan.map((block) => (
        <section key={block.id} className="flex flex-col gap-2">
          <h2 className="text-sm font-medium uppercase tracking-wide text-text-secondary">{block.title}</h2>
          {block.exerciseIds.map((id) => {
            const ex = getExercise(id);
            if (!ex) return null;
            const p = getPrescription(ex, phase);
            const sets = log[id] ?? [];
            const warmups = warmupCounts[id] ?? 0;
            const weighted = (p.weightLbs ?? 0) > 0;
            const isOpen = expanded.has(id);
            return (
              <article key={id} className="rounded-card bg-ink-card p-3">
                {/* Tap the header to drill into details — never marks anything done. */}
                <button
                  type="button"
                  onClick={() => toggleExpanded(id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-start gap-3 text-left"
                >
                  <div className="h-14 w-16 flex-shrink-0 rounded-md bg-ink p-1 text-accent">
                    <StickFigure svg={ex.svg} label={ex.name} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-text-primary">{ex.name}</h3>
                      <span className="flex-shrink-0 text-text-muted">{isOpen ? '⌄' : '›'}</span>
                    </div>
                    <p className="text-xs text-accent">{formatTarget(ex.measurement, p)}</p>
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-2 border-t border-border-subtle pt-2">
                    <p className="text-sm text-text-secondary">{ex.description}</p>
                    {ex.setup.length > 0 && (
                      <ol className="mt-1 list-inside list-decimal text-xs text-text-muted">
                        {ex.setup.map((step, si) => (
                          <li key={si}>{step}</li>
                        ))}
                      </ol>
                    )}
                    {ex.cues.length > 0 && (
                      <ul className="mt-1 list-inside list-disc text-xs text-text-muted">
                        {ex.cues.map((cue, ci) => (
                          <li key={ci}>{cue}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className="mt-2 flex flex-col gap-1.5">
                  {sets.map((set, i) => {
                    const isWarmup = i < warmups;
                    return (
                      <SetRow
                        key={i}
                        set={set}
                        measurement={ex.measurement}
                        weighted={weighted}
                        label={isWarmup ? 'Warm-up' : `Set ${i + 1 - warmups}`}
                        onChange={(patch) => mutateSet(id, i, patch)}
                        onToggle={() => mutateSet(id, i, { completed: !set.completed })}
                      />
                    );
                  })}
                </div>
              </article>
            );
          })}
        </section>
      ))}

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md p-4">
        <button
          type="button"
          onClick={() => setStage('summary')}
          className="w-full rounded-card bg-accent py-3 text-base font-semibold text-ink shadow-lg"
        >
          Finish session
        </button>
      </div>
    </main>
  );
}

// ── Set row ───────────────────────────────────────────────────────────────────
function NumberField({
  value,
  onChange,
  suffix,
  width = 'w-14',
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  suffix: string;
  width?: string;
}) {
  return (
    <span className="flex items-center gap-1">
      <input
        type="number"
        inputMode="decimal"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        className={`${width} rounded-md bg-ink px-2 py-1 text-right text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus`}
      />
      <span className="text-xs text-text-muted">{suffix}</span>
    </span>
  );
}

function SetRow({
  set,
  measurement,
  weighted,
  label,
  onChange,
  onToggle,
}: {
  set: CompletedSet;
  measurement: Exercise['measurement'];
  /** Show the weight field (only true when the exercise uses external load). */
  weighted: boolean;
  label: string;
  onChange: (patch: Partial<CompletedSet>) => void;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 flex-shrink-0 text-xs font-medium text-text-secondary">{label}</span>
      <div className="flex flex-1 items-center gap-2">
        {measurement === 'sets_reps_weight' && (
          <>
            {weighted && (
              <>
                <NumberField value={set.weightLbs} onChange={(v) => onChange({ weightLbs: v })} suffix="lb" />
                <span className="text-text-muted">×</span>
              </>
            )}
            <NumberField value={set.reps} onChange={(v) => onChange({ reps: v })} suffix="reps" width="w-14" />
          </>
        )}
        {measurement === 'time' && (
          <NumberField value={set.durationSec} onChange={(v) => onChange({ durationSec: v })} suffix="sec" />
        )}
        {measurement === 'distance' && (
          <NumberField value={set.distanceFeet} onChange={(v) => onChange({ distanceFeet: v })} suffix="ft" />
        )}
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={set.completed}
        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-pill border-2 text-xs ${
          set.completed ? 'border-success bg-success text-ink' : 'border-border-subtle text-transparent'
        }`}
      >
        ✓
      </button>
    </div>
  );
}
