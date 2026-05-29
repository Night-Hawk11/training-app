import { create } from 'zustand';
import {
  sessionRepo,
  runRepo,
  testResultRepo,
  dailyEntryRepo,
} from '../db/repositories';
import type { DailyEntry, RunEntry, Session, TestResult } from '../data/types';

/**
 * Completed history for the History screen (KICKOFF_BRIEF.md 4.9).
 *
 * Caches sessions, runs, test results, and daily entries (the latter also
 * provide bodyweight readings) in reverse-chronological order. Photos are not
 * eagerly cached here — their blobs are loaded on demand by the Photos tab to
 * keep memory down.
 */
interface HistoryState {
  sessions: Session[];
  runs: RunEntry[];
  tests: TestResult[];
  dailyEntries: DailyEntry[];
  loaded: boolean;
  loadAll: () => Promise<void>;
}

// Newest first.
function byDateDesc<T extends { date: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => b.date.localeCompare(a.date));
}

export const useHistoryStore = create<HistoryState>((set) => ({
  sessions: [],
  runs: [],
  tests: [],
  dailyEntries: [],
  loaded: false,

  loadAll: async () => {
    const [sessions, runs, tests, dailyEntries] = await Promise.all([
      sessionRepo.listByDateRange(),
      runRepo.listByDateRange(),
      testResultRepo.listByDateRange(),
      dailyEntryRepo.listByDateRange(),
    ]);
    set({
      sessions: byDateDesc(sessions),
      runs: byDateDesc(runs),
      tests: byDateDesc(tests),
      dailyEntries: byDateDesc(dailyEntries),
      loaded: true,
    });
  },
}));
