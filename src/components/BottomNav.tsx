import { Link, useLocation } from 'react-router-dom';
import { Home, CalendarDays, Dumbbell, History, TrendingUp, Settings } from 'lucide-react';

/**
 * Persistent bottom tab bar for the top-level destinations. Renders only on the
 * tab routes themselves — deep/flow screens (session, timed routines, readiness)
 * hide it so you can't wander off mid-flow and so it doesn't eat vertical space.
 */
const TABS = [
  { to: '/', label: 'Today', Icon: Home },
  { to: '/calendar', label: 'Plan', Icon: CalendarDays },
  { to: '/catalog', label: 'Library', Icon: Dumbbell },
  { to: '/history', label: 'History', Icon: History },
  { to: '/progress', label: 'Progress', Icon: TrendingUp },
  { to: '/settings', label: 'Settings', Icon: Settings },
] as const;

const TAB_PATHS = new Set<string>(TABS.map((t) => t.to));

export default function BottomNav() {
  const { pathname } = useLocation();
  if (!TAB_PATHS.has(pathname)) return null;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md items-stretch justify-around border-t border-white/[0.06] bg-ink-card/80 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
    >
      {TABS.map(({ to, label, Icon }) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            className={`flex flex-1 flex-col items-center gap-1 pt-2 pb-1.5 text-[10px] font-medium transition-colors ${
              active ? 'text-accent' : 'text-text-muted'
            }`}
          >
            <span
              className={`flex h-7 w-10 items-center justify-center rounded-pill transition-colors ${
                active ? 'bg-accent/15' : ''
              }`}
            >
              <Icon size={19} aria-hidden />
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
