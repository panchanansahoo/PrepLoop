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
import com.preploop.app.text
import org.json.JSONObject
import com.preploop.app.ui.theme.*

@Composable
fun ProfileScreen(
    account: JSONObject,
    onNavigateToAnalytics: () -> Unit,
    onNavigateToHistory: () -> Unit,
    onNavigateToResume: () -> Unit,
    onNavigateToWallet: () -> Unit,
    onNavigateToSettings: () -> Unit,
    onLogout: () -> Unit,
) {
    val name = account.text("fullName").ifBlank { account.text("full_name") }
    val email = account.text("email")
    val tier = account.text("subscriptionTier").ifBlank { "free" }
    val initials = name.split(" ").filter { it.isNotBlank() }.take(2).joinToString("") { it.take(1).uppercase() }
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
                    Text(initials.ifBlank { "P" }, style = PrepLoopTypography.headlineMedium, color = TextPrimary)
                }

                Spacer(modifier = Modifier.height(16.dp))
                Text(name.ifBlank { email }, style = PrepLoopTypography.titleLarge, color = TextPrimary)
                Text(email, style = PrepLoopTypography.bodyMedium, color = TextMuted)

                Spacer(modifier = Modifier.height(12.dp))

                // Tier badge
                Text(
                    text = tier.replaceFirstChar { it.uppercaseChar() } + " plan",
                    style = PrepLoopTypography.labelSmall,
                    color = Warning,
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(Warning.copy(alpha = 0.1f))
                        .padding(horizontal = 12.dp, vertical = 6.dp),
                )
            }
        }

        // Menu items
        item { Spacer(modifier = Modifier.height(24.dp)) }

        item {
            Column(modifier = Modifier.padding(horizontal = 20.dp)) {
                ProfileMenuItem(Icons.Filled.Analytics, "Analytics", onClick = onNavigateToAnalytics)
                ProfileMenuItem(Icons.Filled.AccountBalanceWallet, "Coin Wallet", onClick = onNavigateToWallet)
                ProfileMenuItem(Icons.Filled.History, "History", onClick = onNavigateToHistory)
                ProfileMenuItem(Icons.Filled.Description, "Resume Analyzer", onClick = onNavigateToResume)
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
