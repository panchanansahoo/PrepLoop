import { supabaseAdmin } from '../db/supabaseClient.js';
import dsaLearningPath, { getModuleProblems, getModuleProgress } from '../data/dsaLearningPath.js';
import lldLearningPath from '../data/lldLearningPath.js';
import aiLearningPath from '../data/aiLearningPath.js';

export const LEARNING_PATHS_CATALOG = [
  {
    id: "array",
    title: "Array Interview Track",
    description: "Master array problem-solving patterns with guided practice and IDE workflows",
    duration: "4-6 weeks",
    difficulty: "Beginner",
    modules: [],
  },
  {
    id: "dsa-basics",
    title: "DSA Basics",
    description: "Master fundamental data structures and algorithms from scratch",
    duration: "6-8 weeks",
    difficulty: "Beginner",
    modules: [],
  },
  {
    id: "dsa",
    title: "Advanced DSA",
    description: "Master advanced algorithms and complex data structures for FAANG interviews",
    duration: "10-12 weeks",
    difficulty: "Advanced",
    modules: [],
  },
  {
    id: "data-science",
    title: "Data Science Interview Prep",
    description: "Master statistics, ML algorithms, and Python for data science roles",
    duration: "8-10 weeks",
    difficulty: "Intermediate",
    modules: [],
  },
  {
    id: "ai",
    title: "AI & Machine Learning",
    description: "Deep learning, neural networks, and modern AI techniques",
    duration: "10-12 weeks",
    difficulty: "Advanced",
    modules: [],
  },
  {
    id: "lld",
    title: "Low Level Design",
    description: "Master OOP, design patterns, and build clean code architectures",
    duration: "6-8 weeks",
    difficulty: "Intermediate",
    modules: [],
  },
  {
    id: "hld",
    title: "High Level Design",
    description: "System design for scalable, distributed systems and architectures",
    duration: "8-10 weeks",
    difficulty: "Advanced",
    modules: [],
  },
  {
    id: "beginner",
    title: "Interview Prep Bootcamp",
    description: "Complete beginner-friendly interview preparation path",
    duration: "4-6 weeks",
    difficulty: "Beginner",
    modules: [],
  },
];

export const DETAILED_PATHS = {
  array: {
    id: "array",
    title: "Array Interview Track",
    description: "Master array problem-solving patterns with guided practice and IDE workflows",
    duration: "4-6 weeks",
    difficulty: "Beginner",
    prerequisite: "Basic programming fundamentals",
    outcomes: [
      "Understand array indexing, traversal, and in-place updates",
      "Use two pointers, sliding window, prefix sums, and hash maps confidently",
      "Solve common interview-style array problems with optimized complexity",
      "Practice and debug solutions quickly in an interview-like IDE",
    ],
    modules: [
      {
        id: "array-foundations",
        title: "Array Foundations",
        description: "Core operations, complexity, and baseline techniques",
        topics: ["Traversal", "Insertion & Deletion", "Complexity Analysis"],
        lessons: [
          { title: "How arrays work in memory", duration: "25 min", type: "video" },
          { title: "Operations and trade-offs", duration: "30 min", type: "reading" },
          { title: "Practice set: easy warmup", duration: "90 min", type: "practice" },
        ],
        problems: 12,
        estimatedTime: "4 days",
        unlocked: true,
      },
      {
        id: "array-two-pointers",
        title: "Two Pointers",
        description: "Master left-right pointer techniques for sorted and unsorted arrays",
        topics: ["Pair Search", "Deduplication", "In-place Partitioning"],
        lessons: [
          { title: "Two pointers pattern", duration: "35 min", type: "video" },
          { title: "When to sort and when not to", duration: "25 min", type: "reading" },
          { title: "Practice set: two pointers", duration: "2 hours", type: "practice" },
        ],
        problems: 14,
        estimatedTime: "5 days",
        unlocked: true,
      },
      {
        id: "array-sliding-window",
        title: "Sliding Window",
        description: "Optimize subarray/substring range problems to linear time",
        topics: ["Fixed Window", "Variable Window", "Frequency Tracking"],
        lessons: [
          { title: "Sliding window intuition", duration: "35 min", type: "video" },
          { title: "Window state management", duration: "30 min", type: "reading" },
          { title: "Practice set: sliding window", duration: "2.5 hours", type: "practice" },
        ],
        problems: 15,
        estimatedTime: "6 days",
        unlocked: true,
      },
      {
        id: "array-prefix-sum",
        title: "Prefix Sum & Range Queries",
        description: "Handle range sums, frequency counts, and 2D grid queries efficiently",
        topics: ["1D Prefix Sum", "Hash Map with Prefix", "2D Matrix Prefix"],
        lessons: [
          { title: "Prefix sum foundations", duration: "25 min", type: "video" },
          { title: "Subarray sum equals K pattern", duration: "35 min", type: "video" },
          { title: "Practice set: prefix arrays", duration: "2 hours", type: "practice" },
        ],
        problems: 12,
        estimatedTime: "4 days",
        unlocked: true,
      },
    ],
  },
  "dsa-basics": {
    id: "dsa-basics",
    title: "DSA Basics",
    description: "Master fundamental data structures and algorithms from scratch",
    duration: "6-8 weeks",
    difficulty: "Beginner",
    modules: [],
  },
  dsa: {
    id: "dsa",
    title: "Advanced DSA",
    description: "Master advanced algorithms and complex data structures for FAANG interviews",
    duration: "10-12 weeks",
    difficulty: "Advanced",
    modules: [],
  },
  "data-science": {
    id: "data-science",
    title: "Data Science Interview Prep",
    description: "Master statistics, ML algorithms, and Python for data science roles",
    duration: "8-10 weeks",
    difficulty: "Intermediate",
    modules: [],
  },
  ai: {
    id: "ai",
    title: "AI & Machine Learning",
    description: "Deep learning, neural networks, and modern AI techniques",
    duration: "10-12 weeks",
    difficulty: "Advanced",
    modules: [],
  },
  lld: {
    id: "lld",
    title: "Low Level Design",
    description: "Master OOP, design patterns, and build clean code architectures",
    duration: "6-8 weeks",
    difficulty: "Intermediate",
    modules: [],
  },
  hld: {
    id: "hld",
    title: "High Level Design",
    description: "System design for scalable, distributed systems and architectures",
    duration: "8-10 weeks",
    difficulty: "Advanced",
    modules: [],
  },
  beginner: {
    id: "beginner",
    title: "Interview Prep Bootcamp",
    description: "Complete beginner-friendly interview preparation path",
    duration: "4-6 weeks",
    difficulty: "Beginner",
    modules: [],
  },
};

export class LearningPathService {
  static getCatalog() {
    return LEARNING_PATHS_CATALOG;
  }

  static getPathDetail(pathId) {
    return DETAILED_PATHS[pathId] || null;
  }

  static async getDsaPathWithProgress(userId) {
    const userProgress = {};

    if (userId) {
      const { data } = await supabaseAdmin
        .from("user_progress")
        .select("problem_id, status")
        .eq("user_id", userId);

      (data || []).forEach((row) => {
        userProgress[`problem_${row.problem_id}`] = {
          solved: row.status === "solved",
        };
      });
    }

    return {
      ...dsaLearningPath,
      modules: dsaLearningPath.modules.map((module) => ({
        ...module,
        progress: getModuleProgress(module.slug, userProgress),
        problems: getModuleProblems(module.slug),
      })),
    };
  }

  static async getDsaModule(moduleSlug, userId) {
    const module = dsaLearningPath.modules.find((m) => m.slug === moduleSlug);
    if (!module) return null;

    const userProgress = {};
    if (userId) {
      const { data } = await supabaseAdmin
        .from("user_progress")
        .select("problem_id, status")
        .eq("user_id", userId);

      (data || []).forEach((row) => {
        userProgress[`problem_${row.problem_id}`] = {
          solved: row.status === "solved",
        };
      });
    }

    return {
      ...module,
      problems: getModuleProblems(moduleSlug),
      progress: getModuleProgress(moduleSlug, userProgress),
    };
  }

  static async getLldPathWithProgress(userId) {
    const completedProblems = {};

    if (userId) {
      const { data } = await supabaseAdmin
        .from("user_progress")
        .select("problem_id, status")
        .eq("user_id", userId);

      (data || []).forEach((row) => {
        completedProblems[row.problem_id] = row.status === "solved";
      });
    }

    return {
      ...lldLearningPath,
      modules: lldLearningPath.modules.map((module) => {
        const moduleProblems = lldLearningPath.practiceProblems.filter((p) =>
          module.keyProblems?.some((kp) => kp.title === p.title),
        );

        const solved = moduleProblems.filter((p) => completedProblems[p.id]).length;
        const total = module.problemCount;
        const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;

        return {
          ...module,
          progress: { solved, total, percentage },
        };
      }),
    };
  }

  static async getLldModule(moduleSlug, userId) {
    const module = lldLearningPath.modules.find((m) => m.slug === moduleSlug);
    if (!module) return null;

    const completedProblems = {};
    if (userId) {
      const { data } = await supabaseAdmin
        .from("user_progress")
        .select("problem_id, status")
        .eq("user_id", userId);

      (data || []).forEach((row) => {
        completedProblems[row.problem_id] = row.status === "solved";
      });
    }

    const relatedProblems = lldLearningPath.practiceProblems.filter((p) =>
      module.keyProblems?.some((kp) => kp.title === p.title),
    );

    const solved = relatedProblems.filter((p) => completedProblems[p.id]).length;
    const total = module.problemCount;
    const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;

    return {
      ...module,
      problems: relatedProblems,
      progress: { solved, total, percentage },
    };
  }

  static async getAiPathWithProgress(userId) {
    const completedTopics = {};

    if (userId) {
      const { data } = await supabaseAdmin
        .from("user_progress")
        .select("problem_id, status")
        .eq("user_id", userId);

      (data || []).forEach((row) => {
        completedTopics[row.problem_id] = row.status === "solved";
      });
    }

    return {
      ...aiLearningPath,
      modules: aiLearningPath.modules.map((module) => {
        const solved = (module.topics || []).filter((t) => completedTopics[t.id]).length;
        const total = (module.topics || []).length;
        const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;
        return {
          ...module,
          progress: { solved, total, percentage },
        };
      }),
    };
  }
}

export default LearningPathService;

