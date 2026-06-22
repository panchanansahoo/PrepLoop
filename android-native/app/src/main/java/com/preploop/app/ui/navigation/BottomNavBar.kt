package com.preploop.app.ui.navigation

import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Code
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Work
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Code
import androidx.compose.material.icons.outlined.Mic
import androidx.compose.material.icons.outlined.Work
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.preploop.app.ui.theme.*

data class NavItem(
    val tab: BottomNavTab,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector,
)

private val navItems = listOf(
    NavItem(BottomNavTab.HOME, Icons.Filled.Home, Icons.Outlined.Home),
    NavItem(BottomNavTab.DSA, Icons.Filled.Code, Icons.Outlined.Code),
    NavItem(BottomNavTab.INTERVIEW, Icons.Filled.Mic, Icons.Outlined.Mic),
    NavItem(BottomNavTab.JOBS, Icons.Filled.Work, Icons.Outlined.Work),
    NavItem(BottomNavTab.PROFILE, Icons.Filled.Person, Icons.Outlined.Person),
)

@Composable
fun PrepLoopBottomNav(
    currentRoute: String?,
    onTabSelected: (BottomNavTab) -> Unit,
) {
    NavigationBar(
        containerColor = BgSurfaceVariant,
        contentColor = TextPrimary,
        tonalElevation = 0.dp,
    ) {
        navItems.forEach { item ->
            val selected = currentRoute == item.tab.route
            NavigationBarItem(
                selected = selected,
                onClick = { onTabSelected(item.tab) },
                icon = {
                    Icon(
                        imageVector = if (selected) item.selectedIcon else item.unselectedIcon,
                        contentDescription = item.tab.label,
                        modifier = Modifier.size(24.dp),
                    )
                },
                label = {
                    Text(
                        text = item.tab.label,
                        style = PrepLoopTypography.labelSmall,
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = PrimaryLight,
                    unselectedIconColor = TextMuted,
                    selectedTextColor = PrimaryLight,
                    unselectedTextColor = TextMuted,
                    indicatorColor = PrimaryDark.copy(alpha = 0.15f),
                ),
            )
        }
    }
}
