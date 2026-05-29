/**
 * Weekly training schedule (KICKOFF_BRIEF.md Section 5 — weekly structure).
 *
 * The Athletic Reset week is a fixed Mon–Sun split. This module maps a calendar
 * day to its SessionType and exposes display metadata (title, kind, blurb) that
 * later screens (Today, Gym, Run) reuse so the labelling stays in one place.
 */

import type { SessionType } from '../data/types';
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
  monday_upper: {
    type: 'monday_upper',
    title: 'Upper Body',
    kind: 'gym',
    blurb: 'Upper-body strength day.',
  },
  tuesday_lower_athletic: {
    type: 'tuesday_lower_athletic',
    title: 'Lower + Athletic',
    kind: 'gym',
    blurb: 'Lower-body strength with athletic work.',
  },
  wednesday_run: {
    type: 'wednesday_run',
    title: 'Run',
    kind: 'run',
    blurb: 'Midweek conditioning run.',
  },
  thursday_upper_athletic: {
    type: 'thursday_upper_athletic',
    title: 'Upper + Athletic',
    kind: 'gym',
    blurb: 'Upper-body strength with athletic work.',
  },
  friday_lower_athletic: {
    type: 'friday_lower_athletic',
    title: 'Lower + Athletic',
    kind: 'gym',
    blurb: 'Lower-body strength with athletic work.',
  },
  saturday_long_run: {
    type: 'saturday_long_run',
    title: 'Long Run',
    kind: 'run',
    blurb: 'The week’s long endurance run.',
  },
  sunday_rest_walk: {
    type: 'sunday_rest_walk',
    title: 'Rest / Walk',
    kind: 'rest',
    blurb: 'Active recovery — an easy walk, nothing more.',
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
