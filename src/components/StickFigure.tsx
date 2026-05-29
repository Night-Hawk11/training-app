interface Props {
  /** Inline SVG markup from an Exercise (uses currentColor for stroke/fill). */
  svg: string;
  /** Accessible label, e.g. the exercise name. */
  label?: string;
  className?: string;
}

/**
 * Renders an exercise's inline SVG stick figure. The markup is our own bundled
 * data (exercises.json), not user input, so dangerouslySetInnerHTML is safe
 * here. The SVG uses `currentColor`, so the surrounding text color drives it.
 */
export default function StickFigure({ svg, label, className = '' }: Props) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`[&>svg]:h-full [&>svg]:w-full ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
