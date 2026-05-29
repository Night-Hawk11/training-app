/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark-first athletic palette (see brief Section 9).
        ink: {
          DEFAULT: '#0E1116', // app background
          raised: '#181C23', // raised surface
          card: '#1F242D', // cards
        },
        text: {
          primary: '#F2F4F7',
          secondary: '#9AA4B2',
          muted: '#6B7480',
        },
        accent: {
          DEFAULT: '#5B9DF9',
          dark: '#3B7DD8',
        },
        success: '#5FB87F',
        warning: '#E0B341',
        danger: '#E5705A',
        border: {
          subtle: '#2A303A',
          focus: '#5B9DF9',
        },
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
