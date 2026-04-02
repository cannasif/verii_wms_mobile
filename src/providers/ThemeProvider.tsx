import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { createTheme, type AppTheme } from '@/constants/theme';
import { useUIStore } from '@/store/ui';

interface ThemeContextValue {
  theme: AppTheme;
  mode: AppTheme['mode'];
  setThemeMode: (mode: AppTheme['mode']) => Promise<void>;
  toggleThemeMode: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const mode = useUIStore((state) => state.themeMode);
  const hydrateTheme = useUIStore((state) => state.hydrateTheme);
  const setThemeMode = useUIStore((state) => state.setThemeMode);
  const toggleThemeMode = useUIStore((state) => state.toggleThemeMode);

  useEffect(() => {
    void hydrateTheme();
  }, [hydrateTheme]);

  const theme = useMemo(() => createTheme(mode), [mode]);
  const value = useMemo(
    () => ({ theme, mode, setThemeMode, toggleThemeMode }),
    [mode, setThemeMode, theme, toggleThemeMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
