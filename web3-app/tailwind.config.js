/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          pink: "#ff00ff",
          cyan: "#00f3ff",
          purple: "#bc13fe",
        }
      },
    },
  },
  plugins: [],
}