import { Link, useLocation } from 'react-router-dom';
import { Home, CalendarDays, History, TrendingUp, Settings } from 'lucide-react';

/**
 * Persistent bottom tab bar for the top-level destinations. Renders only on the
 * tab routes themselves — deep/flow screens (session, timed routines, readiness)
 * hide it so you can't wander off mid-flow and so it doesn't eat vertical space.
 */
const TABS = [
  { to: '/', label: 'Today', Icon: Home },
  { to: '/calendar', label: 'Calendar', Icon: CalendarDays },
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
      className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md items-stretch justify-around border-t border-border-subtle bg-ink-card pb-[env(safe-area-inset-bottom)]"
    >
      {TABS.map(({ to, label, Icon }) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
              active ? 'text-accent' : 'text-text-muted'
            }`}
          >
            <Icon size={20} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
