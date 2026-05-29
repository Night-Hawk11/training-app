import { create } from 'zustand';
import { sessionRepo } from '../db/repositories';
import type { Session, SessionType } from '../data/types';

/**
 * In-progress training session (KICKOFF_BRIEF.md Step 2 & 7).
 *
 * Holds the single active session draft in memory while the user works through
 * the gym checklist. The detailed block/set logging UI is built in Step 7; this
 * store provides the lifecycle (start → mutate → finish/persist or discard).
 */
interface SessionState {
  active: Session | null;
  startSession: (init: {
    type: SessionType;
    phase: number;
    weekInPhase: number;
    date?: string; // defaults to today (ISO date)
  }) => Session;
  /** Patch the active session in memory (e.g. add completed blocks, RPE). */
  updateActive: (patch: Partial<Session>) => void;
  /** Stamp endedAt, persist to IndexedDB, and clear the draft. */
  finishSession: () => Promise<Session | null>;
  discardActive: () => void;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export const useSessionStore = create<SessionState>((set, get) => ({
  active: null,

  startSession: (init) => {
    const session: Session = {
      id: crypto.randomUUID(),
      date: init.date ?? todayISO(),
      type: init.type,
      phase: init.phase,
      weekInPhase: init.weekInPhase,
      completedBlocks: [],
      startedAt: new Date().toISOString(),
    };
    set({ active: session });
    return session;
  },

  updateActive: (patch) => {
    const current = get().active;
    if (!current) return;
    set({ active: { ...current, ...patch } });
  },

  finishSession: async () => {
    const current = get().active;
    if (!current) return null;
    const finished: Session = { ...current, endedAt: new Date().toISOString() };
    await sessionRepo.create(finished);
    set({ active: null });
    return finished;
  },

  discardActive: () => set({ active: null }),
}));
