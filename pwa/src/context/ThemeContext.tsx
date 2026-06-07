import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "system";
const KEY = "tl_theme";

interface Ctx { mode: ThemeMode; setMode: (m: ThemeMode) => void; isDark: boolean }
const ThemeCtx = createContext<Ctx>({ mode: "system", setMode: () => {}, isDark: false });

const systemDark = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => (localStorage.getItem(KEY) as ThemeMode) || "system");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const apply = () => {
      const dark = mode === "dark" || (mode === "system" && systemDark());
      setIsDark(dark);
      document.documentElement.classList.toggle("dark", dark);
      // keep the iOS status-bar / theme colour in sync
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#0F172A" : "#F8FAFC");
    };
    apply();
    if (mode === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [mode]);

  const setMode = (m: ThemeMode) => { localStorage.setItem(KEY, m); setModeState(m); };

  return <ThemeCtx.Provider value={{ mode, setMode, isDark }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
