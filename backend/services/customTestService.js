/**
 * Custom Test Case Service
 * Handles validation, execution, and persistence of user-created test cases
 */

import { supabaseAdmin } from '../db/supabaseClient.js';
import { executeCode, buildTestWrapper, parseTestResults } from '../utils/executeCode.js';
import { compareExpectedActual } from '../utils/testComparison.js';
import { getMemorySnapshot } from '../utils/memoryTracking.js';
import { parseExecutionError } from '../utils/errorDiagnostics.js';
import { calculateTimingBreakdown, analyzeExecutionTrace } from '../utils/executionTracer.js';

const SUPPORTED_LANGUAGES = ['python', 'javascript', 'cpp', 'c', 'java'];

/**
 * Validate custom test case structure
 * @param {Object} testCase - { input, expected, description }
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateTestCase(testCase) {
  if (!testCase || typeof testCase !== 'object') {
    return { valid: false, error: 'Test case must be an object' };
  }

  const { input, expected, description } = testCase;

  if (input === undefined || input === null) {
    return { valid: false, error: 'Test case must have "input" field' };
  }

  if (expected === undefined || expected === null) {
    return { valid: false, error: 'Test case must have "expected" field' };
  }

  // Convert to string to validate format
  const inputStr = String(input);
  const expectedStr = String(expected);

  if (inputStr.length > 10000) {
    return { valid: false, error: 'Input exceeds 10,000 characters' };
  }

  if (expectedStr.length > 10000) {
    return { valid: false, error: 'Expected output exceeds 10,000 characters' };
  }

  if (description && String(description).length > 500) {
    return { valid: false, error: 'Description exceeds 500 characters' };
  }

  return { valid: true };
}

/**
 * Validate test case array
 * @param {Array} testCases - Array of test case objects
 * @returns {Object} { valid: boolean, error?: string, validCount: number }
 */
export function validateTestCaseArray(testCases) {
  if (!Array.isArray(testCases)) {
    return { valid: false, error: 'testCases must be an array' };
  }

  if (testCases.length === 0) {
    return { valid: false, error: 'testCases cannot be empty' };
  }

  if (testCases.length > 100) {
    return { valid: false, error: 'Cannot create more than 100 test cases at once' };
  }

  for (let i = 0; i < testCases.length; i++) {
    const result = validateTestCase(testCases[i]);
    if (!result.valid) {
      return { valid: false, error: `Test case ${i + 1}: ${result.error}` };
    }
  }

  return { valid: true, validCount: testCases.length };
}

/**
 * Validate language support
 * @param {string} language - Language code (python, javascript, cpp, c, java)
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateLanguage(language) {
  if (!language) {
    return { valid: false, error: 'language is required' };
  }

  const normalized = String(language).toLowerCase().trim();
  if (!SUPPORTED_LANGUAGES.includes(normalized)) {
    return {
      valid: false,
      error: `Unsupported language: ${language}. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Execute custom test cases against user code
 * @param {Object} options - { code, language, testCases, timeout? }
 * @returns {Promise<Object>} { success, results, passedCount, totalCount, errors? }
 */
export async function executeCustomTests(options) {
  const { code, language, testCases, timeout = 5000 } = options;

  if (!code) {
    throw new Error('code is required');
  }

  // Validate inputs
  const langValidation = validateLanguage(language);
  if (!langValidation.valid) {
    throw new Error(langValidation.error);
  }

  const testValidation = validateTestCaseArray(testCases);
  if (!testValidation.valid) {
    throw new Error(testValidation.error);
  }

  const results = [];
  let passedCount = 0;
  const totalCount = testCases.length;

  // Capture initial memory state
  const memStart = getMemorySnapshot();
  
  // Track execution timing
  const executionStartTime = process.hrtime.bigint();
  let executionEndTime;
  let executionTimeMs = 0;
  let timingBreakdown = null;

  try {
    // For Python/JavaScript: use test wrapper for efficiency
    // For C/C++/Java: execute once per test case
    if (language === 'python' || language === 'javascript') {
      // Convert test cases format from { input, expected } to { input, output }
      // as expected by buildTestWrapper
      const wrappedTestCases = testCases.map((tc) => ({
        input: tc.input,
        output: tc.expected,
      }));

      // buildTestWrapper signature: (userCode, language, testCases, fnName?, problem_starter_code?)
      // fnName defaults to 'solve' if not provided
      const wrappedCode = buildTestWrapper(code, language, wrappedTestCases, 'solve', '');

      try {
        const executionResult = await executeCode(wrappedCode, language, '', timeout);
        const memEnd = getMemorySnapshot();

        if (!executionResult.success) {
          const diagnostics = parseExecutionError(
            executionResult.error || '',
            executionResult.output || '',
            language
          );
          
          // Calculate execution time and timing breakdown for error case too
          executionEndTime = process.hrtime.bigint();
          executionTimeMs = Number(executionEndTime - executionStartTime) / 1_000_000;
          
          if (executionTimeMs > 0) {
            timingBreakdown = calculateTimingBreakdown(
              { code },
              language,
              executionTimeMs
            );
          }

          return {
            success: false,
            results: testCases.map((tc, i) => ({
              index: i + 1,
              description: tc.description || `Test ${i + 1}`,
              passed: false,
              input: tc.input,
              expected: tc.expected,
              actual: null,
              error: executionResult.error || 'Execution failed',
              diagnostics: diagnostics, // Include detailed error info
            })),
            passedCount: 0,
            totalCount,
            error: executionResult.error || 'Code execution failed',
            diagnostics: diagnostics, // Include at top level too
            executionTime: Math.round(executionTimeMs * 100) / 100,
            timingBreakdown: timingBreakdown ? {
              totalMs: timingBreakdown.totalTime,
              parseMs: timingBreakdown.parseTime,
              compileMs: timingBreakdown.compileTime,
              runMs: timingBreakdown.runTime,
              parsePercent: timingBreakdown.breakdown.parse.percent,
              compilePercent: timingBreakdown.breakdown.compile?.percent || 0,
              runPercent: timingBreakdown.breakdown.execution.percent,
            } : null,
            memory: {
              heapUsedMB: memEnd.heapUsed,
              totalMemoryMB: memEnd.rss,
              memoryDelta: Math.round((memEnd.heapUsed - memStart.heapUsed) * 100) / 100,
            },
          };
        }

        // Parse test results from output
        const parsedResults = parseTestResults(executionResult.output);

        if (parsedResults && Array.isArray(parsedResults)) {
          for (let i = 0; i < parsedResults.length && i < testCases.length; i++) {
            const parsed = parsedResults[i];
            const testCase = testCases[i];
            const passed = parsed.passed === true; // Use the wrapper's verdict

            results.push({
              index: i + 1,
              description: testCase.description || `Test ${i + 1}`,
              passed,
              input: testCase.input,
              expected: testCase.expected,
              actual: String(parsed.actual || ''),
              error: passed ? null : (parsed.error || `Expected: ${testCase.expected}, Got: ${parsed.actual}`),
            });

            if (passed) passedCount += 1;
          }
        } else {
          // If we couldn't parse results, report error
          return {
            success: false,
            results: testCases.map((tc, i) => ({
              index: i + 1,
              description: tc.description || `Test ${i + 1}`,
              passed: false,
              input: tc.input,
              expected: tc.expected,
              actual: null,
              error: 'Failed to parse test results',
            })),
            passedCount: 0,
            totalCount,
            error: 'Could not parse wrapped test output',
          };
        }
      } catch (err) {
        return {
          success: false,
          results: testCases.map((tc, i) => ({
            index: i + 1,
            description: tc.description || `Test ${i + 1}`,
            passed: false,
            input: tc.input,
            expected: tc.expected,
            actual: null,
            error: err.message || 'Execution error',
          })),
          passedCount: 0,
          totalCount,
          error: err.message || 'Failed to execute code',
        };
      }
    } else {
      // For C/C++/Java: run individual tests
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        try {
          const executionResult = await executeCode(code, language, String(testCase.input), timeout);

          const passed =
            executionResult.success &&
            compareExpectedActual(testCase.expected, executionResult.output, 'strict');

          const resultObj = {
            index: i + 1,
            description: testCase.description || `Test ${i + 1}`,
            passed,
            input: testCase.input,
            expected: testCase.expected,
            actual: executionResult.output || null,
            error: passed ? null : (executionResult.error || `Expected: ${testCase.expected}, Got: ${executionResult.output}`),
          };

          // Add detailed error diagnostics if test failed
          if (!passed && executionResult.error) {
            resultObj.diagnostics = parseExecutionError(
              executionResult.error,
              executionResult.output || '',
              language
            );
          }

          results.push(resultObj);

          if (passed) passedCount += 1;
        } catch (err) {
          results.push({
            index: i + 1,
            description: testCase.description || `Test ${i + 1}`,
            passed: false,
            input: testCase.input,
            expected: testCase.expected,
            actual: null,
            error: err.message || 'Execution error',
          });
        }
      }
    }
  } catch (err) {
    // Even on error, capture execution time and memory
    executionEndTime = process.hrtime.bigint();
    executionTimeMs = Number(executionEndTime - executionStartTime) / 1_000_000;
    
    const memEnd = getMemorySnapshot();
    
    // Calculate timing breakdown even for errors
    if (executionTimeMs > 0) {
      timingBreakdown = calculateTimingBreakdown(
        { code },
        language,
        executionTimeMs
      );
    }
    
    return {
      success: false,
      results: testCases.map((tc, i) => ({
        index: i + 1,
        description: tc.description || `Test ${i + 1}`,
        passed: false,
        input: tc.input,
        expected: tc.expected,
        actual: null,
        error: err.message || 'Unexpected error',
      })),
      passedCount: 0,
      totalCount,
      error: err.message || 'Failed to execute tests',
      executionTime: Math.round(executionTimeMs * 100) / 100,
      timingBreakdown: timingBreakdown ? {
        totalMs: timingBreakdown.totalTime,
        parseMs: timingBreakdown.parseTime,
        compileMs: timingBreakdown.compileTime,
        runMs: timingBreakdown.runTime,
        parsePercent: timingBreakdown.breakdown.parse.percent,
        compilePercent: timingBreakdown.breakdown.compile?.percent || 0,
        runPercent: timingBreakdown.breakdown.execution.percent,
      } : null,
      memory: {
        heapUsedMB: memEnd.heapUsed,
        totalMemoryMB: memEnd.rss,
        memoryDelta: Math.round((memEnd.heapUsed - memStart.heapUsed) * 100) / 100,
      },
    };
  }

  // Capture final memory state
  const memEnd = getMemorySnapshot();
  
  // Calculate execution time and breakdown
  executionEndTime = process.hrtime.bigint();
  executionTimeMs = Number(executionEndTime - executionStartTime) / 1_000_000; // Convert to ms
  
  // Calculate timing breakdown if execution time was measured
  if (executionTimeMs > 0) {
    timingBreakdown = calculateTimingBreakdown(
      { code },
      language,
      executionTimeMs
    );
  }

  return {
    success: true,
    results,
    passedCount,
    totalCount,
    executionTime: Math.round(executionTimeMs * 100) / 100, // Round to 2 decimals
    timingBreakdown: timingBreakdown ? {
      totalMs: timingBreakdown.totalTime,
      parseMs: timingBreakdown.parseTime,
      compileMs: timingBreakdown.compileTime,
      runMs: timingBreakdown.runTime,
      parsePercent: timingBreakdown.breakdown.parse.percent,
      compilePercent: timingBreakdown.breakdown.compile?.percent || 0,
      runPercent: timingBreakdown.breakdown.execution.percent,
    } : null,
    memory: {
      heapUsedMB: memEnd.heapUsed,
      totalMemoryMB: memEnd.rss,
      memoryDelta: Math.round((memEnd.heapUsed - memStart.heapUsed) * 100) / 100,
    },
  };
}

/**
 * Save custom test cases to database
 * @param {Object} options - { userId, problemId, language, testCases }
 * @returns {Promise<Object>} Saved test cases with metadata
 */
export async function saveCustomTests(options) {
  const { userId, problemId, language, testCases } = options;

  // Validate inputs
  const langValidation = validateLanguage(language);
  if (!langValidation.valid) {
    throw new Error(langValidation.error);
  }

  const testValidation = validateTestCaseArray(testCases);
  if (!testValidation.valid) {
    throw new Error(testValidation.error);
  }

  // Check if user already has custom tests for this problem
  const { data: existing } = await supabaseAdmin
    .from('user_custom_tests')
    .select('id')
    .eq('user_id', userId)
    .eq('problem_id', parseInt(problemId))
    .eq('language', language.toLowerCase())
    .single();

  let result;
  if (existing) {
    // Update existing
    const { data, error } = await supabaseAdmin
      .from('user_custom_tests')
      .update({
        test_cases: testCases,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    result = data;
  } else {
    // Create new
    const { data, error } = await supabaseAdmin
      .from('user_custom_tests')
      .insert([
        {
          user_id: userId,
          problem_id: parseInt(problemId),
          language: language.toLowerCase(),
          test_cases: testCases,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    result = data;
  }

  return {
    success: true,
    id: result.id,
    problemId: result.problem_id,
    language: result.language,
    testCaseCount: testCases.length,
    savedAt: result.updated_at || result.created_at,
  };
}

/**
 * Load custom test cases from database
 * @param {Object} options - { userId, problemId, language }
 * @returns {Promise<Array>} Test cases array
 */
export async function loadCustomTests(options) {
  const { userId, problemId, language } = options;

  const { data, error } = await supabaseAdmin
    .from('user_custom_tests')
    .select('test_cases')
    .eq('user_id', userId)
    .eq('problem_id', parseInt(problemId))
    .eq('language', language.toLowerCase())
    .single();

  if (error) {
    // Not found is OK, return empty array
    if (error.code === 'PGRST116') {
      return [];
    }
    throw error;
  }

  return data?.test_cases || [];
}

/**
 * Delete custom test cases
 * @param {Object} options - { userId, problemId, language }
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteCustomTests(options) {
  const { userId, problemId, language } = options;

  const { error } = await supabaseAdmin
    .from('user_custom_tests')
    .delete()
    .eq('user_id', userId)
    .eq('problem_id', parseInt(problemId))
    .eq('language', language.toLowerCase());

  if (error) throw error;

  return { success: true, deleted: true };
}
