import { useTheme } from '../context/ThemeContext';

/**
 * Hook that provides theme-aware styling for components using isLight pattern.
 * Replaces manual `const isLight = localStorage.getItem('theme') === 'light'` patterns.
 * 
 * Usage:
 * const { isLight, getThemeValue, getCSSVariable } = useThemeStyles();
 * 
 * // For inline styles
 * style={{ background: getThemeValue('#030303', '#f5f5f5') }}
 * 
 * // For boolean checks
 * {isLight && <LightModeComponent />}
 * 
 * // For CSS variables
 * style={{ background: getCSSVariable('--bg-primary') }}
 */
export function useThemeStyles() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isDark = theme === 'dark';

  /**
   * Get value based on current theme
   * @param darkValue - Value to use in dark mode
   * @param lightValue - Value to use in light mode
   * @returns The appropriate value for current theme
   */
  const getThemeValue = (darkValue, lightValue) => {
    return isLight ? lightValue : darkValue;
  };

  /**
   * Get CSS variable value
   * @param varName - CSS variable name (e.g., '--bg-primary')
   * @returns CSS variable string for use in styles
   */
  const getCSSVariable = (varName) => {
    return `var(${varName})`;
  };

  /**
   * Get color with theme awareness
   * @param darkColor - Color for dark mode
   * @param lightColor - Color for light mode
   * @returns CSS color value
   */
  const getColor = (darkColor, lightColor) => {
    return isLight ? lightColor : darkColor;
  };

  /**
   * Get background color
   */
  const getBgColor = (darkBg = '#030303', lightBg = '#fafafa') => {
    return isLight ? lightBg : darkBg;
  };

  /**
   * Get text color
   */
  const getTextColor = (darkText = '#ffffff', lightText = '#111111') => {
    return isLight ? lightText : darkText;
  };

  /**
   * Get border color
   */
  const getBorderColor = (darkBorder = 'rgba(255,255,255,0.1)', lightBorder = 'rgba(26,26,26,0.08)') => {
    return isLight ? lightBorder : darkBorder;
  };

  /**
   * Get shadow color
   */
  const getShadowColor = (darkShadow = 'rgba(0,0,0,0.5)', lightShadow = 'rgba(0,0,0,0.1)') => {
    return isLight ? lightShadow : darkShadow;
  };

  /**
   * Get complete style object with both dark and light values
   * @param styles - Object with dark and light properties
   * @returns Merged style object for current theme
   */
  const getThemedStyles = (styles) => {
    if (!styles) return {};
    const { dark = {}, light = {} } = styles;
    return isLight ? { ...dark, ...light } : dark;
  };

  return {
    theme,
    isLight,
    isDark,
    getThemeValue,
    getCSSVariable,
    getColor,
    getBgColor,
    getTextColor,
    getBorderColor,
    getShadowColor,
    getThemedStyles,
  };
}

/**
 * Simple boolean hook for light mode checks
 * Lighter weight than full useThemeStyles if you only need isLight check
 */
export function useIsLight() {
  const { theme } = useTheme();
  return theme === 'light';
}

/**
 * Hook to get current theme name
 */
export function useCurrentTheme() {
  const { theme } = useTheme();
  return theme;
}
