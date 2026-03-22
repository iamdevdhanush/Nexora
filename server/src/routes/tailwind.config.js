/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', '-apple-system', 'sans-serif'],
        display: ['Syne', '-apple-system', 'sans-serif'],
        mono: ['DM Mono', 'SF Mono', 'JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      colors: {
        green: {
          DEFAULT: '#00E87A',
        },
        purple: {
          DEFAULT: '#A78BFA',
        },
      },
    },
  },
  plugins: [],
};
