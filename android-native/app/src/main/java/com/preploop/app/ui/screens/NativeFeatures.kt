package com.preploop.app.ui.screens

import android.net.Uri
import android.os.SystemClock
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.preploop.app.PrepLoopSession
import com.preploop.app.objects
import com.preploop.app.text
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject

@Composable
fun FeaturePage(title: String, onBack: () -> Unit, content: @Composable () -> Unit) {
    Column(
        Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .verticalScroll(rememberScrollState())
            .imePadding()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        TextButton(onClick = onBack) { Text("Back") }
        Text(title, style = MaterialTheme.typography.headlineMedium)
        content()
    }
}

@Composable
fun <T : Any> LoadFeature(key: Any, load: suspend () -> T, content: @Composable (T) -> Unit) {
    var result by remember(key) { mutableStateOf<T?>(null) }
    var error by remember(key) { mutableStateOf<String?>(null) }
    var attempt by remember(key) { mutableIntStateOf(0) }
    LaunchedEffect(key, attempt) {
        error = null
        try {
            result = load()
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (failure: Exception) {
            error = failure.message ?: "Could not load this page."
        }
    }
    val failure = error
    val data = result
    when {
        failure != null -> {
            Text(failure, color = MaterialTheme.colorScheme.error)
            TextButton(onClick = { attempt++ }) { Text("Try again") }
        }
        data != null -> content(data)
        else -> CircularProgressIndicator()
    }
}

@Composable
fun OpenWebFeature(title: String, path: String, onBack: () -> Unit) {
    val uriHandler = LocalUriHandler.current
    var error by remember { mutableStateOf(false) }
    FeaturePage(title, onBack) {
        Text("Continue in your browser. Sign in there if prompted.")
        Button(onClick = {
            error = runCatching { uriHandler.openUri("https://preploop.me$path") }.isFailure
        }) { Text("Open $title") }
        if (error) Text("Could not open the browser.", color = MaterialTheme.colorScheme.error)
    }
}

@Composable
fun SignupPage(session: PrepLoopSession, onBack: () -> Unit) {
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }
    var registered by remember { mutableStateOf(false) }
    var busy by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val uriHandler = LocalUriHandler.current
    FeaturePage("Create account", onBack) {
        if (!registered) {
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Full name") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("Email") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Password") },
                supportingText = { Text("8+ chars with uppercase, lowercase, number, and symbol") },
                singleLine = true,
                visualTransformation = PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                modifier = Modifier.fillMaxWidth(),
            )
            Button(
                enabled = !busy && name.isNotBlank() && email.isNotBlank() && password.isNotBlank(),
                onClick = {
                    busy = true
                    message = ""
                    scope.launch {
                        try {
                            val response = session.signup(name, email, password)
                            registered = true
                            password = ""
                            message = response.text("message").ifBlank { "Account created. Check your email, then sign in." }
                        } catch (cancelled: CancellationException) {
                            throw cancelled
                        } catch (failure: Exception) {
                            message = failure.message ?: "Could not create your account."
                        } finally {
                            busy = false
                        }
                    }
                },
            ) { Text(if (busy) "Creating…" else "Create account") }
        }
        if (message.isNotBlank()) Text(message)
        if (!registered) TextButton(onClick = {
            if (runCatching { uriHandler.openUri("https://preploop.me/signup") }.isFailure) {
                message = "Could not open the browser."
            }
        }) { Text("Create account in browser") }
        if (registered) Button(onClick = onBack) { Text("Back to sign in") }
    }
}

@Composable
fun ForgotPasswordPage(session: PrepLoopSession, onBack: () -> Unit) {
    var email by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }
    var isError by remember { mutableStateOf(false) }
    var busy by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    FeaturePage("Reset password", onBack) {
        Text("Enter your email address and we will send you a password reset link.")
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            modifier = Modifier.fillMaxWidth(),
        )
        Button(
            enabled = !busy && email.isNotBlank(),
            onClick = {
                busy = true
                message = ""
                isError = false
                scope.launch {
                    try {
                        message = session.forgotPassword(email)
                    } catch (cancelled: CancellationException) {
                        throw cancelled
                    } catch (failure: Exception) {
                        isError = true
                        message = failure.message ?: "Could not send reset email."
                    } finally {
                        busy = false
                    }
                }
            },
        ) { Text(if (busy) "Sending…" else "Send reset link") }
        if (message.isNotBlank()) {
            Text(
                text = message,
                color = if (isError) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurface,
            )
        }
    }
}

@Composable
fun PatternProblems(session: PrepLoopSession, id: String, onBack: () -> Unit, onProblem: (String) -> Unit) {
    FeaturePage("Practice problems", onBack) {
        LoadFeature(id, { session.request("dsa/patterns/${Uri.encode(id)}") as JSONObject }) { data ->
            val patternTitle = data.optJSONObject("pattern")?.text("name").orEmpty()
            if (patternTitle.isNotBlank()) {
                Text(patternTitle, style = MaterialTheme.typography.titleLarge)
            }
            val problems = data.optJSONArray("problems")?.objects().orEmpty()
            if (problems.isEmpty()) Text("No problems are available for this pattern.")
            problems.forEach { problem ->
                TextButton(onClick = { onProblem(problem.text("id")) }, enabled = problem.text("id").isNotBlank()) {
                    Text(listOf(problem.text("title"), problem.text("difficulty")).filter { it.isNotBlank() }.joinToString(" · "))
                }
            }
        }
    }
}

@Composable
fun ProblemPage(session: PrepLoopSession, id: String, onBack: () -> Unit) {
    val uriHandler = LocalUriHandler.current
    var linkFailed by remember { mutableStateOf(false) }
    FeaturePage("Problem details", onBack) {
        LoadFeature(id, { session.request("dsa/problems/${Uri.encode(id)}") as JSONObject }) { response ->
            val problem = response.optJSONObject("problem") ?: response
            Text(problem.text("title"), style = MaterialTheme.typography.titleLarge)
            val difficulty = problem.text("difficulty")
            if (difficulty.isNotBlank()) Text(difficulty)
            val description = problem.text("description")
            if (description.isNotBlank()) {
                Text(android.text.Html.fromHtml(description, android.text.Html.FROM_HTML_MODE_COMPACT).toString())
            }
            Button(onClick = {
                linkFailed = runCatching { uriHandler.openUri("https://preploop.me/problems/${Uri.encode(id)}") }.isFailure
            }) { Text("Open code editor in browser") }
            if (linkFailed) Text("Could not open the browser.", color = MaterialTheme.colorScheme.error)
        }
    }
}

@Composable
fun HistoryPage(
    session: PrepLoopSession,
    onBack: () -> Unit,
    onOpenResult: (String) -> Unit = {},
) {
    FeaturePage("Interview history", onBack) {
        LoadFeature("interview-history", { session.request("ai/interview/history?limit=50") as JSONObject }) { data ->
            val interviews = data.optJSONArray("interviews")?.objects().orEmpty()
            if (interviews.isEmpty()) Text("No completed interviews yet.")
            interviews.forEach { interview ->
                val id = interview.text("id")
                val typeTitle = interview.text("interview_type").ifBlank { interview.text("type") }
                    .ifBlank { "technical" }
                    .replaceFirstChar { it.uppercaseChar() }
                val company = interview.text("company")
                val subtitle = listOf(
                    company.takeIf { it.isNotBlank() && it != "General" },
                    interview.text("difficulty").takeIf { it.isNotBlank() },
                    interview.text("completed_at").take(10).takeIf { it.isNotBlank() },
                    "${interview.optInt("overall_score")}%",
                ).filterNotNull().joinToString(" · ")
                Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text("$typeTitle interview", style = MaterialTheme.typography.titleMedium)
                    Text(subtitle)
                    if (id.isNotBlank()) {
                        TextButton(onClick = { onOpenResult(id) }) { Text("View details") }
                    }
                    HorizontalDivider()
                }
            }
        }
    }
}

@Composable
fun InterviewResultPage(session: PrepLoopSession, sessionId: String, onBack: () -> Unit) {
    FeaturePage("Interview summary", onBack) {
        LoadFeature("interview-result-$sessionId", {
            session.request("ai/interview/${Uri.encode(sessionId)}") as JSONObject
        }) { response ->
            val interview = response.optJSONObject("interview") ?: response
            val title = interview.text("stage")
                .ifBlank { interview.text("interview_type") }
                .ifBlank { "Technical" }
                .replaceFirstChar { it.uppercaseChar() }
            Text("$title interview", style = MaterialTheme.typography.titleLarge)
            val company = interview.text("company")
            val difficulty = interview.text("difficulty")
            val meta = listOf(company, difficulty).filter { it.isNotBlank() }.joinToString(" · ")
            if (meta.isNotBlank()) Text(meta)

            val overall = if (!interview.isNull("overall_score")) interview.optInt("overall_score") else interview.optInt("score")
            Text("Overall score: $overall%")
            if (!interview.isNull("communication_score")) Text("Communication: ${interview.optInt("communication_score")}%")
            if (!interview.isNull("technical_score")) Text("Technical: ${interview.optInt("technical_score")}%")
            if (!interview.isNull("problem_solving_score")) Text("Problem solving: ${interview.optInt("problem_solving_score")}%")
            val feedback = interview.text("feedback")
            if (feedback.isNotBlank()) {
                Text("Feedback", style = MaterialTheme.typography.titleMedium)
                Text(feedback)
            }
        }
    }
}

@Composable
fun AnalyticsPage(session: PrepLoopSession, onBack: () -> Unit) {
    FeaturePage("Interview analytics", onBack) {
        LoadFeature("interview-analytics", { session.request("analytics/overview") as JSONObject }) { data ->
            val total = data.optInt("totalInterviews")
            if (total == 0) {
                Text("Complete your first mock interview to see analytics.")
            } else {
                Text("Total interviews: $total", style = MaterialTheme.typography.titleMedium)
                Text("Average overall score: ${data.optInt("averageOverallScore")}%")
                Text("Best score: ${data.optInt("bestScore")}%")
                Text("Communication avg: ${data.optInt("averageCommunicationScore")}%")
                Text("Technical avg: ${data.optInt("averageTechnicalScore")}%")
                Text("Problem solving avg: ${data.optInt("averageProblemSolvingScore")}%")
                Text("Current streak: ${data.optInt("currentStreak")} days (Best: ${data.optInt("bestStreak")})")
                Text("Consistency: ${data.optInt("consistency")}%")
                val byType = data.optJSONObject("byType")
                if (byType != null && byType.length() > 0) {
                    HorizontalDivider()
                    Text("By interview type", style = MaterialTheme.typography.titleMedium)
                    val keys = byType.keys()
                    while (keys.hasNext()) {
                        val key = keys.next()
                        val item = byType.optJSONObject(key) ?: continue
                        Text("${key.replaceFirstChar { it.uppercaseChar() }}: ${item.optInt("count")} sessions · ${item.optInt("avg")}% avg")
                    }
                }
            }
        }
    }
}

@Composable
fun WalletPage(session: PrepLoopSession, onBack: () -> Unit) {
    FeaturePage("Coin wallet", onBack) {
        LoadFeature("coin-balance", { session.request("coins/balance") as JSONObject }) { balance ->
            Text("${balance.optInt("coins", balance.optInt("balance"))} coins", style = MaterialTheme.typography.titleLarge)
        }
        Text("Recent transactions", style = MaterialTheme.typography.titleMedium)
        LoadFeature("coin-history", { session.request("coins/history?limit=20") }) { raw ->
            val transactions = when (raw) {
                is JSONArray -> raw.objects()
                is JSONObject -> raw.optJSONArray("items")?.objects().orEmpty()
                else -> emptyList()
            }
            if (transactions.isEmpty()) Text("No transactions yet.")
            transactions.forEach { transaction ->
                val label = transaction.text("description").ifBlank { transaction.text("displayType") }.ifBlank { "Transaction" }
                val txnType = transaction.text("displayType").ifBlank { transaction.text("type") }.lowercase()
                val sign = if (txnType == "spend" || txnType == "redeem") "-" else "+"
                val date = transaction.text("created_at").take(10)
                val suffix = if (date.isNotBlank()) " · $date" else ""
                Text("$label · $sign${transaction.optInt("amount")} coins$suffix")
            }
        }
    }
}

@Composable
fun SettingsPage(session: PrepLoopSession, onBack: () -> Unit) {
    FeaturePage("Settings", onBack) {
        LoadFeature("account-settings", {
            val response = session.request("user/settings") as JSONObject
            check(!response.optBoolean("degraded")) { "Settings are temporarily unavailable." }
            response.optJSONObject("settings") ?: response
        }) { settings ->
            var name by remember(settings) { mutableStateOf(settings.text("fullName").ifBlank { settings.text("full_name") }) }
            var emailNotifications by remember(settings) { mutableStateOf(settings.optBoolean("emailNotifications")) }
            var practiceReminders by remember(settings) { mutableStateOf(settings.optBoolean("practiceReminders")) }
            var weeklyReport by remember(settings) { mutableStateOf(settings.optBoolean("weeklyReport")) }
            var message by remember { mutableStateOf("") }
            var isError by remember { mutableStateOf(false) }
            var busy by remember { mutableStateOf(false) }
            val scope = rememberCoroutineScope()
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Full name") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("Email notifications")
                Switch(checked = emailNotifications, onCheckedChange = { emailNotifications = it })
            }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("Practice reminders")
                Switch(checked = practiceReminders, onCheckedChange = { practiceReminders = it })
            }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("Weekly report")
                Switch(checked = weeklyReport, onCheckedChange = { weeklyReport = it })
            }
            Button(enabled = name.isNotBlank() && !busy, onClick = {
                busy = true
                message = ""
                isError = false
                scope.launch {
                    try {
                        val trimmedName = name.trim()
                        val saved = session.request(
                            "user/settings",
                            "PUT",
                            JSONObject()
                                .put("fullName", trimmedName)
                                .put("emailNotifications", emailNotifications)
                                .put("practiceReminders", practiceReminders)
                                .put("weeklyReport", weeklyReport),
                        ) as JSONObject
                        check(!saved.optBoolean("degraded")) { "Some settings could not be saved." }
                        val user = session.user
                        if (user != null) {
                            session.updateAccount(
                                JSONObject(user.toString())
                                    .put("fullName", trimmedName)
                                    .put("full_name", trimmedName),
                            )
                        }
                        message = "Settings saved."
                    } catch (cancelled: CancellationException) {
                        throw cancelled
                    } catch (failure: Exception) {
                        isError = true
                        message = failure.message ?: "Could not save settings."
                    } finally {
                        busy = false
                    }
                }
            }) { Text(if (busy) "Saving…" else "Save changes") }
            if (message.isNotBlank()) {
                Text(
                    text = message,
                    color = if (isError) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurface,
                )
            }
        }
    }
}

private fun JSONObject.interviewQuestion(): String {
    val result = opt("question") ?: opt("firstQuestion")
    return when (result) {
        is JSONObject -> result.text("question").ifBlank { result.text("title") }.ifBlank { result.text("text") }
        is String -> result
        else -> ""
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun InterviewPage(session: PrepLoopSession, onBack: () -> Unit) {
    var selectedType by remember { mutableStateOf("technical") }
    var selectedDifficulty by remember { mutableStateOf("medium") }
    var question by remember { mutableStateOf("") }
    var answer by remember { mutableStateOf("") }
    var responses by remember { mutableStateOf<List<JSONObject>>(emptyList()) }
    var usedProblemIds by remember { mutableStateOf(JSONArray()) }
    var startedAt by remember { mutableLongStateOf(0L) }
    var result by remember { mutableStateOf<JSONObject?>(null) }
    var error by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    val interviewTypes = listOf("technical", "behavioral", "system-design", "coding", "dsa", "mixed")
    val difficulties = listOf("easy", "medium", "hard")

    fun submit(step: String) {
        if (busy) return
        busy = true
        error = ""
        scope.launch {
            try {
                val body = JSONObject().put("type", selectedType).put("difficulty", selectedDifficulty)
                val pending = if (step == "start") emptyList()
                else responses + JSONObject().put("question", question).put("answer", answer.trim())
                if (step == "complete") {
                    val elapsedSec = if (startedAt > 0L) maxOf(0L, (SystemClock.elapsedRealtime() - startedAt) / 1000) else 0L
                    body.put("responses", JSONArray(pending)).put("duration", elapsedSec)
                    result = (session.request("ai/interview/complete", "POST", body) as JSONObject).optJSONObject("scores")
                        ?: throw IllegalStateException("The server did not return interview scores.")
                } else {
                    body.put("previousResponses", JSONArray(pending)).put("usedProblemIds", usedProblemIds)
                    val data = session.request("ai/interview/$step", "POST", body) as JSONObject
                    val next = data.interviewQuestion()
                    check(next.isNotBlank()) { "The server did not return a question." }
                    question = next
                    answer = ""
                    responses = pending
                    usedProblemIds = data.optJSONArray("usedProblemIds") ?: JSONArray()
                    if (step == "start") startedAt = SystemClock.elapsedRealtime()
                }
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (failure: Exception) {
                error = failure.message ?: "Could not continue the interview."
            } finally {
                busy = false
            }
        }
    }

    FeaturePage("AI mock interview", onBack) {
        val scores = result
        when {
            scores != null -> {
                Text("Interview complete", style = MaterialTheme.typography.titleLarge)
                Text("Overall score: ${scores.optInt("overall")}%")
                Text("Technical score: ${scores.optInt("technical")}%")
                Text("Communication score: ${scores.optInt("communication")}%")
                Text("Problem solving score: ${scores.optInt("problemSolving")}%")
                Button(onClick = {
                    question = ""
                    answer = ""
                    responses = emptyList()
                    usedProblemIds = JSONArray()
                    result = null
                    error = ""
                }) { Text("Start another interview") }
            }
            question.isBlank() -> {
                Text("Practice a mock interview with typed answers and AI evaluation. Starting uses interview coins.")
                Text("Interview type", style = MaterialTheme.typography.titleSmall)
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    interviewTypes.forEach { type ->
                        FilterChip(
                            selected = selectedType == type,
                            onClick = { selectedType = type },
                            label = { Text(type.replace('-', ' ').replaceFirstChar { it.uppercaseChar() }) },
                        )
                    }
                }
                Text("Difficulty", style = MaterialTheme.typography.titleSmall)
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    difficulties.forEach { diff ->
                        FilterChip(
                            selected = selectedDifficulty == diff,
                            onClick = { selectedDifficulty = diff },
                            label = { Text(diff.replaceFirstChar { it.uppercaseChar() }) },
                        )
                    }
                }
                Button(enabled = !busy, onClick = { submit("start") }) { Text("Start interview") }
            }
            else -> {
                Text("Question ${responses.size + 1}", style = MaterialTheme.typography.titleMedium)
                Text(question)
                OutlinedTextField(
                    value = answer,
                    onValueChange = { answer = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Your answer") },
                    minLines = 3,
                    enabled = !busy,
                )
                if (responses.size < 9) {
                    Button(enabled = answer.isNotBlank() && !busy, onClick = { submit("next-question") }) { Text("Next question") }
                }
                TextButton(enabled = answer.isNotBlank() && !busy, onClick = { submit("complete") }) { Text("Finish and get scores") }
            }
        }
        if (busy) CircularProgressIndicator()
        if (error.isNotBlank()) Text(error, color = MaterialTheme.colorScheme.error)
    }
}
