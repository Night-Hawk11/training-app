import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.tsx'
import { runPersistenceSelfTest } from './db/schema.ts'

// Step 1 verification: confirm IndexedDB read/write works on dev load.
if (import.meta.env.DEV) {
  runPersistenceSelfTest()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
