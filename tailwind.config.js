/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      animation: {
        pop: "pop 0.3s ease-in-out",
      },
      keyframes: {
        pop: {
          "0%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      colors: {
        upcoming: '#72cecd',
        cancelled: '#bdbec3',
        completed: '#77c1ff', 
      },
    },
    fontFamily: {
      arial: ["Arial", "sans-serif"],
    },
  },
  plugins: [],
};