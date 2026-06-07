/** @type {import('tailwindcss').Config} */
// Colors reference CSS variables (defined in index.css) so light/dark swap
// automatically. Palette mirrors the Android app (mobile light + dark Colors).
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "var(--c-primary)",
        "primary-light": "var(--c-primary-light)",
        "primary-dark": "var(--c-primary-dark)",
        "primary-bg": "var(--c-primary-bg)",
        "primary-border": "var(--c-primary-border)",
        bg: "var(--c-bg)", card: "var(--c-card)",
        gray50: "var(--c-gray50)", gray100: "var(--c-gray100)", gray200: "var(--c-gray200)",
        gray300: "var(--c-gray300)", gray400: "var(--c-gray400)", gray500: "var(--c-gray500)",
        gray600: "var(--c-gray600)", gray700: "var(--c-gray700)", gray800: "var(--c-gray800)",
        gray900: "var(--c-gray900)",
        ink: "var(--c-ink)", muted: "var(--c-muted)", line: "var(--c-line)",
        success: "var(--c-success)", "success-bg": "var(--c-success-bg)", "success-dark": "var(--c-success-dark)",
        warning: "var(--c-warning)", "warning-bg": "var(--c-warning-bg)", "warning-dark": "var(--c-warning-dark)",
        danger: "var(--c-danger)", "danger-bg": "var(--c-danger-bg)", "danger-dark": "var(--c-danger-dark)",
        orange: "var(--c-orange)",
        white: "#FFFFFF",
      },
      fontFamily: { sans: ["Inter", "system-ui", "-apple-system", "sans-serif"] },
      boxShadow: {
        sm: "0 1px 3px rgba(2,8,23,0.06), 0 1px 2px rgba(2,8,23,0.04)",
        md: "0 4px 12px rgba(29,78,216,0.08), 0 2px 6px rgba(2,8,23,0.05)",
        lg: "0 12px 28px rgba(29,78,216,0.16), 0 4px 10px rgba(2,8,23,0.06)",
      },
    },
  },
  plugins: [],
};
