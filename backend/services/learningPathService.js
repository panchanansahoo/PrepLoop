/**
 * learningPathService.js
 * 
 * Manages learning paths for users:
 * - Predefined learning paths (arrays, trees, graphs, etc.)
 * - User progress tracking through paths
 * - Path recommendations based on skill level
 * - Completion metrics and rewards
 */

export default class LearningPathService {
  constructor() {
    // Predefined learning path templates
    this.pathTemplates = {
      'arrays-foundations': {
        id: 'arrays-foundations',
        title: 'Array Fundamentals',
        description: 'Master basic array operations and patterns',
        difficulty: 'easy',
        estimatedHours: 8,
        topics: ['arrays'],
        milestones: [
          { name: 'Two Pointers', problems: 5, difficulty: 'easy' },
          { name: 'Sliding Window', problems: 7, difficulty: 'easy' },
          { name: 'Prefix Sum', problems: 4, difficulty: 'easy' },
        ],
      },
      'trees-basics': {
        id: 'trees-basics',
        title: 'Tree Traversal Basics',
        description: 'Learn DFS, BFS, and tree operations',
        difficulty: 'medium',
        estimatedHours: 12,
        topics: ['trees'],
        milestones: [
          { name: 'Binary Tree Basics', problems: 5, difficulty: 'easy' },
          { name: 'DFS Traversals', problems: 6, difficulty: 'medium' },
          { name: 'BFS & Level Order', problems: 5, difficulty: 'medium' },
          { name: 'BST Operations', problems: 6, difficulty: 'medium' },
        ],
      },
      'dynamic-programming-intro': {
        id: 'dynamic-programming-intro',
        title: 'Introduction to Dynamic Programming',
        description: 'From recursion to optimal substructure',
        difficulty: 'hard',
        estimatedHours: 16,
        topics: ['dynamic-programming'],
        milestones: [
          { name: 'Fibonacci & Memoization', problems: 4, difficulty: 'easy' },
          { name: '1D DP Problems', problems: 7, difficulty: 'medium' },
          { name: '2D DP Problems', problems: 6, difficulty: 'hard' },
          { name: 'Optimization Techniques', problems: 5, difficulty: 'hard' },
        ],
      },
      'graphs-algorithms': {
        id: 'graphs-algorithms',
        title: 'Graph Algorithms',
        description: 'Complete coverage of graph traversal and algorithms',
        difficulty: 'hard',
        estimatedHours: 18,
        topics: ['graphs'],
        milestones: [
          { name: 'Graph Representation', problems: 3, difficulty: 'easy' },
          { name: 'DFS & BFS', problems: 7, difficulty: 'medium' },
          { name: 'Shortest Path', problems: 6, difficulty: 'hard' },
          { name: 'Topological Sort & Cycles', problems: 5, difficulty: 'hard' },
          { name: 'Advanced Topics', problems: 4, difficulty: 'advanced' },
        ],
      },
      'system-design-junior': {
        id: 'system-design-junior',
        title: 'System Design Fundamentals',
        description: 'Core concepts for junior engineers',
        difficulty: 'hard',
        estimatedHours: 20,
        topics: ['system-design'],
        milestones: [
          { name: 'Scalability Basics', problems: 4, difficulty: 'medium' },
          { name: 'Database Design', problems: 5, difficulty: 'hard' },
          { name: 'Caching & CDN', problems: 4, difficulty: 'hard' },
          { name: 'Message Queues', problems: 3, difficulty: 'hard' },
          { name: 'Design a System', problems: 5, difficulty: 'advanced' },
        ],
      },
    };
  }

  /**
   * Get all available learning paths
   */
  getAllPaths() {
    return Object.values(this.pathTemplates);
  }

  /**
   * Get a specific learning path
   */
  getPath(pathId) {
    return this.pathTemplates[pathId] || null;
  }

  /**
   * Recommend learning paths based on user skill and weaknesses
   */
  recommendPaths(userProfile = {}) {
    const { skillLevel = 'beginner', weaknessAreas = {}, attemptedTopics = [] } = userProfile;

    const recommendations = [];

    // Recommend based on skill level
    const pathsByDifficulty = {
      beginner: ['arrays-foundations'],
      intermediate: ['trees-basics', 'arrays-foundations'],
      advanced: ['dynamic-programming-intro', 'graphs-algorithms', 'system-design-junior'],
      expert: ['graphs-algorithms', 'system-design-junior'],
    };

    const basePaths = pathsByDifficulty[skillLevel] || ['arrays-foundations'];

    // Boost recommendations for weak areas (weaknessAreas is an object with topic keys)
    const weakTopics = Object.keys(weaknessAreas).filter(topic => weaknessAreas[topic] > 0.5);

    for (const topic of weakTopics) {
      for (const [pathId, path] of Object.entries(this.pathTemplates)) {
        if (path.topics.includes(topic) && !recommendations.find(r => r.pathId === pathId)) {
          recommendations.push({
            pathId,
            path,
            reason: `Strengthen your weak area: ${topic}`,
            priority: 'high',
          });
        }
      }
    }

    // Add base paths if not already recommended
    for (const pathId of basePaths) {
      if (!recommendations.find(r => r.pathId === pathId)) {
        recommendations.push({
          pathId,
          path: this.pathTemplates[pathId],
          reason: 'Recommended for your skill level',
          priority: 'medium',
        });
      }
    }

    return recommendations;
  }

  /**
   * Create user's learning path progress entry
   */
  createPathProgress(userId, pathId) {
    const path = this.getPath(pathId);

    if (!path) {
      throw new Error(`Path ${pathId} not found`);
    }

    return {
      userId,
      pathId,
      title: path.title,
      startedAt: new Date().toISOString(),
      completedAt: null,
      completionPercentage: 0,
      milestoneProgress: path.milestones.map(m => ({
        name: m.name,
        problemCount: m.problems,
        completed: 0,
        status: 'not_started',
      })),
      estimatedHours: path.estimatedHours,
      totalProblemsSolved: 0,
      totalProblemsToSolve: path.milestones.reduce((sum, m) => sum + m.problems, 0),
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
    milestone.completed = Math.min(problemsSolved, milestone.problemCount);
    milestone.status = milestone.completed === milestone.problemCount ? 'completed' : 'in_progress';

    // Recalculate overall progress
    const totalSolved = pathProgress.milestoneProgress.reduce((sum, m) => sum + m.completed, 0);
    const totalRequired = pathProgress.milestoneProgress.reduce((sum, m) => sum + m.problemCount, 0);

    pathProgress.totalProblemsSolved = totalSolved;
    pathProgress.completionPercentage = Math.round((totalSolved / totalRequired) * 100);

    // Mark as completed if all milestones done
    if (pathProgress.completionPercentage === 100) {
      pathProgress.completedAt = new Date().toISOString();
    }

    return pathProgress;
  }

  /**
   * Get next problem for path progression
   */
  getNextProblem(pathProgress, allProblems = []) {
    // Find first incomplete milestone
    const incompleteMilestone = pathProgress.milestoneProgress.find(m => m.status !== 'completed');

    if (!incompleteMilestone) {
      return null; // Path complete
    }

    // Filter problems by topic and difficulty
    const milestoneName = incompleteMilestone.name;
    const nextProblems = allProblems.filter(p => {
      // Match by difficulty or topic keywords
      const matchesMilestone = p.title?.toLowerCase().includes(milestoneName.toLowerCase()) ||
        p.topic?.toLowerCase().includes(milestoneName.toLowerCase().replace(/\s+/g, '-'));

      return matchesMilestone;
    });

    if (nextProblems.length === 0) {
      // Fallback: return any unsolved problem
      return allProblems[Math.floor(Math.random() * allProblems.length)];
    }

    // Return random unsolved from milestone
    return nextProblems[Math.floor(Math.random() * nextProblems.length)];
  }

  /**
   * Get path statistics and insights
   */
  getPathStats(pathProgress) {
    const totalMilestones = pathProgress.milestoneProgress.length;
    const completedMilestones = pathProgress.milestoneProgress.filter(m => m.status === 'completed').length;
    const inProgressMilestones = pathProgress.milestoneProgress.filter(m => m.status === 'in_progress').length;

    const timeSpent = pathProgress.startedAt
      ? Math.floor((new Date() - new Date(pathProgress.startedAt)) / 3600000) // hours
      : 0;

    return {
      path_title: pathProgress.title,
      completion_percentage: pathProgress.completionPercentage,
      total_problems_solved: pathProgress.totalProblemsSolved,
      total_problems_required: pathProgress.totalProblemsToSolve,
      milestones_completed: completedMilestones,
      milestones_in_progress: inProgressMilestones,
      total_milestones: totalMilestones,
      estimated_hours: pathProgress.estimatedHours,
      time_spent_hours: timeSpent,
      started_at: pathProgress.startedAt,
      completed_at: pathProgress.completedAt,
      problems_per_hour: timeSpent > 0 ? (pathProgress.totalProblemsSolved / timeSpent).toFixed(2) : 0,
    };
  }

  /**
   * Estimate time to complete path
   */
  estimateTimeToCompletion(pathProgress) {
    const { completion_percentage, estimated_hours, time_spent_hours } = this.getPathStats(pathProgress);

    if (completion_percentage === 0) {
      return estimated_hours; // No progress yet
    }

    if (completion_percentage === 100) {
      return 0; // Already complete
    }

    // Linear projection
    const ratePercentPerHour = completion_percentage / time_spent_hours;
    const remainingPercentage = 100 - completion_percentage;
    const estimatedRemainingHours = remainingPercentage / ratePercentPerHour;

    return Math.round(estimatedRemainingHours);
  }

  /**
   * Generate streak bonus for consistent practice
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
   * Get public leaderboard for path
   */
  getPathLeaderboard(pathId, topN = 10) {
    // This would be implemented with DB queries in production
    // Placeholder showing structure
    return {
      pathId,
      topN,
      leaderboard: [], // Would populate from DB
      timestamp: new Date().toISOString(),
    };
  }
}
