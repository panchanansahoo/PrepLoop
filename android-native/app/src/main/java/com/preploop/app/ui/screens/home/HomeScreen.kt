package com.preploop.app.ui.screens.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import com.preploop.app.ui.components.*
import kotlinx.coroutines.CancellationException
import org.json.JSONObject
import com.preploop.app.ui.theme.*

/**
 * Home / Dashboard screen — matches web's Dashboard.jsx layout.
 * Vertical scroll: greeting → stats → quick actions.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    userName: String,
    loadDashboard: suspend () -> JSONObject,
    onNavigateToInterview: () -> Unit,
    onNavigateToDSA: () -> Unit,
    onNavigateToAIInterview: () -> Unit,
    onNavigateToSQL: () -> Unit,
    onNavigateToCompanyPrep: () -> Unit,
) {
    var dashboard by remember { mutableStateOf<JSONObject?>(null) }
    var statsUnavailable by remember { mutableStateOf(false) }
    var attempt by remember { mutableIntStateOf(0) }
    LaunchedEffect(attempt) {
        statsUnavailable = false
        try {
            dashboard = loadDashboard()
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (_: Exception) {
            statsUnavailable = true
        }
    }
    val stats = dashboard?.optJSONObject("stats")
    val greeting = remember {
        val hour = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY)
        when {
            hour < 12 -> "Good morning"
            hour < 18 -> "Good afternoon"
            else -> "Good evening"
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BgPrimary),
        contentPadding = PaddingValues(bottom = 100.dp), // space for bottom nav
    ) {
        // ── Hero Header ──
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 24.dp)
                    .statusBarsPadding(),
            ) {
                Text(
                    text = buildAnnotatedString {
                        append("$greeting, ")
                        withStyle(SpanStyle(brush = Brush.horizontalGradient(listOf(Accent, PrimaryLight)))) {
                            append(userName)
                        }
                        append(" 👋")
                    },
                    style = PrepLoopTypography.headlineMedium,
                    color = TextPrimary,
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "\"First, solve the problem. Then, write the code.\"",
                    style = PrepLoopTypography.bodyMedium,
                    color = TextMuted,
                )
            }
        }

        // ── Quick Stats Row ──
        item {
            val streakText = dashboard
                ?.takeIf { it.has("streak") && !it.isNull("streak") }
                ?.optInt("streak")
                ?.toString()
                ?: "—"
            val solvedText = stats
                ?.takeIf { (it.has("problemsSolved") && !it.isNull("problemsSolved")) || (it.has("problems_solved") && !it.isNull("problems_solved")) }
                ?.let { it.optInt("problemsSolved", it.optInt("problems_solved")).toString() }
                ?: "—"
            val mockCount = stats?.let { it.optInt("mockInterviews", it.optInt("mock_interviews_completed")) } ?: 0
            val avgScoreValue = stats?.let { it.optInt("avgScore", it.optInt("avg_score")) }
                ?: dashboard?.optInt("avgScore")
                ?: 0
            val avgScoreText = if (stats != null && mockCount > 0) "${avgScoreValue}%" else "—"

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                StatCard(
                    value = streakText,
                    label = "Day Streak",
                    icon = Icons.Filled.LocalFireDepartment,
                    modifier = Modifier.weight(1f),
                )
                StatCard(
                    value = solvedText,
                    label = "Solved",
                    icon = Icons.Filled.CheckCircle,
                    modifier = Modifier.weight(1f),
                )
                StatCard(
                    value = avgScoreText,
                    label = "Avg Score",
                    icon = Icons.Filled.TrendingUp,
                    modifier = Modifier.weight(1f),
                )
            }
        }

        if (dashboard == null && !statsUnavailable) {
            item {
                LinearProgressIndicator(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 10.dp),
                    color = Primary,
                )
            }
        }

        if (statsUnavailable) {
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Text("Stats are temporarily unavailable.", color = TextMuted)
                    TextButton(onClick = { attempt++ }) { Text("Retry") }
                }
            }
        }

        // ── Start Mock Interview CTA ──
        item {
            Spacer(modifier = Modifier.height(24.dp))
            Box(modifier = Modifier.padding(horizontal = 20.dp)) {
                GradientButton(
                    text = "Start Mock Interview",
                    onClick = onNavigateToInterview,
                    icon = Icons.Filled.Mic,
                )
            }
        }

        // ── Quick Actions ──
        item {
            Spacer(modifier = Modifier.height(24.dp))
            SectionHeader(title = "Quick Actions")
        }

        item {
            Column(
                modifier = Modifier.padding(horizontal = 20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                FeatureCard(
                    title = "DSA Patterns",
                    description = "Master 15 DSA topics with pattern-first learning",
                    icon = Icons.Filled.Code,
                    accentColor = FeatureYellow,
                    tag = "15 Topics",
                    onClick = onNavigateToDSA,
                )
                FeatureCard(
                    title = "AI Interview Simulator",
                    description = "Practice technical & behavioral interviews with AI feedback",
                    icon = Icons.Filled.Mic,
                    accentColor = FeatureCyan,
                    tag = "AI Powered",
                    onClick = onNavigateToAIInterview,
                )
                FeatureCard(
                    title = "SQL Mastery",
                    description = "100+ real-world SQL problems across all difficulty levels",
                    icon = Icons.Filled.Storage,
                    accentColor = FeatureBlue,
                    tag = "100+ Problems",
                    onClick = onNavigateToSQL,
                )
                FeatureCard(
                    title = "Company Prep Hub",
                    description = "Real interview questions from 50+ top companies",
                    icon = Icons.Filled.Business,
                    accentColor = FeaturePink,
                    tag = "50+ Companies",
                    onClick = onNavigateToCompanyPrep,
                )
            }
        }

        // ── Bottom padding ──
        item { Spacer(modifier = Modifier.height(32.dp)) }
    }
}
