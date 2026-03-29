import express from "express";
import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
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
const PROBLEM_SOLVE_COIN_REWARD = 10;

const isSchemaMissingError = (error) => {
  const code = String(error?.code || '').toUpperCase();
  const combined = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase();
  return (
    code === '42703' ||
    code === '42P01' ||
    combined.includes('does not exist') ||
    combined.includes('could not find') ||
    combined.includes('relationship')
  );
};

const awardFirstSolveCoins = async ({ userId, problemId, problemTitle }) => {
  const description = `Problem solved: ${problemId} - ${problemTitle || 'Unknown Problem'}`.slice(0, 160);

  const { data: existingReward } = await supabaseAdmin
    .from('coin_transactions')
    .select('id')
    .eq('user_id', userId)
    .eq('type', 'earn')
    .eq('description', description)
    .limit(1);

  if (existingReward?.length) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('coins')
      .eq('id', userId)
      .single();

    return { coinsAwarded: 0, currentCoins: profile?.coins || 0 };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('coins')
    .eq('id', userId)
    .single();

  if (profileError) throw profileError;

  const newBalance = (profile?.coins || 0) + PROBLEM_SOLVE_COIN_REWARD;

  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ coins: newBalance })
    .eq('id', userId);

  if (updateError) throw updateError;

  await supabaseAdmin.from('coin_transactions').insert({
    user_id: userId,
    amount: PROBLEM_SOLVE_COIN_REWARD,
    type: 'earn',
    description,
  });

  return { coinsAwarded: PROBLEM_SOLVE_COIN_REWARD, currentCoins: newBalance };
};

const slugifyProblemTitle = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const detectFunctionName = (starterCode = "", userCode = "", language = "") => {
  const code = (starterCode || userCode || "").toString();

  if (language === "python") {
    // Prefer Solution class method when present (most LeetCode-style Python problems).
    const solutionMethodMatch = code.match(
      /class\s+Solution[\s\S]*?def\s+([A-Za-z_]\w*)\s*\(/,
    );
    if (solutionMethodMatch?.[1]) return solutionMethodMatch[1];

    const pyDefMatch = code.match(/def\s+([A-Za-z_]\w*)\s*\(/);
    if (pyDefMatch?.[1] && pyDefMatch[1] !== "__init__") return pyDefMatch[1];
  }

  if (language === "javascript" || language === "typescript") {
    const solutionMethodMatch = code.match(
      /class\s+Solution[\s\S]*?(?:^|\n)\s*(?!constructor\b)([A-Za-z_]\w*)\s*\(/m,
    );
    if (solutionMethodMatch?.[1]) return solutionMethodMatch[1];

    const fnDeclMatch = code.match(/function\s+([A-Za-z_]\w*)\s*\(/);
    if (fnDeclMatch?.[1]) return fnDeclMatch[1];

    const fnExprMatch = code.match(/(?:const|let|var)\s+([A-Za-z_]\w*)\s*=\s*(?:\([^)]*\)|[A-Za-z_]\w*)\s*=>/);
    if (fnExprMatch?.[1]) return fnExprMatch[1];

    const assignedFnMatch = code.match(/(?:const|let|var)\s+([A-Za-z_]\w*)\s*=\s*function\s*\(/);
    if (assignedFnMatch?.[1]) return assignedFnMatch[1];
  }

  const fallbackMatch = code.match(/(?:def|function|const|let|var)\s+([A-Za-z_]\w*)/);
  return fallbackMatch?.[1] || "solve";
};

const stableStringify = (value) => {
  if (value === null || value === undefined) return String(value);
  if (typeof value !== "object") return String(value);

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
};

const normalizeTextOutput = (value) =>
  String(value ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();

const tryParseJsonValue = (value) => {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const JUDGE_PROFILE_BY_SLUG = {
  // Flat arrays where order is not semantically important.
  "two-sum": "unordered-flat-array",
  "top-k-frequent-elements": "unordered-flat-array",
  "intersection-of-two-arrays": "unordered-flat-array",
  "intersection-of-two-arrays-ii": "unordered-flat-array",
  "find-all-numbers-disappeared-in-array": "unordered-flat-array",
  "find-all-duplicates-in-array": "unordered-flat-array",
  "majority-element-ii": "unordered-flat-array",
  "word-search-ii": "unordered-flat-array",
  "letter-combinations-of-a-phone-number": "unordered-flat-array",
  "generate-parentheses": "unordered-flat-array",
  "letter-case-permutation": "unordered-flat-array",
  "restore-ip-addresses": "unordered-flat-array",
  "course-schedule-ii": "unordered-flat-array",
  "minimum-height-trees": "unordered-flat-array",

  // Nested arrays where both outer and inner order can vary.
  "3sum": "unordered-nested-unordered",
  "4sum": "unordered-nested-unordered",
  "subsets": "unordered-nested-unordered",
  "subsets-ii": "unordered-nested-unordered",
  "combination-sum": "unordered-nested-unordered",
  "combination-sum-ii": "unordered-nested-unordered",
  "combination-sum-iii": "unordered-nested-unordered",
  "combinations": "unordered-nested-unordered",

  // Nested arrays where outer order can vary but inner order matters.
  "permutations": "unordered-nested-ordered",
  "permutations-ii": "unordered-nested-ordered",
  "palindrome-partitioning": "unordered-nested-ordered",
  "n-queens": "unordered-nested-ordered",
  "all-paths-from-source-to-target": "unordered-nested-ordered",
  "word-ladder-ii": "unordered-nested-ordered",
  "pacific-atlantic-water-flow": "unordered-nested-ordered",
  "path-sum-ii": "unordered-nested-ordered",

  // Grouping outputs where order of groups/items is not semantically important.
  "group-anagrams": "unordered-anagram-groups",
};

const JUDGE_PROFILE_BY_FUNCTION_NAME = {
  twosum: "unordered-flat-array",
  topkfrequent: "unordered-flat-array",
  intersection: "unordered-flat-array",
  intersect: "unordered-flat-array",
  finddisappearednumbers: "unordered-flat-array",
  findduplicates: "unordered-flat-array",
  majorityelement: "unordered-flat-array",
  findwords: "unordered-flat-array",
  lettercombinations: "unordered-flat-array",
  generateparenthesis: "unordered-flat-array",
  lettercasepermutation: "unordered-flat-array",
  restoreipaddresses: "unordered-flat-array",
  findorder: "unordered-flat-array",
  findminheighttrees: "unordered-flat-array",
  threesum: "unordered-nested-unordered",
  foursum: "unordered-nested-unordered",
  subsets: "unordered-nested-unordered",
  combinationsum: "unordered-nested-unordered",
  combinationsum3: "unordered-nested-unordered",
  combine: "unordered-nested-unordered",
  permute: "unordered-nested-ordered",
  permuteunique: "unordered-nested-ordered",
  partition: "unordered-nested-ordered",
  solvenqueens: "unordered-nested-ordered",
  allpathssourcetarget: "unordered-nested-ordered",
  findladders: "unordered-nested-ordered",
  pacificatlantic: "unordered-nested-ordered",
  groupanagrams: "unordered-anagram-groups",
};

const getJudgeProfile = (problemTitle = "", fnName = "") => {
  const slug = slugifyProblemTitle(problemTitle);
  if (JUDGE_PROFILE_BY_SLUG[slug]) {
    return JUDGE_PROFILE_BY_SLUG[slug];
  }

  const normalizedFnName = String(fnName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (JUDGE_PROFILE_BY_FUNCTION_NAME[normalizedFnName]) {
    return JUDGE_PROFILE_BY_FUNCTION_NAME[normalizedFnName];
  }

  return "strict";
};

const toComparableValue = (value) => {
  if (typeof value !== "string") return value;
  const parsed = tryParseJsonValue(value);
  return parsed !== null ? parsed : value;
};

const normalizeUnorderedFlatArray = (arr) =>
  arr
    .map((item) => stableStringify(item))
    .sort();

const normalizeUnorderedNestedOrderedArray = (arr) =>
  arr
    .map((item) => stableStringify(item))
    .sort();

const normalizeUnorderedNestedUnorderedArray = (arr) =>
  arr
    .map((item) => {
      if (!Array.isArray(item)) return stableStringify(item);
      const normalizedInner = item.map((inner) => stableStringify(inner)).sort();
      return `[${normalizedInner.join(",")}]`;
    })
    .sort();

const normalizeAnagramGroups = (arr) =>
  arr
    .map((group) => {
      if (!Array.isArray(group)) return stableStringify(group);
      const normalizedGroup = group.map((word) => String(word)).sort();
      return `[${normalizedGroup.join(",")}]`;
    })
    .sort();

const compareExpectedActual = (expected, actual, judgeProfile = "strict") => {
  const expectedStr = normalizeTextOutput(expected);
  const actualStr = normalizeTextOutput(actual);

  if (expectedStr === actualStr) return true;

  const expectedNum = Number(expectedStr);
  const actualNum = Number(actualStr);
  if (!Number.isNaN(expectedNum) && !Number.isNaN(actualNum)) {
    return Math.abs(expectedNum - actualNum) <= 1e-6;
  }

  const parsedExpectedFromActual = tryParseJsonValue(actualStr);
  const parsedActualFromExpected = tryParseJsonValue(expectedStr);

  if (parsedExpectedFromActual !== null) {
    const normalizedExpected =
      typeof expected === "string" ? (tryParseJsonValue(expectedStr) ?? expectedStr) : expected;
    if (stableStringify(normalizedExpected) === stableStringify(parsedExpectedFromActual)) {
      return true;
    }
  }

  if (parsedActualFromExpected !== null) {
    const normalizedActual =
      typeof actual === "string" ? (tryParseJsonValue(actualStr) ?? actualStr) : actual;
    if (stableStringify(parsedActualFromExpected) === stableStringify(normalizedActual)) {
      return true;
    }
  }

  // LeetCode-like custom comparators for order-insensitive outputs.
  const expectedValue = toComparableValue(expected);
  const actualValue = toComparableValue(actual);

  if (judgeProfile === "unordered-flat-array") {
    if (Array.isArray(expectedValue) && Array.isArray(actualValue)) {
      return stableStringify(normalizeUnorderedFlatArray(expectedValue)) === stableStringify(normalizeUnorderedFlatArray(actualValue));
    }
  }

  if (judgeProfile === "unordered-nested-ordered") {
    if (Array.isArray(expectedValue) && Array.isArray(actualValue)) {
      return stableStringify(normalizeUnorderedNestedOrderedArray(expectedValue)) === stableStringify(normalizeUnorderedNestedOrderedArray(actualValue));
    }
  }

  if (judgeProfile === "unordered-nested-unordered") {
    if (Array.isArray(expectedValue) && Array.isArray(actualValue)) {
      return stableStringify(normalizeUnorderedNestedUnorderedArray(expectedValue)) === stableStringify(normalizeUnorderedNestedUnorderedArray(actualValue));
    }
  }

  if (judgeProfile === "unordered-anagram-groups") {
    if (Array.isArray(expectedValue) && Array.isArray(actualValue)) {
      return stableStringify(normalizeAnagramGroups(expectedValue)) === stableStringify(normalizeAnagramGroups(actualValue));
    }
  }

  return false;
};

const inputToStdinString = (input) => {
  if (typeof input === "string") return input;
  if (Array.isArray(input)) return input.map((item) => (typeof item === "string" ? item : JSON.stringify(item))).join("\n");
  if (input === null || input === undefined) return "";
  return JSON.stringify(input);
};

const normalizeLintLanguage = (value = "") => {
  const raw = String(value || "").trim().toLowerCase();
  const aliases = {
    js: "javascript",
    node: "javascript",
    py: "python",
    python3: "python",
    cxx: "cpp",
    "c++": "cpp",
  };
  return aliases[raw] || raw;
};

const resolvePythonCommand = () => {
  const candidates = ["python3", "python", "py"];
  for (const cmd of candidates) {
    try {
      execSync(`${cmd} --version`, { stdio: "pipe", timeout: 3000, shell: true });
      return cmd;
    } catch {
      // try next command
    }
  }
  return null;
};

const resolveCommand = (candidates = []) => {
  for (const cmd of candidates) {
    try {
      execSync(`${cmd} --version`, { stdio: "pipe", timeout: 3000, shell: true });
      return cmd;
    } catch {
      // try next command
    }
  }
  return null;
};

const extractPythonSyntaxError = (stderr = "") => {
  const output = String(stderr || "");
  const lineMatch = output.match(/line\s+(\d+)/i);
  const line = lineMatch?.[1] ? Number(lineMatch[1]) : 1;

  const lines = output.split("\n").map((lineText) => lineText.trim()).filter(Boolean);
  const syntaxLine = lines.find((lineText) => lineText.includes("SyntaxError")) || "Syntax error";
  return {
    line: Number.isFinite(line) ? line : 1,
    col: 1,
    severity: "error",
    message: syntaxLine,
  };
};

const extractCompilerSyntaxErrors = (stderr = "", fallbackMessage = "Syntax error") => {
  const output = String(stderr || "")
    .replace(/\u001b\[[0-9;]*m/g, "")
    .replace(/\r/g, "");
  const lines = output.split("\n");
  const errors = [];

  const colonLineColStyle = /:(\d+):(\d+):\s*(fatal error|error|warning)[:\s]+(.+)$/i;
  const parenLineColStyle = /\((\d+),(\d+)\):\s*(fatal error|error|warning)[:\s]+(.+)$/i;
  const lineOnlyStyle = /:(\d+):\s*(fatal error|error|warning)[:\s]+(.+)$/i;
  const pythonicLineOnlyStyle = /line\s+(\d+).*?(fatal error|error|warning)[:\s]+(.+)$/i;

  for (let i = 0; i < lines.length; i += 1) {
    const lineText = lines[i] || "";

    const colonLineColMatch = lineText.match(colonLineColStyle);
    if (colonLineColMatch) {
      errors.push({
        line: Number(colonLineColMatch[1]) || 1,
        col: Number(colonLineColMatch[2]) || 1,
        severity: colonLineColMatch[3].toLowerCase().includes("warning") ? "warning" : "error",
        message: colonLineColMatch[4].trim(),
      });
      continue;
    }

    const parenLineColMatch = lineText.match(parenLineColStyle);
    if (parenLineColMatch) {
      errors.push({
        line: Number(parenLineColMatch[1]) || 1,
        col: Number(parenLineColMatch[2]) || 1,
        severity: parenLineColMatch[3].toLowerCase().includes("warning") ? "warning" : "error",
        message: parenLineColMatch[4].trim(),
      });
      continue;
    }

    const lineOnlyMatch = lineText.match(lineOnlyStyle);
    if (lineOnlyMatch) {
      const pointerLine = lines[i + 2] || "";
      const caretIndex = pointerLine.indexOf("^");
      errors.push({
        line: Number(lineOnlyMatch[1]) || 1,
        col: caretIndex >= 0 ? caretIndex + 1 : 1,
        severity: lineOnlyMatch[2].toLowerCase().includes("warning") ? "warning" : "error",
        message: lineOnlyMatch[3].trim(),
      });
      continue;
    }

    const pythonicLineOnlyMatch = lineText.match(pythonicLineOnlyStyle);
    if (pythonicLineOnlyMatch) {
      errors.push({
        line: Number(pythonicLineOnlyMatch[1]) || 1,
        col: 1,
        severity: pythonicLineOnlyMatch[2].toLowerCase().includes("warning") ? "warning" : "error",
        message: pythonicLineOnlyMatch[3].trim(),
      });
      continue;
    }
  }

  if (errors.length > 0) return errors.slice(0, 20);

  const firstMeaningfulLine = lines
    .map((lineText) => lineText.trim())
    .find((lineText) => lineText && !lineText.startsWith("^") && !lineText.includes("compilation terminated"));

  return [{ line: 1, col: 1, severity: "error", message: firstMeaningfulLine || fallbackMessage }];
};

const evaluateWithStdinCases = async (code, language, testCases = [], judgeProfile = "strict") => {
  const testResults = [];
  let testsPassed = 0;

  for (const tc of testCases) {
    const inputText = inputToStdinString(tc?.input);
    const execResult = await executeCode(code, language, inputText);

    const actual = execResult.success ? normalizeTextOutput(execResult.output) : (execResult.error || "Runtime Error");
    const expected = tc?.output;
    const passed = execResult.success && compareExpectedActual(expected, actual, judgeProfile);

    if (passed) testsPassed += 1;

    testResults.push({
      passed,
      expected,
      actual,
      input: tc?.input,
      ...(execResult.success ? {} : { error: execResult.error || "Runtime Error" }),
    });
  }

  return { testResults, testsPassed };
};

const resolveProblemRecord = async (problemIdentifier) => {
  if (!problemIdentifier) return null;

  const identifierValue =
    typeof problemIdentifier === "object" && problemIdentifier !== null
      ? (problemIdentifier.id ?? problemIdentifier.problemId ?? problemIdentifier.slug ?? problemIdentifier.title ?? "")
      : problemIdentifier;

  const rawIdentifier = String(identifierValue).trim();
  if (!rawIdentifier) return null;

  if (/^\d+$/.test(rawIdentifier)) {
    const numericId = Number(rawIdentifier);
    const { data: byId } = await supabaseAdmin
      .from("problems")
      .select("id, title, test_cases, starter_code, examples")
      .eq("id", numericId)
      .single();

    if (byId) return byId;
  }

  const normalizedIdentifier = slugifyProblemTitle(rawIdentifier);
  const titleFromSlug = rawIdentifier.replace(/[-_]+/g, " ").trim().toLowerCase();

  const staticProblemMatch =
    all425Problems.find((problem) => String(problem.id) === rawIdentifier) ||
    all425Problems.find((problem) => slugifyProblemTitle(problem.title) === normalizedIdentifier) ||
    all425Problems.find((problem) => problem.title?.toLowerCase() === rawIdentifier.toLowerCase()) ||
    all425Problems.find((problem) => problem.title?.toLowerCase() === titleFromSlug) ||
    null;

  const titleSlugsToMatch = new Set([normalizedIdentifier]);
  const titlesToMatch = new Set([rawIdentifier.toLowerCase(), titleFromSlug]);

  if (staticProblemMatch?.title) {
    titleSlugsToMatch.add(slugifyProblemTitle(staticProblemMatch.title));
    titlesToMatch.add(String(staticProblemMatch.title).toLowerCase());
  }

  const { data: candidates } = await supabaseAdmin
    .from("problems")
    .select("id, title, test_cases, starter_code, examples")
    .limit(1500);

  if (!candidates || !candidates.length) return null;

  return (
    candidates.find((problem) => titleSlugsToMatch.has(slugifyProblemTitle(problem.title))) ||
    candidates.find((problem) => titlesToMatch.has(problem.title?.toLowerCase())) ||
    null
  );
};

router.post("/submit", authenticateToken, async (req, res) => {
  const { problemId, code, language } = req.body;

  if (!problemId || !code || !language) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const problem = await resolveProblemRecord(problemId);

    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    const canonicalProblemId = problem.id;

    const testCases = problem.test_cases || [];
    const hasTestCases = Array.isArray(testCases) && testCases.length > 0;
    let testsPassed = 0;
    let testResults = [];

    // Try to detect function name from starter code
    const starterCode = problem.starter_code || {};
    const starterForLang = starterCode[language] || starterCode.python || '';
    const fnName = detectFunctionName(starterForLang, code, language);
    const judgeProfile = getJudgeProfile(problem.title, fnName);

    // Build and execute test wrapper for Python and JavaScript
    if ((language === 'python' || language === 'javascript') && hasTestCases) {
      const wrappedCode = buildTestWrapper(code, language, testCases, fnName, starterForLang);
      const result = await executeCode(wrappedCode, language);

      if (result.success) {
        const parsed = parseTestResults(result.output);
        if (parsed) {
          testResults = parsed.map((r) => ({
            ...r,
            passed: !r.error && compareExpectedActual(r.expected, r.actual, judgeProfile),
          }));
          testsPassed = testResults.filter(r => r.passed).length;
        } else {
          // Wrapper did not return structured marker, fallback to stdin-based evaluation.
          const evaluated = await evaluateWithStdinCases(code, language, testCases, judgeProfile);
          testResults = evaluated.testResults;
          testsPassed = evaluated.testsPassed;
        }
      } else {
        testResults = testCases.map(tc => ({ passed: false, expected: tc.output, actual: result.error || 'Runtime Error', input: tc.input, error: result.error }));
      }
    } else if (hasTestCases) {
      const evaluated = await evaluateWithStdinCases(code, language, testCases, judgeProfile);
      testResults = evaluated.testResults;
      testsPassed = evaluated.testsPassed;
    } else {
      // No test cases configured: direct execution fallback.
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
        problem_id: canonicalProblemId,
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
      .eq("problem_id", canonicalProblemId)
      .single();

    let progress;
    let coinsAwarded = 0;
    let coinBalance = null;
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
        .eq("problem_id", canonicalProblemId)
        .select()
        .single();
      progress = data;

      const isFirstSolve = progressStatus === "solved" && existingProgress.status !== "solved";
      if (isFirstSolve) {
        const rewardResult = await awardFirstSolveCoins({
          userId: req.user.id,
          problemId: canonicalProblemId,
          problemTitle: problem.title,
        });
        coinsAwarded = rewardResult.coinsAwarded;
        coinBalance = rewardResult.currentCoins;
      }
    } else {
      const { data } = await supabaseAdmin
        .from("user_progress")
        .insert({
          user_id: req.user.id,
          problem_id: canonicalProblemId,
          status: progressStatus,
          attempts: 1,
          last_attempt: new Date().toISOString(),
          solved_at:
            progressStatus === "solved" ? new Date().toISOString() : null,
        })
        .select()
        .single();
      progress = data;

      if (progressStatus === "solved") {
        const rewardResult = await awardFirstSolveCoins({
          userId: req.user.id,
          problemId: canonicalProblemId,
          problemTitle: problem.title,
        });
        coinsAwarded = rewardResult.coinsAwarded;
        coinBalance = rewardResult.currentCoins;
      }
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
      coinsAwarded,
      coinBalance,
    });
  } catch (error) {
    console.error("Submission error:", error);
    if (isSchemaMissingError(error)) {
      return res.status(503).json({
        error: "Coins/submission schema is missing. Run migration_coins_streaks.sql.",
      });
    }
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
      const problem = await resolveProblemRecord(problemId);
      if (problem?.id) {
        query = query.eq("problem_id", problem.id);
      } else {
        return res.json({ submissions: [] });
      }
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

  if (!language || typeof language !== "string") {
    return res.status(400).json({ success: false, error: "Language is required" });
  }

  if (typeof code !== "string") {
    return res.status(400).json({ success: false, error: "Code must be a string" });
  }

  if (!code.trim()) {
    return res.status(400).json({ success: false, error: "Code is required" });
  }

  try {
    // If problemId provided, fetch test cases and run against them
    if (problemId) {
      const problem = await resolveProblemRecord(problemId);

      if (!problem) {
        return res.status(404).json({
          success: false,
          error: "Problem not found for test execution",
        });
      }

      if (problem && Array.isArray(problem.test_cases) && problem.test_cases.length > 0) {
        const testCases = problem.test_cases;
        const starterCode = problem.starter_code || {};
        const starterForLang = starterCode[language] || starterCode.python || '';
        const fnName = detectFunctionName(starterForLang, code, language);
        const judgeProfile = getJudgeProfile(problem.title, fnName);

        if (language === 'python' || language === 'javascript') {
          const wrappedCode = buildTestWrapper(code, language, testCases, fnName, starterForLang);
          const result = await executeCode(wrappedCode, language);

          if (result.success) {
            const parsed = parseTestResults(result.output);
            if (parsed) {
              const judgedResults = parsed.map((r) => ({
                ...r,
                passed: !r.error && compareExpectedActual(r.expected, r.actual, judgeProfile),
              }));
              const passed = judgedResults.filter(r => r.passed).length;
              return res.json({
                success: true,
                testResults: judgedResults,
                passed,
                total: judgedResults.length,
                executionTime: result.executionTime,
                message: passed === judgedResults.length ? 'All test cases passed!' : `${passed}/${judgedResults.length} test cases passed`,
              });
            }
          }

          // Wrapper path failed or returned unstructured output: fallback to stdin evaluation.
          const evaluated = await evaluateWithStdinCases(code, language, testCases, judgeProfile);
          return res.json({
            success: true,
            testResults: evaluated.testResults,
            passed: evaluated.testsPassed,
            total: testCases.length,
            executionTime: result.executionTime,
            message:
              evaluated.testsPassed === testCases.length
                ? 'All test cases passed!'
                : `${evaluated.testsPassed}/${testCases.length} test cases passed`,
          });
        }

        // Non-wrapper languages: evaluate via stdin per test case.
        const evaluated = await evaluateWithStdinCases(code, language, testCases, judgeProfile);
        return res.json({
          success: true,
          testResults: evaluated.testResults,
          passed: evaluated.testsPassed,
          total: testCases.length,
          message:
            evaluated.testsPassed === testCases.length
              ? 'All test cases passed!'
              : `${evaluated.testsPassed}/${testCases.length} test cases passed`,
        });
      }

      return res.status(422).json({
        success: false,
        error: "No test cases configured for this problem",
      });
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
  const { code, language } = req.body;

  if (!language || typeof language !== "string") {
    return res.status(400).json({ success: false, output: "", error: "Language is required", executionTime: 0 });
  }

  if (typeof code !== "string") {
    return res.status(400).json({ success: false, output: "", error: "Code must be a string", executionTime: 0 });
  }

  if (!code.trim()) {
    return res.status(400).json({ success: false, output: "", error: "Code is required", executionTime: 0 });
  }

  try {
    const result = await executeCode(code, language);
    res.json(result);
  } catch (error) {
    console.error("Code execution error:", error);
    res.status(500).json({
      success: false,
      output: "",
      error: error.message,
      executionTime: 0,
    });
  }
});

router.post("/lint", optionalAuth, async (req, res) => {
  const { code, language } = req.body;

  if (!language || typeof language !== "string") {
    return res.status(400).json({ success: false, errors: [{ line: 1, col: 1, severity: "error", message: "Language is required" }] });
  }

  if (typeof code !== "string") {
    return res.status(400).json({ success: false, errors: [{ line: 1, col: 1, severity: "error", message: "Code must be a string" }] });
  }

  const normalizedLanguage = normalizeLintLanguage(language);

  try {
    if (!code.trim()) {
      return res.json({ success: true, errors: [], checkedWith: "none" });
    }

    if (normalizedLanguage === "javascript") {
      try {
        // eslint-disable-next-line no-new-func
        new Function(code);
        return res.json({ success: true, errors: [], checkedWith: "js-parser" });
      } catch (err) {
        const raw = String(err?.stack || err?.message || "Syntax error");
        const lineMatch = raw.match(/<anonymous>:(\d+):(\d+)/);
        const line = lineMatch?.[1] ? Math.max(1, Number(lineMatch[1]) - 1) : 1;
        const col = lineMatch?.[2] ? Math.max(1, Number(lineMatch[2])) : 1;
        return res.json({
          success: true,
          checkedWith: "js-parser",
          errors: [{ line, col, severity: "error", message: String(err?.message || "Syntax error") }],
        });
      }
    }

    if (normalizedLanguage === "python") {
      const pythonCmd = resolvePythonCommand();
      if (!pythonCmd) {
        return res.json({
          success: true,
          checkedWith: "python-unavailable",
          errors: [{ line: 1, col: 1, severity: "warning", message: "Python runtime not found for server lint checks" }],
        });
      }

      const lintFile = path.join(os.tmpdir(), `playground_lint_${Date.now()}.py`);
      try {
        fs.writeFileSync(lintFile, code, "utf-8");
        execSync(`${pythonCmd} -m py_compile "${lintFile}"`, {
          stdio: "pipe",
          timeout: 8000,
          shell: true,
          cwd: os.tmpdir(),
        });
        return res.json({ success: true, errors: [], checkedWith: "python-py-compile" });
      } catch (lintErr) {
        const stderr = lintErr?.stderr ? lintErr.stderr.toString() : lintErr?.message || "Syntax error";
        return res.json({
          success: true,
          checkedWith: "python-py-compile",
          errors: [extractPythonSyntaxError(stderr)],
        });
      } finally {
        try { fs.unlinkSync(lintFile); } catch {}
      }
    }

    if (normalizedLanguage === "c") {
      const cCmd = resolveCommand(["gcc", "clang", '"C:\\Program Files\\LLVM\\bin\\clang.exe"']);
      if (!cCmd) {
        return res.json({
          success: true,
          checkedWith: "c-unavailable",
          errors: [{ line: 1, col: 1, severity: "warning", message: "C compiler not found for server lint checks" }],
        });
      }

      const lintFile = path.join(os.tmpdir(), `playground_lint_${Date.now()}.c`);
      try {
        fs.writeFileSync(lintFile, code, "utf-8");
        execSync(`${cCmd} -fsyntax-only "${lintFile}"`, {
          stdio: "pipe",
          timeout: 8000,
          shell: true,
          cwd: os.tmpdir(),
        });
        return res.json({ success: true, errors: [], checkedWith: "c-compiler" });
      } catch (lintErr) {
        const stderr = lintErr?.stderr ? lintErr.stderr.toString() : lintErr?.message || "C syntax error";
        return res.json({
          success: true,
          checkedWith: "c-compiler",
          errors: extractCompilerSyntaxErrors(stderr, "C syntax error"),
        });
      } finally {
        try { fs.unlinkSync(lintFile); } catch {}
      }
    }

    if (normalizedLanguage === "cpp") {
      const cppCmd = resolveCommand(["g++", "clang++", '"C:\\Program Files\\LLVM\\bin\\clang++.exe"']);
      if (!cppCmd) {
        return res.json({
          success: true,
          checkedWith: "cpp-unavailable",
          errors: [{ line: 1, col: 1, severity: "warning", message: "C++ compiler not found for server lint checks" }],
        });
      }

      const lintFile = path.join(os.tmpdir(), `playground_lint_${Date.now()}.cpp`);
      try {
        fs.writeFileSync(lintFile, code, "utf-8");
        execSync(`${cppCmd} -fsyntax-only "${lintFile}"`, {
          stdio: "pipe",
          timeout: 8000,
          shell: true,
          cwd: os.tmpdir(),
        });
        return res.json({ success: true, errors: [], checkedWith: "cpp-compiler" });
      } catch (lintErr) {
        const stderr = lintErr?.stderr ? lintErr.stderr.toString() : lintErr?.message || "C++ syntax error";
        return res.json({
          success: true,
          checkedWith: "cpp-compiler",
          errors: extractCompilerSyntaxErrors(stderr, "C++ syntax error"),
        });
      } finally {
        try { fs.unlinkSync(lintFile); } catch {}
      }
    }

    if (normalizedLanguage === "java") {
      const javacCmd = resolveCommand(["javac"]);
      if (!javacCmd) {
        return res.json({
          success: true,
          checkedWith: "java-unavailable",
          errors: [{ line: 1, col: 1, severity: "warning", message: "Java compiler not found for server lint checks" }],
        });
      }

      const classMatch = code.match(/public\s+class\s+(\w+)/);
      const className = classMatch?.[1] || "Main";
      const lintFile = path.join(os.tmpdir(), `${className}_${Date.now()}.java`);
      const generatedClassName = path.basename(lintFile, ".java");

      // Keep public class name aligned with filename to avoid false mismatch errors.
      const adjustedCode = classMatch?.[1]
        ? code.replace(/public\s+class\s+\w+/, `public class ${generatedClassName}`)
        : code;

      try {
        fs.writeFileSync(lintFile, adjustedCode, "utf-8");
        execSync(`${javacCmd} "${lintFile}"`, {
          stdio: "pipe",
          timeout: 10000,
          shell: true,
          cwd: os.tmpdir(),
        });
        return res.json({ success: true, errors: [], checkedWith: "javac" });
      } catch (lintErr) {
        const stderr = lintErr?.stderr ? lintErr.stderr.toString() : lintErr?.message || "Java syntax error";
        return res.json({
          success: true,
          checkedWith: "javac",
          errors: extractCompilerSyntaxErrors(stderr, "Java syntax error"),
        });
      } finally {
        try { fs.unlinkSync(lintFile); } catch {}
        try { fs.unlinkSync(path.join(os.tmpdir(), `${generatedClassName}.class`)); } catch {}
      }
    }

    return res.json({ success: true, checkedWith: "unsupported", errors: [] });
  } catch (error) {
    console.error("Code lint error:", error);
    return res.status(500).json({
      success: false,
      errors: [{ line: 1, col: 1, severity: "error", message: error.message || "Failed to lint code" }],
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
