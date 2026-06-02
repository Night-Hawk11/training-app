import { useEffect } from 'react';

/**
 * Holds a Screen Wake Lock while `active` is true, so the phone doesn't sleep
 * during a timed hold, a rest interval, or an in-progress gym session.
 *
 * The lock is automatically released by the browser when the tab is hidden, so
 * we re-request it on `visibilitychange` when the page becomes visible again.
 * Unsupported browsers (older iOS, etc.) are handled gracefully — the screen
 * just behaves as normal.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let released = false;

    const request = async () => {
      try {
        sentinel = await navigator.wakeLock.request('screen');
      } catch {
        // Rejected (no user activation, low battery, unsupported) — ignore and
        // let the screen sleep normally rather than surfacing an error.
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !released) void request();
    };

    void request();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      released = true;
      document.removeEventListener('visibilitychange', onVisibility);
      void sentinel?.release().catch(() => {});
      sentinel = null;
    };
  }, [active]);
}
