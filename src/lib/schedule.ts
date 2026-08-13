/**
 * Weekly training schedule (2026-08-13 neuromuscular-first overhaul).
 *
 * The program is now built to correct dynamic knee valgus through motor-control
 * re-education — low-load and non-impact while the knee effusion is active. The
 * daily foundation (morning isometrics + re-education + reactive coordination)
 * lives in the daily routine; this module lays out the seven themed focus
 * sessions on a fixed Mon–Sun cycle, working up the chain: foot/ankle → glute/hip
 * → integrated single-leg control → core → integration → movement quality, plus a
 * regeneration day. No upper-body strength, plyometrics, jumps or running.
 *
 * NOTE ON KEYS: the SessionType keys (e.g. `wednesday_run`, `friday_lower_athletic`)
 * are LEGACY weekday identifiers kept stable so previously-logged sessions still
 * resolve in history/export. Their current meaning is defined by `title`/`blurb`
 * and the plan in sessionPlan.ts — NOT by the key name. Don't trust the key name.
 */

import type { SessionType } from '../data/types';
import { fromISODate } from './dates';

/** What kind of day this is — drives which flow the Today card links to. */
export type SessionKind = 'gym' | 'rest';

export interface SessionMeta {
  type: SessionType;
  /** Short title for the day's focus, e.g. "Upper Body". */
  title: string;
  kind: SessionKind;
  /** One-line description shown under the title. */
  blurb: string;
}

export const SESSION_META: Record<SessionType, SessionMeta> = {
  // Mon — foot & ankle foundation: the base of the chain. [legacy key: monday_upper]
  monday_upper: {
    type: 'monday_upper',
    title: 'Foot & Ankle Foundation',
    kind: 'gym',
    blurb: 'Foot tripod, intrinsics, ankle mobility and single-leg balance — the base of the chain.',
  },
  // Tue — glute & hip control: the hip governor of the knee.
  tuesday_lower_athletic: {
    type: 'tuesday_lower_athletic',
    title: 'Glute & Hip Control',
    kind: 'gym',
    blurb: 'Glute activation and hip control — knees out, pelvis level. The hip governs the knee.',
  },
  // Wed — integrated control: mirror/feedback single-leg work (centrepiece).
  wednesday_run: {
    type: 'wednesday_run',
    title: 'Integrated Control',
    kind: 'gym',
    blurb: 'Mirror single-leg squats with external-focus cueing — rewire the knee to track over the foot.',
  },
  // Thu — core & coordination: trunk control that keeps the knee stacked.
  thursday_upper_athletic: {
    type: 'thursday_upper_athletic',
    title: 'Core & Coordination',
    kind: 'gym',
    blurb: 'Lateral chain, anti-rotation and trunk coordination that keep the knee stacked over the foot.',
  },
  // Fri — lower-chain integration: quad iso (AMI) → integrated control → capped tempo.
  friday_lower_athletic: {
    type: 'friday_lower_athletic',
    title: 'Lower-Chain Integration',
    kind: 'gym',
    blurb: 'Quad isometrics to wake the knee, then integrated single-leg control and capped-depth tempo.',
  },
  // Sat — movement quality: multiplanar single-leg control; impact stays locked.
  saturday_long_run: {
    type: 'saturday_long_run',
    title: 'Movement Quality',
    kind: 'gym',
    blurb: 'Multiplanar single-leg control and controlled deceleration — non-impact; jumps stay locked.',
  },
  // Sun — regeneration: long iso holds, mobility and an easy walk.
  sunday_rest_walk: {
    type: 'sunday_rest_walk',
    title: 'Regeneration',
    kind: 'rest',
    blurb: 'Iso holds, mobility and an easy walk — recover the nervous system.',
  },
};

// JS Date.getDay(): 0 = Sunday … 6 = Saturday.
const WEEKDAY_TO_SESSION: Record<number, SessionType> = {
  0: 'sunday_rest_walk',
  1: 'monday_upper',
  2: 'tuesday_lower_athletic',
  3: 'wednesday_run',
  4: 'thursday_upper_athletic',
  5: 'friday_lower_athletic',
  6: 'saturday_long_run',
};

/** The session type scheduled for the given ISO date. */
export function sessionTypeForDate(iso: string): SessionType {
  return WEEKDAY_TO_SESSION[fromISODate(iso).getDay()];
}

/** Full session metadata for the given ISO date. */
export function planForDate(iso: string): SessionMeta {
  return SESSION_META[sessionTypeForDate(iso)];
}
