import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StickFigure from '../components/StickFigure';
import { useSettingsStore } from '../store/settingsStore';
import { useDailyEntryStore } from '../store/dailyEntryStore';
import { buildEiSegments, morningEiExercises, totalHoldSeconds } from '../lib/morningEi';
import { mmss, approxDuration } from '../lib/format';
import { playEndChime, unlockAudio } from '../lib/sound';
import { useWakeLock } from '../lib/useWakeLock';

/**
 * Morning EI flow (KICKOFF_BRIEF.md 4.3).
 *
 * A guided, timer-driven walk through the morning isometric holds. Each hold
 * opens on a "get ready" step showing how to set up, then counts down; an audio
 * chime marks the end of the hold and the player advances to the next one
 * (again paused so the user can reposition). On finishing the routine, today's
 * DailyEntry is marked complete with the active hold time.
 */

type Phase = 'overview' | 'active' | 'done';

export default function MorningEIScreen() {
  const navigate = useNavigate();
  const currentPhase = useSettingsStore((s) => s.settings?.currentPhase ?? 1);
  const entry = useDailyEntryStore((s) => s.entry);
  const update = useDailyEntryStore((s) => s.update);

  const exercises = useMemo(() => morningEiExercises(), []);
  const segments = useMemo(() => buildEiSegments(currentPhase), [currentPhase]);
  const totalSec = useMemo(() => totalHoldSeconds(currentPhase), [currentPhase]);

  const [phase, setPhase] = useState<Phase>('overview');
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  const segment = segments[index];
  const lastIndex = segments.length - 1;

  // Keep the screen awake for the whole guided routine.
  useWakeLock(phase === 'active');

  // Source-of-truth for the countdown inside the interval callback (which can't
  // read the latest `remaining` from its closure). Synced when a run starts.
  const remainingRef = useRef(0);

  // The countdown tick: one interval while a hold is actively running. It
  // decrements and, on reaching zero, plays the end-of-hold chime. The actual
  // advance to the next hold is handled by the guarded block below.
  useEffect(() => {
    if (phase !== 'active' || !running) return;
    remainingRef.current = remaining; // capture this run's starting value
    const id = setInterval(() => {
      const next = Math.max(0, remainingRef.current - 1);
      remainingRef.current = next;
      setRemaining(next);
      setElapsedSec((e) => e + 1);
      if (next === 0) playEndChime();
    }, 1000);
    return () => clearInterval(id);
    // `remaining` is intentionally captured at subscribe time, not a dep (it
    // would re-create the interval every tick).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, running]);

  // When the current hold's timer runs out, pause and queue the next hold (or
  // finish the routine). This guarded render-phase adjustment is the React-
  // recommended alternative to a setState-in-effect (the `running` flip stops
  // it from re-running). The user taps Start again for the next hold, which
  // gives a natural moment to reposition.
  if (phase === 'active' && running && remaining === 0) {
    setRunning(false);
    if (index < lastIndex) {
      setIndex(index + 1);
      setRemaining(segments[index + 1].durationSec);
    } else {
      setPhase('done');
    }
  }

  // Persist completion once, when the routine reaches the done screen.
  useEffect(() => {
    if (phase !== 'done') return;
    void update({ morningEICompleted: true, morningEIDurationSec: elapsedSec });
    // elapsedSec is intentionally read once at completion.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, update]);

  function start() {
    unlockAudio(); // within the user gesture, so the chime can play later
    setIndex(0);
    setRemaining(segments[0].durationSec);
    setElapsedSec(0);
    setRunning(false); // open on the "get ready" step for the first hold
    setPhase('active');
  }

  // Start/pause the current hold's countdown.
  function toggleRun() {
    if (!running) unlockAudio();
    setRunning((r) => !r);
  }

  function skip() {
    setRunning(false);
    if (index < lastIndex) {
      setIndex(index + 1);
      setRemaining(segments[index + 1].durationSec);
    } else {
      setPhase('done');
    }
  }

  function quit() {
    setRunning(false);
    navigate('/');
  }

  // ── Overview ──────────────────────────────────────────────────────────────
  if (phase === 'overview') {
    const alreadyDone = entry?.morningEICompleted ?? false;
    return (
      <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-6">
        <header>
          <button type="button" onClick={() => navigate('/')} className="mb-2 text-sm text-text-muted">
            ← Today
          </button>
          <h1 className="text-xl font-semibold text-text-primary">Morning EI</h1>
          <p className="text-sm text-text-secondary">
            {exercises.length} holds · {approxDuration(totalSec)}
            {alreadyDone && <span className="ml-2 text-success">· done today</span>}
          </p>
        </header>

        <ol className="flex flex-col gap-2">
          {exercises.map((ex, i) => (
            <li key={ex.id} className="flex items-center gap-3 rounded-card bg-ink-card p-3">
              <span className="w-5 flex-shrink-0 text-center text-sm font-semibold text-text-muted">
                {i + 1}
              </span>
              <div className="h-12 w-16 flex-shrink-0 rounded-md bg-ink p-1 text-accent">
                <StickFigure svg={ex.svg} label={ex.name} />
              </div>
              <span className="min-w-0 flex-1 truncate text-sm text-text-primary">{ex.name}</span>
            </li>
          ))}
        </ol>

        <button
          type="button"
          onClick={start}
          className="rounded-card bg-accent py-3 text-base font-semibold text-ink"
        >
          {alreadyDone ? 'Do it again' : 'Start routine'}
        </button>
      </main>
    );
  }

  // ── Done ────────────────────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <main className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-5xl">✓</div>
        <h1 className="text-2xl font-semibold text-text-primary">Morning EI complete</h1>
        <p className="text-text-secondary">{mmss(elapsedSec)} of holds. Nice start to the day.</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="rounded-card bg-accent px-8 py-3 text-base font-semibold text-ink"
        >
          Back to Today
        </button>
      </main>
    );
  }

  // ── Active player ─────────────────────────────────────────────────────────
  const progress = ((index + (remaining === 0 ? 1 : 0)) / segments.length) * 100;
  // "Get ready" = this hold hasn't started ticking yet (paused at full time).
  const getReady = !running && remaining === segment.durationSec;
  const setLabel = [
    segment.setCount > 1 ? `Set ${segment.setNumber} of ${segment.setCount}` : '',
    segment.side ? `${segment.side} side` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col px-4 py-6">
      <header className="mb-4 flex items-center justify-between">
        <span className="text-sm text-text-secondary">
          {segment.exerciseIndex + 1} / {exercises.length}
        </span>
        <button type="button" onClick={quit} className="text-sm text-text-muted">
          Quit
        </button>
      </header>

      <div className="mb-4 h-1 w-full overflow-hidden rounded-pill bg-border-subtle">
        <div className="h-full rounded-pill bg-accent transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex flex-1 flex-col items-center gap-4 text-center">
        <div className="mt-2 h-36 w-52 rounded-card bg-ink-card p-3 text-accent">
          <StickFigure svg={segment.exercise.svg} label={segment.exercise.name} />
        </div>

        <div>
          <h1 className="text-xl font-semibold text-text-primary">{segment.exercise.name}</h1>
          {setLabel && <p className="text-sm text-text-secondary">{setLabel}</p>}
        </div>

        {getReady ? (
          // How to set up — shown before the hold starts.
          <div className="w-full max-w-xs text-left">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-secondary">
              Get into position · {segment.durationSec}s hold
            </p>
            <ol className="list-inside list-decimal space-y-1 text-sm text-text-secondary">
              {segment.exercise.setup.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        ) : (
          <>
            <div className="font-mono text-6xl font-semibold tabular-nums text-text-primary">
              {mmss(remaining)}
            </div>
            {segment.exercise.cues.length > 0 && (
              <ul className="max-w-xs list-inside list-disc text-left text-xs text-text-muted">
                {segment.exercise.cues.slice(0, 3).map((cue, i) => (
                  <li key={i}>{cue}</li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={toggleRun}
          className="rounded-card bg-accent py-3 text-base font-semibold text-ink"
        >
          {getReady ? 'Start hold' : running ? 'Pause' : 'Resume'}
        </button>
        <button type="button" onClick={skip} className="py-2 text-sm text-text-secondary">
          Skip hold →
        </button>
      </div>
    </main>
  );
}
