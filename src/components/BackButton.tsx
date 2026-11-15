import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

/**
 * Consistent "back" affordance for deep screens — a small pill with a chevron.
 * Defaults to the Today hub; pass `to` for another destination.
 */
export default function BackButton({ to = '/', label = 'Today' }: { to?: string; label?: string }) {
  return (
    <Link
      to={to}
      className="mb-3 inline-flex items-center gap-1 rounded-pill bg-white/[0.06] py-1.5 pl-2 pr-3 text-xs font-medium text-text-secondary transition active:scale-[0.97]"
    >
      <ChevronLeft size={15} aria-hidden /> {label}
    </Link>
  );
}
