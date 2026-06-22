package com.preploop.app.ui.navigation

/**
 * Type-safe route definitions for the entire app.
 * Mirrors the web's react-router structure, adapted for mobile navigation.
 */
sealed class Screen(val route: String) {
    // Auth
    data object Login : Screen("login")
    data object Signup : Screen("signup")
    data object ForgotPassword : Screen("forgot_password")

    // Main tabs
    data object Home : Screen("home")
    data object DSA : Screen("dsa")
    data object Interview : Screen("interview")
    data object Jobs : Screen("jobs")
    data object Profile : Screen("profile")

    // Nested screens — DSA
    data object ProblemDetail : Screen("problem/{problemId}") {
        fun createRoute(problemId: String) = "problem/$problemId"
    }
    data object PatternDetail : Screen("pattern/{patternId}") {
        fun createRoute(patternId: String) = "pattern/$patternId"
    }
    data object LearningPath : Screen("learning_path")

    // Nested screens — Interview
    data object AIInterview : Screen("ai_interview")
    data object InterviewHistory : Screen("interview_history")
    data object InterviewResults : Screen("interview_results/{sessionId}") {
        fun createRoute(sessionId: String) = "interview_results/$sessionId"
    }

    // Nested screens — Profile
    data object CoinWallet : Screen("wallet")
    data object Analytics : Screen("analytics")
    data object Settings : Screen("settings")
    data object ResumeAnalyzer : Screen("resume_analyzer")
}

/** Bottom navigation tab definitions */
enum class BottomNavTab(
    val route: String,
    val label: String,
    val emoji: String, // Placeholder — replace with Material icons
) {
    HOME("home", "Home", "🏠"),
    DSA("dsa", "DSA", "🧩"),
    INTERVIEW("interview", "Interview", "🤖"),
    JOBS("jobs", "Jobs", "💼"),
    PROFILE("profile", "Profile", "👤"),
}
