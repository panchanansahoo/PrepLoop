/**
 * PrepLoop Mobile Design System
 * Matches the web app's design tokens exactly.
 *
 * Web CSS source:
 *   --bg-primary: #030303 / dashboard: #060608
 *   --zinc-400: #a1a1aa  (text secondary)
 *   --zinc-500: #71717a  (text muted)
 *   --zinc-700: #3f3f46  (border light)
 *   --zinc-800: #27272a  (border)
 *   accent: #6366f1 (indigo) / #7c3aed (violet)
 */

export const colors = {
    // ── Backgrounds (matching web's near-black palette) ──────────
    bg: "#070709", // web: #060608 dashboard bg
    bgCard: "#0f0f14", // web: rgba(10,10,10,0.6) glass card
    bgCardAlt: "#0a0a0e", // web: rgba(5,5,5,0.7) deeper card
    bgInput: "#0c0c12", // web: form input background
    bgOverlay: "rgba(7,7,9,0.96)",

    // ── Brand / Accent (matching web's violet-indigo palette) ───
    primary: "#6366f1", // web: --accent-primary (dark mode indigo)
    primaryLight: "#818cf8", // lighter shade
    primaryDark: "#4f46e5", // darker shade
    secondary: "#7c3aed", // web: violet
    secondaryDark: "#6d28d9",
    accent: "#a78bfa", // web: light violet

    // ── Semantic (exact web values) ──────────────────────────────
    success: "#10b981", // web: --color-success
    warning: "#f59e0b", // web: --color-warning
    error: "#ef4444", // web: --color-danger
    info: "#3b82f6",

    // ── Text (web zinc scale) ────────────────────────────────────
    textPrimary: "#f8fafc", // web: --color-text-primary
    textSecondary: "#a1a1aa", // web: --zinc-400
    textMuted: "#71717a", // web: --zinc-500
    textInverse: "#070709",

    // ── Borders (white-alpha approximated as solid) ─────────────
    border: "#1c1c22", // rgba(255,255,255,0.08) on #070709
    borderLight: "#2a2a32", // rgba(255,255,255,0.12) on #070709
    borderSubtle: "#141418", // rgba(255,255,255,0.04)

    // ── Gradient arrays for LinearGradient ──────────────────────
    gradientPrimary: ["#7c3aed", "#6366f1"], // web: dash-hero-cta
    gradientSecondary: ["#a78bfa", "#818cf8"],
    gradientCard: ["#0f0f14", "#0a0a0e"],
    gradientDark: ["#070709", "#0a0a0e"],
    gradientHero: ["#ffffff", "#a1a1aa"], // web: dash-hero-title gradient
    gradientViolet: ["#7c3aed", "#6366f1"],
    gradientPink: ["#a855f7", "#ec4899"], // web: pink/purple combo

    // ── Orb colors (web auth screen orbs) ───────────────────────
    orbPurple: "rgba(168,85,247,0.15)", // web: top-left login orb
    orbPink: "rgba(236,72,153,0.12)", // web: bottom-right login orb
    orbViolet: "rgba(139,92,246,0.10)", // web: center login orb
};

export const typography = {
    fontSizeXS: 11, // web: section labels, eyebrows
    fontSizeSM: 13, // web: secondary text
    fontSizeMD: 15, // web: body text
    fontSizeLG: 17, // web: subheadings
    fontSizeXL: 20, // web: card titles
    fontSize2XL: 24, // web: stats values
    fontSize3XL: 30, // web: hero headings
    fontWeightLight: "300",
    fontWeightRegular: "400",
    fontWeightMedium: "500",
    fontWeightSemiBold: "600",
    fontWeightBold: "700",
    fontWeightExtraBold: "800",
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const borderRadius = {
    sm: 6,
    md: 8, // web: --radius-md
    lg: 12, // web: --radius-lg
    xl: 20, // web: --radius-xl (24px approx)
    xxl: 24, // web: --radius-xl exact
    full: 9999,
};

export const shadows = {
    sm: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
        elevation: 3,
    },
    md: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
    },
    // Purple glow — matches web's CTA button shadow
    glow: {
        shadowColor: "#7c3aed",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 14,
        elevation: 8,
    },
    // Card inset highlight — matches web's inset box-shadow
    card: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 5,
    },
};

/**
 * Glassmorphism-inspired style presets.
 * React Native doesn't support backdrop-filter, so we approximate
 * with semi-transparent backgrounds and subtle borders.
 */
export const glassStyles = {
    // Matches web's .glass-panel
    panel: {
        backgroundColor: "rgba(15, 15, 20, 0.85)",
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.lg,
    },
    // Lighter glass for overlays
    overlay: {
        backgroundColor: "rgba(7, 7, 9, 0.92)",
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderRadius: borderRadius.xl,
    },
    // Card variant with subtle gradient feel
    card: {
        backgroundColor: "rgba(15, 15, 20, 0.75)",
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.lg,
    },
};

/**
 * Animation timing constants matching web's CSS transitions.
 * Use with react-native-reanimated or Animated API.
 */
export const animation = {
    // Duration (ms)
    durationFast: 150,
    durationNormal: 250,
    durationSlow: 350,
    durationXSlow: 500,

    // Spring configs for react-native-reanimated
    springDefault: {
        damping: 20,
        stiffness: 300,
        mass: 0.8,
    },
    springBouncy: {
        damping: 12,
        stiffness: 200,
        mass: 0.6,
    },
    springGentle: {
        damping: 25,
        stiffness: 150,
        mass: 1,
    },

    // Matching web's cubic-bezier(0.4, 0, 0.2, 1)
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
};

/**
 * Font family constants.
 * Used after fonts are loaded via usePrepLoopFonts().
 */
export const fontFamilies = {
    heading: "InstrumentSans-Bold",
    headingSemiBold: "InstrumentSans-SemiBold",
    body: "Inter-Regular",
    bodyMedium: "Inter-Medium",
    bodySemiBold: "Inter-SemiBold",
    bodyBold: "Inter-Bold",
    mono: "SpaceMono-Regular",
};
