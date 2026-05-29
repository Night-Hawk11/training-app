import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { testResultRepo } from '../db/repositories';
import { useSettingsStore } from '../store/settingsStore';
import { useHistoryStore } from '../store/historyStore';
import { todayISO, formatLongDate } from '../lib/dates';
import type { TestMeasurements } from '../data/types';

/**
 * Test logging screen (KICKOFF_BRIEF.md 4.8 / Step 8).
 *
 * Records a periodic TestResult against the current phase/week. Base
 * measurements (jump, balance, landing quality) show always; the Phase 3+
 * approach/single-leg measurements appear only once the user is in phase 3+.
 * Empty numeric fields are omitted so a partial test stays honest.
 */

// Parse a positive number, or undefined if blank/invalid.
function pos(s: string): number | undefined {
  if (s.trim() === '') return undefined;
  const v = Number(s);
  return Number.isFinite(v) && v > 0 ? v : undefined;
}

function NumRow({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix: string;
}) {
  return (
    <label className="flex items-center justify-between py-1.5">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="flex items-center gap-1">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="—"
          className="w-20 rounded-md bg-ink px-2 py-1 text-right text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
        />
        <span className="w-6 text-xs text-text-muted">{suffix}</span>
      </span>
    </label>
  );
}

function QualityRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="py-1.5">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-sm text-text-secondary">{label}</span>
        <span className="text-sm font-semibold text-text-primary">{value}</span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card bg-ink-card p-4">
      <h2 className="mb-1 text-sm font-medium uppercase tracking-wide text-text-secondary">{title}</h2>
      {children}
    </section>
  );
}

export default function TestScreen() {
  const navigate = useNavigate();
  const date = todayISO();
  const settings = useSettingsStore((s) => s.settings);
  const phase = settings?.currentPhase ?? 1;
  const week = settings?.currentWeek ?? 1;

  const [vertical, setVertical] = useState('');
  const [broad, setBroad] = useState('');
  const [balanceL, setBalanceL] = useState('');
  const [balanceR, setBalanceR] = useState('');
  const [qualityL, setQualityL] = useState(3);
  const [qualityR, setQualityR] = useState(3);

  // Phase 3+ fields.
  const [approachVert, setApproachVert] = useState('');
  const [approachVertL, setApproachVertL] = useState('');
  const [approachVertR, setApproachVertR] = useState('');
  const [slBroadL, setSlBroadL] = useState('');
  const [slBroadR, setSlBroadR] = useState('');

  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const showPhase3 = phase >= 3;

  async function save() {
    setSaving(true);
    const m: TestMeasurements = {
      leftLegBilateralBroadLandingQuality: qualityL as TestMeasurements['leftLegBilateralBroadLandingQuality'],
      rightLegBilateralBroadLandingQuality: qualityR as TestMeasurements['rightLegBilateralBroadLandingQuality'],
    };
    const sv = pos(vertical);
    if (sv) m.standingVerticalInches = sv;
    const sb = pos(broad);
    if (sb) m.standingBroadJumpFeet = sb;
    const bl = pos(balanceL);
    if (bl) m.leftLegBalanceClosedEyesSec = bl;
    const br = pos(balanceR);
    if (br) m.rightLegBalanceClosedEyesSec = br;

    if (showPhase3) {
      const av = pos(approachVert);
      if (av) m.twoFootApproachVerticalInches = av;
      const avl = pos(approachVertL);
      if (avl) m.leftLegApproachVerticalInches = avl;
      const avr = pos(approachVertR);
      if (avr) m.rightLegApproachVerticalInches = avr;
      const sbl = pos(slBroadL);
      if (sbl) m.leftLegBroadJumpFeet = sbl;
      const sbr = pos(slBroadR);
      if (sbr) m.rightLegBroadJumpFeet = sbr;
    }

    await testResultRepo.create({
      date,
      phase,
      weekInPhase: week,
      measurements: m,
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    });
    await useHistoryStore.getState().loadAll();
    navigate('/history');
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-6">
      <header>
        <button type="button" onClick={() => navigate('/history')} className="mb-2 text-sm text-text-muted">
          ← History
        </button>
        <h1 className="text-xl font-semibold text-text-primary">Test day</h1>
        <p className="text-sm text-text-secondary">
          {formatLongDate(date)} · Phase {phase} · Week {week}
        </p>
      </header>

      <Card title="Jump">
        <NumRow label="Standing vertical" value={vertical} onChange={setVertical} suffix="in" />
        <NumRow label="Standing broad jump" value={broad} onChange={setBroad} suffix="ft" />
      </Card>

      <Card title="Balance — eyes closed">
        <NumRow label="Left leg" value={balanceL} onChange={setBalanceL} suffix="sec" />
        <NumRow label="Right leg" value={balanceR} onChange={setBalanceR} suffix="sec" />
      </Card>

      <Card title="Landing quality (1–5)">
        <QualityRow label="Left leg" value={qualityL} onChange={setQualityL} />
        <QualityRow label="Right leg" value={qualityR} onChange={setQualityR} />
      </Card>

      {showPhase3 && (
        <Card title="Approach & single-leg (Phase 3+)">
          <NumRow label="Two-foot approach vertical" value={approachVert} onChange={setApproachVert} suffix="in" />
          <NumRow label="Left approach vertical" value={approachVertL} onChange={setApproachVertL} suffix="in" />
          <NumRow label="Right approach vertical" value={approachVertR} onChange={setApproachVertR} suffix="in" />
          <NumRow label="Left single-leg broad" value={slBroadL} onChange={setSlBroadL} suffix="ft" />
          <NumRow label="Right single-leg broad" value={slBroadR} onChange={setSlBroadR} suffix="ft" />
        </Card>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-sm text-text-secondary">Notes (optional)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Conditions, how you felt…"
          className="w-full resize-none rounded-md bg-ink-card p-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-border-focus"
        />
      </label>

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="rounded-card bg-accent py-3 text-base font-semibold text-ink disabled:opacity-60"
      >
        Save test
      </button>
    </main>
  );
}
