/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html", // if your index.html is in root, or adjust to "./public/index.html"
    "./src/**/*.{js,ts,jsx,tsx}", // Scans all JS/TS/JSX/TSX files in src
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};