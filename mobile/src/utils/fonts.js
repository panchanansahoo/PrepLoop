/**
 * PrepLoop Mobile — Font Loading Utility
 *
 * Loads custom fonts that match the web app's typography.
 * Falls back gracefully to system fonts if custom font files
 * are not yet downloaded.
 *
 * To add custom fonts:
 *   1. Download Inter from https://fonts.google.com/specimen/Inter
 *   2. Download Instrument Sans from https://fonts.google.com/specimen/Instrument+Sans
 *   3. Download Space Mono from https://fonts.google.com/specimen/Space+Mono
 *   4. Place .ttf files in mobile/assets/fonts/
 *
 * Usage:
 *   import { usePrepLoopFonts, fontFamily } from './utils/fonts';
 *   const fontsLoaded = usePrepLoopFonts();
 */

/**
 * Font family name constants for use in StyleSheet.
 * These will only work after fonts are loaded; otherwise
 * React Native uses the system default.
 */
export const fontFamily = {
    heading: undefined, // Will use system bold by default
    headingSemiBold: undefined,
    body: undefined, // Will use system regular by default
    bodyMedium: undefined,
    bodySemiBold: undefined,
    bodyBold: undefined,
    mono: undefined, // Will use system monospace by default

    // System fallbacks
    system: undefined,
    systemBold: undefined,
};

/**
 * Hook: Attempts to load custom fonts.
 * Returns `true` immediately if fonts aren't available (graceful degradation).
 *
 * When actual .ttf files are added to assets/fonts/, this hook
 * will be updated to use expo-font's useFonts().
 */
export function usePrepLoopFonts() {
    // Currently using system fonts (custom font files not yet bundled).
    // When font files are added, replace with expo-font's useFonts() hook:
    //
    // import { useFonts } from 'expo-font';
    // const [fontsLoaded] = useFonts({
    //     'InstrumentSans-Bold': require('../../assets/fonts/InstrumentSans-Bold.ttf'),
    //     'Inter-Regular': require('../../assets/fonts/Inter-Regular.ttf'),
    //     ...
    // });
    // return fontsLoaded;
    //
    // For now, return true immediately so the splash screen hides without
    // an extra render cycle.
    return true;
}
