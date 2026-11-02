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
  // Mon — HIGH reactive (vertical) + upper push. [legacy key: monday_upper]
  monday_upper: {
    type: 'monday_upper',
    title: 'Reactive + Upper Push',
    kind: 'gym',
    blurb: 'Fresh-leg vertical pogos & landings, explosive push, then push iso/speed, shoulders and the adductor. Bodyweight logged.',
  },
  // Tue — microdose reactive + loaded single-leg & lateral.
  tuesday_lower_athletic: {
    type: 'tuesday_lower_athletic',
    title: 'Single-Leg & Lateral',
    kind: 'gym',
    blurb: 'A reactive groove, then loaded single-leg and lateral strength over today’s obscure setup, finished with the iso holds.',
  },
  // Wed — microdose reactive + core & rotary.
  wednesday_run: {
    type: 'wednesday_run',
    title: 'Core & Rotary',
    kind: 'gym',
    blurb: 'A reactive groove, then a rotary-trunk and anti-rotation deep-dive — ball rotations, stir-the-pot, Pallof, plank. Pair with easy cardio.',
  },
  // Thu — HIGH reactive (horizontal/landing) + upper pull.
  thursday_upper_athletic: {
    type: 'thursday_upper_athletic',
    title: 'Reactive + Upper Pull',
    kind: 'gym',
    blurb: 'Fresh-leg horizontal hops & landing-sticks, explosive pull, then pull iso/speed and the posterior chain.',
  },
  // Fri — microdose reactive + single-leg & max perturbation.
  friday_lower_athletic: {
    type: 'friday_lower_athletic',
    title: 'Single-Leg & Perturbation',
    kind: 'gym',
    blurb: 'A reactive groove, then max perturbation — inverted bosu, dangling-KB anti-sway, hip airplane and loaded single-leg. Bodyweight logged.',
  },
  // Sat — HIGH reactive, multidirectional variety.
  saturday_long_run: {
    type: 'saturday_long_run',
    title: 'Reactive Variety',
    kind: 'gym',
    blurb: 'Fresh-leg multidirectional pogos and landing-sticks, with the high-impact ramp as it unlocks. Pair with longer easy cardio.',
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
