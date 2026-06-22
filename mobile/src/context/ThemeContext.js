import React, { createContext, useContext } from 'react';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const theme = { colors, typography, spacing, borderRadius, shadows };
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
