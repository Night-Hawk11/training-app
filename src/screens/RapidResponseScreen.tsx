import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StickFigure from '../components/StickFigure';
import { useSettingsStore } from '../store/settingsStore';
import { useDailyEntryStore } from '../store/dailyEntryStore';
import { buildRrSegments, rapidResponseExercises, totalWorkSeconds } from '../lib/rapidResponse';
import { mmss, approxDuration } from '../lib/format';
import { useWakeLock } from '../lib/useWakeLock';
import { playEndChime, playGoCue, playRestCue, unlockAudio } from '../lib/sound';

/**
 * Rapid Response flow (KICKOFF_BRIEF.md 4.5).
 *
 * An interval player over the rapid-response drills: work bouts count down and
 * flow straight into their rest, rest flows into the next work bout, and the
 * player only pauses when a *new exercise* begins (so the user can reposition).
 * On finishing, today's DailyEntry is marked complete; optional notes can be
 * added on the summary before returning to Today.
 */

type Phase = 'overview' | 'active' | 'done';

export default function RapidResponseScreen() {
  const navigate = useNavigate();
  const currentPhase = useSettingsStore((s) => s.settings?.currentPhase ?? 1);
  const entry = useDailyEntryStore((s) => s.entry);
  const setRapidResponse = useDailyEntryStore((s) => s.setRapidResponse);

  const exercises = useMemo(() => rapidResponseExercises(), []);
  const segments = useMemo(() => buildRrSegments(currentPhase), [currentPhase]);
  const totalSec = useMemo(() => totalWorkSeconds(currentPhase), [currentPhase]);

  const [phase, setPhase] = useState<Phase>('overview');
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const [notes, setNotes] = useState(entry?.rapidResponseNotes ?? '');

  const segment = segments[index];
  const lastIndex = segments.length - 1;

  // Keep the screen awake through the interval routine.
  useWakeLock(phase === 'active');

  // The interval runs continuously across work→rest→work, so its callback can't
  // read fresh `remaining`/`index` from its closure. Mirror them into refs after
  // every render and decrement off the ref (the EI screen recreates its interval
  // each hold, so it can get away without this).
  const remainingRef = useRef(0);
  const indexRef = useRef(0);
  useEffect(() => {
    remainingRef.current = remaining;
    indexRef.current = index;
  });

  // Countdown tick while running. On reaching zero, play the cue for the
  // upcoming transition: a "go" when a work bout is about to start (rest is
  // over) and a "rest" when a work bout just ended or we're pausing for the
  // next drill. Firing here (a real timer callback, not render) keeps it to one
  // beep per boundary.
  useEffect(() => {
    if (phase !== 'active' || !running) return;
    const id = setInterval(() => {
      const cur = Math.max(0, remainingRef.current - 1);
      remainingRef.current = cur;
      setRemaining(cur);
      if (cur === 0) {
        const next = segments[indexRef.current + 1];
        if (!next) playEndChime();
        else if (next.pauseBefore) playRestCue();
        else if (next.kind === 'work') playGoCue();
        else playRestCue();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [phase, running, segments]);

  // When a segment's timer runs out, flow into the next one. Keep running
  // through work→rest→work; pause only when the next segment starts a new
  // exercise. Guarded render-phase update (React-recommended over a
  // setState-in-effect; the `running`/`remaining` change stops the re-run).
  if (phase === 'active' && running && remaining === 0) {
    if (index < lastIndex) {
      const next = segments[index + 1];
      setIndex(index + 1);
      setRemaining(next.durationSec);
      if (next.pauseBefore) setRunning(false);
    } else {
      setRunning(false);
      setPhase('done');
    }
  }

  // Persist completion once the routine reaches the summary.
  useEffect(() => {
    if (phase !== 'done') return;
    void setRapidResponse(true, notes);
    // notes is read again on explicit save; completion only needs to fire once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function start() {
    unlockAudio(); // within the user gesture, so the cues can play later
    setIndex(0);
    setRemaining(segments[0].durationSec);
    setRunning(true);
    setPhase('active');
  }

  // Play/pause the countdown (unlock audio when resuming).
  function toggleRun() {
    if (!running) unlockAudio();
    setRunning((r) => !r);
  }

  function skip() {
    if (index < lastIndex) {
      const next = segments[index + 1];
      setIndex(index + 1);
      setRemaining(next.durationSec);
    } else {
      setRunning(false);
      setPhase('done');
    }
  }

  async function saveAndExit() {
    await setRapidResponse(true, notes);
    navigate('/');
  }

  // ── Overview ────────────────────────────────────────────────────────────────
  if (phase === 'overview') {
    const alreadyDone = entry?.rapidResponseCompleted ?? false;
    return (
      <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-6">
        <header>
          <button type="button" onClick={() => navigate('/')} className="mb-2 text-sm text-text-muted">
            ← Today
          </button>
          <h1 className="text-xl font-semibold text-text-primary">Rapid Response</h1>
          <p className="text-sm text-text-secondary">
            {exercises.length} drills · {approxDuration(totalSec)} work
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

        <p className="text-xs text-text-muted">
          Rhythmic and light — speed of firing, not force. Rest flows automatically; the
          timer pauses between drills so you can set up.
        </p>

        <button
          type="button"
          onClick={start}
          className="rounded-card bg-accent py-3 text-base font-semibold text-ink"
        >
          {alreadyDone ? 'Do it again' : 'Start routine'}
        </button>

        {/* Verify the work/rest cues are audible on this device: "go" then
            "rest". Turn up media volume; on iPhone flip the mute switch off. */}
        <button
          type="button"
          onClick={() => {
            unlockAudio();
            playGoCue();
            setTimeout(playRestCue, 700);
          }}
          className="text-sm font-medium text-accent"
        >
          🔊 Test sound
        </button>
      </main>
    );
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <main className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-5xl">✓</div>
        <h1 className="text-2xl font-semibold text-text-primary">Rapid Response complete</h1>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Notes (optional) — rhythm, any drill that felt off…"
          className="w-full resize-none rounded-md bg-ink-card p-2 text-left text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-border-focus"
        />
        <button
          type="button"
          onClick={saveAndExit}
          className="rounded-card bg-accent px-8 py-3 text-base font-semibold text-ink"
        >
          Back to Today
        </button>
      </main>
    );
  }

  // ── Active player ───────────────────────────────────────────────────────────
  const isWork = segment.kind === 'work';
  const isPausedSetup = !running && segment.kind === 'work' && remaining === segment.durationSec;
  const progress = (index / segments.length) * 100;
  // What's coming next, shown during rest so the user can anticipate.
  const next = index < lastIndex ? segments[index + 1] : null;

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col px-4 py-6">
      <header className="mb-4 flex items-center justify-between">
        <span className="text-sm text-text-secondary">
          Drill {segment.exerciseIndex + 1} / {exercises.length}
        </span>
        <button type="button" onClick={() => navigate('/')} className="text-sm text-text-muted">
          Quit
        </button>
      </header>

      <div className="mb-4 h-1 w-full overflow-hidden rounded-pill bg-border-subtle">
        <div className="h-full rounded-pill bg-accent transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <span
          className={`rounded-pill px-4 py-1 text-sm font-semibold uppercase tracking-wide ${
            isWork ? 'bg-accent text-ink' : 'bg-ink-card text-text-secondary'
          }`}
        >
          {isPausedSetup ? 'Get ready' : isWork ? 'Work' : 'Rest'}
        </span>

        <div className="h-36 w-52 rounded-card bg-ink-card p-3 text-accent">
          <StickFigure svg={segment.exercise.svg} label={segment.exercise.name} />
        </div>

        <div>
          <h1 className="text-xl font-semibold text-text-primary">{segment.exercise.name}</h1>
          <p className="text-sm text-text-secondary">
            Bout {segment.boutNumber} of {segment.boutCount}
          </p>
        </div>

        <div
          className={`font-mono text-6xl font-semibold tabular-nums ${
            isWork ? 'text-text-primary' : 'text-text-secondary'
          }`}
        >
          {mmss(remaining)}
        </div>

        {!isWork && next && (
          <p className="text-sm text-text-muted">
            Next: {next.exercise.name}
          </p>
        )}
        {isWork && segment.exercise.cues.length > 0 && (
          <ul className="max-w-xs list-inside list-disc text-left text-xs text-text-muted">
            {segment.exercise.cues.slice(0, 2).map((cue, i) => (
              <li key={i}>{cue}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={toggleRun}
          className="rounded-card bg-accent py-3 text-base font-semibold text-ink"
        >
          {running ? 'Pause' : isPausedSetup ? 'Start drill' : 'Resume'}
        </button>
        <button type="button" onClick={skip} className="py-2 text-sm text-text-secondary">
          Skip →
        </button>
      </div>
    </main>
  );
}
