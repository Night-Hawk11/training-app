/**
 * Audio + haptic cues for the timed routines (Morning EI holds, Rapid Response
 * intervals). Step 5/6 follow-up.
 *
 * Synthesised on the fly (no asset, works offline). Getting a beep to reliably
 * play on a *phone* needs more than desktop:
 *   - it must be unlocked inside a user gesture (`unlockAudio()` on a tap);
 *   - on iOS, Web Audio is silenced by the hardware mute switch unless we set
 *     the audio session to "playback" (iOS 16.4+);
 *   - the context can auto-suspend during a long hold/rest, so the play helpers
 *     resume it and only schedule the tones once it's actually running.
 * We also vibrate (Android; no-op on iOS) so transitions are noticeable even
 * with the volume down.
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

interface Tone {
  freq: number;
  /** Start offset from "now", in seconds. */
  at: number;
  /** Duration in seconds. */
  dur?: number;
  /** Peak gain (0..1). */
  peak?: number;
}

function scheduleTones(c: AudioContext, tones: Tone[]): void {
  const now = c.currentTime;
  for (const { freq, at, dur = 0.18, peak = 0.6 } of tones) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t = now + at;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }
}

/** Vibrate if supported (Android); no-op on iOS / unsupported. */
function buzz(pattern: number | number[]): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // ignore
  }
}

// Play a tone sequence, resuming a suspended context first so it's audible.
function play(tones: Tone[], pattern: number | number[]): void {
  buzz(pattern);
  const c = audioCtx();
  if (!c) return;
  if (c.state === 'suspended') {
    c.resume()
      .then(() => scheduleTones(c, tones))
      .catch(() => {});
  } else {
    scheduleTones(c, tones);
  }
}

/** End of a Morning EI hold (and Rapid Response routine complete): rising trio. */
export function playEndChime(): void {
  play(
    [
      { freq: 784, at: 0 }, // G5
      { freq: 988, at: 0.16 }, // B5
      { freq: 1319, at: 0.32 }, // E6
    ],
    [120, 60, 120]
  );
}

/** Rapid Response: a work bout is starting — punchy ascending "GO". */
export function playGoCue(): void {
  play(
    [
      { freq: 660, at: 0, dur: 0.12 }, // E5
      { freq: 1047, at: 0.1, dur: 0.22, peak: 0.7 }, // C6
    ],
    180
  );
}

/** Rapid Response: a work bout just ended — softer descending "rest". */
export function playRestCue(): void {
  play(
    [
      { freq: 587, at: 0, dur: 0.16, peak: 0.5 }, // D5
      { freq: 392, at: 0.16, dur: 0.22, peak: 0.5 }, // G4
    ],
    [90, 60, 90]
  );
}
