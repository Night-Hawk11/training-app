import { useSettingsStore } from '../store/settingsStore';

export default function TodayScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const loaded = useSettingsStore((s) => s.loaded);

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="rounded-pill bg-ink-card px-3 py-1 text-xs font-medium uppercase tracking-wide text-text-secondary">
        Athletic Reset
      </span>
      <h1 className="text-2xl font-semibold text-text-primary">Scaffold is alive</h1>

      {!loaded ? (
        <p className="text-text-secondary">Loading settings…</p>
      ) : settings ? (
        <p className="text-text-secondary">
          Phase {settings.currentPhase} · Week {settings.currentWeek} · started{' '}
          {settings.startDate}
        </p>
      ) : (
        <p className="text-danger">Settings failed to load.</p>
      )}

      <p className="text-sm text-text-muted">
        Data layer wired (Step 2). The Today screen gets built in Step 4.
      </p>
    </main>
  );
}
