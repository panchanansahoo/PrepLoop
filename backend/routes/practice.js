import express from "express";
import { supabaseAdmin } from "../db/supabaseClient.js";
import { authenticateToken, optionalAuth } from "../middleware/auth.js";
import {
  all425Problems,
  getAllPatterns,
  getAllCompanies,
  getStatistics,
} from "../data/allProblems.js";
import { executeCode, buildTestWrapper, parseTestResults } from "../utils/executeCode.js";

const router = express.Router();

router.post("/submit", authenticateToken, async (req, res) => {
  const { problemId, code, language } = req.body;

  if (!problemId || !code || !language) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const { data: problem, error: problemError } = await supabaseAdmin
      .from("problems")
      .select("test_cases, starter_code")
      .eq("id", problemId)
      .single();

    if (problemError || !problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    const testCases = problem.test_cases || [];
    let testsPassed = 0;
    let testResults = [];

    // Try to detect function name from starter code
    const starterCode = problem.starter_code || {};
    const starterForLang = starterCode[language] || starterCode.python || '';
    const fnMatch = starterForLang.match(/(?:def |function |const |let |var |class )([\w]+)/);
    const fnName = fnMatch ? fnMatch[1] : 'solve';

    // Build and execute test wrapper for Python and JavaScript
    if ((language === 'python' || language === 'javascript') && testCases.length > 0 && testCases[0].input) {
      const wrappedCode = buildTestWrapper(code, language, testCases, fnName, starterForLang);
      const result = await executeCode(wrappedCode, language);

      if (result.success) {
        const parsed = parseTestResults(result.output);
        if (parsed) {
          testResults = parsed;
          testsPassed = parsed.filter(r => r.passed).length;
        } else {
          // Code ran but no test results marker found
          testResults = testCases.map(tc => ({ passed: false, expected: tc.output, actual: result.output, input: tc.input }));
        }
      } else {
        testResults = testCases.map(tc => ({ passed: false, expected: tc.output, actual: result.error || 'Runtime Error', input: tc.input, error: result.error }));
      }
    } else {
      // For other languages, just execute and do simple output comparison
      const result = await executeCode(code, language);
      if (result.success) {
        testResults = [{ passed: true, actual: result.output }];
        testsPassed = 1;
      } else {
        testResults = [{ passed: false, actual: result.error || 'Error' }];
      }
    }

    const totalTests = testCases.length || 1;
    const status = testsPassed === totalTests ? "accepted" : "wrong_answer";

    const { data: submission, error: subError } = await supabaseAdmin
      .from("submissions")
      .insert({
        user_id: req.user.id,
        problem_id: problemId,
        code,
        language,
        status,
        test_cases_passed: testsPassed,
        total_test_cases: totalTests,
      })
      .select()
      .single();

    if (subError) throw subError;

    // Upsert progress
    const progressStatus = status === "accepted" ? "solved" : "attempted";
    const { data: existingProgress } = await supabaseAdmin
      .from("user_progress")
      .select("*")
      .eq("user_id", req.user.id)
      .eq("problem_id", problemId)
      .single();

    let progress;
    if (existingProgress) {
      const updateData = {
        attempts: existingProgress.attempts + 1,
        last_attempt: new Date().toISOString(),
      };
      if (progressStatus === "solved" && existingProgress.status !== "solved") {
        updateData.status = "solved";
        updateData.solved_at = new Date().toISOString();
      }
      const { data } = await supabaseAdmin
        .from("user_progress")
        .update(updateData)
        .eq("user_id", req.user.id)
        .eq("problem_id", problemId)
        .select()
        .single();
      progress = data;
    } else {
      const { data } = await supabaseAdmin
        .from("user_progress")
        .insert({
          user_id: req.user.id,
          problem_id: problemId,
          status: progressStatus,
          attempts: 1,
          last_attempt: new Date().toISOString(),
          solved_at:
            progressStatus === "solved" ? new Date().toISOString() : null,
        })
        .select()
        .single();
      progress = data;
    }

    res.json({
      success: status === "accepted",
      submission,
      progress,
      testResults,
      testsPassed,
      totalTests,
      message:
        status === "accepted"
          ? "All test cases passed!"
          : `${testsPassed}/${totalTests} test cases passed`,
    });
  } catch (error) {
    console.error("Submission error:", error);
    res.status(500).json({ error: "Failed to submit solution" });
  }
});

router.get("/submissions", authenticateToken, async (req, res) => {
  try {
    const { problemId } = req.query;

    let query = supabaseAdmin
      .from("submissions")
      .select("*, problems(title)")
      .eq("user_id", req.user.id)
      .order("submitted_at", { ascending: false })
      .limit(50);

    if (problemId) {
      query = query.eq("problem_id", problemId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const submissions = (data || []).map((s) => ({
      ...s,
      problem_title: s.problems?.title,
      problems: undefined,
    }));

    res.json({ submissions });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

router.post("/run", optionalAuth, async (req, res) => {
  const { code, language, problemId } = req.body;

  try {
    // If problemId provided, fetch test cases and run against them
    if (problemId) {
      const { data: problem } = await supabaseAdmin
        .from("problems")
        .select("test_cases, starter_code, examples")
        .eq("id", problemId)
        .single();

      if (problem && problem.test_cases && problem.test_cases.length > 0) {
        const testCases = problem.test_cases;
        const starterCode = problem.starter_code || {};
        const starterForLang = starterCode[language] || starterCode.python || '';
        const fnMatch = starterForLang.match(/(?:def |function |const |let |var |class )([\w]+)/);
        const fnName = fnMatch ? fnMatch[1] : 'solve';

        if (language === 'python' || language === 'javascript') {
          const wrappedCode = buildTestWrapper(code, language, testCases, fnName, starterForLang);
          const result = await executeCode(wrappedCode, language);

          if (result.success) {
            const parsed = parseTestResults(result.output);
            if (parsed) {
              const passed = parsed.filter(r => r.passed).length;
              return res.json({
                success: true,
                testResults: parsed,
                passed,
                total: parsed.length,
                executionTime: result.executionTime,
                message: passed === parsed.length ? 'All test cases passed!' : `${passed}/${parsed.length} test cases passed`,
              });
            }
          }
          // If test wrapper failed, return raw execution result
          return res.json(result);
        }
      }
    }

    // Fallback: just execute the code directly
    const result = await executeCode(code, language);
    res.json(result);
  } catch (error) {
    console.error("Code execution error:", error);
    res.status(500).json({ error: "Failed to execute code" });
  }
});

router.post("/execute", optionalAuth, async (req, res) => {
  const { code, language, input } = req.body;

  try {
    const result = await executeCode(code, language, input);
    res.json(result);
  } catch (error) {
    console.error("Code execution error:", error);
    res.json({
      success: false,
      output: "",
      error: error.message,
      executionTime: 0,
    });
  }
});

router.get("/snippets", authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("code_snippets")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json({ snippets: data || [] });
  } catch (error) {
    console.error("Error fetching snippets:", error);
    res.status(500).json({ error: "Failed to fetch snippets" });
  }
});

router.post("/snippets", authenticateToken, async (req, res) => {
  try {
    const { name, code, language } = req.body;
    const { data, error } = await supabaseAdmin
      .from("code_snippets")
      .insert({ user_id: req.user.id, name, code, language })
      .select()
      .single();

    if (error) throw error;
    res.json({ snippet: data });
  } catch (error) {
    console.error("Error saving snippet:", error);
    res.status(500).json({ error: "Failed to save snippet" });
  }
});

// Get all 425 problems with optional filters
router.get("/all-problems", optionalAuth, async (req, res) => {
  try {
    const { pattern, difficulty, company, search } = req.query;

    let filteredProblems = [...all425Problems];

    if (pattern && pattern !== "all") {
      filteredProblems = filteredProblems.filter((p) => p.pattern === pattern);
    }

    if (difficulty && difficulty !== "all") {
      filteredProblems = filteredProblems.filter(
        (p) => p.difficulty === difficulty,
      );
    }

    if (company && company !== "all") {
      filteredProblems = filteredProblems.filter((p) =>
        p.companies?.includes(company),
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredProblems = filteredProblems.filter((p) =>
        p.title.toLowerCase().includes(searchLower),
      );
    }

    res.json({
      problems: filteredProblems,
      total: all425Problems.length,
      filtered: filteredProblems.length,
    });
  } catch (error) {
    console.error("Error fetching all problems:", error);
    res.status(500).json({ error: "Failed to fetch problems" });
  }
});

router.get("/statistics", optionalAuth, (req, res) => {
  try {
    const stats = getStatistics();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

router.get("/patterns-list", optionalAuth, (req, res) => {
  try {
    const patterns = getAllPatterns();
    res.json({ patterns });
  } catch (error) {
    console.error("Error fetching patterns:", error);
    res.status(500).json({ error: "Failed to fetch patterns" });
  }
});

router.get("/companies-list", optionalAuth, (req, res) => {
  try {
    const companies = getAllCompanies();
    res.json({ companies });
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ error: "Failed to fetch companies" });
  }
});



// Timed practice session
router.post("/timed-session", authenticateToken, async (req, res) => {
  try {
    const { difficulty, duration, count } = req.body;

    // Fetch random problems matching difficulty
    let query = supabaseAdmin
      .from("problems")
      .select("id, title, difficulty, pattern_id")
      .order("id");

    if (difficulty && difficulty !== "all") {
      query = query.eq("difficulty", difficulty);
    }

    const { data: problems, error } = await query;
    if (error) throw error;

    // Shuffle and pick requested count
    const shuffled = (problems || []).sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count || 5);

    res.json({
      sessionId: `timed_${Date.now()}`,
      problems: selected,
      duration: duration || 30,
      startedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Timed session error:", error);
    res.status(500).json({ error: "Failed to create timed session" });
  }
});



export default router;
