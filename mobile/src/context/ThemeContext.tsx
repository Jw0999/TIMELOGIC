import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { Colors, DarkColors } from '../constants/theme';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorSet = typeof Colors;

interface ThemeCtx {
  mode: ThemeMode;
  isDark: boolean;
  colors: ColorSet;
  setMode: (m: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeCtx>({
  mode: 'system', isDark: false, colors: Colors, setMode: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [mode, setMode] = useState<ThemeMode>('system');

  const isDark =
    mode === 'dark' ||
    (mode === 'system' && systemScheme === 'dark');

  const colors = isDark ? DarkColors : Colors;

  return (
    <ThemeContext.Provider value={{ mode, isDark, colors, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme  = () => useContext(ThemeContext);
/** Shorthand: returns the current active color set (light or dark) */
export const useColors = () => useContext(ThemeContext).colors;
