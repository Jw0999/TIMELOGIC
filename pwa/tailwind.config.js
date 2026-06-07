/** @type {import('tailwindcss').Config} */
// Palette mirrors the Android app (mobile/src/constants/theme.ts light Colors)
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1D4ED8",
        "primary-light": "#3B82F6",
        "primary-dark": "#1E3A8A",
        "primary-bg": "#EFF6FF",
        "primary-border": "#BFDBFE",
        bg: "#F8FAFC",
        card: "#FFFFFF",
        gray50: "#F8FAFC", gray100: "#F1F5F9", gray200: "#E2E8F0",
        gray300: "#CBD5E1", gray400: "#94A3B8", gray500: "#64748B",
        gray600: "#475569", gray700: "#334155", gray800: "#1E293B", gray900: "#0F172A",
        ink: "#1E293B", muted: "#64748B", line: "#F1F5F9",
        success: "#10B981", "success-bg": "#D1FAE5", "success-dark": "#065F46",
        warning: "#F59E0B", "warning-bg": "#FEF3C7", "warning-dark": "#92400E",
        danger: "#EF4444", "danger-bg": "#FEE2E2", "danger-dark": "#991B1B",
        orange: "#F97316",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        sm: "0 1px 3px rgba(2,8,23,0.06), 0 1px 2px rgba(2,8,23,0.04)",
        md: "0 4px 12px rgba(29,78,216,0.08), 0 2px 6px rgba(2,8,23,0.05)",
        lg: "0 12px 28px rgba(29,78,216,0.16), 0 4px 10px rgba(2,8,23,0.06)",
      },
    },
  },
  plugins: [],
};
