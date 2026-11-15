import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useHistoryStore } from '../store/historyStore';
import BackButton from '../components/BackButton';
import { SESSION_META } from '../lib/schedule';
import { formatLongDate } from '../lib/dates';
import type { RunEntry, Session, TestResult } from '../data/types';

/**
 * History screen (KICKOFF_BRIEF.md 4.9 / Step 8).
 *
 * A reverse-chronological timeline of completed sessions, runs, and tests
 * (sourced from the historyStore), with a filter and a latest-bodyweight stat.
 * Entry point for logging a new test.
 */

type Filter = 'all' | 'sessions' | 'runs' | 'tests';

type Item =
  | { kind: 'session'; date: string; sort: string; data: Session }
  | { kind: 'run'; date: string; sort: string; data: RunEntry }
  | { kind: 'test'; date: string; sort: string; data: TestResult };

function sessionSetCounts(s: Session): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const block of s.completedBlocks)
    for (const ex of block.exercises) {
      total += ex.sets.length;
      done += ex.sets.filter((set) => set.completed).length;
    }
  return { done, total };
}

function SessionCard({ s }: { s: Session }) {
  const { done, total } = sessionSetCounts(s);
  return (
    <article className="surface p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-semibold text-text-primary">{SESSION_META[s.type].title}</h3>
        <span className="chip">Gym</span>
      </div>
      <p className="text-sm text-text-secondary">{formatLongDate(s.date)}</p>
      <p className="mt-1 text-xs text-text-muted">
        {done}/{total} sets logged
        {s.sessionRPE != null && ` · RPE ${s.sessionRPE}`}
      </p>
      {s.sessionNotes && <p className="mt-1 text-xs text-text-secondary">{s.sessionNotes}</p>}
    </article>
  );
}

function RunCard({ r }: { r: RunEntry }) {
  return (
    <article className="surface p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-semibold text-text-primary">
          {r.type === 'wednesday' ? 'Wednesday run' : r.type === 'saturday' ? 'Saturday long run' : 'Run'}
        </h3>
        <span className="chip">Run</span>
      </div>
      <p className="text-sm text-text-secondary">{formatLongDate(r.date)}</p>
      <p className="mt-1 text-xs text-text-muted">
        {r.durationMin} min
        {r.distanceMiles != null && ` · ${r.distanceMiles} mi`}
        {` · ${r.surface}`}
        {r.rpe != null && ` · RPE ${r.rpe}`}
      </p>
      {r.notes && <p className="mt-1 text-xs text-text-secondary">{r.notes}</p>}
    </article>
  );
}

function TestCard({ t }: { t: TestResult }) {
  const m = t.measurements;
  const stats: string[] = [];
  if (m.standingVerticalInches != null) stats.push(`Vert ${m.standingVerticalInches}"`);
  if (m.standingBroadJumpFeet != null) stats.push(`Broad ${m.standingBroadJumpFeet} ft`);
  if (m.leftLegBalanceClosedEyesSec != null || m.rightLegBalanceClosedEyesSec != null)
    stats.push(`Balance ${m.leftLegBalanceClosedEyesSec ?? '—'}/${m.rightLegBalanceClosedEyesSec ?? '—'}s`);
  return (
    <article className="surface p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-semibold text-text-primary">Test</h3>
        <span className="chip">
          Phase {t.phase} · Wk {t.weekInPhase}
        </span>
      </div>
      <p className="text-sm text-text-secondary">{formatLongDate(t.date)}</p>
      {stats.length > 0 && <p className="mt-1 text-xs text-text-muted">{stats.join(' · ')}</p>}
      {t.notes && <p className="mt-1 text-xs text-text-secondary">{t.notes}</p>}
    </article>
  );
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'sessions', label: 'Gym' },
  { key: 'runs', label: 'Runs' },
  { key: 'tests', label: 'Tests' },
];

export default function HistoryScreen() {
  const sessions = useHistoryStore((s) => s.sessions);
  const runs = useHistoryStore((s) => s.runs);
  const tests = useHistoryStore((s) => s.tests);
  const dailyEntries = useHistoryStore((s) => s.dailyEntries);
  const loadAll = useHistoryStore((s) => s.loadAll);

  const [filter, setFilter] = useState<Filter>('all');

  // Refresh on mount so newly-logged items appear when navigating in.
  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // Latest recorded bodyweight (dailyEntries are newest-first in the store).
  const latestBw = dailyEntries.find((d) => d.bodyweightLbs != null)?.bodyweightLbs;

  const items: Item[] = [];
  if (filter === 'all' || filter === 'sessions')
    for (const s of sessions) items.push({ kind: 'session', date: s.date, sort: s.startedAt ?? s.date, data: s });
  if (filter === 'all' || filter === 'runs')
    for (const r of runs) items.push({ kind: 'run', date: r.date, sort: r.date, data: r });
  if (filter === 'all' || filter === 'tests')
    for (const t of tests) items.push({ kind: 'test', date: t.date, sort: t.date, data: t });
  items.sort((a, b) => b.sort.localeCompare(a.sort));

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-6 pb-24">
      <header>
        <BackButton />
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">History</h1>
            {latestBw != null && (
              <p className="text-sm text-text-secondary">Latest bodyweight {latestBw} lb</p>
            )}
          </div>
          <Link to="/test" className="pill inline-flex items-center gap-1 bg-accent text-white">
            <Plus size={14} aria-hidden /> Log test
          </Link>
        </div>
      </header>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-pill border px-3.5 py-1.5 text-sm font-medium transition ${
              filter === f.key
                ? 'border-transparent bg-accent text-white'
                : 'border-white/[0.06] bg-ink-card text-text-secondary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="mt-6 text-center text-sm text-text-muted">Nothing logged yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) =>
            item.kind === 'session' ? (
              <SessionCard key={item.data.id} s={item.data} />
            ) : item.kind === 'run' ? (
              <RunCard key={item.data.id} r={item.data} />
            ) : (
              <TestCard key={item.data.id} t={item.data} />
            )
          )}
        </div>
      )}
    </main>
  );
}
