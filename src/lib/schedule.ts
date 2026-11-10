/**
 * Weekly training schedule (2026-09-12 athletic-foundation pivot).
 *
 * One ~30-min morning session per day on a fixed Mon–Sun cycle. ONE template
 * every day (prime → reactive-while-fresh → strength & control → long iso holds
 * → down-regulate); only the reactive tier and the emphasis undulate across the
 * week (DUP). Every day leads with hips & feet (the knee is trained downstream),
 * then fires the reactive work on fresh legs, building toward a return to court
 * sport through the destabilize→fire principle and an earn-it high-impact ramp.
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

// ONE daily template (prime → reactive-fresh → strength → iso → down-regulate);
// only the reactive tier and the emphasis undulate across the week (DUP). The
// title names the day's flavour; the prime, generated setup and iso holds appear
// every day. See sessionPlan.ts for the full wave.
export const SESSION_META: Record<SessionType, SessionMeta> = {
  // Mon — UPPER PUSH day (+ essential lower). [legacy key: monday_upper]
  monday_upper: {
    type: 'monday_upper',
    title: 'Upper Push (+ lower)',
    kind: 'gym',
    blurb: 'Fresh-leg pogos, explosive push (depth push-up + jerk), EDI press & speed bench, rear-delt, plus a bosu SL-RDL and an iso hold. Bodyweight logged.',
  },
  // Tue — LOWER: single-leg & lateral.
  tuesday_lower_athletic: {
    type: 'tuesday_lower_athletic',
    title: 'Lower — Single-Leg & Lateral',
    kind: 'gym',
    blurb: 'Fresh reactive, today’s obscure setup, loaded single-leg and lateral strength, posterior chain, and an iso hold.',
  },
  // Wed — LOWER: core & rotary.
  wednesday_run: {
    type: 'wednesday_run',
    title: 'Lower — Core & Rotary',
    kind: 'gym',
    blurb: 'Fresh reactive, a rotary-trunk and anti-rotation block (ball rotations, dead bug, Pallof), posterior chain, iso hold. Pair with easy cardio.',
  },
  // Thu — UPPER PULL day (+ essential lower).
  thursday_upper_athletic: {
    type: 'thursday_upper_athletic',
    title: 'Upper Pull (+ lower)',
    kind: 'gym',
    blurb: 'Fresh-leg hops, explosive pull-up, pull iso/speed + speed curl, a single-leg step-down and an iso hold.',
  },
  // Fri — LOWER: single-leg & max perturbation.
  friday_lower_athletic: {
    type: 'friday_lower_athletic',
    title: 'Lower — Single-Leg & Perturbation',
    kind: 'gym',
    blurb: 'Fresh-leg single-leg pogos + snap-down-to-stick (deceleration skill), max perturbation (dangling-KB anti-sway + today’s setup), single-leg & hip control, and an iso hold. Bodyweight logged.',
  },
  // Sat — LOWER: reactive, multidirectional variety.
  saturday_long_run: {
    type: 'saturday_long_run',
    title: 'Lower — Reactive Variety',
    kind: 'gym',
    blurb: 'Fresh-leg multidirectional pogos and all-direction single-leg stick-and-holds (high-impact ramp as it unlocks), today’s setup, posterior chain, iso hold. Pair with longer easy cardio.',
  },
  // Sun — Regeneration: lean prime + easy instability, no impact + restorative mobility.
  sunday_rest_walk: {
    type: 'sunday_rest_walk',
    title: 'Regeneration',
    kind: 'rest',
    blurb: 'A lean prime and an easy balance setup without impact, plus restorative mobility and breathing. Pair with an easy walk or jog.',
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
