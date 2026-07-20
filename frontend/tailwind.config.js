/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#000000',
          dark: '#000000',
          surface: '#fbf9f8',
          'surface-dim': '#dbdad9',
          'surface-bright': '#fbf9f8',
          'container-lowest': '#ffffff',
          'container-low': '#f5f3f3',
        },
        surface: '#fbf9f8',
        'surface-dim': '#dbdad9',
        'surface-bright': '#fbf9f8',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f5f3f3',
        brandBlack: '#000000',
        brandGray: '#717171',
        brandGold: '#b8860b',
        'brand-primary': '#000000',
        'brand-secondary': '#666666',
        'accent-green': '#4ade80',
        'impromptu-beige': '#F9F8F6',
        'impromptu-black': '#000000',
        'impromptu-gray': '#717171',
        'impromptu-border': '#E5E7EB',
        danger: '#ef4444',
        success: '#22c55e',
      },
      borderRadius: {
        'custom': '8px',
        'eight': '8px',
        'xl': '12px',
        '2xl': '16px',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translate(-50%, -20px)' },
          '100%': { opacity: '1', transform: 'translate(-50%, 0)' },
        }
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'fade-in-down': 'fade-in-down 0.4s ease-out forwards',
      }
    }
  },
  plugins: [],
}
