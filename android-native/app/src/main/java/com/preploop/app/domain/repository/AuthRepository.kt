package com.preploop.app.domain.repository

import com.preploop.app.domain.model.User
import kotlinx.coroutines.flow.Flow

/**
 * Auth repository contract — mirrors the web's AuthContext.jsx methods.
 * Backend endpoints: POST /api/auth/login, /api/auth/register, /api/auth/logout
 */
interface AuthRepository {
    suspend fun login(email: String, password: String): Result<User>
    suspend fun signup(email: String, password: String, name: String): Result<User>
    suspend fun loginWithGoogle(): Result<User>
    suspend fun loginWithGithub(): Result<User>
    suspend fun refreshToken(): Result<Boolean>
    suspend fun logout()
    fun observeAuthState(): Flow<User?>
    fun isLoggedIn(): Boolean
}
