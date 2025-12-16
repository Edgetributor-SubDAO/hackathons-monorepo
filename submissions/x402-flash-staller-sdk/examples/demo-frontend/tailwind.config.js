/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        stellar: {
          purple: "#7b3fe4",
          blue: "#00d4ff",
          dark: "#0d0d2b",
        },
      },
    },
  },
  plugins: [],
};
