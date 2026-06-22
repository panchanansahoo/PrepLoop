package com.preploop.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.preploop.app.ui.screens.auth.LoginScreen
import com.preploop.app.ui.screens.dsa.DSAPatternsScreen
import com.preploop.app.ui.screens.home.HomeScreen
import com.preploop.app.ui.screens.interview.InterviewHubScreen
import com.preploop.app.ui.screens.jobs.JobsScreen
import com.preploop.app.ui.screens.profile.ProfileScreen

@Composable
fun PrepLoopNavHost(
    navController: NavHostController,
    isLoggedIn: Boolean,
) {
    NavHost(
        navController = navController,
        startDestination = if (isLoggedIn) Screen.Home.route else Screen.Login.route,
    ) {
        // ── Auth ──
        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                },
                onNavigateToSignup = {
                    navController.navigate(Screen.Signup.route)
                },
            )
        }

        composable(Screen.Signup.route) {
            // TODO: SignupScreen
        }

        // ── Main Tabs ──
        composable(Screen.Home.route) {
            HomeScreen(
                onNavigateToInterview = {
                    navController.navigate(Screen.Interview.route)
                },
            )
        }

        composable(Screen.DSA.route) {
            DSAPatternsScreen(
                onProblemClick = { problemId ->
                    navController.navigate(Screen.ProblemDetail.createRoute(problemId))
                },
            )
        }

        composable(Screen.Interview.route) {
            InterviewHubScreen(
                onStartInterview = {
                    navController.navigate(Screen.AIInterview.route)
                },
                onViewHistory = {
                    navController.navigate(Screen.InterviewHistory.route)
                },
            )
        }

        composable(Screen.Jobs.route) {
            JobsScreen()
        }

        composable(Screen.Profile.route) {
            ProfileScreen(
                onNavigateToWallet = {
                    navController.navigate(Screen.CoinWallet.route)
                },
                onNavigateToSettings = {
                    navController.navigate(Screen.Settings.route)
                },
                onLogout = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                },
            )
        }

        // ── Nested Detail Screens (stubs) ──
        composable(Screen.ProblemDetail.route) { /* TODO */ }
        composable(Screen.AIInterview.route) { /* TODO */ }
        composable(Screen.InterviewHistory.route) { /* TODO */ }
        composable(Screen.CoinWallet.route) { /* TODO */ }
        composable(Screen.Settings.route) { /* TODO */ }
    }
}
