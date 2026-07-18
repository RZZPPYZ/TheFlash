/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Neutral-gray modern palette (dark)
        base: {
          900: '#0f0f10', // window background
          850: '#1a1a1c',
          800: '#1e1e20', // editor surface
          750: '#242427',
          700: '#2a2a2e',
          600: '#333338'  // borders
        },
        ink: {
          100: '#f5f5f7', // primary text
          300: '#c7c7cc', // secondary text
          500: '#8e8e93'  // muted text
        },
        accent: {
          DEFAULT: '#f59e0b', // amber bolt
          soft: '#fbbf24'
        },
        danger: '#ef4444',
        ok: '#22c55e'
      },
      fontFamily: {
        mono: ['Cascadia Code', 'Consolas', 'Menlo', 'monospace'],
        ui: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
