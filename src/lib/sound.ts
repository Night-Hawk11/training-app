/**
 * Tiny Web Audio cue used by the Morning EI timer (Step 5 follow-up).
 *
 * Synthesised on the fly so there's no audio asset to bundle and it works
 * offline. Mobile browsers only allow audio after a user gesture, so call
 * `unlockAudio()` from the tap that starts a hold; `playEndChime()` then fires
 * when the hold timer reaches zero.
 */

type WindowWithWebkit = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

let ctx: AudioContext | null = null;

function audioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as WindowWithWebkit).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Create/resume the audio context within a user gesture so later cues can play. */
export function unlockAudio(): void {
  void audioCtx();
}

/** A short rising two-tone chime signalling the end of a hold. */
export function playEndChime(): void {
  const c = audioCtx();
  if (!c) return;
  const start = c.currentTime;
  const tone = (offset: number, freq: number) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t = start + offset;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.22);
  };
  tone(0, 880); // A5
  tone(0.22, 1318.5); // E6 — rising, reads as "done"
}
