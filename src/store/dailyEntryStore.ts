import { create } from 'zustand';
import { dailyEntryRepo } from '../db/repositories';
import { todayISO } from '../lib/dates';
import type { DailyEntry, Readiness } from '../data/types';

/**
 * Today's DailyEntry (KICKOFF_BRIEF.md 4.1 Today + 4.2 Readiness).
 *
 * Backs the Today screen and the daily flows (readiness, morning EI,
 * re-education, rapid response). Mirrors the settingsStore pattern: `load()`
 * runs once on app start, and every mutation writes through to IndexedDB so a
 * refresh restores the day's progress.
 *
 * A row isn't written until the user actually logs something — until then
 * `entry` is null and the screen shows empty/CTA states.
 */

/** A fresh, all-empty entry for a date (kept in sync with the DailyEntry type). */
function emptyEntry(date: string): DailyEntry {
  return {
    date,
    readiness: null,
    morningEICompleted: false,
    reEducationCompleted: false,
    rapidResponseCompleted: false,
    homeWorkCompleted: false,
  };
}

interface DailyEntryState {
  date: string; // ISO date this store is tracking (today, at load time)
  entry: DailyEntry | null;
  loaded: boolean;
  load: () => Promise<void>;
  /** Merge a patch into today's entry (creating it if needed) and persist. */
  update: (patch: Partial<Omit<DailyEntry, 'date'>>) => Promise<void>;
  /** Save the morning readiness check. */
  saveReadiness: (readiness: Readiness) => Promise<void>;
  /** Mark the re-education routine done (or not) with optional notes. */
  setReEducation: (completed: boolean, notes?: string) => Promise<void>;
  /** Mark the rapid-response routine done (or not) with optional notes. */
  setRapidResponse: (completed: boolean, notes?: string) => Promise<void>;
}

export const useDailyEntryStore = create<DailyEntryState>((set, get) => ({
  date: todayISO(),
  entry: null,
  loaded: false,

  load: async () => {
    const date = todayISO();
    const entry = (await dailyEntryRepo.get(date)) ?? null;
    set({ date, entry, loaded: true });
  },

  update: async (patch) => {
    const date = get().date;
    const base = get().entry ?? emptyEntry(date);
    const next: DailyEntry = { ...base, ...patch, date };
    await dailyEntryRepo.upsert(next);
    set({ entry: next });
  },

  saveReadiness: async (readiness) => {
    await get().update({ readiness });
  },

  setReEducation: async (completed, notes) => {
    await get().update({
      reEducationCompleted: completed,
      ...(notes?.trim() ? { reEducationNotes: notes.trim() } : { reEducationNotes: undefined }),
    });
  },

  setRapidResponse: async (completed, notes) => {
    await get().update({
      rapidResponseCompleted: completed,
      ...(notes?.trim() ? { rapidResponseNotes: notes.trim() } : { rapidResponseNotes: undefined }),
    });
  },
}));
