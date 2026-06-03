/**
 * Audio + haptic cue for the Morning EI timer (Step 5 follow-up).
 *
 * Synthesised on the fly (no asset, works offline). Getting a beep to reliably
 * play on a *phone* needs more than desktop:
 *   - it must be unlocked inside a user gesture (`unlockAudio()` on a tap);
 *   - on iOS, Web Audio is silenced by the hardware mute switch unless we set
 *     the audio session to "playback" (iOS 16.4+);
 *   - the context can auto-suspend during a long hold, so `playEndChime()`
 *     resumes it and only schedules the tones once it's actually running.
 * We also vibrate (Android; no-op on iOS) so the end of a hold is noticeable
 * even with the volume down.
 */

type WindowWithWebkit = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

// iOS 16.4+ Audio Session API — not yet in the TS DOM lib.
interface AudioSessionLike {
  type: string;
}
function audioSession(): AudioSessionLike | undefined {
  return (navigator as Navigator & { audioSession?: AudioSessionLike }).audioSession;
}

let ctx: AudioContext | null = null;

function audioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as WindowWithWebkit).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
}

/**
 * Prime audio within a user gesture so later cues can play. Sets the iOS audio
 * session to "playback" (so the mute switch doesn't silence us), resumes the
 * context, and plays an inaudible blip to fully unlock on iOS.
 */
export function unlockAudio(): void {
  const session = audioSession();
  if (session) {
    try {
      session.type = 'playback';
    } catch {
      // Older iOS may expose it read-only; ignore.
    }
  }
  const c = audioCtx();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();
  // A 1-sample silent buffer — the canonical iOS unlock nudge.
  try {
    const buf = c.createBuffer(1, 1, 22050);
    const src = c.createBufferSource();
    src.buffer = buf;
    src.connect(c.destination);
    src.start(0);
  } catch {
    // Non-fatal.
  }
}

// Three ascending beeps — loud and distinct enough to hear across a gym.
function scheduleChime(c: AudioContext): void {
  const now = c.currentTime;
  const freqs = [784, 988, 1319]; // G5, B5, E6
  freqs.forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t = now + i * 0.16;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.6, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  });
}

/** Signal the end of a hold: a rising three-tone chime plus a vibration. */
export function playEndChime(): void {
  // Haptic — works on Android, harmless no-op on iOS.
  try {
    navigator.vibrate?.([120, 60, 120]);
  } catch {
    // ignore
  }

  const c = audioCtx();
  if (!c) return;
  // The context may have suspended during the hold; resume, then schedule once
  // it's actually running so currentTime advances and the tones are audible.
  if (c.state === 'suspended') {
    c.resume()
      .then(() => scheduleChime(c))
      .catch(() => {});
  } else {
    scheduleChime(c);
  }
}
