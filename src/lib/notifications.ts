/**
 * Notifications (KICKOFF_BRIEF.md 4.11 / Step 9).
 *
 * Honest scope: a PWA with no backend cannot reliably fire a notification at a
 * set time while the app is closed — that needs a push server (VAPID) we don't
 * have. So this module does what's actually possible client-side:
 *   - request/track Notification permission,
 *   - fire a best-effort reminder when the app is OPEN past the set time and the
 *     morning routine isn't done (deduped to once per day),
 *   - expose a test notification so the user can confirm it works.
 * The reliable nudge is the in-app banner on the Today screen; notifications are
 * a bonus on top of that.
 */

const LAST_REMINDED_KEY = 'ar.lastMorningReminder'; // ISO date of last reminder

export type NotifPermission = 'default' | 'granted' | 'denied' | 'unsupported';

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getPermission(): NotifPermission {
  if (!notificationsSupported()) return 'unsupported';
  return Notification.permission as NotifPermission;
}

/** Prompts for permission (must be called from a user gesture). */
export async function requestPermission(): Promise<NotifPermission> {
  if (!notificationsSupported()) return 'unsupported';
  try {
    return (await Notification.requestPermission()) as NotifPermission;
  } catch {
    return getPermission();
  }
}

function show(title: string, body: string): void {
  if (getPermission() !== 'granted') return;
  try {
    new Notification(title, { body, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' });
  } catch {
    // Some platforms only allow notifications via the service worker
    // registration; ignore failures rather than disrupt the app.
  }
}

/** Fire a sample notification so the user can confirm the setup works. */
export function sendTestNotification(): void {
  show('Athletic Reset', 'Notifications are on — you’ll get a morning nudge here.');
}

/** "07:00" → minutes since midnight, for comparing against the current time. */
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Best-effort morning reminder, called when the app opens. Shows a notification
 * once per day if: notifications are enabled + granted, the current local time
 * is at/after the set time, and the morning routine isn't done yet.
 */
export function maybeMorningReminder(opts: {
  enabled: boolean;
  notificationTime: string;
  morningDone: boolean;
  todayISO: string;
}): void {
  const { enabled, notificationTime, morningDone, todayISO } = opts;
  if (!enabled || morningDone) return;
  if (getPermission() !== 'granted') return;

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  if (nowMin < toMinutes(notificationTime)) return;

  if (localStorage.getItem(LAST_REMINDED_KEY) === todayISO) return; // already today
  localStorage.setItem(LAST_REMINDED_KEY, todayISO);
  show('Morning routine', 'Time for your readiness check and Morning EI.');
}
