import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../store/settingsStore';
import { useDailyEntryStore } from '../store/dailyEntryStore';
import { useHistoryStore } from '../store/historyStore';
import { evaluatePhaseGate, TOP_PHASE } from '../lib/phaseGate';
import { phaseOverview } from '../lib/phases';
import { daysBetween } from '../lib/dates';

/**
 * Phase check-in — criteria-gated advancement (2026-09-12 pivot).
 *
 * Shows the current phase's exit criteria: auto checks derived from the logged
 * session history (✓/✗) plus movement-quality self-confirmations. The "Advance"
 * button unlocks only when the auto checks are green AND every self-check is
 * ticked. The Settings phase picker remains a manual override.
 */

export default function PhaseCheckScreen() {
  const navigate = useNavigate();
  const settings = useSettingsStore((s) => s.settings);
  const setPhaseAndWeek = useSettingsStore((s) => s.setPhaseAndWeek);
  const date = useDailyEntryStore((s) => s.date);
  const dailyEntries = useHistoryStore((s) => s.dailyEntries);

  const phase = settings?.currentPhase ?? 1;
  const daysInPhase = settings?.phaseStartDate ? daysBetween(settings.phaseStartDate, date) + 1 : null;
  const gate = useMemo(() => evaluatePhaseGate(phase, dailyEntries, date), [phase, dailyEntries, date]);
  const next = gate.nextPhase != null ? phaseOverview(gate.nextPhase) : undefined;

  const [confirmed, setConfirmed] = useState<boolean[]>(() => gate.selfChecks.map(() => false));
  const [saving, setSaving] = useState(false);

  const allSelf = confirmed.length > 0 && confirmed.every(Boolean);
  const canAdvance = gate.autoMet && allSelf && gate.nextPhase != null;

  async function advance() {
    if (!canAdvance || gate.nextPhase == null) return;
    setSaving(true);
    await setPhaseAndWeek(gate.nextPhase as 1 | 2 | 3 | 4, 1);
    navigate('/');
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-6 pb-24">
      <header>
        <button type="button" onClick={() => navigate('/')} className="mb-2 text-sm text-text-muted">
          ← Today
        </button>
        <h1 className="text-xl font-semibold text-text-primary">Phase check-in</h1>
        <p className="text-sm text-text-secondary">
          Currently in Phase {phase}
          {daysInPhase != null && ` · day ${daysInPhase}`}.
        </p>
      </header>

      {gate.nextPhase == null ? (
        <section className="rounded-card bg-ink-card p-4">
          <p className="text-sm text-text-secondary">
            {phase >= TOP_PHASE
              ? 'You’re on the top phase — Return to Court. There’s no next gate; progress your sport exposure and reactive amplitude, and back off at any sign of a flare.'
              : 'No advancement criteria for this phase.'}
          </p>
        </section>
      ) : (
        <>
          {next && (
            <section className="rounded-card bg-ink-card p-4">
              <p className="text-xs uppercase tracking-wide text-text-secondary">Next up</p>
              <p className="mt-0.5 text-lg font-semibold text-text-primary">
                Phase {gate.nextPhase} · {next.theme}
              </p>
              <p className="mt-1 text-sm text-text-secondary">{next.summary}</p>
            </section>
          )}

          <section className="rounded-card bg-ink-card p-4">
            <h2 className="text-sm font-medium uppercase tracking-wide text-text-secondary">
              From your log
            </h2>
            <ul className="mt-2 flex flex-col gap-2">
              {gate.autoCriteria.map((c) => (
                <li key={c.label} className="flex items-start justify-between gap-3">
                  <span className="flex items-start gap-2 text-sm text-text-primary">
                    <span className={c.met ? 'text-success' : 'text-text-muted'}>{c.met ? '✓' : '○'}</span>
                    {c.label}
                  </span>
                  {c.detail && <span className="flex-shrink-0 text-xs text-text-muted">{c.detail}</span>}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-card bg-ink-card p-4">
            <h2 className="text-sm font-medium uppercase tracking-wide text-text-secondary">
              Confirm honestly
            </h2>
            <div className="mt-2 flex flex-col gap-2">
              {gate.selfChecks.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setConfirmed((prev) => prev.map((v, j) => (j === i ? !v : v)))}
                  aria-pressed={confirmed[i]}
                  className="flex items-start gap-3 text-left"
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 text-xs ${
                      confirmed[i] ? 'border-success bg-success text-ink' : 'border-border-subtle text-transparent'
                    }`}
                  >
                    ✓
                  </span>
                  <span className="text-sm text-text-primary">{label}</span>
                </button>
              ))}
            </div>
          </section>

          {!gate.autoMet && (
            <p className="px-1 text-xs text-text-muted">
              Keep going — the auto checks turn green from your daily sessions and flare-free readiness
              logs. This gate protects the knee; don’t rush it.
            </p>
          )}

          <button
            type="button"
            onClick={advance}
            disabled={!canAdvance || saving}
            className="rounded-card bg-accent py-3 text-base font-semibold text-ink disabled:opacity-40"
          >
            Advance to Phase {gate.nextPhase}
          </button>
          <p className="px-1 text-center text-xs text-text-muted">
            You can still set the phase manually in Settings.
          </p>
        </>
      )}
    </main>
  );
}
