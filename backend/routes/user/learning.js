import express from 'express';
import { supabaseAdmin } from '../../db/supabaseClient.js';
import { authenticateToken, optionalAuth } from '../../middleware/auth.js';
import dsaLearningPath, { getModuleProblems, getModuleProgress } from '../../data/dsaLearningPath.js';
import lldLearningPath from '../../data/lldLearningPath.js';

const router = express.Router();

router.get("/learning-paths", authenticateToken, (req, res) => {
  try {
    const paths = [
      {
        id: "array",
        title: "Array Interview Track",
        description:
          "Master array problem-solving patterns with guided practice and IDE workflows",
        duration: "4-6 weeks",
        difficulty: "Beginner",
        modules: [],
      },
      {
        id: "dsa-basics",
        title: "DSA Basics",
        description:
          "Master fundamental data structures and algorithms from scratch",
        duration: "6-8 weeks",
        difficulty: "Beginner",
        modules: [],
      },
      {
        id: "dsa",
        title: "Advanced DSA",
        description:
          "Master advanced algorithms and complex data structures for FAANG interviews",
        duration: "10-12 weeks",
        difficulty: "Advanced",
        modules: [],
      },
      {
        id: "data-science",
        title: "Data Science Interview Prep",
        description:
          "Master statistics, ML algorithms, and Python for data science roles",
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
        description:
          "Master OOP, design patterns, and build clean code architectures",
        duration: "6-8 weeks",
        difficulty: "Intermediate",
        modules: [],
      },
      {
        id: "hld",
        title: "High Level Design",
        description:
          "System design for scalable, distributed systems and architectures",
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

    res.json({ paths });
  } catch (error) {
    console.error("Error fetching learning paths:", error);
    res.status(500).json({ error: "Failed to fetch learning paths" });
  }
});

router.get("/learning-paths/:pathId", authenticateToken, (req, res) => {
  try {
    const { pathId } = req.params;

    const pathsData = {
      array: {
        id: "array",
        title: "Array Interview Track",
        description:
          "Master array problem-solving patterns with guided practice and IDE workflows",
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
            topics: [
              "Traversal",
              "Insertion & Deletion",
              "Complexity Analysis",
            ],
            lessons: [
              {
                title: "How arrays work in memory",
                duration: "25 min",
                type: "video",
              },
              {
                title: "Operations and trade-offs",
                duration: "30 min",
                type: "reading",
              },
              {
                title: "Practice set: easy warmup",
                duration: "90 min",
                type: "practice",
              },
            ],
            problems: 12,
            estimatedTime: "4 days",
            unlocked: true,
          },
          {
            id: "array-two-pointers",
            title: "Two Pointers",
            description:
              "Master left-right pointer techniques for sorted and unsorted arrays",
            topics: ["Pair Search", "Deduplication", "In-place Partitioning"],
            lessons: [
              {
                title: "Two pointers pattern",
                duration: "35 min",
                type: "video",
              },
              {
                title: "When to sort and when not to",
                duration: "25 min",
                type: "reading",
              },
              {
                title: "Practice set: two pointers",
                duration: "2 hours",
                type: "practice",
              },
            ],
            problems: 14,
            estimatedTime: "5 days",
            unlocked: true,
          },
          {
            id: "array-sliding-window",
            title: "Sliding Window",
            description:
              "Optimize subarray/substring range problems to linear time",
            topics: ["Fixed Window", "Variable Window", "Frequency Tracking"],
            lessons: [
              {
                title: "Sliding window intuition",
                duration: "35 min",
                type: "video",
              },
              {
                title: "Template and pitfalls",
                duration: "30 min",
                type: "reading",
              },
              {
                title: "Practice set: windows",
                duration: "2.5 hours",
                type: "practice",
              },
            ],
            problems: 15,
            estimatedTime: "1 week",
            unlocked: true,
          },
        ],
      },
      "dsa-basics": {
        id: "dsa-basics",
        title: "DSA Basics",
        description:
          "Master fundamental data structures and algorithms from scratch",
        duration: "6-8 weeks",
        difficulty: "Beginner",
        prerequisite: "Basic programming knowledge",
        outcomes: [
          "Understand core data structures (arrays, linked lists, stacks, queues)",
          "Master basic algorithms and their time complexity",
          "Solve 100+ beginner-friendly problems",
          "Build strong foundation for advanced topics",
        ],
        modules: [],
      },
      dsa: {
        id: "dsa",
        title: "Advanced DSA",
        description:
          "Master advanced algorithms and complex data structures for FAANG interviews",
        duration: "10-12 weeks",
        difficulty: "Advanced",
        prerequisite: "Strong foundation in basic DSA",
        outcomes: [
          "Master advanced data structures (Trees, Graphs, Heaps)",
          "Solve medium to hard LeetCode problems",
          "Understand dynamic programming and greedy algorithms",
          "Ready for top-tier company interviews",
        ],
        modules: [],
      },
      "data-science": {
        id: "data-science",
        title: "Data Science Interview Prep",
        description:
          "Master statistics, ML algorithms, and Python for data science roles",
        duration: "8-10 weeks",
        difficulty: "Intermediate",
        prerequisite: "Python programming, basic statistics",
        outcomes: [
          "Master statistics and probability for DS interviews",
          "Understand ML algorithms and their applications",
          "Practice SQL and data manipulation",
          "Build portfolio projects for interviews",
        ],
        modules: [],
      },
      ai: _aiLearningPath,
      lld: {
        id: "lld",
        title: "Low Level Design",
        description:
          "Master OOP, design patterns, and build clean code architectures",
        duration: "6-8 weeks",
        difficulty: "Intermediate",
        prerequisite: "OOP concepts, programming experience",
        outcomes: [
          "Master SOLID principles and design patterns",
          "Design scalable and maintainable systems",
          "Practice real-world LLD interview questions",
          "Build clean, modular code architectures",
        ],
        modules: [],
      },
      hld: {
        id: "hld",
        title: "High Level Design",
        description:
          "System design for scalable, distributed systems and architectures",
        duration: "8-10 weeks",
        difficulty: "Advanced",
        prerequisite: "Basic system design concepts, databases",
        outcomes: [
          "Design scalable distributed systems",
          "Master system design patterns and trade-offs",
          "Practice FAANG-level system design interviews",
          "Understand real-world architecture decisions",
        ],
        modules: [],
      },
    };

    const pathData = pathsData[pathId];

    if (!pathData) {
      return res.status(404).json({ error: "Learning path not found" });
    }

    res.json(pathData);
  } catch (error) {
    console.error("Error fetching learning path:", error);
    res.status(500).json({ error: "Failed to fetch learning path" });
  }
});

router.get("/learning-path/dsa", optionalAuth, async (req, res) => {
  try {
    const userProgress = {};

    if (req.user) {
      const { data } = await supabaseAdmin
        .from("user_progress")
        .select("problem_id, status")
        .eq("user_id", req.user.id);

      (data || []).forEach((row) => {
        userProgress[`problem_${row.problem_id}`] = {
          solved: row.status === "solved",
        };
      });
    }

    const pathWithProgress = {
      ...dsaLearningPath,
      modules: dsaLearningPath.modules.map((module) => ({
        ...module,
        progress: getModuleProgress(module.slug, userProgress),
        problems: getModuleProblems(module.slug),
      })),
    };

    res.json(pathWithProgress);
  } catch (error) {
    console.error("Error fetching DSA learning path:", error);
    res.status(500).json({ error: "Failed to fetch learning path" });
  }
});

router.get(
  "/learning-path/dsa/module/:moduleSlug",
  optionalAuth,
  async (req, res) => {
    try {
      const { moduleSlug } = req.params;

      const module = dsaLearningPath.modules.find((m) => m.slug === moduleSlug);

      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }

      const userProgress = {};

      if (req.user) {
        const { data } = await supabaseAdmin
          .from("user_progress")
          .select("problem_id, status")
          .eq("user_id", req.user.id);

        (data || []).forEach((row) => {
          userProgress[`problem_${row.problem_id}`] = {
            solved: row.status === "solved",
          };
        });
      }

      const problems = getModuleProblems(moduleSlug);
      const progress = getModuleProgress(moduleSlug, userProgress);

      res.json({
        ...module,
        problems,
        progress,
      });
    } catch (error) {
      console.error("Error fetching module:", error);
      res.status(500).json({ error: "Failed to fetch module" });
    }
  },
);

router.get("/learning-path/lld", optionalAuth, async (req, res) => {
  try {
    const completedProblems = {};

    if (req.user) {
      const { data } = await supabaseAdmin
        .from("user_progress")
        .select("problem_id, status")
        .eq("user_id", req.user.id);

      (data || []).forEach((row) => {
        completedProblems[row.problem_id] = row.status === "solved";
      });
    }

    const pathWithProgress = {
      ...lldLearningPath,
      modules: lldLearningPath.modules.map((module) => {
        const moduleProblems = lldLearningPath.practiceProblems.filter((p) =>
          module.keyProblems?.some((kp) => kp.title === p.title),
        );

        const solved = moduleProblems.filter(
          (p) => completedProblems[p.id],
        ).length;
        const total = module.problemCount;
        const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;

        return {
          ...module,
          progress: {
            solved,
            total,
            percentage,
          },
        };
      }),
    };

    res.json(pathWithProgress);
  } catch (error) {
    console.error("Error fetching LLD learning path:", error);
    res.status(500).json({ error: "Failed to fetch learning path" });
  }
});

router.get(
  "/learning-path/lld/module/:moduleSlug",
  optionalAuth,
  async (req, res) => {
    try {
      const { moduleSlug } = req.params;

      const module = lldLearningPath.modules.find((m) => m.slug === moduleSlug);

      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }

      const completedProblems = {};

      if (req.user) {
        const { data } = await supabaseAdmin
          .from("user_progress")
          .select("problem_id, status")
          .eq("user_id", req.user.id);

        (data || []).forEach((row) => {
          completedProblems[row.problem_id] = row.status === "solved";
        });
      }

      const relatedProblems = lldLearningPath.practiceProblems.filter((p) =>
        module.keyProblems?.some((kp) => kp.title === p.title),
      );

      const solved = relatedProblems.filter(
        (p) => completedProblems[p.id],
      ).length;
      const total = module.problemCount;
      const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;

      res.json({
        ...module,
        relatedProblems,
        progress: {
          solved,
          total,
          percentage,
        },
      });
    } catch (error) {
      console.error("Error fetching LLD module:", error);
      res.status(500).json({ error: "Failed to fetch module" });
    }
  },
);

export default router;
