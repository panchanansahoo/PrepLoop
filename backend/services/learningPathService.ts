import { supabaseAdmin } from '../db/supabaseClient.js';
import dsaLearningPath, { getModuleProblems, getModuleProgress } from '../data/dsaLearningPath.js';
import lldLearningPath from '../data/lldLearningPath.js';
import aiLearningPath from '../data/aiLearningPath.js';
import { findMobileTrackModule, getMobileTrack } from '../data/mobileLearningTracks.js';

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

export const DETAILED_PATHS: Record<string, any> = {
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

function formatDsaModuleContent(module: any): { content: string; code_example: string | null } {
  const parts: string[] = [];
  if (module?.description) {
    parts.push(String(module.description).trim());
  }
  if (Array.isArray(module?.topics) && module.topics.length > 0) {
    parts.push(`Key Topics:\n${module.topics.map((topic: string) => `• ${topic}`).join('\n')}`);
  }
  const fundamentals = module?.theory?.fundamentals;
  if (typeof fundamentals === 'string' && fundamentals.trim()) {
    parts.push(fundamentals.trim());
  }

  let codeExample: string | null = null;
  const techniques = module?.theory?.techniques;
  if (techniques && typeof techniques === 'object') {
    const firstTechnique = Object.values(techniques).find((val) => typeof val === 'string' && val.trim());
    if (typeof firstTechnique === 'string') {
      codeExample = firstTechnique.trim();
    }
  }

  return {
    content: parts.join('\n\n'),
    code_example: codeExample,
  };
}

export class LearningPathService {
  static getCatalog() {
    return LEARNING_PATHS_CATALOG;
  }

  static getPathDetail(pathId: string) {
    return DETAILED_PATHS[pathId] || null;
  }

  static async getCompletedLearningTopics(userId?: string | null): Promise<Record<string, any>> {
    if (!userId) return {};
    try {
      const adminApi = (supabaseAdmin as any)?.auth?.admin;
      if (!adminApi || typeof adminApi.getUserById !== 'function') return {};
      const { data, error } = await adminApi.getUserById(userId);
      if (error || !data?.user?.user_metadata) return {};
      const completed = data.user.user_metadata.learning_completed_topics;
      return completed && typeof completed === 'object' && !Array.isArray(completed) ? completed : {};
    } catch {
      return {};
    }
  }

  static async getDsaPathWithProgress(userId?: string | null) {
    const userProgress: Record<string, { solved: boolean }> = {};
    let completedTopics: Record<string, any> = {};

    if (userId) {
      const [progressResult, completed] = await Promise.all([
        supabaseAdmin
          .from("user_progress")
          .select("problem_id, status")
          .eq("user_id", userId),
        LearningPathService.getCompletedLearningTopics(userId),
      ]);
      completedTopics = completed;

      (progressResult?.data || []).forEach((row: any) => {
        userProgress[`problem_${row.problem_id}`] = {
          solved: row.status === "solved",
        };
      });
    }

    return {
      ...dsaLearningPath,
      modules: dsaLearningPath.modules.map((module: any) => {
        const progress = getModuleProgress(module.slug, userProgress);
        const problems = getModuleProblems(module.slug);
        const totalTopics = progress.total || module.topics?.length || module.problemCount || 0;
        const markedComplete = Boolean(
          completedTopics[module.slug] || completedTopics[String(module.id)],
        );
        const completedCount = markedComplete
          ? totalTopics
          : progress.solved || 0;

        return {
          ...module,
          progress,
          problems,
          completed: markedComplete || (totalTopics > 0 && completedCount >= totalTopics),
          completed_topics: completedCount,
          total_topics: totalTopics,
        };
      }),
    };
  }

  static async getDsaModule(moduleSlug: string, userId?: string | null) {
    const normalizedSlug = String(moduleSlug || '').trim();
    const module: any = dsaLearningPath.modules.find(
      (m: any) => m.slug === normalizedSlug || String(m.id) === normalizedSlug,
    );
    if (!module) return null;

    const userProgress: Record<string, { solved: boolean }> = {};
    let completedTopics: Record<string, any> = {};
    if (userId) {
      const [progressResult, completed] = await Promise.all([
        supabaseAdmin
          .from("user_progress")
          .select("problem_id, status")
          .eq("user_id", userId),
        LearningPathService.getCompletedLearningTopics(userId),
      ]);
      completedTopics = completed;

      (progressResult?.data || []).forEach((row: any) => {
        userProgress[`problem_${row.problem_id}`] = {
          solved: row.status === "solved",
        };
      });
    }

    const progress = getModuleProgress(module.slug, userProgress);
    const totalTopics = progress.total || module.topics?.length || module.problemCount || 0;
    const markedComplete = Boolean(
      completedTopics[module.slug] || completedTopics[String(module.id)],
    );
    const formatted = formatDsaModuleContent(module);

    return {
      ...module,
      content: module.content || formatted.content,
      code_example: module.code_example || formatted.code_example,
      problems: getModuleProblems(module.slug),
      progress,
      completed: markedComplete || (totalTopics > 0 && (progress.solved || 0) >= totalTopics),
      completed_topics: markedComplete ? totalTopics : progress.solved || 0,
      total_topics: totalTopics,
    };
  }

  static async getTrackPathWithProgress(trackId: string, userId?: string | null) {
    const track = getMobileTrack(trackId);
    if (!track) return null;

    const completedTopics = await LearningPathService.getCompletedLearningTopics(userId);
    return {
      id: track.id,
      title: track.title,
      modules: track.modules.map((mod: any) => {
        const completed = Boolean(completedTopics[mod.id]);
        return {
          id: mod.id,
          title: mod.title,
          description: mod.description,
          total_topics: mod.total_topics,
          completed_topics: completed ? mod.total_topics : 0,
          completed,
        };
      }),
    };
  }

  static async getTrackModule(trackId: string, topicId: string, userId?: string | null) {
    const found = findMobileTrackModule(topicId, trackId);
    if (!found) return null;

    const completedTopics = await LearningPathService.getCompletedLearningTopics(userId);
    const completed = Boolean(completedTopics[found.module.id]);

    return {
      ...found.module,
      trackId: found.trackId,
      completed,
      completed_topics: completed ? found.module.total_topics : 0,
    };
  }

  static async getTopicProgress(topicId: string, userId?: string | null) {
    const foundTrackMod = findMobileTrackModule(topicId);
    if (foundTrackMod) {
      const completedTopics = await LearningPathService.getCompletedLearningTopics(userId);
      const completed = Boolean(completedTopics[foundTrackMod.module.id]);
      return {
        id: foundTrackMod.module.id,
        title: foundTrackMod.module.title,
        completed,
        completed_topics: completed ? foundTrackMod.module.total_topics : 0,
        total_topics: foundTrackMod.module.total_topics,
      };
    }

    const dsaMod = await LearningPathService.getDsaModule(topicId, userId);
    if (dsaMod) {
      return {
        id: dsaMod.slug || String(dsaMod.id),
        title: dsaMod.title,
        completed: Boolean(dsaMod.completed),
        completed_topics: dsaMod.completed_topics || 0,
        total_topics: dsaMod.total_topics || 0,
      };
    }

    return null;
  }

  static async markTopicComplete(userId: string, topicId: string) {
    const normalizedId = String(topicId || '').trim();
    let canonicalKey: string | null = null;
    let totalTopics = 1;

    const foundTrackMod = findMobileTrackModule(normalizedId);
    if (foundTrackMod) {
      canonicalKey = foundTrackMod.module.id;
      totalTopics = foundTrackMod.module.total_topics;
    } else {
      const dsaMod = dsaLearningPath.modules.find(
        (m: any) => m.slug === normalizedId || String(m.id) === normalizedId,
      );
      if (dsaMod) {
        canonicalKey = dsaMod.slug || String(dsaMod.id);
        totalTopics = getModuleProblems(dsaMod.slug).length || dsaMod.topics?.length || dsaMod.problemCount || 1;
      }
    }

    if (!canonicalKey) return null;

    const adminApi = (supabaseAdmin as any)?.auth?.admin;
    if (adminApi && typeof adminApi.getUserById === 'function' && typeof adminApi.updateUserById === 'function') {
      const { data, error } = await adminApi.getUserById(userId);
      if (error) throw error;
      const userMetadata = data?.user?.user_metadata || {};
      const existingCompleted =
        userMetadata.learning_completed_topics && typeof userMetadata.learning_completed_topics === 'object'
          ? userMetadata.learning_completed_topics
          : {};
      const nextCompleted = {
        ...existingCompleted,
        [canonicalKey]: { completedAt: new Date().toISOString() },
      };
      const { error: updateError } = await adminApi.updateUserById(userId, {
        user_metadata: {
          ...userMetadata,
          learning_completed_topics: nextCompleted,
        },
      });
      if (updateError) throw updateError;
    }

    return {
      success: true,
      topicId: canonicalKey,
      completed: true,
      completed_topics: totalTopics,
      total_topics: totalTopics,
    };
  }

  static async getLldPathWithProgress(userId?: string | null) {
    const completedProblems: Record<string, boolean> = {};

    if (userId) {
      const { data } = await supabaseAdmin
        .from("user_progress")
        .select("problem_id, status")
        .eq("user_id", userId);

      (data || []).forEach((row: any) => {
        completedProblems[row.problem_id] = row.status === "solved";
      });
    }

    return {
      ...lldLearningPath,
      modules: lldLearningPath.modules.map((module: any) => {
        const moduleProblems = lldLearningPath.practiceProblems.filter((p: any) =>
          module.keyProblems?.some((kp: any) => kp.title === p.title),
        );

        const solved = moduleProblems.filter((p: any) => completedProblems[p.id]).length;
        const total = module.problemCount;
        const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;

        return {
          ...module,
          progress: { solved, total, percentage },
        };
      }),
    };
  }

  static async getLldModule(moduleSlug: string, userId?: string | null) {
    const module = lldLearningPath.modules.find((m: any) => m.slug === moduleSlug);
    if (!module) return null;

    const completedProblems: Record<string, boolean> = {};
    if (userId) {
      const { data } = await supabaseAdmin
        .from("user_progress")
        .select("problem_id, status")
        .eq("user_id", userId);

      (data || []).forEach((row: any) => {
        completedProblems[row.problem_id] = row.status === "solved";
      });
    }

    const relatedProblems = lldLearningPath.practiceProblems.filter((p: any) =>
      module.keyProblems?.some((kp: any) => kp.title === p.title),
    );

    const solved = relatedProblems.filter((p: any) => completedProblems[p.id]).length;
    const total = module.problemCount;
    const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;

    return {
      ...module,
      problems: relatedProblems,
      progress: { solved, total, percentage },
    };
  }

  static async getAiPathWithProgress(userId?: string | null) {
    const completedTopics: Record<string, boolean> = {};

    if (userId) {
      const { data } = await supabaseAdmin
        .from("user_progress")
        .select("problem_id, status")
        .eq("user_id", userId);

      (data || []).forEach((row: any) => {
        completedTopics[row.problem_id] = row.status === "solved";
      });
    }

    return {
      ...aiLearningPath,
      modules: aiLearningPath.modules.map((module: any) => {
        const problems = module.problems || [];
        const solved = problems.filter((p: any) => completedTopics[p.id]).length;
        const total = problems.length;
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

