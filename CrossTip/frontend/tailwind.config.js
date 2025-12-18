/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        stellar: '#14b9e6',
        polkadot: '#e6007a',
      },
    },
  },
  plugins: [],
}
