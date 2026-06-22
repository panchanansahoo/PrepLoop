package com.preploop.app.domain.repository

import com.preploop.app.domain.model.DashboardData
import com.preploop.app.domain.model.Problem
import com.preploop.app.domain.model.Pattern

/**
 * Practice repository — covers DSA, SQL, and aptitude.
 * Backend endpoints: /api/dsa/... and /api/practice/...
 */
interface PracticeRepository {
    suspend fun getPatterns(): Result<List<Pattern>>
    suspend fun getProblems(patternId: String): Result<List<Problem>>
    suspend fun getProblem(id: String): Result<Problem>
    suspend fun submitSolution(problemId: String, code: String, language: String): Result<SubmissionResult>
    suspend fun getDashboardData(): Result<DashboardData>
}

data class SubmissionResult(
    val passed: Boolean,
    val testCasesPassed: Int,
    val totalTestCases: Int,
    val runtime: String?,
    val feedback: String?,
)
