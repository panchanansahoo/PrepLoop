package com.preploop.app.ui.screens.jobs

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.outlined.OpenInNew
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.platform.LocalUriHandler
import com.preploop.app.text
import org.json.JSONObject
import com.preploop.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun JobsScreen(jobs: List<JSONObject>) {
    var searchQuery by remember { mutableStateOf("") }
    var error by remember { mutableStateOf(false) }
    val uriHandler = LocalUriHandler.current
    val filtered = jobs.filter { job ->
        listOf("title", "company", "location").any { job.text(it).contains(searchQuery.trim(), ignoreCase = true) }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgPrimary)
            .statusBarsPadding(),
    ) {
        Text(
            text = "Job Updates",
            style = PrepLoopTypography.headlineMedium,
            color = TextPrimary,
            modifier = Modifier.padding(horizontal = 20.dp, vertical = 16.dp),
        )

        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Search jobs...", color = TextMuted) },
            leadingIcon = { Icon(Icons.Filled.Search, null, tint = TextMuted) },
            singleLine = true,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Accent,
                unfocusedBorderColor = Border,
                focusedContainerColor = BgInput,
                unfocusedContainerColor = BgInput,
                cursorColor = Accent,
                focusedTextColor = TextPrimary,
                unfocusedTextColor = TextPrimary,
            ),
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp),
        )

        Spacer(modifier = Modifier.height(12.dp))
        if (error) Text("Could not open the job link.", color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(horizontal = 20.dp))

        LazyColumn(
            contentPadding = PaddingValues(horizontal = 20.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            if (filtered.isEmpty()) item { Text("No matching jobs", color = TextMuted) }
            items(filtered) { job ->
                val company = job.text("company")
                val location = job.text("location")
                val jobType = job.text("type")
                val applyUrl = listOf("apply_link", "applyUrl", "url", "link")
                    .firstNotNullOfOrNull { key -> job.text(key).takeIf { it.isNotBlank() } }
                    .orEmpty()
                val hasValidUrl = applyUrl.startsWith("https://", true) || applyUrl.startsWith("http://", true)
                val openApplyUrl = {
                    error = runCatching { uriHandler.openUri(applyUrl) }.isFailure
                }
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(20.dp))
                        .background(BgSurface)
                        .border(1.dp, Border, RoundedCornerShape(20.dp))
                        .clickable(enabled = hasValidUrl, onClick = openApplyUrl)
                        .padding(16.dp),
                    verticalAlignment = Alignment.Top,
                ) {
                    // Company initials avatar
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .clip(RoundedCornerShape(14.dp))
                            .background(
                                Brush.linearGradient(listOf(Primary.copy(alpha = 0.2f), Secondary.copy(alpha = 0.1f)))
                            ),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(company.trim().take(2).uppercase().ifBlank { "?" }, style = PrepLoopTypography.titleMedium, color = Accent)
                    }

                    Spacer(modifier = Modifier.width(14.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(job.text("title"), style = PrepLoopTypography.titleMedium, color = TextPrimary)
                        Text(company, style = PrepLoopTypography.bodyMedium, color = Accent)
                        if (location.isNotBlank() || jobType.isNotBlank()) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                if (location.isNotBlank()) {
                                    // Location chip
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(BgSurfaceVariant)
                                            .border(1.dp, Border, RoundedCornerShape(8.dp))
                                            .padding(horizontal = 8.dp, vertical = 4.dp),
                                    ) {
                                        Icon(Icons.Filled.LocationOn, null, tint = TextMuted, modifier = Modifier.size(12.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(location, style = PrepLoopTypography.labelSmall, color = TextSecondary)
                                    }
                                }
                                if (jobType.isNotBlank()) {
                                    // Type chip
                                    Text(
                                        text = jobType,
                                        style = PrepLoopTypography.labelSmall,
                                        color = Primary,
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(Primary.copy(alpha = 0.1f))
                                            .padding(horizontal = 8.dp, vertical = 4.dp),
                                    )
                                }
                            }
                        }
                    }

                    if (hasValidUrl) {
                        IconButton(onClick = openApplyUrl) {
                            Icon(Icons.Outlined.OpenInNew, "Apply", tint = Accent, modifier = Modifier.size(18.dp))
                        }
                    }
                }
            }
            item { Spacer(modifier = Modifier.height(80.dp)) }
        }
    }
}
