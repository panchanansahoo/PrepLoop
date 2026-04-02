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

const isProfilesAccessBlocked = (error) => {
  const code = String(error?.code || '').toUpperCase();
  const message = String(error?.message || '').toLowerCase();
  return code === '42P17' || message.includes('infinite recursion detected in policy');
};

const buildProfileResponse = (req, profile) => {
  const fullName = profile?.full_name || req.user.user_metadata?.full_name || '';
  const subscriptionTier = profile?.subscription_tier || 'free';
  const experienceLevel = profile?.experience_level || 'beginner';
  const role = profile?.role || 'user';
  const experienceSummary = profile?.experience_summary || '';
  const experienceYears = profile?.experience_years ?? null;

  const flatProfile = {
    id: profile?.id || req.user.id,
    email: req.user.email,
    fullName,
    full_name: fullName,
    subscriptionTier,
    subscription_tier: subscriptionTier,
    experienceLevel,
    experience_level: experienceLevel,
    role,
    created_at: profile?.created_at || null,
    last_login: profile?.last_login || null,
    bio: profile?.bio || '',
    currentRole: profile?.designation || profile?.current_role || '',
    skills: profile?.skills || '',
    education: profile?.education || '',
    experience: experienceSummary || (experienceYears != null ? String(experienceYears) : experienceLevel),
    experienceSummary,
    experienceYears,
    company: profile?.company || '',
    designation: profile?.designation || '',
    avatar_url: profile?.avatar_url || '',
  };

  return {
    user: {
      id: flatProfile.id,
      email: flatProfile.email,
      full_name: flatProfile.full_name,
      subscription_tier: flatProfile.subscription_tier,
      experience_level: flatProfile.experience_level,
      created_at: flatProfile.created_at,
      last_login: flatProfile.last_login,
      role: flatProfile.role,
      bio: flatProfile.bio,
      current_role: flatProfile.currentRole,
      skills: flatProfile.skills,
      education: flatProfile.education,
      experience: flatProfile.experience,
      experience_summary: flatProfile.experienceSummary,
      experience_years: flatProfile.experienceYears,
      company: flatProfile.company,
      designation: flatProfile.designation,
      avatar_url: flatProfile.avatar_url,
    },
    profile: flatProfile,
    ...flatProfile,
  };
};

const normalizeProfileUpdatePayload = (body = {}) => {
  const updates = {};

  const fullName = body.fullName || body.full_name;
  const experienceLevel = body.experienceLevel || body.experience_level;
  const currentRole = body.currentRole || body.current_role || body.designation;
  const bio = body.bio;
  const skills = body.skills;
  const education = body.education;

  if (fullName) updates.full_name = fullName;
  if (experienceLevel) updates.experience_level = experienceLevel;
  if (currentRole) updates.designation = currentRole;
  if (bio !== undefined) updates.bio = bio;
  if (skills !== undefined) updates.skills = skills;
  if (education !== undefined) updates.education = education;

  const experienceValue = body.experienceSummary || body.experience_summary || body.experience;
  if (experienceValue !== undefined && experienceValue !== null && String(experienceValue).trim() !== '') {
    const trimmed = String(experienceValue).trim();
    const numericExperience = Number(trimmed);

    if (Number.isFinite(numericExperience) && /^\d+(?:\.\d+)?$/.test(trimmed)) {
      updates.experience_years = numericExperience;
      updates.experience_summary = null;
    } else {
      updates.experience_summary = trimmed;
    }
  }

  return updates;
};

const XP_BY_DIFFICULTY = {
  easy: 10,
  medium: 25,
  hard: 50,
};

const LEVELS = [
  { name: 'Novice', minXP: 0 },
  { name: 'Apprentice', minXP: 100 },
  { name: 'Intermediate', minXP: 350 },
  { name: 'Advanced', minXP: 800 },
  { name: 'Expert', minXP: 1800 },
  { name: 'Master', minXP: 4000 },
  { name: 'Grandmaster', minXP: 8000 },
  { name: 'Legend', minXP: 15000 },
];

const getLevelInfo = (xp) => {
  const safeXP = Number(xp) || 0;

  for (let index = LEVELS.length - 1; index >= 0; index -= 1) {
    if (safeXP >= LEVELS[index].minXP) {
      return { ...LEVELS[index], index };
    }
  }

  return { ...LEVELS[0], index: 0 };
};

const getLevelProgressInfo = (xp) => {
  const totalXP = Number(xp) || 0;
  const currentLevel = getLevelInfo(totalXP);
  const nextLevel = LEVELS[currentLevel.index + 1] || null;

  if (!nextLevel) {
    return {
      currentLevel,
      currentXP: totalXP,
      nextLevelXP: totalXP,
      rank: currentLevel.name,
    };
  }

  return {
    currentLevel,
    currentXP: totalXP - currentLevel.minXP,
    nextLevelXP: nextLevel.minXP,
    rank: currentLevel.name,
  };
};

const getWeekRange = (offsetWeeks = 0) => {
  const start = new Date();
  start.setDate(start.getDate() - start.getDay() - (offsetWeeks * 7));
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  return { start, end };
};

const buildWeeklyStats = (submissions, start, end) => {
  const accepted = (submissions || []).filter((submission) => {
    const submittedAt = new Date(submission.submitted_at);
    return submission.status === 'accepted' && submittedAt >= start && submittedAt < end;
  });

  const totals = accepted.reduce((accumulator, submission) => {
    const difficulty = String(submission.problems?.difficulty || '').toLowerCase();
    const executionTime = Number(submission.execution_time) || 0;

    accumulator.problems += 1;
    accumulator.timeHours += executionTime / 3600;
    accumulator.xp += XP_BY_DIFFICULTY[difficulty] || XP_BY_DIFFICULTY.easy;
    return accumulator;
  }, { problems: 0, timeHours: 0, xp: 0 });

  return {
    problems: totals.problems,
    time: Number(totals.timeHours.toFixed(1)),
    xp: totals.xp,
  };
};

router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (isProfilesAccessBlocked(error)) {
      return res.json({
        ...buildProfileResponse(req, {
          id: req.user.id,
          full_name: req.user.user_metadata?.full_name || '',
          subscription_tier: 'free',
          experience_level: 'beginner',
          role: 'user',
        }),
        degraded: true,
      });
    }

    if (error || !profile) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(buildProfileResponse(req, profile));
  } catch (error) {
    console.error("Error fetching profile:", error);
    if (isProfilesAccessBlocked(error)) {
      return res.json({
        ...buildProfileResponse(req, {
          id: req.user.id,
          full_name: req.user.user_metadata?.full_name || '',
          subscription_tier: 'free',
          experience_level: 'beginner',
          role: 'user',
        }),
        degraded: true,
      });
    }
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const updates = normalizeProfileUpdatePayload(req.body);

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

    res.json(buildProfileResponse(req, data));
  } catch (error) {
    console.error("Error updating profile:", error);
    if (isProfilesAccessBlocked(error)) {
      return res.status(503).json({ error: "Profile update is temporarily unavailable", degraded: true });
    }
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
      .select("id, submitted_at, status, problem_id, execution_time, problems(title, difficulty, tags)")
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

    // ── 7) Total XP (derived from real activity) ──
    const acceptedSubmissions = subs.filter((submission) => submission.status === 'accepted');
    const totalProblemXP = acceptedSubmissions.reduce((sum, submission) => {
      const difficulty = String(submission.problems?.difficulty || '').toLowerCase();
      return sum + (XP_BY_DIFFICULTY[difficulty] || XP_BY_DIFFICULTY.easy);
    }, 0);
    const totalXP = totalProblemXP + (completedInterviews.length * 50);

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
    const thisWeekRange = getWeekRange(0);
    const lastWeekRange = getWeekRange(1);

    const thisWeek = buildWeeklyStats(subs, thisWeekRange.start, thisWeekRange.end);
    const lastWeek = buildWeeklyStats(subs, lastWeekRange.start, lastWeekRange.end);

    const levelInfo = getLevelProgressInfo(totalXP);

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
      thisWeekProblems: thisWeek.problems,
      lastWeekProblems: lastWeek.problems,
      thisWeekTime: thisWeek.time,
      lastWeekTime: lastWeek.time,
      thisWeekXP: thisWeek.xp,
      lastWeekXP: lastWeek.xp,
      currentLevel: levelInfo.currentLevel.index + 1,
      currentXP: levelInfo.currentXP,
      nextLevelXP: levelInfo.nextLevelXP,
      rank: levelInfo.rank,
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

// Get/Update user settings
router.get("/settings", authenticateToken, async (req, res) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (isProfilesAccessBlocked(error)) {
      return res.json({
        settings: {
          full_name: req.user.user_metadata?.full_name || '',
          experience_level: 'beginner',
          subscription_tier: 'free',
        },
        degraded: true,
      });
    }

    if (error || !profile) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      settings: {
        full_name: profile.full_name,
        experience_level: profile.experience_level,
        subscription_tier: profile.subscription_tier,
      },
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    if (isProfilesAccessBlocked(error)) {
      return res.json({
        settings: {
          full_name: req.user.user_metadata?.full_name || '',
          experience_level: 'beginner',
          subscription_tier: 'free',
        },
        degraded: true,
      });
    }
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

router.put("/settings", authenticateToken, async (req, res) => {
  try {
    const { fullName, experienceLevel } = req.body;
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
      settings: {
        full_name: data.full_name,
        experience_level: data.experience_level,
        subscription_tier: data.subscription_tier,
      },
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    if (isProfilesAccessBlocked(error)) {
      return res.status(503).json({ error: "Settings update is temporarily unavailable", degraded: true });
    }
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// Save user preferences (onboarding)
router.post("/preferences", authenticateToken, async (req, res) => {
  try {
    const { experienceLevel, goals, targetCompanies } = req.body;
    const updates = {};
    if (experienceLevel) updates.experience_level = experienceLevel;

    if (Object.keys(updates).length > 0) {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update(updates)
        .eq("id", req.user.id);

      if (error) throw error;
    }

    res.json({ success: true, message: "Preferences saved" });
  } catch (error) {
    console.error("Error saving preferences:", error);
    if (isProfilesAccessBlocked(error)) {
      return res.status(503).json({ error: "Preferences update is temporarily unavailable", degraded: true });
    }
    res.status(500).json({ error: "Failed to save preferences" });
  }
});

// ==========================================
// TODO CRUD ENDPOINTS
// ==========================================

// GET /api/user/todos - List user's todos
router.get("/todos", authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_todos")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Transform to match frontend format
    const todos = (data || []).map(t => ({
      id: t.id,
      text: t.text,
      done: t.completed,
      priority: t.priority || 'medium',
      category: (t.category || 'Study').toLowerCase(),
      dueDate: t.due_date,
      createdAt: t.created_at,
      subtasks: t.subtasks || [],
    }));

    res.json({ todos });
  } catch (error) {
    console.error("Error fetching todos:", error);
    res.status(500).json({ error: "Failed to fetch todos" });
  }
});

// POST /api/user/todos - Create a todo
router.post("/todos", authenticateToken, async (req, res) => {
  try {
    const { text, priority, category, dueDate, subtasks } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Todo text is required" });
    }

    const { data, error } = await supabaseAdmin
      .from("user_todos")
      .insert({
        user_id: req.user.id,
        text: text.trim(),
        priority: priority || 'medium',
        category: category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Study',
        due_date: dueDate || null,
        subtasks: subtasks || [],
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      todo: {
        id: data.id,
        text: data.text,
        done: data.completed,
        priority: data.priority,
        category: (data.category || 'Study').toLowerCase(),
        dueDate: data.due_date,
        createdAt: data.created_at,
        subtasks: data.subtasks || [],
      }
    });
  } catch (error) {
    console.error("Error creating todo:", error);
    res.status(500).json({ error: "Failed to create todo" });
  }
});

// PUT /api/user/todos/:id - Update a todo
router.put("/todos/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { text, completed, priority, category, dueDate, subtasks } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (text !== undefined) updates.text = text.trim();
    if (completed !== undefined) updates.completed = completed;
    if (priority !== undefined) updates.priority = priority;
    if (category !== undefined) updates.category = category.charAt(0).toUpperCase() + category.slice(1);
    if (dueDate !== undefined) updates.due_date = dueDate;
    if (subtasks !== undefined) updates.subtasks = subtasks;

    const { data, error } = await supabaseAdmin
      .from("user_todos")
      .update(updates)
      .eq("id", id)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      todo: {
        id: data.id,
        text: data.text,
        done: data.completed,
        priority: data.priority,
        category: (data.category || 'Study').toLowerCase(),
        dueDate: data.due_date,
        createdAt: data.created_at,
        subtasks: data.subtasks || [],
      }
    });
  } catch (error) {
    console.error("Error updating todo:", error);
    res.status(500).json({ error: "Failed to update todo" });
  }
});

// DELETE /api/user/todos/:id - Delete a todo
router.delete("/todos/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from("user_todos")
      .delete()
      .eq("id", id)
      .eq("user_id", req.user.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting todo:", error);
    res.status(500).json({ error: "Failed to delete todo" });
  }
});

// DELETE /api/user/todos - Clear completed todos
router.delete("/todos", authenticateToken, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from("user_todos")
      .delete()
      .eq("user_id", req.user.id)
      .eq("completed", true);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error("Error clearing completed todos:", error);
    res.status(500).json({ error: "Failed to clear completed todos" });
  }
});

// ==========================================
// CALENDAR EVENTS CRUD ENDPOINTS
// ==========================================

// GET /api/user/calendar-events - List user's calendar events
router.get("/calendar-events", authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_calendar_events")
      .select("*")
      .eq("user_id", req.user.id)
      .order("event_date", { ascending: true });

    if (error) throw error;

    // Group events by date key (YYYY-MM-DD)
    const eventsByDate = {};
    (data || []).forEach(evt => {
      const key = evt.event_date;
      if (!eventsByDate[key]) eventsByDate[key] = [];
      eventsByDate[key].push({
        id: evt.id,
        title: evt.title,
        time: evt.event_time || '',
        tag: evt.tag || 'study',
      });
    });

    res.json({ events: eventsByDate });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    res.status(500).json({ error: "Failed to fetch calendar events" });
  }
});

// POST /api/user/calendar-events - Create a calendar event
router.post("/calendar-events", authenticateToken, async (req, res) => {
  try {
    const { title, date, time, tag } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Event title is required" });
    }
    if (!date) {
      return res.status(400).json({ error: "Event date is required" });
    }

    const { data, error } = await supabaseAdmin
      .from("user_calendar_events")
      .insert({
        user_id: req.user.id,
        title: title.trim(),
        event_date: date,
        event_time: time || null,
        tag: tag || 'study',
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      event: {
        id: data.id,
        title: data.title,
        time: data.event_time || '',
        tag: data.tag || 'study',
        date: data.event_date,
      }
    });
  } catch (error) {
    console.error("Error creating calendar event:", error);
    res.status(500).json({ error: "Failed to create calendar event" });
  }
});

// PUT /api/user/calendar-events/:id - Update a calendar event
router.put("/calendar-events/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, time, tag } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (time !== undefined) updates.event_time = time;
    if (tag !== undefined) updates.tag = tag;

    const { data, error } = await supabaseAdmin
      .from("user_calendar_events")
      .update(updates)
      .eq("id", id)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      event: {
        id: data.id,
        title: data.title,
        time: data.event_time || '',
        tag: data.tag || 'study',
        date: data.event_date,
      }
    });
  } catch (error) {
    console.error("Error updating calendar event:", error);
    res.status(500).json({ error: "Failed to update calendar event" });
  }
});

// DELETE /api/user/calendar-events/:id - Delete a calendar event
router.delete("/calendar-events/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from("user_calendar_events")
      .delete()
      .eq("id", id)
      .eq("user_id", req.user.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    res.status(500).json({ error: "Failed to delete calendar event" });
  }
});

// ==========================================
// DAILY CHALLENGE ENDPOINT
// ==========================================

// GET /api/user/daily-challenge - Get today's daily challenge
router.get("/daily-challenge", optionalAuth, async (req, res) => {
  try {
    // Use a simple seed from today's date to pick a consistent company for the day
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

    // Import daily challenges data dynamically (same data as frontend)
    // We'll return the seed index so frontend can use it
    res.json({
      seed,
      dayOfYear: Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000),
      date: today.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error("Error fetching daily challenge:", error);
    res.status(500).json({ error: "Failed to fetch daily challenge" });
  }
});

export default router;
