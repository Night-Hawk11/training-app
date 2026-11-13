import { useMemo, useState } from 'react';
import { ChevronDown, Play } from 'lucide-react';
import { EXERCISES } from '../data/exercises';
import { CATEGORY_META, CATEGORY_ORDER } from '../lib/categoryMeta';
import StickFigure from '../components/StickFigure';
import type { Exercise, ExerciseCategory, Prescription } from '../data/types';

/**
 * Exercise catalog — the user-facing library, browsable by body area / type.
 *
 * Category chips filter the list (default: all, grouped into sections). Each
 * exercise is a card that expands to its description, setup, cues, and a linked
 * demo video where one exists. Replaces the hidden /_debug/exercises screen for
 * everyday "what is this / how do I do it" lookups.
 */

function targetLine(p: Prescription): string {
  const parts: string[] = [];
  if (p.sets != null) parts.push(`${p.sets}×`);
  if (p.reps != null) parts.push(`${p.reps} reps`);
  if (p.durationSec != null) parts.push(`${p.durationSec}s`);
  if (p.distanceFeet != null) parts.push(`${p.distanceFeet} ft`);
  if (p.weightLbs != null) parts.push(`${p.weightLbs} lb`);
  if (p.perSide) parts.push('/ side');
  // Join, tightening the "N×" prefix onto the following token.
  return parts.join(' ').replace('× ', '× ').trim() || '—';
}

function ExerciseCard({ ex }: { ex: Exercise }) {
  const [open, setOpen] = useState(false);
  const hue = CATEGORY_META[ex.category].hue;
  return (
    <article className="surface overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        <div
          className="h-14 w-16 flex-shrink-0 rounded-md bg-ink p-1"
          style={{ color: hue }}
        >
          <StickFigure svg={ex.svg} label={ex.name} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold leading-tight text-text-primary">{ex.name}</h3>
          <p className="mt-0.5 text-xs text-accent">{targetLine(ex.defaultPrescription)}</p>
          {ex.videoUrl && (
            <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-text-muted">
              <Play size={11} aria-hidden /> demo
            </span>
          )}
        </div>
        <ChevronDown
          size={18}
          aria-hidden
          className={`flex-shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="border-t border-white/[0.05] px-3 pb-3 pt-2">
          <p className="text-sm text-text-secondary">{ex.description}</p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {ex.equipment.map((eq) => (
              <span key={eq} className="chip">
                {eq}
              </span>
            ))}
          </div>

          {ex.setup.length > 0 && (
            <>
              <p className="eyebrow mt-3">Setup</p>
              <ol className="mt-1 list-inside list-decimal text-xs leading-relaxed text-text-muted">
                {ex.setup.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </>
          )}

          {ex.cues.length > 0 && (
            <>
              <p className="eyebrow mt-3">Cues</p>
              <ul className="mt-1 list-inside list-disc text-xs leading-relaxed text-text-muted">
                {ex.cues.map((cue, i) => (
                  <li key={i}>{cue}</li>
                ))}
              </ul>
            </>
          )}

          {ex.videoUrl && (
            <a
              href={ex.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost mt-3 w-full py-2 text-sm"
            >
              <Play size={15} aria-hidden /> Watch demo
            </a>
          )}
        </div>
      )}
    </article>
  );
}

export default function CatalogScreen() {
  const [filter, setFilter] = useState<ExerciseCategory | 'all'>('all');

  const grouped = useMemo(() => {
    const map = new Map<ExerciseCategory, Exercise[]>();
    for (const ex of EXERCISES) {
      const list = map.get(ex.category) ?? [];
      list.push(ex);
      map.set(ex.category, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.name.localeCompare(b.name));
    return map;
  }, []);

  const categories = CATEGORY_ORDER.filter((c) => (grouped.get(c)?.length ?? 0) > 0);
  const visible = filter === 'all' ? categories : categories.filter((c) => c === filter);

  return (
    <main className="mx-auto max-w-md px-4 pt-6 pb-28">
      <header className="hero mb-4 p-5">
        <p className="eyebrow">Library</p>
        <h1 className="mt-1 text-2xl font-bold text-text-primary">Exercises</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {EXERCISES.length} movements · tap any to see how it's done
        </p>
      </header>

      {/* Category filter chips (horizontal scroll). */}
      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label="All" />
        {categories.map((c) => (
          <FilterChip
            key={c}
            active={filter === c}
            onClick={() => setFilter(c)}
            label={CATEGORY_META[c].label}
            hue={CATEGORY_META[c].hue}
          />
        ))}
      </div>

      <div className="flex flex-col gap-6">
        {visible.map((category) => {
          const list = grouped.get(category)!;
          const meta = CATEGORY_META[category];
          return (
            <section key={category}>
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="h-4 w-1 rounded-pill"
                  style={{ backgroundColor: meta.hue }}
                  aria-hidden
                />
                <div className="flex-1">
                  <h2 className="text-sm font-semibold text-text-primary">{meta.label}</h2>
                  <p className="text-xs text-text-muted">{meta.blurb}</p>
                </div>
                <span className="text-xs text-text-muted">{list.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {list.map((ex) => (
                  <ExerciseCard key={ex.id} ex={ex} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  hue,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hue?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-shrink-0 rounded-pill border px-3.5 py-1.5 text-xs font-medium transition ${
        active
          ? 'border-transparent bg-accent-grad text-white shadow-glow'
          : 'border-white/[0.06] bg-ink-card text-text-secondary'
      }`}
    >
      {hue && !active && (
        <span
          className="mr-1.5 inline-block h-2 w-2 rounded-pill align-middle"
          style={{ backgroundColor: hue }}
          aria-hidden
        />
      )}
      {label}
    </button>
  );
}
