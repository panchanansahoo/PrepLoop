package com.preploop.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.preploop.app.ui.theme.*

/**
 * Feature card — matches web's feature cards on the home page.
 * Used for Quick Actions, Interview types, etc.
 */
@Composable
fun FeatureCard(
    title: String,
    description: String,
    icon: ImageVector,
    accentColor: Color,
    tag: String? = null,
    onClick: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    val bgColor = accentColor.copy(alpha = 0.08f)

    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(BgSurface)
            .border(1.dp, Border, RoundedCornerShape(20.dp))
            .clickable(onClick = onClick)
            .padding(20.dp),
    ) {
        Column {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth(),
            ) {
                // Icon container
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(bgColor),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = accentColor,
                        modifier = Modifier.size(22.dp),
                    )
                }

                // Tag badge
                if (tag != null) {
                    Text(
                        text = tag,
                        style = PrepLoopTypography.labelSmall,
                        color = accentColor,
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(accentColor.copy(alpha = 0.1f))
                            .padding(horizontal = 8.dp, vertical = 4.dp),
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = title,
                style = PrepLoopTypography.titleMedium,
                color = TextPrimary,
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = description,
                style = PrepLoopTypography.bodyMedium,
                color = TextMuted,
                maxLines = 2,
            )
        }
    }
}

/**
 * Stat card — matches web's QuickStats dashboard cards.
 */
@Composable
fun StatCard(
    value: String,
    label: String,
    icon: ImageVector,
    modifier: Modifier = Modifier,
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .background(BgSurface)
            .border(1.dp, Border, RoundedCornerShape(16.dp))
            .padding(16.dp),
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = TextSecondary,
            modifier = Modifier.size(20.dp),
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = value,
            style = PrepLoopTypography.headlineMedium,
            color = TextPrimary,
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = label,
            style = PrepLoopTypography.labelSmall,
            color = TextMuted,
        )
    }
}

/**
 * Gradient button — matches web's primary CTA gradient.
 */
@Composable
fun GradientButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
    enabled: Boolean = true,
) {
    val gradient = Brush.horizontalGradient(
        colors = listOf(GradientPrimaryStart, GradientPrimaryEnd),
    )

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(52.dp)
            .clip(RoundedCornerShape(999.dp))
            .background(if (enabled) gradient else Brush.horizontalGradient(listOf(TextMuted, TextMuted)))
            .clickable(enabled = enabled, onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center,
        ) {
            if (icon != null) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(18.dp),
                )
                Spacer(modifier = Modifier.width(8.dp))
            }
            Text(
                text = text,
                style = PrepLoopTypography.titleMedium,
                color = Color.White,
            )
        }
    }
}

/**
 * Section header with optional "See All" action — common pattern across screens.
 */
@Composable
fun SectionHeader(
    title: String,
    modifier: Modifier = Modifier,
    actionText: String? = null,
    onAction: () -> Unit = {},
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = title,
            style = PrepLoopTypography.titleLarge,
            color = TextPrimary,
        )
        if (actionText != null) {
            Text(
                text = actionText,
                style = PrepLoopTypography.bodyMedium,
                color = Accent,
                modifier = Modifier.clickable(onClick = onAction),
            )
        }
    }
}
