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

// Hues come from the training quality, not decoration: foundation = green,
// isometric = molten gold, balance/rotary = violet, reactive = ignition orange,
// loaded strength/upper = signal blue, regen = muted. Matches the theme tokens.
export const CATEGORY_META: Record<ExerciseCategory, CategoryMeta> = {
  mobility: { label: 'Mobility', blurb: 'Joint prep & active range', hue: '#4FC98A' },
  foot_ankle: { label: 'Foot & Ankle', blurb: 'Arch lock & ankle spring', hue: '#4FC98A' },
  hip: { label: 'Hip', blurb: 'Rotation, holds & position', hue: '#4FC98A' },
  isometric: { label: 'Isometric Holds', blurb: 'Schroeder-style long-duration holds', hue: '#F2B23E' },
  ball: { label: 'Ball & Core Connection', blurb: 'Low-fatigue switch-on', hue: '#4C8DF6' },
  posterior_chain: { label: 'Posterior Chain', blurb: 'Foot → glute → hamstring line', hue: '#4C8DF6' },
  single_leg: { label: 'Single-Leg', blurb: 'Loaded & controlled one-leg work', hue: '#4C8DF6' },
  instability: { label: 'Balance & Perturbation', blurb: 'Destabilize → fire', hue: '#9B7CF0' },
  plyometric: { label: 'Reactive & Plyometric', blurb: 'Fast, quiet contacts & landings', hue: '#FF5A36' },
  core: { label: 'Core & Rotation', blurb: 'Anti-rotation & knee-safe rotary', hue: '#9B7CF0' },
  upper: { label: 'Upper Body', blurb: 'Explosive EDI press & pull', hue: '#4C8DF6' },
  regen: { label: 'Regeneration', blurb: 'Down-regulate & restore', hue: '#5F6773' },
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
