package com.preploop.app.domain.model

/**
 * Domain models — clean layer, no serialization annotations.
 */

data class User(
    val id: String,
    val email: String,
    val name: String,
    val avatar: String?,
    val tier: String, // "free", "pro", "premium"
    val coins: Int,
    val streak: Int,
)

data class DashboardData(
    val streak: Int,
    val problemsSolved: Int,
    val averageScore: Int,
    val dailyChallenge: Problem?,
    val recentActivity: List<ActivityItem>,
)

data class Pattern(
    val id: String,
    val name: String,
    val description: String,
    val problemCount: Int,
    val completedCount: Int,
    val difficulty: String,
)

data class Problem(
    val id: String,
    val title: String,
    val description: String,
    val difficulty: String, // "Easy", "Medium", "Hard"
    val topic: String,
    val acceptanceRate: Float,
    val starterCode: Map<String, String>, // language → code
    val hints: List<String>,
    val solution: String?,
)

data class ActivityItem(
    val type: String,
    val title: String,
    val timestamp: Long,
    val score: Int?,
)

data class Job(
    val id: String,
    val title: String,
    val company: String,
    val location: String,
    val type: String, // "Full-time", "Internship", "Contract"
    val description: String,
    val applyUrl: String,
    val postedAt: Long,
    val companyLogoUrl: String?,
)
