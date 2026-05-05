/**
 * learningPathService.js
 *
 * Facade service that orchestrates modular learning path services.
 * Provides backward compatibility while delegating to specialized services:
 * - learningPathManagerService: Path definitions and retrieval
 * - learningProgressTrackerService: Progress tracking
 * - learningPathRecommenderService: Recommendations
 * - learningTheoryFramework: Pedagogical structure
 */

import pathManager from './learningPathManagerService.js';
import progressTracker from './learningProgressTrackerService.js';
import recommender from './learningPathRecommenderService.js';
import { generatePathObjectives } from './learningTheoryFramework.js';

class LearningPathService {
  /**
   * Get all available learning paths
   */
  getAllPaths() {
    return pathManager.getAllPaths();
  }

  /**
   * Get a specific learning path
   */
  getPath(pathId) {
    return pathManager.getPath(pathId);
  }

  /**
   * Recommend learning paths based on user profile
   */
  recommendPaths(userProfile = {}) {
    const result = recommender.recommendPaths(userProfile);
    return result.recommendations;
  }

  /**
   * Get comprehensive recommendations with detailed analysis
   */
  getDetailedRecommendations(userProfile = {}) {
    return recommender.recommendPaths(userProfile);
  }

  /**
   * Create user's learning path progress entry
   */
  createPathProgress(userId, pathId) {
    const path = this.getPath(pathId);
    if (!path) {
      throw new Error(`Path ${pathId} not found`);
    }
    return progressTracker.createPathProgress(userId, path);
  }

  /**
   * Update milestone progress
   */
  updateMilestoneProgress(pathProgress, milestoneIndex, problemsSolved) {
    return progressTracker.updateMilestoneProgress(pathProgress, milestoneIndex, problemsSolved)
      .pathProgress;
  }

  /**
   * Complete a milestone
   */
  completeMilestone(pathProgress, milestoneIndex) {
    return progressTracker.completeMilestone(pathProgress, milestoneIndex).pathProgress;
  }

  /**
   * Get next incomplete milestone
   */
  getNextIncompleteMilestone(pathProgress) {
    return progressTracker.getNextIncompleteMilestone(pathProgress);
  }

  /**
   * Get path statistics and insights
   */
  getPathStats(pathProgress) {
    return progressTracker.getPathStats(pathProgress);
  }

  /**
   * Estimate time to complete path
   */
  estimateTimeToCompletion(pathProgress) {
    return progressTracker.estimateTimeToCompletion(pathProgress);
  }

  /**
   * Generate streak bonus for consistent practice
   */
  calculateStreakBonus(pathProgress) {
    return progressTracker.calculateStreakBonus(pathProgress);
  }

  /**
   * Get path learning objectives based on pedagogical framework
   */
  getPathObjectives(pathId) {
    const path = this.getPath(pathId);
    if (!path) {
      throw new Error(`Path ${pathId} not found`);
    }
    return generatePathObjectives(path);
  }

  /**
   * Recommend next path after current path completion
   */
  getNextRecommendedPath(currentPathId, completedPaths = [], userProfile = {}) {
    return recommender.recommendNextPath(currentPathId, completedPaths, userProfile);
  }

  /**
   * Get paths by role
   */
  getPathsByRole(role) {
    return recommender.recommendPathsByRole(role);
  }

  /**
   * Analyze performance gaps
   */
  analyzePerformanceGaps(userPerformance = {}) {
    return recommender.analyzePerfomanceGaps(userPerformance);
  }

  /**
   * Get paths by category
   */
  getPathsByCategory(category) {
    return pathManager.getPathsByCategory(category);
  }

  /**
   * Get paths by difficulty
   */
  getPathsByDifficulty(difficulty) {
    return pathManager.getPathsByDifficulty(difficulty);
  }

  /**
   * Get public leaderboard for path (placeholder for DB implementation)
   */
  getPathLeaderboard(pathId, topN = 10) {
    return {
      pathId,
      topN,
      leaderboard: [],
      timestamp: new Date().toISOString(),
    };
  }
}

export default new LearningPathService();
