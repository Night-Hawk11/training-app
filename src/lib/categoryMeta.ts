import type { ExerciseCategory } from '../data/types';

/**
 * Display metadata for exercise categories — friendly label, a one-line "what this
 * trains" blurb, and an accent hue for the premium catalog UI. Grouping the
 * library by these is the catalog's primary navigation ("browse by body area /
 * type"). Order follows the daily session ladder: prime → reactive → strength →
 * balance → iso → close, with upper folded near strength.
 */
export interface CategoryMeta {
  label: string;
  blurb: string;
  /** Accent hue (hex) for the category's icon tint / header glow. */
  hue: string;
}

export const CATEGORY_META: Record<ExerciseCategory, CategoryMeta> = {
  mobility: { label: 'Mobility', blurb: 'Joint prep & active range', hue: '#5FB87F' },
  foot_ankle: { label: 'Foot & Ankle', blurb: 'Arch lock & ankle spring', hue: '#5FB87F' },
  hip: { label: 'Hip', blurb: 'Rotation, holds & position', hue: '#5FB87F' },
  isometric: { label: 'Isometric Holds', blurb: 'Schroeder-style long-duration holds', hue: '#E0B341' },
  ball: { label: 'Ball & Core Connection', blurb: 'Low-fatigue switch-on', hue: '#5B9DF9' },
  posterior_chain: { label: 'Posterior Chain', blurb: 'Foot → glute → hamstring line', hue: '#5B9DF9' },
  single_leg: { label: 'Single-Leg', blurb: 'Loaded & controlled one-leg work', hue: '#5B9DF9' },
  instability: { label: 'Balance & Perturbation', blurb: 'Destabilize → fire', hue: '#8B7CF6' },
  plyometric: { label: 'Reactive & Plyometric', blurb: 'Fast, quiet contacts & landings', hue: '#E5705A' },
  core: { label: 'Core & Rotation', blurb: 'Anti-rotation & knee-safe rotary', hue: '#8B7CF6' },
  upper: { label: 'Upper Body', blurb: 'Explosive EDI press & pull', hue: '#5B9DF9' },
  regen: { label: 'Regeneration', blurb: 'Down-regulate & restore', hue: '#6B7480' },
};

/** Stable display order for the catalog & debug grouping. */
export const CATEGORY_ORDER: ExerciseCategory[] = [
  'plyometric',
  'instability',
  'isometric',
  'single_leg',
  'posterior_chain',
  'hip',
  'foot_ankle',
  'core',
  'ball',
  'upper',
  'mobility',
  'regen',
];
