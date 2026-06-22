package com.preploop.app.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

/**
 * PrepLoop is a dark-only app — matches the web's default dark theme.
 */
private val PrepLoopColorScheme = darkColorScheme(
    primary = Primary,
    onPrimary = TextPrimary,
    primaryContainer = PrimaryDark,
    onPrimaryContainer = TextPrimary,
    secondary = Secondary,
    onSecondary = TextPrimary,
    secondaryContainer = SecondaryDark,
    onSecondaryContainer = TextPrimary,
    tertiary = Accent,
    onTertiary = TextInverse,
    background = BgPrimary,
    onBackground = TextPrimary,
    surface = BgSurface,
    onSurface = TextPrimary,
    surfaceVariant = BgSurfaceVariant,
    onSurfaceVariant = TextSecondary,
    error = Error,
    onError = TextPrimary,
    outline = Border,
    outlineVariant = BorderLight,
)

@Composable
fun PrepLoopTheme(content: @Composable () -> Unit) {
    val colorScheme = PrepLoopColorScheme
    val view = LocalView.current

    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = BgPrimary.toArgb()
            window.navigationBarColor = BgSurfaceVariant.toArgb()
            WindowCompat.getInsetsController(window, view).apply {
                isAppearanceLightStatusBars = false
                isAppearanceLightNavigationBars = false
            }
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = PrepLoopTypography,
        shapes = PrepLoopShapes,
        content = content,
    )
}
