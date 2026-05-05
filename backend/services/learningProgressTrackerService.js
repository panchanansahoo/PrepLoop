/**
 * learningProgressTrackerService.js
 *
 * Manages user progress through learning paths.
 * Responsibilities:
 * - Track path progress
 * - Update milestone completion
 * - Calculate completion statistics
 * - Estimate time to completion
 */

import { calculateMasteryLevel, getStageFromProgress } from './learningTheoryFramework.js';

export class LearningProgressTrackerService {
  /**
   * Create user's learning path progress entry
   */
  createPathProgress(userId, path) {
    if (!path || !path.id) {
      throw new Error('Invalid path provided');
    }

    return {
      userId,
      pathId: path.id,
      title: path.title,
      startedAt: new Date().toISOString(),
      completedAt: null,
      completionPercentage: 0,
      milestoneProgress: path.milestones.map((m) => ({
        name: m.name,
        stage: m.stage || 'PRACTICE',
        problemCount: m.problems,
        completed: 0,
        status: 'not_started',
        createdAt: new Date().toISOString(),
      })),
      estimatedHours: path.estimatedHours,
      totalProblemsSolved: 0,
      totalProblemsToSolve: path.milestones.reduce((sum, m) => sum + m.problems, 0),
      masteryLevel: 'Not Started',
    };
  }

  /**
   * Update milestone progress
   */
  updateMilestoneProgress(pathProgress, milestoneIndex, problemsSolved) {
    if (milestoneIndex < 0 || milestoneIndex >= pathProgress.milestoneProgress.length) {
      throw new Error('Invalid milestone index');
    }

    const milestone = pathProgress.milestoneProgress[milestoneIndex];
    const previousCompleted = milestone.completed;
    milestone.completed = Math.min(problemsSolved, milestone.problemCount);
    milestone.status =
      milestone.completed === milestone.problemCount
        ? 'completed'
        : milestone.completed > 0
          ? 'in_progress'
          : 'not_started';

    // Recalculate overall progress
    this._recalculateProgress(pathProgress);

    return {
      pathProgress,
      delta: milestone.completed - previousCompleted,
      milestoneName: milestone.name,
    };
  }

  /**
   * Mark milestone as completed
   */
  completeMilestone(pathProgress, milestoneIndex) {
    if (milestoneIndex < 0 || milestoneIndex >= pathProgress.milestoneProgress.length) {
      throw new Error('Invalid milestone index');
    }

    const milestone = pathProgress.milestoneProgress[milestoneIndex];
    return this.updateMilestoneProgress(pathProgress, milestoneIndex, milestone.problemCount);
  }

  /**
   * Mark milestone as not started
   */
  resetMilestone(pathProgress, milestoneIndex) {
    if (milestoneIndex < 0 || milestoneIndex >= pathProgress.milestoneProgress.length) {
      throw new Error('Invalid milestone index');
    }

    return this.updateMilestoneProgress(pathProgress, milestoneIndex, 0);
  }

  /**
   * Get next incomplete milestone
   */
  getNextIncompleteMilestone(pathProgress) {
    return pathProgress.milestoneProgress.find((m) => m.status !== 'completed') || null;
  }

  /**
   * Get milestone statistics
   */
  getMilestoneStats(pathProgress) {
    const total = pathProgress.milestoneProgress.length;
    const completed = pathProgress.milestoneProgress.filter(
      (m) => m.status === 'completed',
    ).length;
    const inProgress = pathProgress.milestoneProgress.filter(
      (m) => m.status === 'in_progress',
    ).length;
    const notStarted = pathProgress.milestoneProgress.filter(
      (m) => m.status === 'not_started',
    ).length;

    return { total, completed, inProgress, notStarted };
  }

  /**
   * Get path statistics
   */
  getPathStats(pathProgress) {
    const { total, completed, inProgress } = this.getMilestoneStats(pathProgress);

    const timeSpent = pathProgress.startedAt
      ? Math.floor((new Date() - new Date(pathProgress.startedAt)) / 3600000) // hours
      : 0;

    const problemsPerHour = timeSpent > 0 ? (pathProgress.totalProblemsSolved / timeSpent).toFixed(2) : 0;

    return {
      pathTitle: pathProgress.title,
      pathId: pathProgress.pathId,
      completionPercentage: pathProgress.completionPercentage,
      masteryLevel: pathProgress.masteryLevel,
      totalProblemsSolved: pathProgress.totalProblemsSolved,
      totalProblemsRequired: pathProgress.totalProblemsToSolve,
      milestonesCompleted: completed,
      milestonesInProgress: inProgress,
      totalMilestones: total,
      estimatedHours: pathProgress.estimatedHours,
      timeSpentHours: timeSpent,
      startedAt: pathProgress.startedAt,
      completedAt: pathProgress.completedAt,
      problemsPerHour,
      currentStage: getStageFromProgress(completed, total),
    };
  }

  /**
   * Estimate time to complete path
   */
  estimateTimeToCompletion(pathProgress) {
    const stats = this.getPathStats(pathProgress);
    const { completionPercentage, estimatedHours, timeSpentHours } = stats;

    if (completionPercentage === 0) {
      return estimatedHours; // No progress yet
    }

    if (completionPercentage === 100) {
      return 0; // Already complete
    }

    // Linear projection based on current pace
    const ratePercentPerHour = completionPercentage / timeSpentHours;
    const remainingPercentage = 100 - completionPercentage;
    const estimatedRemainingHours = remainingPercentage / ratePercentPerHour;

    return Math.round(estimatedRemainingHours);
  }

  /**
   * Calculate streak bonus for consistent practice
   */
  calculateStreakBonus(pathProgress) {
    if (!pathProgress.startedAt) return 0;

    const startDate = new Date(pathProgress.startedAt);
    const today = new Date();
    const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

    // Assuming ~2 problems per day for consistent streak
    const expectedProblems = daysSinceStart * 2;
    const actualProblems = pathProgress.totalProblemsSolved;

    if (actualProblems >= expectedProblems) {
      // User is on pace or ahead
      return Math.floor((actualProblems / expectedProblems) * 100); // 100-200+ points
    }

    return 0;
  }

  /**
   * Get progress by stage
   */
  getProgressByStage(pathProgress) {
    const stages = {};

    pathProgress.milestoneProgress.forEach((milestone) => {
      const stage = milestone.stage || 'PRACTICE';
      if (!stages[stage]) {
        stages[stage] = { total: 0, completed: 0, problems: 0 };
      }

      stages[stage].total += 1;
      stages[stage].problems += milestone.problemCount;

      if (milestone.status === 'completed') {
        stages[stage].completed += 1;
      }
    });

    // Calculate percentages
    Object.keys(stages).forEach((stage) => {
      stages[stage].percentage = Math.round(
        (stages[stage].completed / stages[stage].total) * 100,
      );
    });

    return stages;
  }

  /**
   * Private helper to recalculate progress
   */
  _recalculateProgress(pathProgress) {
    const totalSolved = pathProgress.milestoneProgress.reduce((sum, m) => sum + m.completed, 0);
    const totalRequired = pathProgress.milestoneProgress.reduce(
      (sum, m) => sum + m.problemCount,
      0,
    );

    pathProgress.totalProblemsSolved = totalSolved;
    pathProgress.completionPercentage = Math.round((totalSolved / totalRequired) * 100);
    pathProgress.masteryLevel = calculateMasteryLevel(pathProgress.completionPercentage).name;

    // Mark as completed if all problems solved
    if (pathProgress.completionPercentage === 100 && !pathProgress.completedAt) {
      pathProgress.completedAt = new Date().toISOString();
    }
  }
}

export default new LearningProgressTrackerService();
