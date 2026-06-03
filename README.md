# Athletic Reset

A phone-first PWA that drives the Athletic Reset Program day to day. Local-first:
all data lives in IndexedDB on the device — no backend, no accounts, no sync.

See `KICKOFF_BRIEF.md` (in the original handoff package) for the full v1 spec:
architecture, data model, screens, build order, and export format.

## Stack

- **Build:** Vite
- **Language:** TypeScript
- **UI:** React 19
- **Styling:** Tailwind CSS (dark-first athletic palette)
- **State:** Zustand
- **Routing:** React Router
- **Persistence:** IndexedDB via `idb`
- **PWA:** `vite-plugin-pwa` (service worker + installable manifest)

## Develop

```bash
npm install
npm run gen-icons   # one-time: generate placeholder PWA icons
npm run dev         # http://localhost:5173
```

`npm run build` type-checks and produces a production build in `dist/`;
`npm run preview` serves it.

## Trial on a phone

The app is an installable, offline-first PWA, but a service worker only
registers over **HTTPS** — a `http://<LAN-IP>` dev server won't give you offline
or a real install. To use it at the gym, deploy the static `dist/` build to an
HTTPS host and "Add to Home Screen".

Recommended: connect the repo to **Netlify** or **Cloudflare Pages** (free,
permanent URL, auto-deploys on `git push`).

- Build command: `npm run build`
- Publish/output directory: `dist`
- SPA routing: handled by `public/_redirects` (copied to `dist/_redirects`),
  which both hosts read — direct loads of `/session`, `/history`, etc. fall
  back to `index.html`.

On the phone: open the deployed URL in the browser, then Share → Add to Home
Screen (iOS) or the install prompt (Android). It then launches standalone and
runs fully offline from IndexedDB.

## Build progress

Built in the order from Section 6 of the brief, one step per session.

- [x] **Step 1 — Scaffold:** Vite + React + TS + Tailwind, React Router with a
      single `/` route, `vite-plugin-pwa` configured, IndexedDB scaffold
      (`src/db/schema.ts`) defining the six entity stores, `idb` read/write
      self-test (logs to console in dev).
- [x] **Step 2 — Data layer:** entity types (`src/data/types.ts`), thin
      repositories (`src/db/repositories.ts`), and Zustand stores
      (`settings`, `session`, `history`) wired to IndexedDB on app load.
- [x] **Step 3 — Exercises database:** Exercise schema types, `src/data/exercises.ts`
      loader (typed import of `exercises.json`, `getExercise`/`getExercisesByCategory`,
      startup validation), reusable `StickFigure` SVG component, and a
      `/_debug/exercises` screen listing all 62 exercises grouped by category.
      The per-exercise figures are generated from a shared pose vocabulary by
      `scripts/gen-figures.mjs` (see Notes below).
- [x] **Step 4 — Today screen + Readiness check:** the Today hub (`/`) showing
      date / phase / week, the day's scheduled focus, readiness status, and
      daily-routine progress; a readiness check form (`/readiness`) persisting
      the `Readiness` fields to today's `DailyEntry`; `src/lib/dates.ts` and
      `src/lib/schedule.ts` (weekday → `SessionType` plan + session metadata);
      and a `dailyEntryStore` write-through to IndexedDB.
- [x] **Step 5 — Morning EI flow:** guided, timer-driven walk through the
      `morning_ei` isometric holds (`/morning-ei`). `src/lib/morningEi.ts`
      expands the per-phase prescriptions into ordered timed segments (per-side
      holds become Left/Right); each hold opens on a "get ready" step showing
      the exercise's setup instructions, then counts down with an end-of-hold
      cue (`src/lib/sound.ts`: a rising three-tone Web Audio chime — no asset —
      plus an Android vibration; a "Test sound" button on the overview lets you
      verify it per-device), auto-advancing
      paused so the user can reposition. On finishing it marks today's
      `DailyEntry` complete with the active hold time. The Today screen's
      Morning EI row links here and reflects completion.
- [x] **Step 6 — Re-education + Rapid Response flows:** Re-education
      (`/re-education`) is a guided checklist of the `re_education` drills —
      sets×reps, coaching cues, tick-off, optional notes — that marks today's
      `DailyEntry` complete. Rapid Response (`/rapid-response`) is an interval
      player over the `rapid_response` drills: `src/lib/rapidResponse.ts`
      expands each drill's `bouts × workSec/restSec` into ordered work/rest
      segments (rest auto-flows into the next bout; a new drill pauses for
      setup), persisting completion + notes. Both Today rows now link in.
- [x] **Step 7 — Gym session screens:** `src/lib/sessionPlan.ts` defines each
      gym day's plan (ordered blocks → exercise ids); `GymSessionScreen`
      (`/session`) renders today's plan, logs each prescribed set
      (weight×reps / hold seconds / distance) with a done toggle, then a
      summary captures session RPE, notes, and bodyweight (Mon/Fri). Working
      state lives in the `sessionStore` draft (survives in-app navigation) and
      persists via `sessionRepo` on finish. The Today focus card shows a
      Start/Resume session CTA on gym days and "✓ Session logged" once done.
- [x] **Step 8 — Run, test, history screens:** `RunScreen` (`/run`) logs a
      `RunEntry` (duration, optional distance, surface, RPE, notes; type derived
      from the day); `TestScreen` (`/test`) logs a `TestResult` against the
      current phase/week, with the Phase 3+ approach/single-leg measurements
      shown only in phase 3+; `HistoryScreen` (`/history`) is a filterable,
      reverse-chronological timeline of sessions / runs / tests plus the latest
      bodyweight. The Today card gains a run-day Log-run CTA and a History link.
- [x] **Step 9 — Settings + export + notifications:** `SettingsScreen`
      (`/settings`, linked from the Today header) sets phase/week, start date,
      morning-reminder prefs, and export detail. `src/lib/export.ts` does a full
      JSON **backup / restore** (the safety net for a local-first app) and a
      coach-readable **text summary** (honours `includeRecentSessions`).
      `src/lib/notifications.ts` handles permission + a best-effort morning
      reminder; the reliable nudge is an in-app banner on Today.
- [ ] Step 10 — Polish

## Notes / deviations from the brief

- The PWA manifest is generated by `vite-plugin-pwa` (configured in
  `vite.config.ts`) rather than hand-written at `public/manifest.json`. This is
  the idiomatic setup and keeps the manifest and service worker in sync.
- PWA icons under `public/icons/` are placeholder solid squares generated by
  `scripts/gen-icons.mjs`. Real artwork comes in Step 10.
- `src/lib/dates.ts` defines `todayISO()` in **local** time (the daily check-in
  must follow the user's calendar day). `sessionStore` still uses a UTC-based
  `todayISO`; these can be unified when the gym flow is built in Step 7.
- On the Today screen, all three daily-routine rows (Morning EI, Re-education,
  Rapid Response) link into their flows and reflect completion.
- `src/lib/useWakeLock.ts` holds a Screen Wake Lock during the EI timer, the
  Rapid Response intervals, and an in-progress gym session, so the phone doesn't
  sleep mid-set. Gracefully no-ops where the API is unsupported.
- The EI end-of-hold chime (`src/lib/sound.ts`) is unlocked on a user tap and
  sets `navigator.audioSession.type = 'playback'` (iOS 16.4+) so the hardware
  mute switch doesn't silence it; it resumes a suspended context before
  scheduling, and vibrates as a fallback. On older iOS the silent switch may
  still mute it — the "Test sound" button on the EI overview lets the user check
  their device. Chime is EI-only by design.
- Notifications are best-effort only: a no-backend PWA can't fire a reminder
  when the app is closed (that needs a push server). The Settings toggle stores
  the preference + requests permission and fires a reminder when you open the
  app past the set time; the dependable nudge is the in-app Today banner.
- Backup/restore writes all five JSON-safe stores in **one** IndexedDB
  transaction, queuing every clear+put before awaiting — awaiting between
  requests lets the transaction auto-commit and silently drops the later
  writes. Photos are excluded (Blobs aren't JSON; no capture flow yet).
- The per-day gym exercise lists in `src/lib/sessionPlan.ts` are **inferred**
  (the brief's exact session content isn't in the repo) from the session-type
  names, exercise categories, and explicit hints in `exercises.json` (curl =
  Monday, dip "mirrors Monday" → Thursday, nordic = Friday, pec/glute cooldowns,
  dead-hang finisher). All 41 gym-category exercises are used exactly once
  across the four gym days; `validateSessionPlans()` (run in dev) checks every
  id resolves. Adjust that one file when the brief is available. Phase-3+
  exercises (e.g. single-leg broad jump, one-step approaches) appear in the
  Friday plan regardless of current phase; the logger lets you skip sets.
- The exercise stick figures live in the `svg` field of each row in
  `exercises.json`, but are authored by `npm run gen-figures`
  (`scripts/gen-figures.mjs`): one shared set of SVG primitives + ~35 named
  poses, composed per exercise on a 150×150 `currentColor` canvas, so the set
  stays stylistically consistent and each pose actually reads as its movement.
  Re-run it after editing poses. To review them, `npm run gen-figure-gallery`
  writes `dist-gallery/figures*.html` (a labeled grid you can open or
  screenshot). `dist-gallery/` is git-ignored.
