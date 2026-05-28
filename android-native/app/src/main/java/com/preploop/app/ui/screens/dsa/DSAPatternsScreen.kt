package com.preploop.app.ui.screens.dsa

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.preploop.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DSAPatternsScreen(
    onProblemClick: (String) -> Unit,
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedDifficulty by remember { mutableStateOf<String?>(null) }
    val difficulties = listOf("Easy", "Medium", "Hard")

    // Placeholder data
    val patterns = remember {
        listOf(
            Triple("Two Pointers", "12 problems", "Easy"),
            Triple("Sliding Window", "10 problems", "Medium"),
            Triple("Binary Search", "15 problems", "Medium"),
            Triple("Dynamic Programming", "20 problems", "Hard"),
            Triple("Graph BFS/DFS", "14 problems", "Hard"),
            Triple("Stack & Queue", "8 problems", "Easy"),
            Triple("Tree Traversal", "11 problems", "Medium"),
            Triple("Backtracking", "9 problems", "Hard"),
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgPrimary)
            .statusBarsPadding(),
    ) {
        // Header
        Text(
            text = "DSA Patterns",
            style = PrepLoopTypography.headlineMedium,
            color = TextPrimary,
            modifier = Modifier.padding(horizontal = 20.dp, vertical = 16.dp),
        )

        // Search bar
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Search patterns...", color = TextMuted) },
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
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp),
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Difficulty filter chips
        LazyRow(
            contentPadding = PaddingValues(horizontal = 20.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            items(difficulties) { diff ->
                val selected = selectedDifficulty == diff
                val chipColor = when (diff) {
                    "Easy" -> Success
                    "Medium" -> Warning
                    "Hard" -> Error
                    else -> Primary
                }
                FilterChip(
                    selected = selected,
                    onClick = {
                        selectedDifficulty = if (selected) null else diff
                    },
                    label = { Text(diff) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = chipColor.copy(alpha = 0.15f),
                        selectedLabelColor = chipColor,
                        containerColor = BgSurface,
                        labelColor = TextSecondary,
                    ),
                    border = FilterChipDefaults.filterChipBorder(
                        borderColor = Border,
                        selectedBorderColor = chipColor.copy(alpha = 0.3f),
                        enabled = true,
                        selected = selected,
                    ),
                )
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Pattern list
        LazyColumn(
            contentPadding = PaddingValues(horizontal = 20.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            items(patterns) { (name, count, difficulty) ->
                val diffColor = when (difficulty) {
                    "Easy" -> Success
                    "Medium" -> Warning
                    else -> Error
                }
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(BgSurface)
                        .border(1.dp, Border, RoundedCornerShape(16.dp))
                        .clickable { onProblemClick(name) }
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(name, style = PrepLoopTypography.titleMedium, color = TextPrimary)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(count, style = PrepLoopTypography.bodyMedium, color = TextMuted)
                    }
                    Text(
                        text = difficulty,
                        style = PrepLoopTypography.labelSmall,
                        color = diffColor,
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(diffColor.copy(alpha = 0.1f))
                            .padding(horizontal = 10.dp, vertical = 5.dp),
                    )
                }
            }
            item { Spacer(modifier = Modifier.height(80.dp)) }
        }
    }
}
