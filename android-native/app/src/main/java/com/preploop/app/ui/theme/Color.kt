package com.preploop.app.ui.theme

import androidx.compose.ui.graphics.Color

/**
 * PrepLoop color palette — mirrors the web app's CSS variables and
 * the React Native theme tokens from mobile/src/utils/theme.js.
 */

// ── Backgrounds (near-black palette) ──
val BgPrimary = Color(0xFF070709)
val BgSurface = Color(0xFF0F0F14)
val BgSurfaceVariant = Color(0xFF0A0A0E)
val BgInput = Color(0xFF0C0C12)
val BgOverlay = Color(0xF5070709) // ~96% alpha

// ── Brand / Accent (violet-indigo) ──
val Primary = Color(0xFF6366F1)       // Indigo 500
val PrimaryLight = Color(0xFF818CF8)  // Indigo 400
val PrimaryDark = Color(0xFF4F46E5)   // Indigo 600
val Secondary = Color(0xFF7C3AED)     // Violet 600
val SecondaryDark = Color(0xFF6D28D9) // Violet 700
val Accent = Color(0xFFA78BFA)        // Violet 300

// ── Semantic ──
val Success = Color(0xFF10B981)
val Warning = Color(0xFFF59E0B)
val Error = Color(0xFFEF4444)
val Info = Color(0xFF3B82F6)

// ── Text (zinc scale) ──
val TextPrimary = Color(0xFFF8FAFC)
val TextSecondary = Color(0xFFA1A1AA)  // Zinc 400
val TextMuted = Color(0xFF71717A)      // Zinc 500
val TextInverse = Color(0xFF070709)

// ── Borders ──
val Border = Color(0xFF1C1C22)         // ~8% white on dark
val BorderLight = Color(0xFF2A2A32)    // ~12% white
val BorderSubtle = Color(0xFF141418)   // ~4% white

// ── Gradient helper colors ──
val GradientPrimaryStart = Color(0xFF7C3AED)
val GradientPrimaryEnd = Color(0xFF6366F1)
val GradientPinkStart = Color(0xFFA855F7)
val GradientPinkEnd = Color(0xFFEC4899)

// ── Feature accent colors (matching web's feature cards) ──
val FeatureViolet = Color(0xFFA78BFA)
val FeatureBlue = Color(0xFF60A5FA)
val FeatureGreen = Color(0xFF34D399)
val FeatureYellow = Color(0xFFFBBF24)
val FeaturePink = Color(0xFFF472B6)
val FeatureCyan = Color(0xFF22D3EE)
