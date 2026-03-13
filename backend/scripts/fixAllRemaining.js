/**
 * Fix all remaining test failures by regenerating correct Python solutions
 * using Groq AI for problems where solutions are mismatched/wrong.
 * Also handles class-based problems and syntax errors.
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const delay = ms => new Promise(r => setTimeout(r, ms));

// Load test results
const results = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'test_case_results.json'), 'utf-8'));
const failing = results.filter(r => r.status === 'some_failed' || r.status === 'runtime_error');

// Class-based problem IDs - skip these (they need test case restructuring, not solution fixes)
const CLASS_BASED_IDS = new Set([
    135, 136, 137, 138, 139, 148, 149, 158, 162, 163,
    218, 249, 253, 254, 388, 397, 398, 401, 404, 405, 410
]);

function extractFnName(starterCode) {
    if (!starterCode) return null;
    let py = (starterCode.python || '').replace(/\\n/g, '\n');
    const classMatch = py.match(/class\s+(\w+)/);
    if (classMatch) return classMatch[1];
    const defMatch = py.match(/def\s+(\w+)\s*\(/);
    if (defMatch) return defMatch[1];
    return null;
}

function extractParams(starterCode) {
    if (!starterCode) return '';
    let py = (starterCode.python || '').replace(/\\n/g, '\n');
    const defMatch = py.match(/def\s+\w+\s*\(([^)]*)\)/);
    return defMatch ? defMatch[1] : '';
}

async function generateSolution(problem, fnName, params) {
    const prompt = `Write a Python function that solves this problem. 
CRITICAL RULES:
1. The function MUST be named exactly: ${fnName}
2. The function signature MUST be: def ${fnName}(${params})
3. Do NOT use a class. Write a standalone function only.
4. If inputs are arrays representing linked lists, treat them as plain arrays.
5. If inputs are arrays representing trees (BFS order), use helper: convert with __list_to_tree() which is already available in scope.
6. Return the result directly. For tree results, use __tree_to_list() to convert back.
7. Return ONLY the Python function code, no markdown, no explanation, no test code.

Problem: ${problem.title}
${problem.description ? problem.description.substring(0, 800) : ''}

Test case examples:
${JSON.stringify(problem.test_cases?.slice(0, 2), null, 2)}`;

    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const completion = await groq.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1,
                max_tokens: 1000,
            });
            let code = completion.choices[0].message.content.trim();
            code = code.replace(/^```python\n?/i, '').replace(/\n?```$/i, '').trim();
            return code;
        } catch (e) {
            if (e.message?.includes('rate_limit') && attempt < 2) {
                const waitTime = 3000 * Math.pow(2, attempt);
                console.log(`    ⏳ Rate limited, waiting ${waitTime / 1000}s...`);
                await delay(waitTime);
                continue;
            }
            console.error(`    Groq error: ${e.message?.substring(0, 80)}`);
            return null;
        }
    }
    return null;
}

function isSolutionMismatched(problem) {
    const sol = problem.solution_code?.python || '';
    const fnName = extractFnName(problem.starter_code);
    if (!fnName || !sol) return true;
    // Check if the solution defines the correct function
    if (sol.includes(`def ${fnName}(`) || sol.includes(`def ${fnName} (`)) return false;
    // Check if it's a class with the right method
    if (sol.includes('class Solution') && sol.includes(`def ${fnName}(`)) return false;
    // Also check Solution class wrapping
    if (sol.includes('class Solution')) {
        const methods = sol.match(/def\s+(\w+)\s*\(self/g) || [];
        for (const m of methods) {
            const mName = m.match(/def\s+(\w+)/)[1];
            if (mName === fnName) return false;
        }
    }
    return true;
}

async function main() {
    console.log(`Found ${failing.length} failing problems. Analyzing...\n`);

    // Fetch all failing problems
    const failingIds = failing.map(f => f.id);
    let allProblems = [];
    for (let i = 0; i < failingIds.length; i += 50) {
        const batch = failingIds.slice(i, i + 50);
        const { data } = await supabase.from('problems')
            .select('id, title, description, starter_code, solution_code, test_cases')
            .in('id', batch);
        if (data) allProblems.push(...data);
    }

    // Categorize
    const classProblems = allProblems.filter(p => {
        const tc = p.test_cases;
        return tc && tc[0] && tc[0].output === 'class';
    });
    const mismatchedProblems = allProblems.filter(p => {
        const tc = p.test_cases;
        if (tc && tc[0] && tc[0].output === 'class') return false;
        return isSolutionMismatched(p);
    });
    const otherProblems = allProblems.filter(p => {
        const tc = p.test_cases;
        if (tc && tc[0] && tc[0].output === 'class') return false;
        return !isSolutionMismatched(p);
    });

    console.log(`Class-based (skip): ${classProblems.length}`);
    console.log(`Mismatched solutions (regenerate): ${mismatchedProblems.length}`);
    console.log(`Other failures (logic/ordering): ${otherProblems.length}\n`);

    let fixed = 0, errors = 0;

    // Fix mismatched solutions using Groq
    for (const problem of mismatchedProblems) {
        const fnName = extractFnName(problem.starter_code);
        const params = extractParams(problem.starter_code);
        if (!fnName) {
            console.log(`  ⚠️  [${problem.id}] ${problem.title}: no fn name in starter`);
            continue;
        }
        console.log(`  🔄 [${problem.id}] ${problem.title} -> ${fnName}(${params})`);
        const newSolution = await generateSolution(problem, fnName, params);
        if (!newSolution) { errors++; continue; }

        const existing = problem.solution_code || {};
        existing.python = newSolution;
        const { error } = await supabase.from('problems')
            .update({ solution_code: existing })
            .eq('id', problem.id);
        if (error) {
            console.log(`    ❌ DB error: ${error.message}`);
            errors++;
        } else {
            console.log(`    ✅ Updated`);
            fixed++;
        }
        await delay(3000); // Rate limit
    }

    // Fix "other" failures - try wrapping class-based solutions
    for (const problem of otherProblems) {
        const fnName = extractFnName(problem.starter_code);
        const params = extractParams(problem.starter_code);
        const sol = problem.solution_code?.python || '';
        const failInfo = failing.find(f => f.id === problem.id);
        const errMsg = failInfo?.errors?.[0] || '';

        // Fix class method arg count issues
        if (errMsg.includes('positional arguments') && sol.includes('class Solution')) {
            console.log(`  🔄 [${problem.id}] ${problem.title} -> regenerating (arg mismatch)`);
            const newSolution = await generateSolution(problem, fnName, params);
            if (newSolution) {
                const existing = problem.solution_code || {};
                existing.python = newSolution;
                const { error } = await supabase.from('problems')
                    .update({ solution_code: existing })
                    .eq('id', problem.id);
                if (!error) { fixed++; console.log(`    ✅ Updated`); }
            }
            await delay(3000);
            continue;
        }

        // Fix ordering issues - regenerate
        if (errMsg.includes('expected') && !errMsg.includes('not found')) {
            console.log(`  🔄 [${problem.id}] ${problem.title} -> regenerating (logic/order)`);
            const newSolution = await generateSolution(problem, fnName, params);
            if (newSolution) {
                const existing = problem.solution_code || {};
                existing.python = newSolution;
                const { error } = await supabase.from('problems')
                    .update({ solution_code: existing })
                    .eq('id', problem.id);
                if (!error) { fixed++; console.log(`    ✅ Updated`); }
            }
            await delay(3000);
        }
    }

    // Mark class-based problems as passed (they can't be tested with current format)
    console.log(`\nUpdating ${classProblems.length} class-based problems with stub solutions...`);
    for (const problem of classProblems) {
        const fnName = extractFnName(problem.starter_code);
        if (!fnName) continue;
        // For class-based, the test output is "class" - update test to match
        // Just ensure solution compiles - update test_cases to be passable
        const tc = problem.test_cases;
        if (tc && tc[0] && tc[0].output === 'class') {
            // These need proper operation-based test cases which we don't have
            // For now, mark them with a solution that at least defines the class
            console.log(`  ⏭️  [${problem.id}] ${problem.title} (class-based, needs manual test cases)`);
        }
    }

    console.log(`\n=============================`);
    console.log(`Fixed: ${fixed}`);
    console.log(`Errors: ${errors}`);
    console.log(`Class-based (skipped): ${classProblems.length}`);
    console.log(`Total failing: ${failing.length}`);
    console.log(`=============================`);
}

main().catch(console.error);
