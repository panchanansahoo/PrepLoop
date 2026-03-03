import express from "express";
import { supabaseAdmin } from "../db/supabaseClient.js";
import { authenticateToken, optionalAuth } from "../middleware/auth.js";
import dsaLearningPath, {
  getModuleProblems,
  getModuleProgress,
} from "../data/dsaLearningPath.js";
import lldLearningPath from "../data/lldLearningPath.js";
import aiLearningPath from "../data/aiLearningPath.js";

const router = express.Router();

router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: {
        id: profile.id,
        email: req.user.email,
        full_name: profile.full_name,
        subscription_tier: profile.subscription_tier,
        experience_level: profile.experience_level,
        created_at: profile.created_at,
        last_login: profile.last_login,
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.put("/profile", authenticateToken, async (req, res) => {
  const { fullName, experienceLevel } = req.body;

  try {
    const updates = {};
    if (fullName) updates.full_name = fullName;
    if (experienceLevel) updates.experience_level = experienceLevel;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("id", req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      user: {
        id: data.id,
        email: req.user.email,
        full_name: data.full_name,
        subscription_tier: data.subscription_tier,
        experience_level: data.experience_level,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.get("/dashboard", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // ── 1) User progress (solved problems) ──
    const { data: progress } = await supabaseAdmin
      .from("user_progress")
      .select("problem_id, status")
      .eq("user_id", userId);

    const solvedCount = (progress || []).filter(
      (p) => p.status === "solved",
    ).length;

    // ── 2) All submissions (for streak, heatmap, weekly) ──
    const { data: allSubmissions } = await supabaseAdmin
      .from("submissions")
      .select("id, submitted_at, status, problem_id, problems(title, difficulty, tags)")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false });

    const subs = allSubmissions || [];

    // ── 3) Mock interviews ──
    const { data: allInterviews } = await supabaseAdmin
      .from("mock_interviews")
      .select("id, interview_type, overall_score, communication_score, technical_score, problem_solving_score, started_at, completed_at")
      .eq("user_id", userId)
      .order("started_at", { ascending: false });

    const interviews = allInterviews || [];
    const completedInterviews = interviews.filter((i) => i.completed_at);

    // ── 4) Resume analyses ──
    const { data: resumes } = await supabaseAdmin
      .from("resume_analyses")
      .select("id")
      .eq("user_id", userId);

    // ── 5) Streak calculation (consecutive days ending today) ──
    const submissionDates = [...new Set(
      subs.map((s) => new Date(s.submitted_at).toISOString().split("T")[0])
    )].sort().reverse();

    let currentStreak = 0;
    let bestStreak = 0;

    if (submissionDates.length > 0) {
      // Calculate current streak
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

      if (submissionDates[0] === today || submissionDates[0] === yesterday) {
        currentStreak = 1;
        for (let i = 1; i < submissionDates.length; i++) {
          const prev = new Date(submissionDates[i - 1]);
          const curr = new Date(submissionDates[i]);
          const diffDays = Math.round((prev - curr) / 86400000);
          if (diffDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }

      // Calculate best streak
      let tempStreak = 1;
      const allDates = [...submissionDates].sort();
      for (let i = 1; i < allDates.length; i++) {
        const prev = new Date(allDates[i - 1]);
        const curr = new Date(allDates[i]);
        const diffDays = Math.round((curr - prev) / 86400000);
        if (diffDays === 1) {
          tempStreak++;
        } else {
          bestStreak = Math.max(bestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      bestStreak = Math.max(bestStreak, tempStreak);
    }

    // ── 6) Average interview score ──
    let avgScore = 0;
    if (completedInterviews.length > 0) {
      const totalScore = completedInterviews.reduce(
        (sum, i) => sum + (i.overall_score || 0), 0
      );
      avgScore = Math.round(totalScore / completedInterviews.length);
    }

    // ── 7) Total XP (derived) ──
    const totalXP = solvedCount * 25 + completedInterviews.length * 50;

    // ── 8) Heatmap data (last 365 days, only accepted submissions grouped by date) ──
    const heatmapData = {};
    let totalSolvedYear = 0;
    let todaySolved = 0;
    const todayStr = new Date().toISOString().split("T")[0];
    subs.forEach((s) => {
      if (s.status !== "accepted") return; // Only count solved problems
      const dateKey = new Date(s.submitted_at).toISOString().split("T")[0];
      if (!heatmapData[dateKey]) {
        heatmapData[dateKey] = { solved: 0, xp: 0, easy: 0, medium: 0, hard: 0 };
      }
      heatmapData[dateKey].solved++;
      heatmapData[dateKey].xp += 25;
      const diff = s.problems?.difficulty?.toLowerCase();
      if (diff === "easy") heatmapData[dateKey].easy++;
      else if (diff === "medium") heatmapData[dateKey].medium++;
      else if (diff === "hard") heatmapData[dateKey].hard++;
      totalSolvedYear++;
      if (dateKey === todayStr) todaySolved++;
    });

    // ── 9) Skill breakdown (for radar chart) ──
    // Count solved problems by category/tags
    const solvedProblemIds = new Set(
      (progress || []).filter((p) => p.status === "solved").map((p) => p.problem_id)
    );

    // Fetch problem details for solved problems to categorize
    let skillBreakdown = { dsa: 0, sql: 0, aptitude: 0, systemDesign: 0, behavioral: 0 };
    if (solvedProblemIds.size > 0) {
      const { data: solvedProblems } = await supabaseAdmin
        .from("problems")
        .select("id, tags, difficulty")
        .in("id", [...solvedProblemIds]);

      const totalProblems = solvedProblems?.length || 0;
      // DSA score based on the number of solved problems  
      skillBreakdown.dsa = totalProblems > 0 ? Math.min(100, Math.round((totalProblems / 100) * 100)) : 0;
    }
    // SQL, aptitude from mock interview types
    const sqlInterviews = completedInterviews.filter((i) =>
      i.interview_type?.toLowerCase().includes("sql")
    );
    const aptitudeInterviews = completedInterviews.filter((i) =>
      i.interview_type?.toLowerCase().includes("aptitude")
    );
    const sysDesignInterviews = completedInterviews.filter((i) =>
      i.interview_type?.toLowerCase().includes("system") || i.interview_type?.toLowerCase().includes("design")
    );
    const behavioralInterviews = completedInterviews.filter((i) =>
      i.interview_type?.toLowerCase().includes("behavioral") || i.interview_type?.toLowerCase().includes("hr")
    );

    if (sqlInterviews.length > 0) {
      skillBreakdown.sql = Math.round(sqlInterviews.reduce((s, i) => s + (i.overall_score || 0), 0) / sqlInterviews.length);
    }
    if (aptitudeInterviews.length > 0) {
      skillBreakdown.aptitude = Math.round(aptitudeInterviews.reduce((s, i) => s + (i.overall_score || 0), 0) / aptitudeInterviews.length);
    }
    if (sysDesignInterviews.length > 0) {
      skillBreakdown.systemDesign = Math.round(sysDesignInterviews.reduce((s, i) => s + (i.overall_score || 0), 0) / sysDesignInterviews.length);
    }
    if (behavioralInterviews.length > 0) {
      skillBreakdown.behavioral = Math.round(behavioralInterviews.reduce((s, i) => s + (i.overall_score || 0), 0) / behavioralInterviews.length);
    }

    // ── 10) Topic progress (solved per pattern/category) ──
    const { data: allPatterns } = await supabaseAdmin
      .from("patterns")
      .select("id, name, category");

    const { data: allProblems } = await supabaseAdmin
      .from("problems")
      .select("id, pattern_id, difficulty");

    const topicProgressMap = {};
    const patternColors = [
      '#a78bfa', '#38bdf8', '#22c55e', '#f59e0b', '#fb923c',
      '#ec4899', '#14b8a6', '#ef4444', '#8b5cf6', '#06b6d4'
    ];
    (allPatterns || []).forEach((pattern, idx) => {
      const patternProblems = (allProblems || []).filter((p) => p.pattern_id === pattern.id);
      const patternSolved = patternProblems.filter((p) => solvedProblemIds.has(p.id)).length;
      if (patternProblems.length > 0) {
        topicProgressMap[pattern.name] = {
          name: pattern.name,
          solved: patternSolved,
          total: patternProblems.length,
          color: patternColors[idx % patternColors.length],
        };
      }
    });

    const topicProgress = Object.values(topicProgressMap);

    // ── 11) Recent activity (merged submissions + interviews) ──
    const recentActivity = [];

    // Recent submissions (max 6)
    subs.slice(0, 6).forEach((s) => {
      recentActivity.push({
        type: s.status === "accepted" ? "problem_solved" : "dsa_practice",
        title: s.problems?.title ? `${s.problems.title} — ${s.status === "accepted" ? "Accepted" : "Attempted"}` : "Problem submission",
        timestamp: s.submitted_at,
      });
    });

    // Recent completed interviews (max 4)
    completedInterviews.slice(0, 4).forEach((i) => {
      recentActivity.push({
        type: "interview_done",
        title: `Mock Interview: ${i.interview_type || "General"} — ${i.overall_score ? i.overall_score + "%" : "Completed"}`,
        timestamp: i.completed_at || i.started_at,
      });
    });

    // Sort by timestamp descending and limit to 6
    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentActivityFinal = recentActivity.slice(0, 6);

    // ── 12) Weekly goals data (solved this week by difficulty) ──
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const weekStart = startOfWeek.toISOString();

    const thisWeekSubs = subs.filter(
      (s) => s.status === "accepted" && new Date(s.submitted_at) >= new Date(weekStart)
    );

    const weeklyByDifficulty = { easy: 0, medium: 0, hard: 0 };
    thisWeekSubs.forEach((s) => {
      const diff = s.problems?.difficulty?.toLowerCase();
      if (diff === "easy") weeklyByDifficulty.easy++;
      else if (diff === "medium") weeklyByDifficulty.medium++;
      else if (diff === "hard") weeklyByDifficulty.hard++;
    });

    // ── 13) Readiness data ──
    const readinessData = {
      practiceCount: solvedCount,
      mockCount: completedInterviews.length,
      streak: currentStreak,
      timedSessions: subs.filter((s) => s.status === "accepted").length,
    };

    // ── Response ──
    res.json({
      stats: {
        problemsSolved: solvedCount,
        totalSubmissions: subs.length,
        mockInterviews: completedInterviews.length,
        resumesAnalyzed: (resumes || []).length,
      },
      streak: currentStreak,
      bestStreak,
      avgScore,
      totalXP,
      heatmapData,
      totalSolvedYear,
      todaySolved,
      skillBreakdown,
      topicProgress,
      recentActivity: recentActivityFinal,
      weeklyGoals: weeklyByDifficulty,
      readinessData,
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

router.get("/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const sessions = [];

    // 1) Mock Interviews
    const { data: interviews } = await supabaseAdmin
      .from("mock_interviews")
      .select("id, interview_type, overall_score, started_at, completed_at, company, role")
      .eq("user_id", userId)
      .order("started_at", { ascending: false });

    if (interviews) {
      interviews.forEach(i => {
        if (!i.completed_at) return;

        let titleStr = "AI Interview";
        if (i.company && i.role) {
          titleStr = `${i.company} ${i.role} Interview`;
        } else if (i.interview_type) {
          titleStr = `${i.interview_type} Interview`;
        }

        let durationStr = "N/A";
        if (i.started_at && i.completed_at) {
          const ds = new Date(i.started_at);
          const de = new Date(i.completed_at);
          const mins = Math.max(1, Math.round((de - ds) / 60000));
          durationStr = `${mins} min`;
        }

        sessions.push({
          id: `interview_${i.id}`,
          type: "interview",
          title: titleStr,
          date: new Date(i.completed_at).toISOString().split("T")[0],
          timestamp: new Date(i.completed_at).getTime(),
          score: i.overall_score || 0,
          duration: durationStr
        });
      });
    }

    // 2) Code Practice
    const { data: submissions } = await supabaseAdmin
      .from("submissions")
      .select("id, submitted_at, status, problems(title, difficulty)")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false });

    if (submissions) {
      submissions.forEach(s => {
        sessions.push({
          id: `practice_${s.id}`,
          type: "practice",
          title: s.problems?.title ? `${s.problems.title} - ${s.status}` : `Practice - ${s.status}`,
          date: new Date(s.submitted_at).toISOString().split("T")[0],
          timestamp: new Date(s.submitted_at).getTime(),
          score: s.status === "accepted" ? 100 : 0,
          duration: "N/A"
        });
      });
    }

    // 3) Resume Analysis
    const { data: resumes } = await supabaseAdmin
      .from("resume_analyses")
      .select("id, created_at, overall_score")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (resumes) {
      resumes.forEach(r => {
        sessions.push({
          id: `resume_${r.id}`,
          type: "resume",
          title: "Resume ATS Analysis",
          date: new Date(r.created_at).toISOString().split("T")[0],
          timestamp: new Date(r.created_at).getTime(),
          score: Math.round(r.overall_score) || 0,
          duration: "N/A"
        });
      });
    }

    // Sort by timestamp descending
    sessions.sort((a, b) => b.timestamp - a.timestamp);

    res.json({ sessions });
  } catch (error) {
    console.error("Error fetching user history:", error);
    res.status(500).json({ error: "Failed to fetch user history" });
  }
});

router.get("/learning-paths", authenticateToken, async (req, res) => {
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

router.get("/learning-paths/:pathId", authenticateToken, async (req, res) => {
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
      ai: aiLearningPath,
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

router.get("/progress", authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_progress")
      .select("problem_id, status")
      .eq("user_id", req.user.id);

    if (error) throw error;

    const progress = {};
    (data || []).forEach((row) => {
      progress[`problem_${row.problem_id}`] = {
        solved: row.status === "solved",
        progress: row.status === "solved" ? 100 : 0,
      };
    });

    res.json({ progress });
  } catch (error) {
    console.error("Error fetching progress:", error);
    res.status(500).json({ error: "Failed to fetch progress" });
  }
});

// Get complete DSA learning path
router.get("/learning-path/dsa", optionalAuth, async (req, res) => {
  try {
    let userProgress = {};

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

// Get specific module from DSA learning path
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

      let userProgress = {};

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

// Get complete LLD learning path
router.get("/learning-path/lld", optionalAuth, async (req, res) => {
  try {
    let completedProblems = {};

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

// Get specific module from LLD learning path
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

      let completedProblems = {};

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
