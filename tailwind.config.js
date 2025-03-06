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
        upcoming: '#72cecd', // Teal/cyan for Upcoming Trips
        cancelled: '#f0af2f', // Yellow/orange for Cancelled
        completed: '#bdbec3', // Light gray for Completed
      },
    },
    fontFamily: {
      arial: ["Arial", "sans-serif"],
    },
  },
  plugins: [],
};