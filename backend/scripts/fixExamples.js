// Force-reformat examples for ALL problems that have raw array format
// Converts test_cases -> properly named examples using starter_code param names

import { supabaseAdmin } from '../db/supabaseClient.js';

function extractParamNames(starterCode) {
    if (!starterCode?.python) return [];
    const match = starterCode.python.match(/def\s+\w+\s*\(([^)]*)\)/);
    if (!match) return [];
    return match[1]
        .split(',')
        .map(p => p.trim())
        .filter(p => p && p !== 'self')
        .map(p => { const i = p.indexOf(':'); return i >= 0 ? p.slice(0, i).trim() : p.trim(); })
        .filter(Boolean);
}

function formatValue(val) {
    if (val === null || val === undefined) return 'null';
    if (val === true) return 'true';
    if (val === false) return 'false';
    if (typeof val === 'string') return `"${val}"`;
    if (Array.isArray(val)) {
        if (val.length === 0) return '[]';
        // Nested arrays
        return `[${val.map(v => formatValue(v)).join(', ')}]`;
    }
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
}

function formatExample(testCase, paramNames) {
    const inputs = testCase.input;
    const output = testCase.output;
    let inputStr;

    if (!Array.isArray(inputs)) {
        inputStr = paramNames.length > 0 ? `${paramNames[0]} = ${formatValue(inputs)}` : formatValue(inputs);
    } else if (inputs.length === 1) {
        inputStr = paramNames.length > 0 ? `${paramNames[0]} = ${formatValue(inputs[0])}` : formatValue(inputs[0]);
    } else {
        inputStr = inputs.map((inp, i) => {
            const name = paramNames[i] || `param${i + 1}`;
            return `${name} = ${formatValue(inp)}`;
        }).join(', ');
    }

    return { input: inputStr, output: formatValue(output) };
}

// Generate contextual explanation based on problem title and output
function generateExplanation(title, output) {
    const t = title.toLowerCase();
    const o = output;

    if (typeof o === 'boolean') {
        if (t.includes('valid') || t.includes('palindrome')) return o ? 'The input is valid.' : 'The input is invalid.';
        if (t.includes('duplicate')) return o ? 'Duplicate found.' : 'No duplicates.';
        if (t.includes('subset') || t.includes('subsequence')) return o ? 'It is a valid subsequence/subset.' : 'Not a valid subsequence/subset.';
        return o ? 'Condition is satisfied.' : 'Condition is not satisfied.';
    }
    if (typeof o === 'number') {
        if (t.includes('depth') || t.includes('height')) return `The depth/height is ${o}.`;
        if (t.includes('longest')) return `The length of the longest result is ${o}.`;
        if (t.includes('shortest') || t.includes('minimum path')) return o >= 0 ? `The shortest path is ${o}.` : 'No valid path exists.';
        if (t.includes('profit') || t.includes('buy') && t.includes('sell')) return o > 0 ? `Maximum profit is ${o}.` : 'No profit possible.';
        if (t.includes('island') || t.includes('component') || t.includes('province')) return `There are ${o} connected regions.`;
        if (t.includes('missing')) return `The missing number is ${o}.`;
        if (t.includes('single')) return `The unique element is ${o}.`;
        if (t.includes('count')) return `The count is ${o}.`;
        if (t.includes('maximum') || t.includes('max')) return `The maximum value is ${o}.`;
        if (t.includes('minimum') || t.includes('min')) return `The minimum value is ${o}.`;
        if (t.includes('sum')) return `The sum equals ${o}.`;
        if (t.includes('stair') || t.includes('climb') || t.includes('ways')) return `There are ${o} distinct ways.`;
    }
    if (Array.isArray(o)) {
        if (t.includes('sort') || t.includes('merge') || t.includes('reverse')) return `After processing: ${formatValue(o)}.`;
        if (t.includes('two sum')) return `The indices are ${formatValue(o)}.`;
    }
    return null;
}

async function fixAllExamples() {
    console.log('Fetching all problems...');
    const { data: problems, error } = await supabaseAdmin
        .from('problems')
        .select('id, title, test_cases, starter_code, examples')
        .order('id');

    if (error) { console.error('Error:', error.message); process.exit(1); }
    console.log(`Found ${problems.length} problems`);

    let updated = 0, skipped = 0, failed = 0;

    for (const p of problems) {
        // Check if example already has good format (named params with =)
        const ex = p.examples;
        if (ex && ex[0] && typeof ex[0].input === 'string' &&
            ex[0].input.includes(' = ') && !ex[0].input.startsWith('[') && !ex[0].input.startsWith('{')) {
            skipped++;
            continue;
        }

        // Need test cases to convert
        const tc = p.test_cases;
        if (!tc || !Array.isArray(tc) || tc.length === 0) {
            failed++;
            continue;
        }

        // Skip placeholder test cases  
        if (tc[0].input && Array.isArray(tc[0].input) && tc[0].input[0] === 'example_input') {
            failed++;
            continue;
        }

        const paramNames = extractParamNames(p.starter_code);
        const numEx = Math.min(3, tc.length);
        const examples = [];

        for (let i = 0; i < numEx; i++) {
            if (!tc[i] || tc[i].input === undefined || tc[i].output === undefined) continue;
            const example = formatExample(tc[i], paramNames);
            if (i === 0) {
                const explanation = generateExplanation(p.title, tc[i].output);
                if (explanation) example.explanation = explanation;
            }
            examples.push(example);
        }

        if (examples.length === 0) { failed++; continue; }

        const { error: err } = await supabaseAdmin
            .from('problems')
            .update({ examples })
            .eq('id', p.id);

        if (err) {
            console.error(`[${p.id}] ${p.title} - FAILED: ${err.message}`);
            failed++;
        } else {
            updated++;
        }
    }

    console.log('\n════════════════════════════════════════');
    console.log('   EXAMPLES REFORMAT REPORT');
    console.log('════════════════════════════════════════');
    console.log(`  Total:    ${problems.length}`);
    console.log(`  Updated:  ${updated}`);
    console.log(`  Skipped:  ${skipped} (already formatted)`);
    console.log(`  Failed:   ${failed}`);
    console.log('════════════════════════════════════════\n');
}

fixAllExamples().catch(console.error);
