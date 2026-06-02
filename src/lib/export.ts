import { getDB, STORES } from '../db/schema';
import { getExercise } from '../data/exercises';
import { SESSION_META } from './schedule';
import { formatLongDate } from './dates';
import { SETTINGS_ID } from '../data/types';
import type {
  DailyEntry,
  RunEntry,
  Session,
  Settings,
  StoredSettings,
  TestResult,
} from '../data/types';

/**
 * Backup / export (KICKOFF_BRIEF.md 4.10 / Step 9).
 *
 * The app is local-first with no backend, so the data only exists in this
 * device's IndexedDB. These helpers let the user (a) take a full JSON backup
 * they can restore later — the only safety net against a lost phone — and (b)
 * generate a human-readable summary to share with a coach.
 *
 * Photos are intentionally excluded: their Blobs aren't JSON-friendly and the
 * capture flow isn't built yet. The five JSON-safe stores round-trip fully.
 */

const BACKUP_VERSION = 1;

// The stores included in a JSON backup, in restore order.
const BACKUP_STORES = [
  STORES.settings,
  STORES.dailyEntries,
  STORES.sessions,
  STORES.runs,
  STORES.testResults,
] as const;

export interface BackupFile {
  app: 'athletic-reset';
  version: number;
  exportedAt: string; // ISO timestamp
  data: {
    settings: StoredSettings[];
    dailyEntries: DailyEntry[];
    sessions: Session[];
    runs: RunEntry[];
    testResults: TestResult[];
  };
}

/** Reads every backed-up store into a single serialisable object. */
export async function buildBackup(): Promise<BackupFile> {
  const db = await getDB();
  const [settings, dailyEntries, sessions, runs, testResults] = await Promise.all([
    db.getAll(STORES.settings),
    db.getAll(STORES.dailyEntries),
    db.getAll(STORES.sessions),
    db.getAll(STORES.runs),
    db.getAll(STORES.testResults),
  ]);
  return {
    app: 'athletic-reset',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: { settings, dailyEntries, sessions, runs, testResults },
  };
}

/** Triggers a file download in the browser. */
function triggerDownload(filename: string, contents: string, mime: string): void {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the download has started.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function stamp(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Builds and downloads the full JSON backup. */
export async function downloadBackup(): Promise<void> {
  const backup = await buildBackup();
  triggerDownload(
    `athletic-reset-backup-${stamp()}.json`,
    JSON.stringify(backup, null, 2),
    'application/json'
  );
}

export interface RestoreResult {
  sessions: number;
  runs: number;
  tests: number;
  dailyEntries: number;
}

/** Validates a parsed backup object, returning it typed or throwing. */
function assertBackup(obj: unknown): BackupFile {
  const b = obj as Partial<BackupFile>;
  if (!b || b.app !== 'athletic-reset' || typeof b.version !== 'number' || !b.data) {
    throw new Error('Not an Athletic Reset backup file.');
  }
  if (b.version > BACKUP_VERSION) {
    throw new Error('This backup was made by a newer version of the app.');
  }
  return b as BackupFile;
}

/**
 * Restores a backup, REPLACING all current data in the backed-up stores. The
 * write happens in one transaction so a failure leaves the DB untouched.
 */
export async function restoreBackup(json: string): Promise<RestoreResult> {
  const backup = assertBackup(JSON.parse(json));
  const { data } = backup;
  const db = await getDB();

  // All requests must be issued synchronously (no `await` between them) or the
  // transaction auto-commits the moment one settles, and later writes throw.
  // So we queue every clear+put up front and await them together via tx.done.
  const tx = db.transaction(BACKUP_STORES, 'readwrite');
  const ops: Promise<unknown>[] = [];

  // Clear each store first (IndexedDB runs requests in the order issued, so
  // these complete before the puts below on the same store).
  for (const name of BACKUP_STORES) ops.push(tx.objectStore(name).clear());

  // Settings always keyed by SETTINGS_ID; defend against a hand-edited file.
  for (const s of data.settings ?? []) ops.push(tx.objectStore(STORES.settings).put({ ...s, id: SETTINGS_ID }));
  for (const e of data.dailyEntries ?? []) ops.push(tx.objectStore(STORES.dailyEntries).put(e));
  for (const s of data.sessions ?? []) ops.push(tx.objectStore(STORES.sessions).put(s));
  for (const r of data.runs ?? []) ops.push(tx.objectStore(STORES.runs).put(r));
  for (const t of data.testResults ?? []) ops.push(tx.objectStore(STORES.testResults).put(t));

  await Promise.all(ops);
  await tx.done;

  return {
    sessions: data.sessions?.length ?? 0,
    runs: data.runs?.length ?? 0,
    tests: data.testResults?.length ?? 0,
    dailyEntries: data.dailyEntries?.length ?? 0,
  };
}

// ── Human-readable summary ──────────────────────────────────────────────────

function describeSets(exerciseId: string, sets: Session['completedBlocks'][number]['exercises'][number]['sets']): string {
  const ex = getExercise(exerciseId);
  const name = ex?.name ?? exerciseId;
  const done = sets.filter((s) => s.completed);
  if (done.length === 0) return `${name}: (skipped)`;
  const parts = done.map((s) => {
    if (s.weightLbs != null && s.reps != null) return `${s.weightLbs}×${s.reps}`;
    if (s.reps != null) return `${s.reps}`;
    if (s.durationSec != null) return `${s.durationSec}s`;
    if (s.distanceFeet != null) return `${s.distanceFeet}ft`;
    return '✓';
  });
  return `${name}: ${parts.join(', ')}`;
}

/**
 * Builds a coach-shareable plain-text summary: current status, the last N
 * sessions in detail (N = exportPreferences.includeRecentSessions), recent
 * runs, and the latest test. Inputs are expected newest-first.
 */
export function buildSummaryText(
  settings: Settings,
  sessions: Session[],
  runs: RunEntry[],
  tests: TestResult[],
  dailyEntries: DailyEntry[]
): string {
  const lines: string[] = [];
  const latestBw = dailyEntries.find((d) => d.bodyweightLbs != null)?.bodyweightLbs;

  lines.push('ATHLETIC RESET — SUMMARY');
  lines.push(`Generated: ${formatLongDate(stamp())}`);
  lines.push(
    `Phase ${settings.currentPhase} · Week ${settings.currentWeek} · started ${settings.startDate}`
  );
  if (latestBw != null) lines.push(`Latest bodyweight: ${latestBw} lb`);
  lines.push('');

  const n = settings.exportPreferences.includeRecentSessions;
  lines.push(`LAST ${n} SESSIONS`);
  const recent = sessions.slice(0, n);
  if (recent.length === 0) lines.push('  (none logged)');
  for (const s of recent) {
    const meta = SESSION_META[s.type];
    lines.push(`• ${formatLongDate(s.date)} — ${meta.title}${s.sessionRPE != null ? ` (RPE ${s.sessionRPE})` : ''}`);
    for (const block of s.completedBlocks) {
      const withWork = block.exercises.filter((e) => e.sets.some((set) => set.completed));
      if (withWork.length === 0) continue;
      for (const e of withWork) lines.push(`    ${describeSets(e.exerciseId, e.sets)}`);
    }
    if (s.sessionNotes) lines.push(`    note: ${s.sessionNotes}`);
  }
  lines.push('');

  lines.push('RECENT RUNS');
  const recentRuns = runs.slice(0, 5);
  if (recentRuns.length === 0) lines.push('  (none logged)');
  for (const r of recentRuns) {
    const dist = r.distanceMiles != null ? `, ${r.distanceMiles} mi` : '';
    const rpe = r.rpe != null ? `, RPE ${r.rpe}` : '';
    lines.push(`• ${formatLongDate(r.date)} — ${r.durationMin} min${dist}, ${r.surface}${rpe}`);
  }
  lines.push('');

  lines.push('LATEST TEST');
  const t = tests[0];
  if (!t) {
    lines.push('  (none logged)');
  } else {
    lines.push(`• ${formatLongDate(t.date)} (Phase ${t.phase} · Week ${t.weekInPhase})`);
    const m = t.measurements;
    if (m.standingVerticalInches != null) lines.push(`    Standing vertical: ${m.standingVerticalInches} in`);
    if (m.standingBroadJumpFeet != null) lines.push(`    Standing broad jump: ${m.standingBroadJumpFeet} ft`);
    if (m.leftLegBalanceClosedEyesSec != null || m.rightLegBalanceClosedEyesSec != null)
      lines.push(`    Balance (eyes closed) L/R: ${m.leftLegBalanceClosedEyesSec ?? '—'}/${m.rightLegBalanceClosedEyesSec ?? '—'} s`);
    if (t.notes) lines.push(`    note: ${t.notes}`);
  }

  return lines.join('\n');
}

/** Builds and downloads the readable summary as a .txt file. */
export function downloadSummary(
  settings: Settings,
  sessions: Session[],
  runs: RunEntry[],
  tests: TestResult[],
  dailyEntries: DailyEntry[]
): void {
  const text = buildSummaryText(settings, sessions, runs, tests, dailyEntries);
  triggerDownload(`athletic-reset-summary-${stamp()}.txt`, text, 'text/plain');
}
