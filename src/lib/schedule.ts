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

export const SESSION_META: Record<SessionType, SessionMeta> = {
  // Mon — Foot & Ankle Foundation: the base of the chain. [legacy key: monday_upper]
  monday_upper: {
    type: 'monday_upper',
    title: 'Foot & Ankle Foundation',
    kind: 'gym',
    blurb: 'Foot tripod, windlass, ankle stiffness and balance — the base of the chain, then ankle hops.',
  },
  // Tue — Hips: abductor / adductor / psoas. The hip governs the knee.
  tuesday_lower_athletic: {
    type: 'tuesday_lower_athletic',
    title: 'Hips — Abductor & Adductor',
    kind: 'gym',
    blurb: 'Glute-medius and adductor work, Copenhagen and psoas on the ball — the hip governs the knee.',
  },
  // Wed — Ball Control: dynamic isometrics.
  wednesday_run: {
    type: 'wednesday_run',
    title: 'Ball Control',
    kind: 'gym',
    blurb: 'Dynamic isometrics on the ball — dead-bug, stir-the-pot, hamstring bridge, wall squat.',
  },
  // Thu — Posterior Chain: foot → glute connection.
  thursday_upper_athletic: {
    type: 'thursday_upper_athletic',
    title: 'Posterior Chain',
    kind: 'gym',
    blurb: 'Load the foot→calf→hamstring→glute line as one unit — windlass, long-line hinge, SL RDL.',
  },
  // Fri — Single-Leg Integration.
  friday_lower_athletic: {
    type: 'friday_lower_athletic',
    title: 'Single-Leg Integration',
    kind: 'gym',
    blurb: 'Single-leg isometrics then mirror-feedback control and deceleration — knee tracks over the foot.',
  },
  // Sat — Reactive & Elastic: the plyo-emphasis day (earn-it).
  saturday_long_run: {
    type: 'saturday_long_run',
    title: 'Reactive & Elastic',
    kind: 'gym',
    blurb: 'Multiplanar balance into the earn-it plyo ladder — pogos, single-leg and lateral bounds.',
  },
  // Sun — Regeneration: mobility, light iso, breathing.
  sunday_rest_walk: {
    type: 'sunday_rest_walk',
    title: 'Regeneration',
    kind: 'rest',
    blurb: 'Active mobility, light iso and breathing — restore the system. Pair with an easy walk or jog.',
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
