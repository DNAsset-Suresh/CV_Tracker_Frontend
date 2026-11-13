/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          midnight: '#111827',
          navy: '#1E293B',
          slate: '#334155',
          teal: '#0D9488',
          emerald: '#059669',
          indigo: '#6366F1',
          bg: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
        },
        status: {
          success: '#16A34A',
          pending: '#D97706',
          rejected: '#DC2626',
          processing: '#6366F1',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

