import { create } from 'zustand';
import { settingsRepo } from '../db/repositories';
import type { Phase, Settings } from '../data/types';

/**
 * App-wide settings (phase, week, notifications, export prefs), backed by the
 * single-row settings store in IndexedDB. `load()` is called once on app start;
 * every mutation writes through to IndexedDB so a refresh restores state.
 */
interface SettingsState {
  settings: Settings | null;
  loaded: boolean;
  load: () => Promise<void>;
  /** Merge a partial patch into settings and persist. */
  update: (patch: Partial<Settings>) => Promise<void>;
  /** Phase override flow (Settings screen) — set phase and reset/choose week. */
  setPhaseAndWeek: (phase: Phase, week: number) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  loaded: false,

  load: async () => {
    const settings = await settingsRepo.loadOrInit();
    set({ settings, loaded: true });
  },

  update: async (patch) => {
    const current = get().settings;
    if (!current) return;
    const next: Settings = { ...current, ...patch };
    await settingsRepo.save(next);
    set({ settings: next });
  },

  setPhaseAndWeek: async (phase, week) => {
    await get().update({ currentPhase: phase, currentWeek: week });
  },
}));
