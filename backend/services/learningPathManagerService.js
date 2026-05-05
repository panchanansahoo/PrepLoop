/**
 * learningPathManagerService.js
 *
 * Manages learning path definitions and retrieval.
 * Responsibilities:
 * - Store and retrieve path templates
 * - Validate path structures
 * - Provide path metadata
 */

export class LearningPathManagerService {
  constructor() {
    this.pathTemplates = {
      'arrays-foundations': {
        id: 'arrays-foundations',
        title: 'Array Fundamentals',
        description: 'Master basic array operations and patterns',
        difficulty: 'easy',
        estimatedHours: 8,
        topics: ['arrays'],
        category: 'data-structures',
        prerequisites: [],
        milestones: [
          { name: 'Two Pointers', problems: 5, difficulty: 'easy', stage: 'THEORY' },
          { name: 'Sliding Window', problems: 7, difficulty: 'easy', stage: 'QUICK_METHODS' },
          { name: 'Prefix Sum', problems: 4, difficulty: 'easy', stage: 'SHORTCUTS' },
        ],
      },
      'trees-basics': {
        id: 'trees-basics',
        title: 'Tree Traversal Basics',
        description: 'Learn DFS, BFS, and tree operations',
        difficulty: 'medium',
        estimatedHours: 12,
        topics: ['trees'],
        category: 'data-structures',
        prerequisites: ['arrays-foundations'],
        milestones: [
          { name: 'Binary Tree Basics', problems: 5, difficulty: 'easy', stage: 'THEORY' },
          { name: 'DFS Traversals', problems: 6, difficulty: 'medium', stage: 'QUICK_METHODS' },
          { name: 'BFS & Level Order', problems: 5, difficulty: 'medium', stage: 'QUICK_METHODS' },
          { name: 'BST Operations', problems: 6, difficulty: 'medium', stage: 'SHORTCUTS' },
        ],
      },
      'dynamic-programming-intro': {
        id: 'dynamic-programming-intro',
        title: 'Introduction to Dynamic Programming',
        description: 'From recursion to optimal substructure',
        difficulty: 'hard',
        estimatedHours: 16,
        topics: ['dynamic-programming'],
        category: 'algorithms',
        prerequisites: ['arrays-foundations'],
        milestones: [
          { name: 'Fibonacci & Memoization', problems: 4, difficulty: 'easy', stage: 'THEORY' },
          { name: '1D DP Problems', problems: 7, difficulty: 'medium', stage: 'QUICK_METHODS' },
          { name: '2D DP Problems', problems: 6, difficulty: 'hard', stage: 'SHORTCUTS' },
          { name: 'Optimization Techniques', problems: 5, difficulty: 'hard', stage: 'PRACTICE' },
        ],
      },
      'graphs-algorithms': {
        id: 'graphs-algorithms',
        title: 'Graph Algorithms',
        description: 'Complete coverage of graph traversal and algorithms',
        difficulty: 'hard',
        estimatedHours: 18,
        topics: ['graphs'],
        category: 'algorithms',
        prerequisites: ['trees-basics'],
        milestones: [
          { name: 'Graph Representation', problems: 3, difficulty: 'easy', stage: 'THEORY' },
          { name: 'DFS & BFS', problems: 7, difficulty: 'medium', stage: 'QUICK_METHODS' },
          { name: 'Shortest Path', problems: 6, difficulty: 'hard', stage: 'SHORTCUTS' },
          { name: 'Topological Sort & Cycles', problems: 5, difficulty: 'hard', stage: 'PRACTICE' },
          { name: 'Advanced Topics', problems: 4, difficulty: 'advanced', stage: 'PRACTICE' },
        ],
      },
      'system-design-junior': {
        id: 'system-design-junior',
        title: 'System Design Fundamentals',
        description: 'Core concepts for junior engineers',
        difficulty: 'hard',
        estimatedHours: 20,
        topics: ['system-design'],
        category: 'system-design',
        prerequisites: [],
        milestones: [
          { name: 'Scalability Basics', problems: 4, difficulty: 'medium', stage: 'THEORY' },
          { name: 'Database Design', problems: 5, difficulty: 'hard', stage: 'QUICK_METHODS' },
          { name: 'Caching & CDN', problems: 4, difficulty: 'hard', stage: 'SHORTCUTS' },
          { name: 'Message Queues', problems: 3, difficulty: 'hard', stage: 'PRACTICE' },
          { name: 'Design a System', problems: 5, difficulty: 'advanced', stage: 'PRACTICE' },
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
   * Get paths by category
   */
  getPathsByCategory(category) {
    return Object.values(this.pathTemplates).filter((path) => path.category === category);
  }

  /**
   * Get a specific learning path
   */
  getPath(pathId) {
    return this.pathTemplates[pathId] || null;
  }

  /**
   * Get paths by difficulty level
   */
  getPathsByDifficulty(difficulty) {
    return Object.values(this.pathTemplates).filter((path) => path.difficulty === difficulty);
  }

  /**
   * Check if user has completed prerequisites
   */
  checkPrerequisites(pathId, completedPaths = []) {
    const path = this.getPath(pathId);
    if (!path) return false;

    return path.prerequisites.every((prereqId) => completedPaths.includes(prereqId));
  }

  /**
   * Get prerequisite paths for a given path
   */
  getPrerequisitePaths(pathId) {
    const path = this.getPath(pathId);
    if (!path) return [];

    return path.prerequisites.map((prereqId) => this.getPath(prereqId)).filter(Boolean);
  }

  /**
   * Get dependent paths (paths that require this one as prerequisite)
   */
  getDependentPaths(pathId) {
    return Object.values(this.pathTemplates).filter((path) =>
      path.prerequisites.includes(pathId),
    );
  }

  /**
   * Validate path structure
   */
  validatePath(path) {
    const errors = [];

    if (!path.id) errors.push('Path must have an id');
    if (!path.title) errors.push('Path must have a title');
    if (!path.difficulty || !['easy', 'medium', 'hard', 'advanced'].includes(path.difficulty))
      errors.push('Invalid difficulty level');
    if (path.estimatedHours <= 0) errors.push('Estimated hours must be positive');
    if (!Array.isArray(path.milestones) || path.milestones.length === 0)
      errors.push('Path must have at least one milestone');

    path.milestones.forEach((milestone, index) => {
      if (!milestone.name) errors.push(`Milestone ${index} missing name`);
      if (!milestone.problems || milestone.problems <= 0)
        errors.push(`Milestone ${index} must have positive problem count`);
    });

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get path by topic
   */
  getPathsByTopic(topic) {
    return Object.values(this.pathTemplates).filter((path) => path.topics.includes(topic));
  }

  /**
   * Create a new path template (for admin use)
   */
  createPath(pathData) {
    const { valid, errors } = this.validatePath(pathData);
    if (!valid) {
      throw new Error(`Invalid path: ${errors.join(', ')}`);
    }

    this.pathTemplates[pathData.id] = pathData;
    return pathData;
  }
}

export default new LearningPathManagerService();
