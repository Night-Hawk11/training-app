/**
 * Weekly training schedule.
 *
 * The week follows two methodologies: Marv Marinovich (rapid-response CNS prep)
 * and Jay Schroeder (extreme isometrics + ballistic absorb→generate force). The
 * daily foundation (morning extreme isometrics + rapid-response drills) lives in
 * the daily routine; this module lays out the seven *main* sessions on a fixed
 * Mon–Sun cycle: 2 pure-strength days (upper/lower), 2 power days (lower/upper),
 * a rapid-response conditioning day, a full-body athletic-expression day, and a
 * regeneration day. There are no longer any running days.
 *
 * NOTE ON KEYS: the SessionType keys (e.g. `wednesday_run`, `friday_lower_athletic`)
 * are LEGACY weekday identifiers kept stable so previously-logged sessions still
 * resolve in history/export. Their current meaning is defined by `title`/`blurb`
 * and the plan in sessionPlan.ts — NOT by the key name. Don't trust the key name.
 */

import type { Phase, SessionType } from '../data/types';
import { fromISODate } from './dates';

/** What kind of day this is — drives which flow the Today card links to. */
export type SessionKind = 'gym' | 'run' | 'rest';

export interface SessionMeta {
  type: SessionType;
  /** Short title for the day's focus, e.g. "Upper Body". */
  title: string;
  kind: SessionKind;
  /** One-line description shown under the title. */
  blurb: string;
}

export const SESSION_META: Record<SessionType, SessionMeta> = {
  // Mon — pure max-strength, upper body (2 all-out sets per lift).
  monday_upper: {
    type: 'monday_upper',
    title: 'Strength — Upper',
    kind: 'gym',
    blurb: 'Max-strength upper body: two all-out sets per lift.',
  },
  // Tue — lower-body power: absorb landings, then generate jumps (Schroeder).
  tuesday_lower_athletic: {
    type: 'tuesday_lower_athletic',
    title: 'Power — Lower',
    kind: 'gym',
    blurb: 'Lower-body force: loaded-iso priming, absorb landings, then jumps.',
  },
  // Wed — rapid-response conditioning (Marinovich). [legacy key: was the run]
  wednesday_run: {
    type: 'wednesday_run',
    title: 'Rapid Response',
    kind: 'gym',
    blurb: 'Reactive, fast-twitch conditioning — the “perform longer” quality.',
  },
  // Thu — upper-body power: ballistic pressing and throws (Schroeder).
  thursday_upper_athletic: {
    type: 'thursday_upper_athletic',
    title: 'Power — Upper',
    kind: 'gym',
    blurb: 'Explosive overhead/press power and ballistic throws.',
  },
  // Fri — pure max-strength, lower body. [legacy key: was lower+athletic]
  friday_lower_athletic: {
    type: 'friday_lower_athletic',
    title: 'Strength — Lower',
    kind: 'gym',
    blurb: 'Max-strength lower body: two all-out sets per lift.',
  },
  // Sat — full-body explosive expression (Marinovich). [legacy key: was long run]
  saturday_long_run: {
    type: 'saturday_long_run',
    title: 'Athletic Expression',
    kind: 'gym',
    blurb: 'Full-body explosive expression — jumps and throws.',
  },
  // Sun — regeneration: long extreme-iso holds and an easy walk.
  sunday_rest_walk: {
    type: 'sunday_rest_walk',
    title: 'Regeneration',
    kind: 'rest',
    blurb: 'Extreme-iso holds and an easy walk — recover the nervous system.',
  },
};

// Running was removed from the program (it conflicts with the power/CNS focus of
// the Marinovich/Schroeder methodologies). No session has a distance target.
// Kept as a no-op so the run UI branches in Today/Preview still type-check.
const RUN_DISTANCE_TARGETS: Partial<Record<SessionType, Record<Phase, string>>> = {};

/**
 * Rough distance to pursue on a run day in the given phase. Always null now that
 * the program has no running days.
 */
export function runDistanceTarget(type: SessionType, phase: Phase): string | null {
  const miles = RUN_DISTANCE_TARGETS[type]?.[phase];
  return miles ? `${miles} mi` : null;
}

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
