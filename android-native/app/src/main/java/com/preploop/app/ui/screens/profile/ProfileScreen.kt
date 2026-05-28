package com.preploop.app.ui.screens.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.preploop.app.ui.theme.*

@Composable
fun ProfileScreen(
    onNavigateToWallet: () -> Unit,
    onNavigateToSettings: () -> Unit,
    onLogout: () -> Unit,
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BgPrimary)
            .statusBarsPadding(),
        contentPadding = PaddingValues(bottom = 100.dp),
    ) {
        // Profile header card
        item {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
            ) {
                // Avatar
                Box(
                    modifier = Modifier
                        .size(80.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.linearGradient(listOf(GradientPrimaryStart, GradientPrimaryEnd))
                        ),
                    contentAlignment = Alignment.Center,
                ) {
                    Text("PE", style = PrepLoopTypography.headlineMedium, color = TextPrimary)
                }

                Spacer(modifier = Modifier.height(16.dp))
                Text("Prep Engineer", style = PrepLoopTypography.titleLarge, color = TextPrimary)
                Text("engineer@preploop.me", style = PrepLoopTypography.bodyMedium, color = TextMuted)

                Spacer(modifier = Modifier.height(12.dp))

                // Tier badge
                Text(
                    text = "⭐ Free Tier",
                    style = PrepLoopTypography.labelSmall,
                    color = Warning,
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(Warning.copy(alpha = 0.1f))
                        .padding(horizontal = 12.dp, vertical = 6.dp),
                )
            }
        }

        // Stats row
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                StatBlock("42", "Problems", Modifier.weight(1f))
                StatBlock("7", "Interviews", Modifier.weight(1f))
                StatBlock("85%", "Avg Score", Modifier.weight(1f))
            }
        }

        // Menu items
        item { Spacer(modifier = Modifier.height(24.dp)) }

        item {
            Column(modifier = Modifier.padding(horizontal = 20.dp)) {
                ProfileMenuItem(Icons.Filled.Analytics, "Analytics", onClick = {})
                ProfileMenuItem(Icons.Filled.AccountBalanceWallet, "Coin Wallet", onClick = onNavigateToWallet)
                ProfileMenuItem(Icons.Filled.History, "History", onClick = {})
                ProfileMenuItem(Icons.Filled.Description, "Resume Analyzer", onClick = {})
                ProfileMenuItem(Icons.Filled.Settings, "Settings", onClick = onNavigateToSettings)

                Spacer(modifier = Modifier.height(16.dp))
                HorizontalDivider(color = Border)
                Spacer(modifier = Modifier.height(16.dp))

                ProfileMenuItem(
                    Icons.AutoMirrored.Filled.Logout,
                    "Logout",
                    tint = Error,
                    onClick = onLogout,
                )
            }
        }
    }
}

@Composable
private fun StatBlock(value: String, label: String, modifier: Modifier) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = modifier
            .clip(RoundedCornerShape(14.dp))
            .background(BgSurface)
            .border(1.dp, Border, RoundedCornerShape(14.dp))
            .padding(16.dp),
    ) {
        Text(value, style = PrepLoopTypography.titleLarge, color = TextPrimary)
        Spacer(modifier = Modifier.height(2.dp))
        Text(label, style = PrepLoopTypography.labelSmall, color = TextMuted)
    }
}

@Composable
private fun ProfileMenuItem(
    icon: ImageVector,
    label: String,
    tint: androidx.compose.ui.graphics.Color = TextSecondary,
    onClick: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .padding(vertical = 14.dp, horizontal = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(icon, null, tint = tint, modifier = Modifier.size(22.dp))
        Spacer(modifier = Modifier.width(16.dp))
        Text(label, style = PrepLoopTypography.bodyLarge, color = TextPrimary, modifier = Modifier.weight(1f))
        Icon(Icons.Outlined.ChevronRight, null, tint = TextMuted, modifier = Modifier.size(20.dp))
    }
}
