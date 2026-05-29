import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

/**
 * IndexedDB scaffold for the Athletic Reset app.
 *
 * Six object stores, one per core entity (see KICKOFF_BRIEF.md Section 2).
 * This file defines the stores, keys, and indexes only. The full entity
 * field types and the read/write repository functions are fleshed out in
 * Step 2 (`db/repositories.ts`); the value types below are intentionally
 * loose placeholders so the schema compiles before then.
 */

export const DB_NAME = 'athletic-reset';
export const DB_VERSION = 1;

// Store names kept in one place so repositories reference these constants
// rather than stringly-typed literals.
export const STORES = {
  settings: 'settings',
  dailyEntries: 'dailyEntries',
  sessions: 'sessions',
  runs: 'runs',
  testResults: 'testResults',
  photos: 'photos',
} as const;

// Placeholder record types — replaced with the real entity types in Step 2.
type Settings = { id: string } & Record<string, unknown>;
type DailyEntry = { date: string } & Record<string, unknown>;
type Session = { id: string; date: string } & Record<string, unknown>;
type RunEntry = { id: string; date: string } & Record<string, unknown>;
type TestResult = { id: string; date: string } & Record<string, unknown>;
type PhotoEntry = { id: string; date: string } & Record<string, unknown>;

export interface AthleticResetDB extends DBSchema {
  settings: {
    key: string; // single-row store, keyed by a fixed id ('app')
    value: Settings;
  };
  dailyEntries: {
    key: string; // ISO date string
    value: DailyEntry;
  };
  sessions: {
    key: string; // UUID
    value: Session;
    indexes: { 'by-date': string };
  };
  runs: {
    key: string; // UUID
    value: RunEntry;
    indexes: { 'by-date': string };
  };
  testResults: {
    key: string; // UUID
    value: TestResult;
    indexes: { 'by-date': string };
  };
  photos: {
    key: string; // UUID
    value: PhotoEntry;
    indexes: { 'by-date': string };
  };
}

let dbPromise: Promise<IDBPDatabase<AthleticResetDB>> | null = null;

/**
 * Returns the shared database connection, opening (and migrating) it on first
 * use. Safe to call from anywhere — the connection is memoized.
 */
export function getDB(): Promise<IDBPDatabase<AthleticResetDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AthleticResetDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // settings: single-row config, keyed by an explicit id field.
        if (!db.objectStoreNames.contains(STORES.settings)) {
          db.createObjectStore(STORES.settings, { keyPath: 'id' });
        }

        // dailyEntries: one row per day, keyed by the ISO date itself.
        if (!db.objectStoreNames.contains(STORES.dailyEntries)) {
          db.createObjectStore(STORES.dailyEntries, { keyPath: 'date' });
        }

        // The remaining stores are UUID-keyed with a date index for
        // reverse-chronological history queries.
        for (const name of [
          STORES.sessions,
          STORES.runs,
          STORES.testResults,
          STORES.photos,
        ] as const) {
          if (!db.objectStoreNames.contains(name)) {
            const store = db.createObjectStore(name, { keyPath: 'id' });
            store.createIndex('by-date', 'date');
          }
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Step 1 verification helper: writes a probe record to the settings store,
 * reads it back, and logs the result. Called from main.tsx in dev only.
 */
export async function runPersistenceSelfTest(): Promise<boolean> {
  try {
    const db = await getDB();
    const probe = { id: '__selftest__', ts: Date.now() };
    await db.put(STORES.settings, probe);
    const readBack = await db.get(STORES.settings, '__selftest__');
    await db.delete(STORES.settings, '__selftest__');
    const ok = !!readBack && (readBack as { ts?: number }).ts === probe.ts;
    if (ok) {
      console.info('[db] IndexedDB read/write self-test passed ✓');
    } else {
      console.error('[db] IndexedDB self-test failed: read-back mismatch', readBack);
    }
    return ok;
  } catch (err) {
    console.error('[db] IndexedDB self-test threw:', err);
    return false;
  }
}
