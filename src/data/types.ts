// Core entity types for the Athletic Reset app (KICKOFF_BRIEF.md Section 2).
// All six entities are persisted in IndexedDB; see src/db/schema.ts for the
// store/key/index definitions and src/db/repositories.ts for read/write access.

// ── 2.1 Settings ────────────────────────────────────────────────────────────

// 2026-09-12 pivot: 4 criteria-gated phases (P1 Foundation & Connection →
// P2 Dynamic Control → P3 Reactive & Multidirectional → P4 Return to Court).
// Phases advance on movement criteria, not the calendar — currentPhase is set
// manually in Settings. (Was 1..5 in the old DKV rehab build.)
export type Phase = 1 | 2 | 3 | 4;

export interface Settings {
  currentPhase: Phase;
  currentWeek: number; // week within the current phase (informational)
  startDate: string; // ISO date the program began, e.g. "2026-05-30"
  phaseStartDate: string; // ISO date the current phase was entered (for "day N of Phase X")
  notificationTime: string; // "07:00", when the morning reminder fires
  notificationsEnabled: boolean;
  exportPreferences: {
    includeRecentSessions: number; // how many recent sessions to include in export
  };
}

// Settings is a single-row store. We persist it under one fixed key so the
// store has a keyPath to work with.
export const SETTINGS_ID = 'app';
export type StoredSettings = Settings & { id: typeof SETTINGS_ID };

// ── 2.2 DailyEntry ──────────────────────────────────────────────────────────

export interface JointCheck {
  knees: number; // 1-10
  ankles: number; // 1-10
  hips: number; // 1-10
}

export interface Readiness {
  sleepHours: number;
  jointCheck: JointCheck;
  energy: number; // 1-10
  ateNormally: boolean; // simple yes/no, replaces food logging
  notes?: string;
}

export interface DailyEntry {
  date: string; // ISO date, primary key
  readiness: Readiness | null;
  morningEICompleted: boolean;
  morningEIDurationSec?: number;
  reEducationCompleted: boolean;
  reEducationNotes?: string;
  rapidResponseCompleted: boolean;
  rapidResponseNotes?: string;
  homeWorkCompleted?: boolean; // supplemental home work done (only on its days)
  bodyweightLbs?: number; // logged Mon/Fri at the gym, undefined otherwise
}

// ── 2.3 Session ─────────────────────────────────────────────────────────────

export type SessionType =
  | 'monday_upper'
  | 'tuesday_lower_athletic'
  | 'wednesday_run'
  | 'thursday_upper_athletic'
  | 'friday_lower_athletic'
  | 'saturday_long_run'
  | 'sunday_rest_walk';

export interface CompletedSet {
  setNumber: number;
  // For weighted exercises:
  weightLbs?: number;
  reps?: number;
  // For timed exercises:
  durationSec?: number;
  // For distance exercises:
  distanceFeet?: number;
  // Subjective:
  rpe?: number;
  // For movements that are just "done or not":
  completed?: boolean;
}

export interface CompletedExercise {
  exerciseId: string; // ref to exercises.json
  sets: CompletedSet[];
  notes?: string;
}

export interface CompletedBlock {
  blockId: string; // e.g. "warmup", "main", "finisher"
  exercises: CompletedExercise[];
}

export interface Session {
  id: string; // UUID
  date: string; // ISO date
  type: SessionType;
  phase: number; // which phase this session was performed in
  weekInPhase: number;
  completedBlocks: CompletedBlock[];
  sessionRPE?: number; // 1-10, logged at end
  sessionNotes?: string;
  startedAt: string; // ISO timestamp
  endedAt?: string;
}

// ── 2.4 RunEntry ────────────────────────────────────────────────────────────

export type RunType = 'wednesday' | 'saturday' | 'other';
export type RunSurface = 'treadmill' | 'road' | 'trail' | 'track';

export interface RunEntry {
  id: string;
  date: string;
  type: RunType;
  durationMin: number;
  distanceMiles?: number;
  surface: RunSurface;
  rpe?: number;
  notes?: string;
}

// ── 2.5 TestResult ──────────────────────────────────────────────────────────

export interface TestMeasurements {
  standingVerticalInches?: number;
  standingBroadJumpFeet?: number;
  leftLegBalanceClosedEyesSec?: number;
  rightLegBalanceClosedEyesSec?: number;
  leftLegBilateralBroadLandingQuality?: 1 | 2 | 3 | 4 | 5;
  rightLegBilateralBroadLandingQuality?: 1 | 2 | 3 | 4 | 5;
  // Added in Phase 3+:
  twoFootApproachVerticalInches?: number;
  leftLegApproachVerticalInches?: number;
  rightLegApproachVerticalInches?: number;
  leftLegBroadJumpFeet?: number;
  rightLegBroadJumpFeet?: number;
}

export interface TestResult {
  id: string;
  date: string;
  phase: number;
  weekInPhase: number;
  measurements: TestMeasurements;
  notes?: string;
}

// ── 2.6 PhotoEntry ──────────────────────────────────────────────────────────

export type PhotoType = 'front' | 'side' | 'back';

export interface PhotoEntry {
  id: string;
  date: string; // ISO date
  type: PhotoType;
  imageBlob: Blob; // stored directly in IndexedDB
}

// ── Exercise reference data ───────────────────────────────────────────────────
// These describe the read-only exercise database (src/data/exercises.json), not
// a persisted entity. The app loads exercises from JSON at startup; completed
// work references them by `Exercise.id` (see CompletedExercise above).

// Categories present in exercises.json (2026-09-12 athletic-foundation pivot).
// The taxonomy mirrors the connect→control→express method ladder and the daily
// 5-block session, ordered foot/hip-first (the knee is a victim joint):
//   mobility        — active/loaded hip & ankle mobility (Prime block); NOT passive yoga
//   foot_ankle      — foot tripod, windlass, ankle stiffness (tibialis/calf iso)
//   hip             — glute/hip control, abductor, adductor, psoas (active)
//   isometric       — Connect-layer holds (wall sit, Spanish squat, split-squat iso)
//   ball            — dynamic isometrics on the 55cm ball (dead-bug, stir-the-pot, curls)
//   posterior_chain — foot→glute long line, hinge, hamstring (fascial connection)
//   single_leg      — closed-chain single-leg control (mirror SL squat, step-down)
//   plyometric      — the earn-it Express ladder (pogo → hops → landings → bounds)
//   core            — anti-rotation / anti-extension trunk control
//   regen           — breathing / down-regulate
export type ExerciseCategory =
  | 'mobility'
  | 'foot_ankle'
  | 'hip'
  | 'isometric'
  | 'ball'
  | 'posterior_chain'
  | 'single_leg'
  | 'plyometric'
  | 'core'
  | 'regen';

// The 3 measurement modes present in exercises.json.
export type ExerciseMeasurement =
  | 'time' // timed hold/movement (durationSec)
  | 'sets_reps_weight' // strength-style sets × reps (× optional weight)
  | 'distance'; // measured distance (distanceFeet)

// A prescription. All fields optional — which ones appear depends on the
// exercise's measurement mode (e.g. timed holds use durationSec; rapid-response
// drills use bouts/workSec/restSec; lifts use sets/reps/weightLbs). `notes`
// only appears inside phasePrescriptions overrides.
export interface Prescription {
  sets?: number;
  warmupSets?: number;
  reps?: number;
  durationSec?: number;
  restSec?: number;
  distanceFeet?: number;
  weightLbs?: number;
  bouts?: number; // rapid-response: work/rest cycles
  workSec?: number; // rapid-response: work interval
  perSide?: boolean; // prescription is per side (left/right)
  notes?: string;
}

// Per-phase overrides, keyed by phase number as a string ("2".."5"). Phases not
// listed fall back to defaultPrescription. Null when there are no overrides.
export type PhasePrescriptions = Record<string, Prescription>;

// Kinetic-chain type at the KNEE. This is a hard safety filter: the user has a
// history of left patellar subluxation in open-chain positions, so open-chain
// knee-extension work is excluded from scheduling entirely. 'closed' = foot
// fixed / patella seated (safe); 'open' = free-moving shank at the knee (avoid);
// 'na' = doesn't load the knee (breathing, upper mobility, etc.).
export type KneeChain = 'open' | 'closed' | 'na';

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  chain: KneeChain;
  equipment: string[]; // free-text equipment list, e.g. ["55cm exercise ball", "light band"]
  description: string;
  setup: string[]; // ordered setup steps
  cues: string[];
  measurement: ExerciseMeasurement;
  defaultPrescription: Prescription;
  phasePrescriptions?: PhasePrescriptions | null;
  svg: string; // inline SVG markup; uses currentColor so it inherits text color
  /** Optional demo video (e.g. an Instagram reel) surfaced as a "Watch demo" link. */
  videoUrl?: string;
}
