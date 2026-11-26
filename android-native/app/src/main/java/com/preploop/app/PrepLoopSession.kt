package com.preploop.app

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.preploop.app.di.TokenManager
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import org.json.JSONTokener

@HiltViewModel
class PrepLoopSession @Inject constructor(
    private val client: OkHttpClient,
    private val tokenManager: TokenManager,
) : ViewModel() {
    var user by mutableStateOf<JSONObject?>(null)
        private set
    var isCheckingSession by mutableStateOf(false)
        private set
    private val refreshLock = Mutex()

    init {
        val cachedUser = tokenManager.userJson?.let { raw -> runCatching { JSONObject(raw) }.getOrNull() }
        if (tokenManager.accessToken != null || tokenManager.refreshToken != null) {
            if (cachedUser != null) {
                user = cachedUser
            }
            isCheckingSession = true
            viewModelScope.launch {
                try {
                    verifySession()
                } catch (cancelled: CancellationException) {
                    throw cancelled
                } finally {
                    isCheckingSession = false
                }
            }
        }
    }

    suspend fun verifySession(): Boolean {
        if (tokenManager.accessToken == null && tokenManager.refreshToken == null) {
            user = null
            return false
        }
        return try {
            val response = request("user/profile") as JSONObject
            val account = response.optJSONObject("user") ?: response
            if (account.text("id").isBlank() && account.text("email").isBlank()) {
                tokenManager.clearSession()
                user = null
                false
            } else {
                tokenManager.updateUserJson(account.toString())
                user = account
                true
            }
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (error: ApiException) {
            if (error.status in listOf(400, 401, 403)) {
                tokenManager.clearSession()
                user = null
            }
            false
        } catch (_: java.io.IOException) {
            // Preserve cached session on transient offline startup if we have both token & cached profile
            user != null && tokenManager.accessToken != null
        }
    }

    suspend fun login(email: String, password: String) {
        val normalizedEmail = email.trim().lowercase()
        check(normalizedEmail.isNotBlank() && password.isNotBlank()) { "Email and password are required." }
        val credentials = JSONObject().put("email", normalizedEmail).put("password", password)
        val response = send("auth/login", "POST", credentials) as JSONObject
        val account = response.optJSONObject("user")
        val token = response.optString("token")
        check(token.isNotBlank() && account != null) { "The server did not return a sign-in session." }
        val refresh = response.optString("refreshToken").ifBlank { null }
        tokenManager.saveSession(token, refresh, account.toString())
        user = account
    }

    suspend fun signup(name: String, email: String, password: String): JSONObject =
        send(
            "auth/signup",
            "POST",
            JSONObject()
                .put("fullName", name.trim())
                .put("email", email.trim().lowercase())
                .put("password", password),
        ) as JSONObject

    suspend fun forgotPassword(email: String): String {
        val response = send(
            "auth/forgot-password",
            "POST",
            JSONObject().put("email", email.trim().lowercase()),
        ) as JSONObject
        return response.text("message").ifBlank {
            "If an account with that email exists, a password reset link has been sent."
        }
    }

    fun logout() {
        val token = tokenManager.accessToken
        tokenManager.clearSession()
        user = null
        if (token == null) return
        viewModelScope.launch {
            try {
                send("auth/logout", "POST", JSONObject(), token)
            } catch (_: java.io.IOException) {
                // The local session has already been cleared.
            }
        }
    }

    fun updateAccount(account: JSONObject) {
        user = account
        tokenManager.updateUserJson(account.toString())
    }

    suspend fun request(path: String, method: String = "GET", body: JSONObject? = null): Any {
        val token = tokenManager.accessToken
        if (token == null) {
            if (tokenManager.refreshToken == null) {
                throw ApiException(401, "Please sign in again.")
            }
            refreshAccessToken(previousToken = null)
            return send(path, method, body)
        }
        try {
            return send(path, method, body)
        } catch (error: ApiException) {
            if (error.status != 401) throw error
        }
        refreshAccessToken(previousToken = token)
        return send(path, method, body)
    }

    private suspend fun refreshAccessToken(previousToken: String?): String = refreshLock.withLock {
        val current = tokenManager.accessToken
        if (!current.isNullOrBlank() && current != previousToken) {
            return@withLock current
        }
        try {
            val refresh = tokenManager.refreshToken ?: throw ApiException(401, "Please sign in again.")
            val response = send("auth/refresh", "POST", JSONObject().put("refreshToken", refresh)) as JSONObject
            val newToken = response.optString("token")
            if (newToken.isBlank()) throw ApiException(401, "Please sign in again.")
            if (tokenManager.refreshToken != refresh || (previousToken != null && tokenManager.accessToken != previousToken)) {
                throw ApiException(401, "Please sign in again.")
            }
            tokenManager.updateTokens(newToken, response.optString("refreshToken").ifBlank { null })
            newToken
        } catch (error: ApiException) {
            if (error.status in listOf(400, 401, 403) && tokenManager.accessToken == previousToken) {
                tokenManager.clearSession()
                user = null
            }
            throw error
        }
    }

    private suspend fun send(
        path: String,
        method: String,
        body: JSONObject?,
        explicitToken: String? = null,
    ): Any =
        withContext(Dispatchers.IO) {
            val request = Request.Builder()
                .url("${BuildConfig.API_BASE_URL}/api/$path")
                .header("Accept", "application/json")
            if (explicitToken != null) {
                request.header("Authorization", "Bearer $explicitToken")
            }
            val effectiveBody = if (body == null && method in listOf("POST", "PUT", "PATCH")) JSONObject() else body
            val payload = effectiveBody?.toString()?.toRequestBody("application/json".toMediaType())
            client.newCall(request.method(method, payload).build()).execute().use { response ->
                val raw = response.body?.string().orEmpty()
                val data = if (raw.isBlank()) JSONObject() else runCatching { JSONTokener(raw).nextValue() }.getOrNull()
                if (!response.isSuccessful) {
                    val message = (data as? JSONObject)?.let { it.optString("error").ifBlank { it.optString("message") } }
                    throw ApiException(response.code, message?.takeIf { it.isNotBlank() } ?: "Request failed (${response.code}).")
                }
                data ?: throw java.io.IOException("The server returned an unreadable response.")
            }
        }
}

private class ApiException(val status: Int, message: String) : java.io.IOException(message)

fun JSONArray.objects(): List<JSONObject> = (0 until length()).mapNotNull { optJSONObject(it) }

fun JSONObject.text(key: String): String = if (isNull(key)) "" else optString(key)
