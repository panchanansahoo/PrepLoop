package com.preploop.app.ui.navigation

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.preploop.app.PrepLoopSession
import com.preploop.app.objects
import com.preploop.app.text
import com.preploop.app.ui.screens.*
import com.preploop.app.ui.screens.auth.LoginScreen
import com.preploop.app.ui.screens.dsa.DSAPatternsScreen
import com.preploop.app.ui.screens.home.HomeScreen
import com.preploop.app.ui.screens.interview.InterviewHubScreen
import com.preploop.app.ui.screens.jobs.JobsScreen
import com.preploop.app.ui.screens.profile.ProfileScreen
import org.json.JSONObject

@Composable
fun PrepLoopNavHost(
    navController: NavHostController,
    isLoggedIn: Boolean,
    session: PrepLoopSession,
    modifier: Modifier = Modifier,
) {
    val back: () -> Unit = { navController.popBackStack() }
    val navigateToTab: (String) -> Unit = { route ->
        navController.navigate(route) {
            popUpTo(navController.graph.findStartDestination().id) {
                saveState = true
            }
            launchSingleTop = true
            restoreState = true
        }
    }

    NavHost(
        navController = navController,
        startDestination = if (isLoggedIn) Screen.Home.route else Screen.Login.route,
        modifier = modifier,
    ) {
        if (!isLoggedIn) {
            composable(Screen.Login.route) {
                LoginScreen(
                    onLogin = session::login,
                    onNavigateToSignup = { navController.navigate(Screen.Signup.route) },
                    onNavigateToForgotPassword = { navController.navigate(Screen.ForgotPassword.route) },
                )
            }
            composable(Screen.Signup.route) { SignupPage(session, back) }
            composable(Screen.ForgotPassword.route) { ForgotPasswordPage(session, back) }
        } else {
            composable(Screen.Home.route) {
                val displayName = session.user
                    ?.let { it.text("fullName").ifBlank { it.text("full_name") } }
                    .orEmpty()
                    .ifBlank { "there" }
                HomeScreen(
                    userName = displayName,
                    loadDashboard = { session.request("user/dashboard") as JSONObject },
                    onNavigateToInterview = { navigateToTab(Screen.Interview.route) },
                    onNavigateToDSA = { navigateToTab(Screen.DSA.route) },
                    onNavigateToAIInterview = { navController.navigate(Screen.AIInterview.route) },
                    onNavigateToSQL = { navController.navigate(Screen.SqlMastery.route) },
                    onNavigateToCompanyPrep = { navController.navigate("web-interview/company-prep") },
                )
            }
            composable(Screen.DSA.route) {
                LoadFeature("dsa-patterns", { session.request("dsa/patterns") as JSONObject }) { data ->
                    DSAPatternsScreen(
                        patterns = data.optJSONArray("patterns")?.objects().orEmpty(),
                        onPatternClick = { navController.navigate(Screen.PatternDetail.createRoute(it)) },
                    )
                }
            }
            composable(Screen.PatternDetail.route) { entry ->
                PatternProblems(session, entry.arguments?.getString("patternId").orEmpty(), back) {
                    navController.navigate(Screen.ProblemDetail.createRoute(it))
                }
            }
            composable(Screen.ProblemDetail.route) { entry ->
                ProblemPage(session, entry.arguments?.getString("problemId").orEmpty(), back)
            }
            composable(Screen.LearningPath.route) {
                OpenWebFeature("Learning path", "/learning-path", back)
            }
            composable(Screen.SqlMastery.route) {
                OpenWebFeature("SQL Mastery", "/sql-problems", back)
            }
            composable(Screen.Interview.route) {
                InterviewHubScreen(
                    onStartInterview = { navController.navigate(Screen.AIInterview.route) },
                    onViewHistory = { navController.navigate(Screen.InterviewHistory.route) },
                    onOpenWebInterview = { navController.navigate("web-interview/$it") },
                )
            }
            composable("web-interview/{track}") { entry ->
                when (entry.arguments?.getString("track")) {
                    "company-prep" -> OpenWebFeature("Company prep", "/company-prep", back)
                    "debugging-interview" -> OpenWebFeature("Debugging interview", "/debugging-interview", back)
                    "code-review-interview" -> OpenWebFeature("Code review interview", "/code-review-interview", back)
                    else -> FeaturePage("Interview", back) { Text("Unknown interview track.") }
                }
            }
            composable(Screen.AIInterview.route) { InterviewPage(session, back) }
            composable(Screen.InterviewHistory.route) {
                HistoryPage(
                    session = session,
                    onBack = back,
                    onOpenResult = { sessionId ->
                        navController.navigate(Screen.InterviewResults.createRoute(sessionId))
                    },
                )
            }
            composable(Screen.InterviewResults.route) { entry ->
                InterviewResultPage(session, entry.arguments?.getString("sessionId").orEmpty(), back)
            }
            composable(Screen.Jobs.route) {
                LoadFeature("jobs", { session.request("jobs?limit=50") as JSONObject }) { data ->
                    JobsScreen(data.optJSONArray("jobs")?.objects().orEmpty())
                }
            }
            composable(Screen.Profile.route) {
                session.user?.let { account ->
                    ProfileScreen(
                        account = account,
                        onNavigateToWallet = { navController.navigate(Screen.CoinWallet.route) },
                        onNavigateToAnalytics = { navController.navigate(Screen.Analytics.route) },
                        onNavigateToHistory = { navController.navigate(Screen.InterviewHistory.route) },
                        onNavigateToResume = { navController.navigate(Screen.ResumeAnalyzer.route) },
                        onNavigateToSettings = { navController.navigate(Screen.Settings.route) },
                        onLogout = session::logout,
                    )
                }
            }
            composable(Screen.CoinWallet.route) { WalletPage(session, back) }
            composable(Screen.Settings.route) { SettingsPage(session, back) }
            composable(Screen.Analytics.route) { AnalyticsPage(session, back) }
            composable(Screen.ResumeAnalyzer.route) { OpenWebFeature("Resume analyzer", "/resume-analyzer", back) }
        }
    }
}
