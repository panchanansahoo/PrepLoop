package com.preploop.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.ui.Alignment
import com.preploop.app.PrepLoopSession
import androidx.compose.ui.Modifier
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.preploop.app.ui.navigation.BottomNavTab
import com.preploop.app.ui.navigation.PrepLoopBottomNav
import com.preploop.app.ui.navigation.PrepLoopNavHost
import com.preploop.app.ui.theme.BgPrimary
import com.preploop.app.ui.theme.Primary

/**
 * Root composable — manages Scaffold with bottom nav and NavHost.
 */
@Composable
fun PrepLoopAppRoot(session: PrepLoopSession) {
    val isLoggedIn = session.user != null
    if (session.isCheckingSession && !isLoggedIn) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(BgPrimary),
            contentAlignment = Alignment.Center,
        ) {
            CircularProgressIndicator(color = Primary)
        }
        return
    }
    key(isLoggedIn) {
        PrepLoopNavigation(session, isLoggedIn)
    }
}

@Composable
private fun PrepLoopNavigation(session: PrepLoopSession, isLoggedIn: Boolean) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    // Tabs that should show the bottom nav bar
    val mainTabRoutes = BottomNavTab.entries.map { it.route }.toSet()
    val showBottomNav = currentRoute in mainTabRoutes

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
            session = session,
            modifier = Modifier.padding(bottom = innerPadding.calculateBottomPadding()),
        )
    }
}
