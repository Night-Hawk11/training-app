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
        // Secondary hue for premium gradients (accent blue → iris violet).
        iris: '#8B7CF6',
        success: '#5FB87F',
        warning: '#E0B341',
        danger: '#E5705A',
        border: {
          subtle: '#2A303A',
          focus: '#5B9DF9',
        },
      },
      backgroundImage: {
        // App-wide top glow + the hero card wash + the primary-button gradient.
        'app-glow': 'radial-gradient(130% 90% at 50% -10%, #171c2b 0%, #0E1116 55%)',
        'hero-glow':
          'radial-gradient(120% 130% at 0% 0%, rgba(139,124,246,0.38) 0%, rgba(91,157,249,0.20) 38%, rgba(31,36,45,0) 72%)',
        'accent-grad': 'linear-gradient(135deg, #5B9DF9 0%, #8B7CF6 100%)',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.30), 0 10px 28px -16px rgba(0,0,0,0.70)',
        glow: '0 12px 30px -10px rgba(91,157,249,0.55)',
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
