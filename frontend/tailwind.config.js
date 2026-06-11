/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        safe: {
          bg: '#fef3c7',
          border: '#f59e0b',
          text: '#92400e',
        },
      },
    },
  },
  plugins: [],
};
