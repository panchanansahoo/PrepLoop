/**
 * learningPathRecommenderService.js
 *
 * Recommends learning paths based on user profile and performance.
 * Responsibilities:
 * - Analyze user skill level and weaknesses
 * - Generate personalized path recommendations
 * - Prioritize paths by relevance
 * - Track recommendation effectiveness
 */

import pathManager from './learningPathManagerService.js';

export class LearningPathRecommenderService {
  /**
   * Recommend learning paths based on user profile
   */
  recommendPaths(userProfile = {}) {
    const {
      skillLevel = 'beginner',
      weaknessAreas = {},
      attemptedTopics = [],
      completedPaths = [],
      currentRole = 'software-engineer',
    } = userProfile;

    const recommendations = [];

    // 1. Recommend based on skill level
    const pathsByDifficulty = {
      beginner: ['arrays-foundations'],
      intermediate: ['trees-basics', 'dynamic-programming-intro'],
      advanced: ['graphs-algorithms', 'system-design-junior'],
      expert: ['system-design-junior'],
    };

    const basePaths = pathsByDifficulty[skillLevel] || ['arrays-foundations'];

    // 2. Boost recommendations for weak areas
    const weakTopics = Object.keys(weaknessAreas).filter((topic) => weaknessAreas[topic] > 0.5);

    // Add weak area paths with HIGH priority
    for (const topic of weakTopics) {
      const topicPaths = pathManager.getPathsByTopic(topic);
      for (const path of topicPaths) {
        if (
          !recommendations.find((r) => r.pathId === path.id) &&
          !completedPaths.includes(path.id)
        ) {
          recommendations.push({
            pathId: path.id,
            path,
            reason: `Strengthen weak area: ${topic}`,
            priority: 'high',
            weakness: weaknessAreas[topic],
            score: 90 + weaknessAreas[topic] * 10,
          });
        }
      }
    }

    // 3. Add prerequisite-satisfied base paths with MEDIUM priority
    for (const pathId of basePaths) {
      const path = pathManager.getPath(pathId);
      if (path && !recommendations.find((r) => r.pathId === pathId) && !completedPaths.includes(pathId)) {
        const prereqsMet = pathManager.checkPrerequisites(pathId, completedPaths);
        if (prereqsMet) {
          recommendations.push({
            pathId,
            path,
            reason: 'Recommended for your skill level',
            priority: 'medium',
            score: 60,
          });
        }
      }
    }

    // 4. Add dependent paths for completed paths (progression) with MEDIUM priority
    for (const completedPathId of completedPaths) {
      const dependents = pathManager.getDependentPaths(completedPathId);
      for (const path of dependents) {
        if (!recommendations.find((r) => r.pathId === path.id)) {
          recommendations.push({
            pathId: path.id,
            path,
            reason: `Progress after completing ${pathManager.getPath(completedPathId).title}`,
            priority: 'medium',
            score: 70,
          });
        }
      }
    }

    // 5. Sort by priority and score
    recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return (b.score || 0) - (a.score || 0);
    });

    return {
      recommendations: recommendations.slice(0, 5), // Top 5 recommendations
      totalAvailable: recommendations.length,
      userProfile: {
        skillLevel,
        completedPaths: completedPaths.length,
        weakAreasCount: weakTopics.length,
      },
    };
  }

  /**
   * Recommend next path based on current progress
   */
  recommendNextPath(currentPathId, completedPaths = [], userProfile = {}) {
    const currentPath = pathManager.getPath(currentPathId);
    if (!currentPath) {
      throw new Error(`Path ${currentPathId} not found`);
    }

    // Check for dependent paths
    const dependents = pathManager.getDependentPaths(currentPathId);
    const incompleteDependents = dependents.filter((path) => !completedPaths.includes(path.id));

    if (incompleteDependents.length > 0) {
      return {
        recommended: true,
        nextPathId: incompleteDependents[0].id,
        path: incompleteDependents[0],
        reason: 'Natural progression from completed path',
        type: 'progression',
      };
    }

    // Otherwise, use general recommendations
    const allRecommendations = this.recommendPaths({
      ...userProfile,
      completedPaths: [...completedPaths, currentPathId],
    });

    if (allRecommendations.recommendations.length > 0) {
      const nextRec = allRecommendations.recommendations[0];
      return {
        recommended: true,
        nextPathId: nextRec.pathId,
        path: nextRec.path,
        reason: nextRec.reason,
        type: 'skill-based',
      };
    }

    return {
      recommended: false,
      reason: 'All recommended paths completed',
      type: 'completion',
    };
  }

  /**
   * Get path recommendations by role
   */
  recommendPathsByRole(role) {
    const rolePathMap = {
      'junior-developer': ['arrays-foundations', 'trees-basics', 'dynamic-programming-intro'],
      'mid-level-engineer': ['graphs-algorithms', 'system-design-junior'],
      'senior-engineer': ['system-design-junior'],
      'data-scientist': ['arrays-foundations', 'dynamic-programming-intro'],
      'competitive-programmer': ['arrays-foundations', 'trees-basics', 'graphs-algorithms', 'dynamic-programming-intro'],
    };

    const pathIds = rolePathMap[role] || [];
    return pathIds.map((id) => pathManager.getPath(id)).filter(Boolean);
  }

  /**
   * Analyze which topics need improvement based on performance
   */
  analyzePerfomanceGaps(userPerformance = {}) {
    // userPerformance: { topicId: score (0-100), ... }
    const gaps = [];

    Object.entries(userPerformance).forEach(([topic, score]) => {
      if (score < 50) {
        gaps.push({
          topic,
          score,
          severity: score < 25 ? 'critical' : 'high',
          recommendedAction: 'Review path with theory focus',
        });
      } else if (score < 75) {
        gaps.push({
          topic,
          score,
          severity: 'medium',
          recommendedAction: 'Practice more problems',
        });
      }
    });

    return gaps.sort((a, b) => a.score - b.score);
  }

  /**
   * Calculate recommendation score based on multiple factors
   */
  calculateRecommendationScore(path, userProfile, performanceGaps) {
    let score = 0;

    // Base score for path difficulty relative to skill
    const difficultyScores = { beginner: 20, intermediate: 40, advanced: 60, expert: 80 };
    score += difficultyScores[path.difficulty] || 40;

    // Boost if path addresses weak area
    if (userProfile.weaknessAreas) {
      for (const topic of path.topics) {
        if (userProfile.weaknessAreas[topic] > 0.5) {
          score += 30;
        }
      }
    }

    // Reduce if path is already completed
    if (userProfile.completedPaths && userProfile.completedPaths.includes(path.id)) {
      score -= 100;
    }

    return Math.max(0, score);
  }
}

export default new LearningPathRecommenderService();
