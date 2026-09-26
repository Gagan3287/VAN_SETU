/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          950: '#06130b',
          900: '#0B2215',
          800: '#143622',
          700: '#1B4D31',
          600: '#267349',
          500: '#34A066',
          400: '#4EDE8E',
          300: '#86EFB5',
          100: '#D1FADF',
        },
        gold: {
          500: '#EAB308',
          400: '#FACC15',
          300: '#FDE047',
        },
        darkbg: '#090D16',
        darkcard: '#111827',
        darkborder: '#1F2937',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

