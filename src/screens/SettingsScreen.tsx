import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../store/settingsStore';
import { useHistoryStore } from '../store/historyStore';
import { useDailyEntryStore } from '../store/dailyEntryStore';
import { useSessionStore } from '../store/sessionStore';
import { downloadBackup, downloadSummary, restoreBackup } from '../lib/export';
import { resetAllData } from '../db/repositories';
import {
  getPermission,
  requestPermission,
  sendTestNotification,
  notificationsSupported,
} from '../lib/notifications';
import type { Phase } from '../data/types';

/**
 * Settings screen (KICKOFF_BRIEF.md 4.10–4.11 / Step 9).
 *
 * Phase/week, start date, notification preferences, export preferences, and the
 * data tools (JSON backup / restore, coach summary). All settings write through
 * the settingsStore to IndexedDB; restore reloads every store afterwards.
 */

const PHASES: Phase[] = [1, 2, 3, 4, 5];
const WEEKS = [1, 2, 3, 4];

function Card({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) {
  return (
    <section className="rounded-card bg-ink-card p-4">
      <h2 className="text-sm font-medium uppercase tracking-wide text-text-secondary">{title}</h2>
      {hint && <p className="mt-0.5 text-xs text-text-muted">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Pills<T extends number>({
  values,
  value,
  onChange,
}: {
  values: T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`min-w-10 rounded-pill px-4 py-1.5 text-sm font-medium ${
            value === v ? 'bg-accent text-ink' : 'bg-ink text-text-secondary'
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

export default function SettingsScreen() {
  const navigate = useNavigate();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const loadSettings = useSettingsStore((s) => s.load);

  const history = useHistoryStore();
  const reloadDaily = useDailyEntryStore((s) => s.load);
  const discardActive = useSessionStore((s) => s.discardActive);

  const [perm, setPerm] = useState(getPermission());
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!settings) {
    return (
      <main className="mx-auto flex min-h-full max-w-md items-center justify-center px-6">
        <p className="text-text-secondary">Loading settings…</p>
      </main>
    );
  }

  async function enableNotifications() {
    const result = await requestPermission();
    setPerm(result);
    await update({ notificationsEnabled: result === 'granted' });
  }

  async function toggleNotifications() {
    if (!settings!.notificationsEnabled) {
      await enableNotifications();
    } else {
      await update({ notificationsEnabled: false });
    }
  }

  async function onRestoreFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    if (!window.confirm('Restore will REPLACE all current data on this device. Continue?')) return;
    try {
      const text = await file.text();
      const r = await restoreBackup(text);
      await Promise.all([loadSettings(), history.loadAll(), reloadDaily()]);
      setRestoreMsg(`Restored ${r.sessions} sessions, ${r.runs} runs, ${r.tests} tests, ${r.dailyEntries} days.`);
    } catch (err) {
      setRestoreMsg(err instanceof Error ? `Restore failed: ${err.message}` : 'Restore failed.');
    }
  }

  async function onResetAll() {
    if (
      !window.confirm(
        'Full regroup: this ERASES all logged history (daily entries, sessions, tests, photos) and restarts the program at Phase 1 / Week 1 from today. This cannot be undone. Back up first if you want a copy. Continue?'
      )
    )
      return;
    setResetting(true);
    try {
      await resetAllData();
      discardActive();
      await Promise.all([loadSettings(), history.loadAll(), reloadDaily()]);
      setRestoreMsg('Full regroup done — fresh Phase 1 / Week 1 starting today.');
      navigate('/');
    } catch (err) {
      setRestoreMsg(err instanceof Error ? `Reset failed: ${err.message}` : 'Reset failed.');
    } finally {
      setResetting(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-6 pb-24">
      <header>
        <button type="button" onClick={() => navigate('/')} className="mb-2 text-sm text-text-muted">
          ← Today
        </button>
        <h1 className="text-xl font-semibold text-text-primary">Settings</h1>
      </header>

      <Card title="Program phase">
        <Pills values={PHASES} value={settings.currentPhase} onChange={(v) => update({ currentPhase: v })} />
      </Card>

      <Card title="Week in phase">
        <Pills values={WEEKS} value={settings.currentWeek} onChange={(v) => update({ currentWeek: v })} />
      </Card>

      <Card title="Program start date">
        <input
          type="date"
          value={settings.startDate}
          onChange={(e) => update({ startDate: e.target.value })}
          className="w-full rounded-md bg-ink px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
        />
      </Card>

      <Card
        title="Morning reminder"
        hint="Best-effort: fires when you open the app past this time and the morning routine isn’t done. Background reminders when the app is closed aren’t supported without a server."
      >
        {!notificationsSupported() ? (
          <p className="text-sm text-text-muted">Notifications aren’t supported on this browser.</p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Enabled</span>
              <button
                type="button"
                role="switch"
                aria-checked={settings.notificationsEnabled}
                onClick={toggleNotifications}
                className={`relative h-7 w-12 rounded-pill transition-colors ${
                  settings.notificationsEnabled ? 'bg-accent' : 'bg-ink'
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-pill bg-text-primary transition-all ${
                    settings.notificationsEnabled ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Time</span>
              <input
                type="time"
                value={settings.notificationTime}
                onChange={(e) => update({ notificationTime: e.target.value })}
                className="rounded-md bg-ink px-3 py-1.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
              />
            </div>
            {perm === 'denied' && (
              <p className="text-xs text-warning">
                Notifications are blocked in your browser settings — enable them there to get reminders.
              </p>
            )}
            {settings.notificationsEnabled && perm === 'granted' && (
              <button
                type="button"
                onClick={sendTestNotification}
                className="self-start text-sm font-medium text-accent"
              >
                Send a test notification
              </button>
            )}
          </div>
        )}
      </Card>

      <Card title="Export detail" hint="How many recent sessions to include in the coach summary.">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-sm text-text-secondary">Recent sessions</span>
          <span className="text-sm font-semibold text-text-primary">
            {settings.exportPreferences.includeRecentSessions}
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={settings.exportPreferences.includeRecentSessions}
          onChange={(e) =>
            update({ exportPreferences: { includeRecentSessions: Number(e.target.value) } })
          }
          className="w-full accent-accent"
        />
      </Card>

      <Card title="Data" hint="Your data lives only on this device. Back it up so you don’t lose it.">
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => void downloadBackup()}
            className="rounded-card bg-accent py-2.5 text-sm font-semibold text-ink"
          >
            Download backup (.json)
          </button>
          <button
            type="button"
            onClick={() =>
              downloadSummary(settings, history.sessions, history.runs, history.tests, history.dailyEntries)
            }
            className="rounded-card bg-ink py-2.5 text-sm font-semibold text-text-primary"
          >
            Download coach summary (.txt)
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-card bg-ink py-2.5 text-sm font-semibold text-text-primary"
          >
            Restore from backup…
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={onRestoreFile}
            className="hidden"
          />
          {restoreMsg && <p className="text-xs text-text-secondary">{restoreMsg}</p>}
        </div>
      </Card>

      <Card
        title="Full regroup"
        hint="Erases all logged history and restarts the program at Phase 1 / Week 1 from today. Back up first — this can't be undone."
      >
        <button
          type="button"
          onClick={() => void onResetAll()}
          disabled={resetting}
          className="w-full rounded-card border border-danger py-2.5 text-sm font-semibold text-danger disabled:opacity-50"
        >
          {resetting ? 'Resetting…' : 'Reset all data'}
        </button>
      </Card>
    </main>
  );
}
