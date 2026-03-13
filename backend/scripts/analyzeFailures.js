import fs from 'fs';

const data = JSON.parse(fs.readFileSync('failing_problems_data.json', 'utf8'));

console.log('=== CLASS-BASED PROBLEMS (output === "class") ===\n');
const classProbs = [];
const fnNotFound = [];
const logicIssues = [];
const treeListIssues = [];
const otherIssues = [];

for (const [id, p] of Object.entries(data)) {
    const tc0 = p.test_cases?.[0];
    if (!tc0) continue;

    if (tc0.output === 'class') {
        classProbs.push({ id, title: p.title, starter_fn: p.starter_fn, tc: tc0 });
    } else {
        // check if the solution has function name issues based on report
        otherIssues.push({ id, title: p.title, starter_fn: p.starter_fn });
    }
}

console.log('Class-based problems:', classProbs.length);
classProbs.forEach(p => {
    console.log(`  ${p.id}: ${p.title} (starter_fn: ${p.starter_fn})`);
    console.log(`    TC input: ${JSON.stringify(p.tc.input)}`);
});

console.log('\n\nOther failing problems:', otherIssues.length);
otherIssues.forEach(p => {
    console.log(`  ${p.id}: ${p.title} (starter_fn: ${p.starter_fn})`);
});

// Now check what functions the solutions define
console.log('\n\n=== SOLUTION FUNCTION ANALYSIS ===\n');
for (const [id, p] of Object.entries(data)) {
    const sol = p.solution_py_first300 || '';
    const starterFn = p.starter_fn;
    const solFns = [...sol.matchAll(/def (\w+)/g)].map(m => m[1]);
    const hasClass = sol.includes('class Solution') || sol.includes('class ');
    console.log(`  ${id}: ${p.title}`);
    console.log(`    Starter fn: ${starterFn}, Sol Class: ${hasClass}, Sol fns: [${solFns.join(', ')}]`);
}
