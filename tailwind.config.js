/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // "Force readout" — a deliberate cool-graphite base (not tinted near-black),
        // a single signal-blue brand accent, and content-derived training-quality hues.
        ink: {
          DEFAULT: '#0C0E12', // app background (cool graphite)
          raised: '#14171D', // raised surface
          card: '#171A21', // cards
        },
        text: {
          primary: '#F5F7FA',
          secondary: '#98A2B0',
          muted: '#5F6773',
        },
        accent: {
          DEFAULT: '#4C8DF6', // signal blue — brand / CTA
          dark: '#2E6AD6',
        },
        // Training-quality hues — color means something (see categoryMeta).
        reactive: '#FF5A36', // ignition — reactive/plyometric
        iso: '#F2B23E', // molten gold — isometric holds
        balance: '#9B7CF0', // violet — balance & perturbation
        foundation: '#4FC98A', // green — foot/hip/mobility foundation
        success: '#4FC98A',
        warning: '#F2B23E',
        danger: '#FF6B57',
        border: {
          subtle: '#262B34',
          focus: '#4C8DF6',
        },
      },
      boxShadow: {
        // Quieter depth — the identity leans on hairlines + the ground-tick, not boxes.
        card: '0 1px 2px rgba(0,0,0,0.35)',
        lift: '0 2px 4px rgba(0,0,0,0.35), 0 14px 32px -18px rgba(0,0,0,0.80)',
      },
      fontFamily: {
        // System fonts only — no web font loading (brief Section 9).
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'Segoe UI',
          'Roboto',
          'system-ui',
          'sans-serif',
        ],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        card: '20px',
        pill: '999px',
      },
    },
  },
  plugins: [],
}
