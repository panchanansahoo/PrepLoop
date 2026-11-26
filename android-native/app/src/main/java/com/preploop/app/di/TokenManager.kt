package com.preploop.app.di

import android.content.Context
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Thread-safe token and session cache backed by SharedPreferences
 * so OkHttp interceptors and ViewModels share persisted auth state.
 */
@Singleton
class TokenManager @Inject constructor(
    @ApplicationContext context: Context,
) {
    private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    @Volatile
    var accessToken: String? = prefs.getString(KEY_ACCESS_TOKEN, null)?.takeIf { it.isNotBlank() }
        private set

    @Volatile
    var refreshToken: String? = prefs.getString(KEY_REFRESH_TOKEN, null)?.takeIf { it.isNotBlank() }
        private set

    @Volatile
    var userJson: String? = prefs.getString(KEY_USER_JSON, null)?.takeIf { it.isNotBlank() }
        private set

    @Synchronized
    fun saveSession(accessToken: String, refreshToken: String?, userJson: String?) {
        val cleanAccess = accessToken.takeIf { it.isNotBlank() }
        val cleanRefresh = refreshToken?.takeIf { it.isNotBlank() }
        val cleanUser = userJson?.takeIf { it.isNotBlank() }
        this.accessToken = cleanAccess
        this.refreshToken = cleanRefresh
        this.userJson = cleanUser
        prefs.edit()
            .putString(KEY_ACCESS_TOKEN, cleanAccess)
            .putString(KEY_REFRESH_TOKEN, cleanRefresh)
            .putString(KEY_USER_JSON, cleanUser)
            .apply()
    }

    @Synchronized
    fun updateTokens(accessToken: String, refreshToken: String?) {
        val cleanAccess = accessToken.takeIf { it.isNotBlank() }
        val cleanRefresh = refreshToken?.takeIf { it.isNotBlank() } ?: this.refreshToken
        this.accessToken = cleanAccess
        this.refreshToken = cleanRefresh
        prefs.edit()
            .putString(KEY_ACCESS_TOKEN, cleanAccess)
            .putString(KEY_REFRESH_TOKEN, cleanRefresh)
            .apply()
    }

    @Synchronized
    fun updateUserJson(userJson: String) {
        val cleanUser = userJson.takeIf { it.isNotBlank() }
        this.userJson = cleanUser
        prefs.edit()
            .putString(KEY_USER_JSON, cleanUser)
            .apply()
    }

    @Synchronized
    fun clearSession() {
        accessToken = null
        refreshToken = null
        userJson = null
        prefs.edit().clear().apply()
    }

    private companion object {
        const val PREFS_NAME = "preploop_session"
        const val KEY_ACCESS_TOKEN = "access_token"
        const val KEY_REFRESH_TOKEN = "refresh_token"
        const val KEY_USER_JSON = "user_json"
    }
}
