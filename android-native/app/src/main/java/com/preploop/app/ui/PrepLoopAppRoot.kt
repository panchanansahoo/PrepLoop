package com.preploop.app.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.preploop.app.ui.navigation.BottomNavTab
import com.preploop.app.ui.navigation.PrepLoopBottomNav
import com.preploop.app.ui.navigation.PrepLoopNavHost
import com.preploop.app.ui.navigation.Screen
import com.preploop.app.ui.theme.BgPrimary

/**
 * Root composable — manages Scaffold with bottom nav and NavHost.
 */
@Composable
fun PrepLoopAppRoot() {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    // Tabs that should show the bottom nav bar
    val mainTabRoutes = BottomNavTab.entries.map { it.route }.toSet()
    val showBottomNav = currentRoute in mainTabRoutes

    // TODO: Replace with real auth state from ViewModel
    val isLoggedIn = false

    Scaffold(
        containerColor = BgPrimary,
        bottomBar = {
            if (showBottomNav) {
                PrepLoopBottomNav(
                    currentRoute = currentRoute,
                    onTabSelected = { tab ->
                        navController.navigate(tab.route) {
                            popUpTo(navController.graph.findStartDestination().id) {
                                saveState = true
                            }
                            launchSingleTop = true
                            restoreState = true
                        }
                    },
                )
            }
        },
    ) { innerPadding ->
        PrepLoopNavHost(
            navController = navController,
            isLoggedIn = isLoggedIn,
        )
    }
}
