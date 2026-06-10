/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#FFF4E6',
          100: '#FFE4C2',
          500: '#F68E22',
          600: '#E07A10',
          700: '#B8630D',
          900: '#663707',
          DEFAULT: '#F68E22',
        },
        secondary: {
          50: '#EBF5FB',
          400: '#349FD5',
          600: '#216C96',
          DEFAULT: '#349FD5',
        },
        accent: '#FFD200',
        alert: '#EC3A29',
        background: '#f8f9fb',
      },
    },
  },
  plugins: [],
};
