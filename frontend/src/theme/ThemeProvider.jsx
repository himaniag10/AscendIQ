import { createContext, useEffect, useMemo, useState } from 'react';
import { themes } from './themes.js';

const DEFAULT_THEME = 'system';
const STORAGE_KEY = 'ascendiq-theme';

export const ThemeContext = createContext({
  theme: themes.light,
  mode: DEFAULT_THEME,
  setMode: () => {},
});

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(DEFAULT_THEME);
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    setSystemDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      setMode(saved);
      return;
    }
    setMode(DEFAULT_THEME);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (event) => setSystemDark(event.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    const activeTheme = mode === 'system' ? (systemDark ? themes.dark : themes.light) : themes[mode];
    window.localStorage.setItem(STORAGE_KEY, mode);
    const root = document.documentElement;
    root.dataset.theme = activeTheme.name;
    root.style.setProperty('--theme-background', activeTheme.background);
    root.style.setProperty('--theme-surface', activeTheme.surface);
    root.style.setProperty('--theme-surface-alt', activeTheme.surfaceAlt);
    root.style.setProperty('--theme-elevated', activeTheme.elevated);
    root.style.setProperty('--theme-text', activeTheme.text);
    root.style.setProperty('--theme-secondary-text', activeTheme.secondaryText);
    root.style.setProperty('--theme-muted-text', activeTheme.mutedText);
    root.style.setProperty('--theme-border', activeTheme.border);
    root.style.setProperty('--theme-border-strong', activeTheme.borderStrong);
    root.style.setProperty('--theme-primary', activeTheme.primary);
    root.style.setProperty('--theme-primary-hover', activeTheme.primaryHover);
    root.style.setProperty('--theme-primary-soft', activeTheme.primarySoft);
    root.style.setProperty('--theme-success', activeTheme.success);
    root.style.setProperty('--theme-warning', activeTheme.warning);
    root.style.setProperty('--theme-danger', activeTheme.danger);
    root.style.setProperty('--theme-shadow', activeTheme.shadow);
  }, [mode, systemDark]);

  const value = useMemo(() => {
    const activeTheme = mode === 'system' ? (systemDark ? themes.dark : themes.light) : themes[mode];
    return { theme: activeTheme || themes.light, mode, setMode };
  }, [mode, systemDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
