/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        ocean: "#0f8b8d",
        coral: "#e96f55",
        gold: "#f1b24a",
      },
      boxShadow: {
        lift: "0 24px 70px rgba(23, 32, 51, 0.14)",
      },
    },
  },
  plugins: [],
};
