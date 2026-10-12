/**
 * Weekly training schedule (2026-09-12 athletic-foundation pivot).
 *
 * One ~30-min morning session per day on a fixed Mon–Sun cycle. HYBRID shape: a
 * short fixed spine (hip mobility → ankle/foot) then a free instability circuit
 * you flow through, themed by a rotating featured quality. Every day leads with
 * hips & feet (the knee is trained downstream), building toward a return to court
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

// Each day = the fixed spine (hips & feet) + a free instability circuit with a
// generated "obscure setup of the day" + a rotating featured quality. The title
// names the feature; the spine and generated setup appear every day.
export const SESSION_META: Record<SessionType, SessionMeta> = {
  // Mon — featured: adductor. [legacy key: monday_upper]
  monday_upper: {
    type: 'monday_upper',
    title: 'Instability + Adductor',
    kind: 'gym',
    blurb: 'Spine, today’s obscure setup and the adductor — bosu balance, Copenhagen, squeeze and psoas.',
  },
  // Tue — featured: abductor & lateral hip.
  tuesday_lower_athletic: {
    type: 'tuesday_lower_athletic',
    title: 'Instability + Abductor',
    kind: 'gym',
    blurb: 'Spine, today’s obscure setup and lateral hip — tandem foam reach, glute-medius, band walks.',
  },
  // Wed — featured: ball & core.
  wednesday_run: {
    type: 'wednesday_run',
    title: 'Instability + Ball & Core',
    kind: 'gym',
    blurb: 'Spine, today’s obscure setup and a rotary-trunk deep-dive — ball rotations, stir-the-pot, plank.',
  },
  // Thu — featured: posterior chain.
  thursday_upper_athletic: {
    type: 'thursday_upper_athletic',
    title: 'Instability + Posterior Chain',
    kind: 'gym',
    blurb: 'Spine, today’s obscure setup and foot→glute loading — single-leg RDL on a dome, hamstring bridge.',
  },
  // Fri — featured: single-leg & perturbation.
  friday_lower_athletic: {
    type: 'friday_lower_athletic',
    title: 'Instability + Single-Leg',
    kind: 'gym',
    blurb: 'Spine, today’s obscure setup and max perturbation — inverted bosu, dangling-KB anti-sway, hip airplane. Loaded knee work earns in from Phase 2.',
  },
  // Sat — featured: reactive & plyo (earn-it).
  saturday_long_run: {
    type: 'saturday_long_run',
    title: 'Instability + Reactive',
    kind: 'gym',
    blurb: 'Spine, today’s obscure setup and reactivity — minor pogos/landings now, the high-impact ramp as it unlocks.',
  },
  // Sun — Regeneration: spine + easy instability, no impact + restorative mobility.
  sunday_rest_walk: {
    type: 'sunday_rest_walk',
    title: 'Regeneration',
    kind: 'rest',
    blurb: 'The spine and an easy balance setup without impact, plus restorative mobility and breathing. Pair with an easy walk or jog.',
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
