import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeCtx { theme: Theme; setTheme: (t: Theme) => void; isDark: boolean }

const ThemeContext = createContext<ThemeCtx>({ theme: 'system', setTheme: () => {}, isDark: false });

function applyTheme(t: Theme, setIsDark: (v: boolean) => void) {
  const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = t === 'dark' || (t === 'system' && sysDark);
  document.documentElement.classList.toggle('dark', dark);
  setIsDark(dark);
  localStorage.setItem('theme', t);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) ?? 'system');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    applyTheme(theme, setIsDark);
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system', setIsDark);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);

  const setTheme = (t: Theme) => { setThemeState(t); applyTheme(t, setIsDark); };

  return <ThemeContext.Provider value={{ theme, setTheme, isDark }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
