/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#070d1c",
        base: "#0a1226",
        card: "#0e1a35",
        brand: "#2563eb",
        "brand-deep": "#1e3a6e",
        sky: "#60a5fa",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
