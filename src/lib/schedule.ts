/**
 * Weekly training schedule (2026-09-12 athletic-foundation pivot).
 *
 * One ~30-min morning session per day on a fixed Mon–Sun cycle, each a themed
 * variation of the same 5-block skeleton (Prime → Connect → Control → Express →
 * Down-regulate). Every day leads with hips & feet (the knee is trained
 * downstream), building toward a return to court sport through isometrics,
 * dynamic isometrics and an earn-it plyometric ramp.
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

// Each day = the shared daily anchor (full ground-up chain) + a rotating emphasis.
// The title names the emphasis; the anchor is the same every day.
export const SESSION_META: Record<SessionType, SessionMeta> = {
  // Mon — emphasis: adductor. [legacy key: monday_upper]
  monday_upper: {
    type: 'monday_upper',
    title: 'Foundation + Adductor',
    kind: 'gym',
    blurb: 'The daily ground-up chain, today emphasising the adductor — Copenhagen, squeeze and psoas.',
  },
  // Tue — emphasis: abductor & lateral hip.
  tuesday_lower_athletic: {
    type: 'tuesday_lower_athletic',
    title: 'Foundation + Abductor',
    kind: 'gym',
    blurb: 'The daily chain plus lateral-hip emphasis — glute-medius, band walks and multi-direction reach.',
  },
  // Wed — emphasis: ball & core.
  wednesday_run: {
    type: 'wednesday_run',
    title: 'Foundation + Ball & Core',
    kind: 'gym',
    blurb: 'The daily chain plus a ball dynamic-isometric deep-dive — stir-the-pot, bridge, wall squat, plank.',
  },
  // Thu — emphasis: posterior chain.
  thursday_upper_athletic: {
    type: 'thursday_upper_athletic',
    title: 'Foundation + Posterior Chain',
    kind: 'gym',
    blurb: 'The daily chain plus deeper foot→glute loading — single-leg RDL, hamstring bridge, bird dog.',
  },
  // Fri — emphasis: single-leg control.
  friday_lower_athletic: {
    type: 'friday_lower_athletic',
    title: 'Foundation + Single-Leg',
    kind: 'gym',
    blurb: 'The daily chain plus single-leg feedback control — wall SL squat, step-down, sit-to-ball, reach.',
  },
  // Sat — emphasis: reactive & plyo (earn-it).
  saturday_long_run: {
    type: 'saturday_long_run',
    title: 'Foundation + Reactive',
    kind: 'gym',
    blurb: 'The daily chain plus the earn-it plyo ladder — pogos, landings and lateral bounds as they unlock.',
  },
  // Sun — Regeneration: anchor without impact + restorative mobility.
  sunday_rest_walk: {
    type: 'sunday_rest_walk',
    title: 'Regeneration',
    kind: 'rest',
    blurb: 'The chain without impact, plus restorative mobility and breathing. Pair with an easy walk or jog.',
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
