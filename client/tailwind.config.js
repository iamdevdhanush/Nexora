/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Geist"', '"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', '"JetBrains Mono"', 'monospace'],
        display: ['"Cabinet Grotesk"', '"Geist"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          DEFAULT: '#0A0A0A',
          soft: '#1A1A1A',
          muted: '#6B6B6B',
          ghost: '#A3A3A3',
        },
        surface: {
          DEFAULT: '#FAFAFA',
          raised: '#FFFFFF',
          overlay: 'rgba(255,255,255,0.85)',
        },
        line: {
          DEFAULT: '#E8E8E8',
          strong: '#D1D1D1',
        },
        brand: {
          DEFAULT: '#1B6BFF',
          soft: '#EBF2FF',
          dark: '#0F4FCC',
        },
        success: { DEFAULT: '#1A7F4B', soft: '#EBFAF2' },
        warning: { DEFAULT: '#B45309', soft: '#FEF6E8' },
        danger: { DEFAULT: '#CC1B1B', soft: '#FEEBEB' },
        amber: { DEFAULT: '#D97706', soft: '#FFF8ED' },
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card': '0 2px 8px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.08)',
        'elevated': '0 8px 24px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.06)',
        'modal': '0 24px 48px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.08)',
        'bottom-nav': '0 -1px 0 rgba(0,0,0,0.06), 0 -4px 16px rgba(0,0,0,0.04)',
      },
      keyframes: {
        'slide-up': { from: { transform: 'translateY(100%)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        'slide-down': { from: { transform: 'translateY(-8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        'slide-in-right': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'scale-in': { from: { transform: 'scale(0.96)', opacity: '0' }, to: { transform: 'scale(1)', opacity: '1' } },
        'shimmer': { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        'ping-soft': { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
      },
      animation: {
        'slide-up': 'slide-up 0.32s cubic-bezier(0.32,0,0,1)',
        'slide-down': 'slide-down 0.2s ease-out',
        'slide-in-right': 'slide-in-right 0.28s cubic-bezier(0.32,0,0,1)',
        'fade-in': 'fade-in 0.15s ease-out',
        'scale-in': 'scale-in 0.18s cubic-bezier(0.32,0,0,1)',
        'shimmer': 'shimmer 2s linear infinite',
        'ping-soft': 'ping-soft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
