/**
 * Check All Question Test Cases
 * 
 * Fetches all problems from Supabase and runs their solution_code (Python)
 * against their test_cases to validate correctness.
 * Outputs results to a JSON file and a summary text file.
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { executeCode, buildTestWrapper, parseTestResults } from '../utils/executeCode.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

async function fetchAllProblems() {
    const allProblems = [];
    let offset = 0;
    const batchSize = 100;

    while (true) {
        const { data, error } = await supabase
            .from('problems')
            .select('id, title, test_cases, starter_code, solution_code, difficulty, pattern_id')
            .range(offset, offset + batchSize - 1)
            .order('id');

        if (error) {
            console.error('Failed to fetch problems:', error.message);
            break;
        }
        if (!data || data.length === 0) break;
        allProblems.push(...data);
        if (data.length < batchSize) break;
        offset += batchSize;
    }

    return allProblems;
}

async function checkProblem(problem) {
    const result = {
        id: problem.id,
        title: problem.title,
        difficulty: problem.difficulty,
        pattern: problem.pattern_id,
        status: 'unknown',
        passed: 0,
        total: 0,
        errors: [],
    };

    // Check if test_cases exist
    const testCases = problem.test_cases;
    if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
        result.status = 'no_test_cases';
        result.errors.push('No test cases found');
        return result;
    }

    // Check for placeholder test cases
    if (testCases.length === 1 && testCases[0].input?.[0] === 'example_input') {
        result.status = 'placeholder_test_cases';
        result.errors.push('Has placeholder test cases');
        return result;
    }

    result.total = testCases.length;

    // Check if solution_code exists
    const solutionCode = problem.solution_code;
    if (!solutionCode || typeof solutionCode !== 'object') {
        result.status = 'no_solution';
        result.errors.push('No solution code found');
        return result;
    }

    // Try Python solution first, then JavaScript
    const pythonSolution = solutionCode.python;
    const jsSolution = solutionCode.javascript;

    if (!pythonSolution && !jsSolution) {
        result.status = 'no_solution';
        result.errors.push('No Python or JavaScript solution available');
        return result;
    }

    // Determine language and solution to use
    const language = pythonSolution ? 'python' : 'javascript';
    const code = pythonSolution || jsSolution;

    // Detect function name from starter code, falling back to solution code
    const starterCode = problem.starter_code || {};
    const starterForLang = starterCode[language] || starterCode.python || '';

    let fnName = 'solve';
    // First try: get method name from class Solution in starter code
    const methodMatch = starterForLang.match(/def\s+(\w+)\s*\(self/);
    if (methodMatch) {
        fnName = methodMatch[1];
    } else {
        // Try standalone function in starter code
        const fnMatch = starterForLang.match(/(?:def |function |const |let |var )([\w]+)/);
        if (fnMatch) {
            fnName = fnMatch[1];
        }
    }

    // If starter code gave us nothing useful, extract from solution code
    if (fnName === 'solve' || fnName === 'Solution') {
        const solMethodMatch = code.match(/def\s+(\w+)\s*\(self/);
        if (solMethodMatch) {
            fnName = solMethodMatch[1];
        } else {
            const solFnMatch = code.match(/def\s+(\w+)\s*\(/);
            if (solFnMatch) {
                fnName = solFnMatch[1];
            }
        }
    }

    // Check test case format
    const hasInputField = testCases[0] && testCases[0].input !== undefined;
    if (!hasInputField) {
        result.status = 'bad_test_format';
        result.errors.push('Test cases missing input field');
        return result;
    }

    try {
        const wrappedCode = buildTestWrapper(code, language, testCases, fnName, starterForLang);
        const execResult = await executeCode(wrappedCode, language);

        if (execResult.success) {
            const parsed = parseTestResults(execResult.output);
            if (parsed) {
                result.passed = parsed.filter(r => r.passed).length;
                result.total = parsed.length;
                result.status = result.passed === result.total ? 'all_passed' : 'some_failed';

                // Record failed test details
                parsed.forEach((t, i) => {
                    if (!t.passed) {
                        result.errors.push(
                            `TC ${i + 1}: expected ${JSON.stringify(t.expected)}, got ${JSON.stringify(t.actual)}`
                        );
                    }
                });
            } else {
                result.status = 'no_test_output';
                result.errors.push('Code ran but no test results marker found');
                result.errors.push(`Output: ${execResult.output.substring(0, 200)}`);
            }
        } else {
            result.status = 'runtime_error';
            result.errors.push(execResult.error || 'Unknown error');
        }
    } catch (e) {
        result.status = 'execution_error';
        result.errors.push(e.message);
    }

    return result;
}

async function main() {
    console.log('Fetching all problems from Supabase...');
    const problems = await fetchAllProblems();
    console.log(`Fetched ${problems.length} problems`);

    const allResults = [];
    let completed = 0;

    for (const problem of problems) {
        completed++;
        const pct = ((completed / problems.length) * 100).toFixed(1);
        process.stdout.write(`\r[${pct}%] Checking ${completed}/${problems.length}: ${problem.title.substring(0, 40).padEnd(40)}`);

        const result = await checkProblem(problem);
        allResults.push(result);
    }

    console.log('\nDone.\n');

    // Categorize results
    const categories = {
        all_passed: allResults.filter(r => r.status === 'all_passed'),
        some_failed: allResults.filter(r => r.status === 'some_failed'),
        runtime_error: allResults.filter(r => r.status === 'runtime_error'),
        no_test_cases: allResults.filter(r => r.status === 'no_test_cases'),
        placeholder_test_cases: allResults.filter(r => r.status === 'placeholder_test_cases'),
        no_solution: allResults.filter(r => r.status === 'no_solution'),
        bad_test_format: allResults.filter(r => r.status === 'bad_test_format'),
        no_test_output: allResults.filter(r => r.status === 'no_test_output'),
        execution_error: allResults.filter(r => r.status === 'execution_error'),
    };

    // Build report
    const lines = [];
    lines.push('=================================================================');
    lines.push('   TEST CASE VALIDATION REPORT');
    lines.push('=================================================================');
    lines.push('');
    lines.push(`Total problems:             ${problems.length}`);
    lines.push('');
    lines.push('--- SUMMARY ---');
    lines.push(`  All Tests Passed:        ${categories.all_passed.length}`);
    lines.push(`  Some Tests Failed:       ${categories.some_failed.length}`);
    lines.push(`  Runtime Error:           ${categories.runtime_error.length}`);
    lines.push(`  No Test Cases:           ${categories.no_test_cases.length}`);
    lines.push(`  Placeholder Test Cases:  ${categories.placeholder_test_cases.length}`);
    lines.push(`  No Solution Code:        ${categories.no_solution.length}`);
    lines.push(`  Bad Test Format:         ${categories.bad_test_format.length}`);
    lines.push(`  No Test Output:          ${categories.no_test_output.length}`);
    lines.push(`  Execution Error:         ${categories.execution_error.length}`);
    lines.push('');

    const testableCount = categories.all_passed.length + categories.some_failed.length + categories.runtime_error.length + categories.no_test_output.length + categories.execution_error.length;
    const passRate = testableCount > 0 ? ((categories.all_passed.length / testableCount) * 100).toFixed(1) : '0.0';
    lines.push(`Pass Rate (testable): ${passRate}% (${categories.all_passed.length}/${testableCount})`);
    lines.push('');

    // Detail failed tests
    if (categories.some_failed.length > 0) {
        lines.push('');
        lines.push('=================================================================');
        lines.push(`   PROBLEMS WITH FAILED TEST CASES (${categories.some_failed.length})`);
        lines.push('=================================================================');
        categories.some_failed.forEach((r, i) => {
            lines.push(`  ${i + 1}. ${r.title} (${r.difficulty} | ${r.pattern || 'N/A'})`);
            lines.push(`     Passed: ${r.passed}/${r.total}`);
            r.errors.slice(0, 3).forEach(e => {
                lines.push(`     -> ${e.substring(0, 200)}`);
            });
            lines.push('');
        });
    }

    if (categories.runtime_error.length > 0) {
        lines.push('');
        lines.push('=================================================================');
        lines.push(`   RUNTIME ERRORS (${categories.runtime_error.length})`);
        lines.push('=================================================================');
        categories.runtime_error.forEach((r, i) => {
            lines.push(`  ${i + 1}. ${r.title} (${r.difficulty} | ${r.pattern || 'N/A'})`);
            r.errors.slice(0, 2).forEach(e => {
                lines.push(`     -> ${e.substring(0, 200)}`);
            });
            lines.push('');
        });
    }

    if (categories.no_test_output.length > 0) {
        lines.push('');
        lines.push('=================================================================');
        lines.push(`   NO TEST OUTPUT (${categories.no_test_output.length})`);
        lines.push('=================================================================');
        categories.no_test_output.forEach((r, i) => {
            lines.push(`  ${i + 1}. ${r.title} (${r.difficulty} | ${r.pattern || 'N/A'})`);
            r.errors.slice(0, 2).forEach(e => {
                lines.push(`     -> ${e.substring(0, 200)}`);
            });
            lines.push('');
        });
    }

    if (categories.placeholder_test_cases.length > 0) {
        lines.push('');
        lines.push('=================================================================');
        lines.push(`   PLACEHOLDER TEST CASES (${categories.placeholder_test_cases.length})`);
        lines.push('=================================================================');
        categories.placeholder_test_cases.forEach((r, i) => {
            lines.push(`  ${i + 1}. ${r.title} (${r.difficulty} | ${r.pattern || 'N/A'})`);
        });
        lines.push('');
    }

    if (categories.no_solution.length > 0) {
        lines.push('');
        lines.push('=================================================================');
        lines.push(`   NO SOLUTION CODE (${categories.no_solution.length})`);
        lines.push('=================================================================');
        categories.no_solution.forEach((r, i) => {
            lines.push(`  ${i + 1}. ${r.title} (${r.difficulty} | ${r.pattern || 'N/A'})`);
        });
        lines.push('');
    }

    const report = lines.join('\n');
    console.log(report);

    // Write to files
    fs.writeFileSync('test_case_report.txt', report, 'utf-8');
    fs.writeFileSync('test_case_results.json', JSON.stringify(allResults, null, 2), 'utf-8');
    console.log('\nReport saved to: test_case_report.txt');
    console.log('Detailed results saved to: test_case_results.json');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
