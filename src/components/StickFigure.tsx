interface Props {
  /** Inline SVG markup from an Exercise (uses currentColor for stroke/fill). Optional. */
  svg?: string;
  /** Accessible label, e.g. the exercise name. */
  label?: string;
  className?: string;
}

// Neutral placeholder shown when an exercise has no figure — a simple "movement"
// glyph rather than an empty box, so a figure-less exercise still looks finished.
const PLACEHOLDER = `<svg viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.35">
  <circle cx="75" cy="40" r="10" fill="currentColor" stroke="none"/>
  <path d="M75 50 L75 92"/>
  <path d="M75 60 L55 74 M75 60 L95 74"/>
  <path d="M75 92 L58 120 M75 92 L92 120"/>
</svg>`;

/**
 * Renders an exercise's inline SVG stick figure, or a neutral placeholder glyph
 * when none is supplied. The markup is our own bundled data (exercises.json),
 * not user input, so dangerouslySetInnerHTML is safe here. The SVG uses
 * `currentColor`, so the surrounding text color drives it.
 */
export default function StickFigure({ svg, label, className = '' }: Props) {
  const markup = svg && svg.includes('<svg') ? svg : PLACEHOLDER;
  return (
    <div
      role="img"
      aria-label={label}
      className={`[&>svg]:h-full [&>svg]:w-full ${className}`}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
