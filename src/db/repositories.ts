import { getDB, STORES } from './schema';
import { todayISO } from '../lib/dates';
import {
  SETTINGS_ID,
  type Settings,
  type StoredSettings,
  type DailyEntry,
  type Session,
  type RunEntry,
  type TestResult,
  type PhotoEntry,
} from '../data/types';

/**
 * Read/write access for each entity (KICKOFF_BRIEF.md Section 2 & Step 2).
 *
 * Repositories are intentionally thin: create / read-by-id / list-by-date-range
 * / update / delete. Business logic (phase calculation, export, etc.) lives in
 * src/lib and the Zustand stores, not here.
 */

// Default settings written on first launch (brief Step 2).
export const DEFAULT_SETTINGS: Settings = {
  currentPhase: 1,
  currentWeek: 1,
  startDate: '2026-08-13', // Full regroup onto the neuromuscular-first program
  notificationTime: '07:00',
  notificationsEnabled: false, // off until the user grants permission
  exportPreferences: {
    includeRecentSessions: 3, // matches the "LAST 3 SESSIONS" export block
  },
};

// Builds an IDBKeyRange from optional inclusive ISO-date bounds.
function dateRange(startISO?: string, endISO?: string): IDBKeyRange | undefined {
  if (startISO && endISO) return IDBKeyRange.bound(startISO, endISO);
  if (startISO) return IDBKeyRange.lowerBound(startISO);
  if (endISO) return IDBKeyRange.upperBound(endISO);
  return undefined;
}

function newId(): string {
  return crypto.randomUUID();
}

// ── Settings (single row) ─────────────────────────────────────────────────

export const settingsRepo = {
  /** Returns stored settings, or null if the app has never been launched. */
  async get(): Promise<Settings | null> {
    const db = await getDB();
    const row = await db.get(STORES.settings, SETTINGS_ID);
    if (!row) return null;
    const { id: _id, ...settings } = row;
    void _id;
    return settings;
  },

  async save(settings: Settings): Promise<void> {
    const db = await getDB();
    const row: StoredSettings = { ...settings, id: SETTINGS_ID };
    await db.put(STORES.settings, row);
  },

  /** Returns existing settings, or writes and returns the defaults. */
  async loadOrInit(): Promise<Settings> {
    const existing = await this.get();
    if (existing) return existing;
    await this.save(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  },
};

// ── DailyEntry (keyed by ISO date) ────────────────────────────────────────

export const dailyEntryRepo = {
  async get(date: string): Promise<DailyEntry | undefined> {
    const db = await getDB();
    return db.get(STORES.dailyEntries, date);
  },

  /** Insert or replace the entry for its date. */
  async upsert(entry: DailyEntry): Promise<DailyEntry> {
    const db = await getDB();
    await db.put(STORES.dailyEntries, entry);
    return entry;
  },

  async listByDateRange(startISO?: string, endISO?: string): Promise<DailyEntry[]> {
    const db = await getDB();
    return db.getAll(STORES.dailyEntries, dateRange(startISO, endISO));
  },

  async remove(date: string): Promise<void> {
    const db = await getDB();
    await db.delete(STORES.dailyEntries, date);
  },
};

// ── Session (UUID key, date index) ────────────────────────────────────────

export const sessionRepo = {
  async create(data: Omit<Session, 'id'> & { id?: string }): Promise<Session> {
    const record: Session = { ...data, id: data.id ?? newId() };
    const db = await getDB();
    await db.add(STORES.sessions, record);
    return record;
  },

  async get(id: string): Promise<Session | undefined> {
    const db = await getDB();
    return db.get(STORES.sessions, id);
  },

  async listByDateRange(startISO?: string, endISO?: string): Promise<Session[]> {
    const db = await getDB();
    return db.getAllFromIndex(STORES.sessions, 'by-date', dateRange(startISO, endISO));
  },

  async update(record: Session): Promise<void> {
    const db = await getDB();
    await db.put(STORES.sessions, record);
  },

  async remove(id: string): Promise<void> {
    const db = await getDB();
    await db.delete(STORES.sessions, id);
  },
};

// ── RunEntry (UUID key, date index) ───────────────────────────────────────

export const runRepo = {
  async create(data: Omit<RunEntry, 'id'> & { id?: string }): Promise<RunEntry> {
    const record: RunEntry = { ...data, id: data.id ?? newId() };
    const db = await getDB();
    await db.add(STORES.runs, record);
    return record;
  },

  async get(id: string): Promise<RunEntry | undefined> {
    const db = await getDB();
    return db.get(STORES.runs, id);
  },

  async listByDateRange(startISO?: string, endISO?: string): Promise<RunEntry[]> {
    const db = await getDB();
    return db.getAllFromIndex(STORES.runs, 'by-date', dateRange(startISO, endISO));
  },

  async update(record: RunEntry): Promise<void> {
    const db = await getDB();
    await db.put(STORES.runs, record);
  },

  async remove(id: string): Promise<void> {
    const db = await getDB();
    await db.delete(STORES.runs, id);
  },
};

// ── TestResult (UUID key, date index) ─────────────────────────────────────

export const testResultRepo = {
  async create(data: Omit<TestResult, 'id'> & { id?: string }): Promise<TestResult> {
    const record: TestResult = { ...data, id: data.id ?? newId() };
    const db = await getDB();
    await db.add(STORES.testResults, record);
    return record;
  },

  async get(id: string): Promise<TestResult | undefined> {
    const db = await getDB();
    return db.get(STORES.testResults, id);
  },

  async listByDateRange(startISO?: string, endISO?: string): Promise<TestResult[]> {
    const db = await getDB();
    return db.getAllFromIndex(STORES.testResults, 'by-date', dateRange(startISO, endISO));
  },

  async update(record: TestResult): Promise<void> {
    const db = await getDB();
    await db.put(STORES.testResults, record);
  },

  async remove(id: string): Promise<void> {
    const db = await getDB();
    await db.delete(STORES.testResults, id);
  },
};

// ── PhotoEntry (UUID key, date index) ─────────────────────────────────────

export const photoRepo = {
  async create(data: Omit<PhotoEntry, 'id'> & { id?: string }): Promise<PhotoEntry> {
    const record: PhotoEntry = { ...data, id: data.id ?? newId() };
    const db = await getDB();
    await db.add(STORES.photos, record);
    return record;
  },

  async get(id: string): Promise<PhotoEntry | undefined> {
    const db = await getDB();
    return db.get(STORES.photos, id);
  },

  async listByDateRange(startISO?: string, endISO?: string): Promise<PhotoEntry[]> {
    const db = await getDB();
    return db.getAllFromIndex(STORES.photos, 'by-date', dateRange(startISO, endISO));
  },

  async update(record: PhotoEntry): Promise<void> {
    const db = await getDB();
    await db.put(STORES.photos, record);
  },

  async remove(id: string): Promise<void> {
    const db = await getDB();
    await db.delete(STORES.photos, id);
  },
};

/**
 * Full regroup: wipe every store and re-seed a fresh Phase 1 / Week 1 program
 * starting TODAY. Clears all logged history (daily entries, sessions, runs,
 * tests, photos) and the old settings, then writes fresh defaults. Returns the
 * new settings. Irreversible — the caller should confirm and offer a backup
 * first, then reload the stores.
 */
export async function resetAllData(): Promise<Settings> {
  const db = await getDB();
  await Promise.all([
    db.clear(STORES.settings),
    db.clear(STORES.dailyEntries),
    db.clear(STORES.sessions),
    db.clear(STORES.runs),
    db.clear(STORES.testResults),
    db.clear(STORES.photos),
  ]);
  const fresh: Settings = {
    ...DEFAULT_SETTINGS,
    currentPhase: 1,
    currentWeek: 1,
    startDate: todayISO(),
  };
  await settingsRepo.save(fresh);
  return fresh;
}

// Grouped export — convenient for exposing on window in dev (see main.tsx).
export const repositories = {
  settings: settingsRepo,
  dailyEntries: dailyEntryRepo,
  sessions: sessionRepo,
  runs: runRepo,
  testResults: testResultRepo,
  photos: photoRepo,
};
