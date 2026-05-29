import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.tsx'
import { runPersistenceSelfTest } from './db/schema.ts'
import { repositories } from './db/repositories.ts'
import { useSettingsStore } from './store/settingsStore.ts'
import { useHistoryStore } from './store/historyStore.ts'

// Wire the Zustand stores to IndexedDB on app load (brief Step 2). These read
// from IndexedDB and populate the stores; components render reactively as they
// resolve.
void useSettingsStore.getState().load()
void useHistoryStore.getState().loadAll()

if (import.meta.env.DEV) {
  // Step 1 verification: confirm IndexedDB read/write works.
  void runPersistenceSelfTest()
  // Step 2 verification: lets you create/read entities from the dev console,
  // e.g. `await db.dailyEntries.upsert({ date: '2026-05-28', readiness: null,
  // morningEICompleted: false, reEducationCompleted: false,
  // rapidResponseCompleted: false })` then refresh and `await
  // db.dailyEntries.get('2026-05-28')`.
  ;(window as unknown as { db: typeof repositories }).db = repositories
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
