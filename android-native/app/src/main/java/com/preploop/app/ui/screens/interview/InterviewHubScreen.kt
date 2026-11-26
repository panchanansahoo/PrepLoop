package com.preploop.app.ui.screens.interview

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.preploop.app.ui.components.FeatureCard
import com.preploop.app.ui.components.SectionHeader
import com.preploop.app.ui.theme.*

@Composable
fun InterviewHubScreen(
    onStartInterview: () -> Unit,
    onViewHistory: () -> Unit,
    onOpenWebInterview: (String) -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgPrimary)
            .statusBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(bottom = 80.dp),
    ) {
        SectionHeader(
            title = "Interview Suite",
            actionText = "History",
            onAction = onViewHistory,
        )

        Column(
            modifier = Modifier.padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            FeatureCard(
                title = "AI Mock Interview",
                description = "Practice with typed answers and get an AI score",
                icon = Icons.Filled.Mic,
                accentColor = FeatureCyan,
                tag = "AI Powered",
                onClick = onStartInterview,
            )
            FeatureCard(
                title = "Company-Specific",
                description = "Practice with questions from Google, Amazon, Meta & more",
                icon = Icons.Filled.Business,
                accentColor = FeatureViolet,
                tag = "50+ Companies",
                onClick = { onOpenWebInterview("company-prep") },
            )
            FeatureCard(
                title = "Debugging Interview",
                description = "Find and fix bugs under pressure — timed debugging sessions",
                icon = Icons.Filled.BugReport,
                accentColor = FeatureYellow,
                onClick = { onOpenWebInterview("debugging-interview") },
            )
            FeatureCard(
                title = "Code Review",
                description = "Review code snippets and identify improvements",
                icon = Icons.Filled.RateReview,
                accentColor = FeatureGreen,
                onClick = { onOpenWebInterview("code-review-interview") },
            )
        }
    }
}
