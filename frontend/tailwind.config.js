/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Cormorant Garamond"', "Georgia", "serif"],
        body: ['"Outfit"', "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#FAF9F6",
          100: "#F5F3EE",
          200: "#E8E4DD",
          300: "#D4CEC4",
          400: "#B5ADA0",
          500: "#8A8072",
          600: "#6B6154",
          700: "#4A4239",
          800: "#2D2822",
          900: "#1A1714",
          950: "#0D0B09",
        },
      },
      letterSpacing: {
        widest: "0.15em",
      },
    },
  },
  plugins: [],
};
