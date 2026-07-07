/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        keva: {
          navy: '#1e3a5f',
          gold: '#f2c14e',
          cream: '#faf6ee',
        },
      },
    },
  },
  plugins: [],
}
