/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6',
          50: '#EBF2FF',
          100: '#D7E6FF',
          200: '#B0CFFF',
          300: '#88B8FF',
          400: '#61A1FF',
          500: '#3B82F6',
          600: '#0B61FF',
          700: '#0047D2',
          800: '#00349A',
          900: '#002162'
        }
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      }
    }
  },
  plugins: []
}
