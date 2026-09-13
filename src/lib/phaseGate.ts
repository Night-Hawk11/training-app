/**
 * Phase advancement gate (2026-09-12 pivot).
 *
 * Phases are criteria-gated, not calendar-driven. Rather than a blind manual
 * toggle, this evaluates each phase's exit criteria from the logged DailyEntry
 * history — a mix of AUTO checks (consistency + symptom-free, computed from data)
 * and SELF checks (movement-quality confirmations the user ticks in the check-in).
 *
 * The check-in offers to advance only when every auto criterion is met AND the
 * user confirms the self checks. The Settings phase picker remains as a manual
 * override. Windows are rolling (last N days) so they don't depend on tracking a
 * per-phase start date.
 */

import type { DailyEntry } from '../data/types';
import { addDays } from './dates';
import { KNEE_FLARE_THRESHOLD } from './sessionPlan';

export interface Criterion {
  label: string;
  met: boolean;
  /** e.g. "8 / 10" — the current standing against the target. */
  detail?: string;
}

export interface PhaseGate {
  currentPhase: number;
  /** The phase the check-in would advance to, or null at the top phase. */
  nextPhase: number | null;
  /** Data-derived criteria (✓/✗ shown to the user). */
  autoCriteria: Criterion[];
  /** Movement-quality statements the user must confirm to advance. */
  selfChecks: string[];
  /** True when every auto criterion is met. */
  autoMet: boolean;
}

interface PhaseRule {
  sessionsDays: number;
  minSessions: number;
  flareDays: number;
  selfChecks: string[];
}

// Exit criteria per current phase. Kept deliberately conservative for the knee;
// tune the thresholds here.
const PHASE_RULES: Record<number, PhaseRule> = {
  1: {
    sessionsDays: 14,
    minSessions: 10,
    flareDays: 7,
    selfChecks: [
      'Single-leg balance ~30s, eyes open, feels solid with a quiet foot',
      'Foundation work is pain- and swelling-free',
    ],
  },
  2: {
    sessionsDays: 14,
    minSessions: 12,
    flareDays: 10,
    selfChecks: [
      'Double-leg pogo & curb drop-to-stick land silent and controlled',
      'Knee tracks over the foot on every landing — no cave-in',
    ],
  },
  3: {
    sessionsDays: 14,
    minSessions: 12,
    flareDays: 14,
    selfChecks: [
      'Single-leg landings are quiet and symmetrical on both sides',
      'Lateral bounds stick without the knee caving',
    ],
  },
};

export const TOP_PHASE = 4;

/** Count days in the trailing window (inclusive of today) with a completed session. */
function completedSessions(entries: DailyEntry[], todayISO: string, days: number): number {
  const from = addDays(todayISO, -(days - 1));
  return entries.filter((e) => e.date >= from && e.date <= todayISO && e.morningEICompleted).length;
}

/** Whether any readiness in the trailing window flagged the knee at or below the flare threshold. */
function hadKneeFlare(entries: DailyEntry[], todayISO: string, days: number): boolean {
  const from = addDays(todayISO, -(days - 1));
  return entries.some(
    (e) =>
      e.date >= from &&
      e.date <= todayISO &&
      e.readiness != null &&
      e.readiness.jointCheck.knees <= KNEE_FLARE_THRESHOLD
  );
}

/** Evaluate the advancement gate for the current phase. */
export function evaluatePhaseGate(
  currentPhase: number,
  entries: DailyEntry[],
  todayISO: string
): PhaseGate {
  const rule = PHASE_RULES[currentPhase];
  if (!rule || currentPhase >= TOP_PHASE) {
    return { currentPhase, nextPhase: null, autoCriteria: [], selfChecks: [], autoMet: false };
  }

  const sessions = completedSessions(entries, todayISO, rule.sessionsDays);
  const flare = hadKneeFlare(entries, todayISO, rule.flareDays);

  const autoCriteria: Criterion[] = [
    {
      label: `${rule.minSessions}+ sessions in the last ${rule.sessionsDays} days`,
      met: sessions >= rule.minSessions,
      detail: `${sessions} / ${rule.minSessions}`,
    },
    {
      label: `No knee flare in the last ${rule.flareDays} days`,
      met: !flare,
      detail: flare ? 'flare logged' : 'clear',
    },
  ];

  return {
    currentPhase,
    nextPhase: currentPhase + 1,
    autoCriteria,
    selfChecks: rule.selfChecks,
    autoMet: autoCriteria.every((c) => c.met),
  };
}
