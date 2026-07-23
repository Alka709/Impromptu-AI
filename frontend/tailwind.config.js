/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        brand: {
          bg: '#FAFAF8',
          surface: '#FFFFFF',
          text: '#111111',
          muted: '#5B5B5B',
          border: '#E7E7E7',
          accent: '#0F172A',
          cta: '#111827',
          section: '#F5F5F4',
        },
      },
    },
  },
  plugins: [],
}
