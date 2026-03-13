// Seed real LeetCode-style examples for all 425 problems
// Converts existing test_cases + starter_code into formatted examples
// Format: { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "..." }

import { supabaseAdmin } from '../db/supabaseClient.js';

// ── Extract parameter names from Python starter code ──
function extractParamNames(starterCode) {
    if (!starterCode?.python) return [];
    const py = starterCode.python;
    // Match "def funcName(param1, param2, ...)" 
    const match = py.match(/def\s+\w+\s*\(([^)]*)\)/);
    if (!match) return [];
    return match[1]
        .split(',')
        .map(p => p.trim())
        .filter(p => p && p !== 'self')
        .map(p => {
            // Remove type hints: "nums: List[int]" -> "nums"
            const colonIdx = p.indexOf(':');
            return colonIdx >= 0 ? p.slice(0, colonIdx).trim() : p.trim();
        })
        .filter(Boolean);
}

// ── Format a value for display ──
function formatValue(val) {
    if (val === null || val === undefined) return 'null';
    if (val === true) return 'true';
    if (val === false) return 'false';
    if (typeof val === 'string') return `"${val}"`;
    if (Array.isArray(val)) {
        // Handle nested arrays
        if (val.length > 0 && Array.isArray(val[0])) {
            return `[${val.map(v => formatValue(v)).join(',')}]`;
        }
        // Handle arrays of strings (like grid problems)
        if (val.length > 0 && typeof val[0] === 'string' && val[0].length === 1) {
            return `[${val.map(v => `"${v}"`).join(',')}]`;
        }
        return `[${val.map(v => formatValue(v)).join(',')}]`;
    }
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
}

// ── Format a single test case as an example ──
function formatExample(testCase, paramNames) {
    const inputs = testCase.input;
    const output = testCase.output;

    let inputStr;
    if (!Array.isArray(inputs)) {
        // Single input value
        if (paramNames.length > 0) {
            inputStr = `${paramNames[0]} = ${formatValue(inputs)}`;
        } else {
            inputStr = formatValue(inputs);
        }
    } else if (inputs.length === 1) {
        // Single parameter wrapped in array
        if (paramNames.length > 0) {
            inputStr = `${paramNames[0]} = ${formatValue(inputs[0])}`;
        } else {
            inputStr = formatValue(inputs[0]);
        }
    } else {
        // Multiple parameters
        const parts = inputs.map((inp, i) => {
            const name = paramNames[i] || `arg${i + 1}`;
            return `${name} = ${formatValue(inp)}`;
        });
        inputStr = parts.join(', ');
    }

    return {
        input: inputStr,
        output: formatValue(output)
    };
}

// ── Generate an explanation for the first example (where useful) ──
function generateExplanation(title, testCase, paramNames) {
    const inputs = testCase.input;
    const output = testCase.output;
    const t = title.toLowerCase();

    // Common explanations based on problem patterns
    if (t.includes('two sum') && Array.isArray(inputs) && inputs.length >= 2) {
        if (Array.isArray(output) && output.length === 2) {
            const nums = inputs[0];
            const target = inputs[1];
            if (Array.isArray(nums)) {
                return `Because ${paramNames[0] || 'nums'}[${output[0]}] + ${paramNames[0] || 'nums'}[${output[1]}] == ${target}`;
            }
        }
    }
    if (t.includes('palindrome') && typeof output === 'boolean') {
        return output ? 'The string reads the same forwards and backwards after cleaning.' : 'Not a palindrome.';
    }
    if (t.includes('maximum subarray') && typeof output === 'number') {
        return `The contiguous subarray with the largest sum equals ${output}.`;
    }
    if (t.includes('binary search') && typeof output === 'number') {
        if (output >= 0) return `Target found at index ${output}.`;
        return `Target not found in the array.`;
    }
    if (t.includes('climbing') || t.includes('stairs')) {
        return `There are ${output} distinct ways to reach the top.`;
    }
    if (t.includes('fibonacci') || t.includes('house robber')) {
        return `The optimal result is ${formatValue(output)}.`;
    }
    if (t.includes('reverse')) {
        return `After reversing, the result is ${formatValue(output)}.`;
    }
    if (t.includes('sort') && Array.isArray(output)) {
        return `After sorting/processing, the result becomes ${formatValue(output)}.`;
    }
    if (t.includes('valid') && typeof output === 'boolean') {
        return output ? 'The input satisfies the validity condition.' : 'The input does not satisfy the validity condition.';
    }
    if (t.includes('depth') || t.includes('height')) {
        return `The maximum depth of the tree is ${output}.`;
    }
    if (t.includes('island') || t.includes('component')) {
        return `There are ${output} connected components.`;
    }
    if (t.includes('duplicate') && typeof output === 'boolean') {
        return output ? 'A duplicate value exists in the input.' : 'All elements are distinct.';
    }
    if (t.includes('missing') && typeof output === 'number') {
        return `The missing number is ${output}.`;
    }
    if (t.includes('single') && typeof output === 'number') {
        return `The element ${output} appears only once.`;
    }
    if (t.includes('merge') && Array.isArray(output)) {
        return `After merging, the result is ${formatValue(output)}.`;
    }
    if (t.includes('buy') && t.includes('sell')) {
        return output > 0 ? `Maximum profit achievable is ${output}.` : `No profitable transaction possible.`;
    }
    if (t.includes('water') || t.includes('container')) {
        return `The maximum area/water is ${output}.`;
    }
    if (t.includes('longest') && typeof output === 'number') {
        return `The longest valid sequence/substring has length ${output}.`;
    }
    if (t.includes('shortest') && typeof output === 'number') {
        return output >= 0 ? `The shortest path/distance is ${output}.` : `No valid path exists.`;
    }
    if (t.includes('count') && typeof output === 'number') {
        return `The count is ${output}.`;
    }
    if (t.includes('minimum') && typeof output === 'number') {
        return `The minimum value is ${output}.`;
    }
    if (t.includes('maximum') && typeof output === 'number') {
        return `The maximum value is ${output}.`;
    }

    // Generic explanation for first example
    return null;
}

// ── Check if examples are already real (not placeholder) ──
function hasRealExamples(examples) {
    if (!examples || !Array.isArray(examples) || examples.length === 0) return false;
    const first = examples[0];
    if (!first.input || !first.output) return false;
    // Detect placeholder patterns
    const placeholders = ['see problem', 'example_input', 'expected output', 'see expected'];
    const inputLower = String(first.input).toLowerCase();
    const outputLower = String(first.output).toLowerCase();
    return !placeholders.some(ph => inputLower.includes(ph) || outputLower.includes(ph));
}

// ── Main ──
async function seedExamples() {
    console.log('🔄 Fetching all problems from Supabase...');

    const { data: problems, error } = await supabaseAdmin
        .from('problems')
        .select('id, title, test_cases, starter_code, examples')
        .order('id');

    if (error) {
        console.error('❌ Error fetching problems:', error.message);
        process.exit(1);
    }

    console.log(`📦 Found ${problems.length} problems`);

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const problem of problems) {
        // Skip if already has real examples
        if (hasRealExamples(problem.examples)) {
            skipped++;
            continue;
        }

        // Skip if no test cases to convert
        const testCases = problem.test_cases;
        if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
            console.log(`⚠️  [${problem.id}] ${problem.title} — no test cases, skipping`);
            failed++;
            continue;
        }

        // Skip placeholder test cases
        const firstTC = testCases[0];
        if (!firstTC || !firstTC.input || (Array.isArray(firstTC.input) && firstTC.input[0] === 'example_input')) {
            console.log(`⚠️  [${problem.id}] ${problem.title} — placeholder test cases, generating basic examples`);
            // Still generate something basic
            const basicExamples = [{
                input: `See problem description for ${problem.title}`,
                output: 'See expected output'
            }];
            const { error: updateErr } = await supabaseAdmin
                .from('problems')
                .update({ examples: basicExamples })
                .eq('id', problem.id);
            if (updateErr) console.error(`  ❌ Update failed: ${updateErr.message}`);
            failed++;
            continue;
        }

        // Extract parameter names from starter code
        const paramNames = extractParamNames(problem.starter_code);

        // Convert up to 3 test cases into examples
        const numExamples = Math.min(3, testCases.length);
        const examples = [];

        for (let i = 0; i < numExamples; i++) {
            const tc = testCases[i];
            if (!tc || tc.input === undefined || tc.output === undefined) continue;

            const example = formatExample(tc, paramNames);

            // Add explanation only for the first example
            if (i === 0) {
                const explanation = generateExplanation(problem.title, tc, paramNames);
                if (explanation) {
                    example.explanation = explanation;
                }
            }

            examples.push(example);
        }

        if (examples.length === 0) {
            console.log(`⚠️  [${problem.id}] ${problem.title} — could not generate examples`);
            failed++;
            continue;
        }

        // Update in Supabase
        const { error: updateErr } = await supabaseAdmin
            .from('problems')
            .update({ examples })
            .eq('id', problem.id);

        if (updateErr) {
            console.error(`❌ [${problem.id}] ${problem.title} — update failed: ${updateErr.message}`);
            failed++;
        } else {
            updated++;
        }
    }

    console.log('\n════════════════════════════════════════');
    console.log('   EXAMPLES SEEDING REPORT');
    console.log('════════════════════════════════════════');
    console.log(`  Total problems:    ${problems.length}`);
    console.log(`  Updated:           ${updated}`);
    console.log(`  Skipped (already): ${skipped}`);
    console.log(`  Failed/No data:    ${failed}`);
    console.log('════════════════════════════════════════\n');
}

seedExamples().catch(console.error);
