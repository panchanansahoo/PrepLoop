package com.preploop.app.di

import com.preploop.app.BuildConfig
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

/**
 * Hilt module providing networking dependencies.
 * Mirrors the web's axios instance with baseURL and auth interceptor.
 */
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideMoshi(): Moshi = Moshi.Builder()
        .addLast(KotlinJsonAdapterFactory())
        .build()

    @Provides
    @Singleton
    fun provideOkHttpClient(tokenManager: TokenManager): OkHttpClient {
        val logging = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG)
                HttpLoggingInterceptor.Level.BASIC
            else
                HttpLoggingInterceptor.Level.NONE
        }

        return OkHttpClient.Builder()
            .addInterceptor { chain ->
                val original = chain.request()
                val path = original.url.encodedPath
                val isPublicAuth = path.endsWith("/api/auth/login") ||
                    path.endsWith("/api/auth/signup") ||
                    path.endsWith("/api/auth/register") ||
                    path.endsWith("/api/auth/refresh") ||
                    path.endsWith("/api/auth/forgot-password")

                val builder = original.newBuilder()
                if (original.header("Accept") == null) {
                    builder.header("Accept", "application/json")
                }
                val token = tokenManager.accessToken
                if (!isPublicAuth && original.header("Authorization") == null && !token.isNullOrBlank()) {
                    builder.header("Authorization", "Bearer $token")
                }
                chain.proceed(builder.build())
            }
            .addInterceptor(logging)
            .followRedirects(false)
            .followSslRedirects(false)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(client: OkHttpClient, moshi: Moshi): Retrofit =
        Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL + "/api/")
            .client(client)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
}
