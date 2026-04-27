/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#E8470A',
          50:  '#FEF0EB',
          100: '#FDD8CC',
          200: '#FAB199',
          300: '#F78A66',
          400: '#F46333',
          500: '#E8470A',
          600: '#C23C08',
          700: '#9C3007',
          800: '#762405',
          900: '#501803',
        },
        brand: {
          DEFAULT: '#E8470A',
          50:  '#FEF0EB',
          100: '#FDD8CC',
          200: '#FAB199',
          300: '#F78A66',
          400: '#F46333',
          500: '#E8470A',
          600: '#C23C08',
          700: '#9C3007',
          800: '#762405',
          900: '#501803',
          950: '#3A0C01',
        },
        // Compatibility aliases for files not yet migrated
        surface: {
          DEFAULT:   '#ffffff',
          secondary: '#F9FAFB',
          tertiary:  '#F3F4F6',
          border:    '#E5E7EB',
        },
        content: {
          primary:   '#111827',
          secondary: '#374151',
          tertiary:  '#9CA3AF',
          inverse:   '#ffffff',
        },
        status: {
          success: '#059669',
          warning: '#D97706',
          error:   '#DC2626',
          info:    '#2563EB',
        },
      },
      boxShadow: {
        'xs':    '0 1px 2px 0 rgba(0,0,0,0.05)',
        'card':  '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.08)',
        'modal': '0 20px 60px -10px rgba(0,0,0,0.15)',
      },
      borderRadius: {
        'xl':  '0.75rem',
        '2xl': '1rem',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%':      { transform: 'translateX(-6px)' },
          '40%':      { transform: 'translateX(6px)' },
          '60%':      { transform: 'translateX(-4px)' },
          '80%':      { transform: 'translateX(4px)' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shake:    'shake 0.5s ease-in-out',
        'fade-in': 'fade-in 0.15s ease-out',
      },
    },
  },
  plugins: [],
}
