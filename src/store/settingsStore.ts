import { create } from 'zustand';
import { settingsRepo } from '../db/repositories';
import { todayISO } from '../lib/dates';
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
    // One-time migration (2026-09-12 pivot): reset the phase-entry date to today
    // so "day N of Phase X" counts fresh from this deploy, without wiping history.
    // Gated by a localStorage flag so it fires exactly once per device.
    const MIGRATION_KEY = 'phaseStartReset_20260912';
    try {
      if (!localStorage.getItem(MIGRATION_KEY)) {
        const today = todayISO();
        if (settings.phaseStartDate !== today) {
          await settingsRepo.save({ ...settings, phaseStartDate: today });
          settings.phaseStartDate = today;
        }
        localStorage.setItem(MIGRATION_KEY, '1');
      }
    } catch {
      // localStorage unavailable — skip the migration rather than fail startup.
    }
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
    // Stamp the phase-entry date only when the phase actually changes, so
    // re-selecting the same phase (or just changing the week) doesn't reset it.
    const current = get().settings;
    const phaseChanged = !current || current.currentPhase !== phase;
    await get().update({
      currentPhase: phase,
      currentWeek: week,
      ...(phaseChanged ? { phaseStartDate: todayISO() } : {}),
    });
  },
}));
