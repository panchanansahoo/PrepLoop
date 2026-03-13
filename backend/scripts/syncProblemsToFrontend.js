// Script to sync backend problems (425) to frontend problemsDatabase.js
// Generates missing problems from backend data in frontend format

import { dsaProblems } from '../data/dsaProblems.js';
import { extendedDsaProblems } from '../data/dsaProblemsExtended.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const allBackend = [...dsaProblems, ...extendedDsaProblems];

// Read current frontend file
const fePath = path.join(__dirname, '../../frontend/src/data/problemsDatabase.js');
const feContent = fs.readFileSync(fePath, 'utf-8');

// Find existing IDs in frontend (match { id: NN, pattern)
const existingTitles = new Set();
const titleMatches = [...feContent.matchAll(/title:\s*'([^']+)'/g)];
titleMatches.forEach(m => existingTitles.add(m[1].toLowerCase()));

console.log(`Frontend has titles: ${existingTitles.size}`);
console.log(`Backend has problems: ${allBackend.length}`);

// Map backend pattern to frontend topics
const patternToTopics = {
    'Array': ['Arrays'],
    'Arrays & Hashing': ['Arrays', 'Hashing'],
    'Two Pointers': ['Two Pointers', 'Arrays'],
    'Sliding Window': ['Sliding Window', 'Arrays'],
    'Stack': ['Stack'],
    'Binary Search': ['Binary Search', 'Arrays'],
    'Linked List': ['Linked List'],
    'Trees': ['Trees'],
    'Tries': ['Trie'],
    'Trie': ['Trie'],
    'Heap / Priority Queue': ['Heap'],
    'Heap': ['Heap'],
    'Backtracking': ['Backtracking', 'Recursion'],
    'Graphs': ['Graphs'],
    'Advanced Graphs': ['Graphs'],
    '1-D Dynamic Programming': ['Dynamic Programming'],
    '2-D Dynamic Programming': ['Dynamic Programming', 'Matrix'],
    'Greedy': ['Greedy'],
    'Intervals': ['Arrays', 'Sorting'],
    'Math & Geometry': ['Math'],
    'Bit Manipulation': ['Bit Manipulation'],
    'Dynamic Programming': ['Dynamic Programming'],
    'Matrix': ['Matrix', 'Arrays'],
    'String': ['Strings'],
    'Sorting': ['Sorting', 'Arrays'],
    'Hashing': ['Hashing', 'Arrays'],
    'Recursion': ['Recursion'],
    'Queue': ['Queue'],
    'Design': ['Design'],
    'Divide & Conquer': ['Divide & Conquer'],
    'Union Find': ['Graphs'],
    'Math': ['Math'],
};

// Map backend pattern to frontend patterns
const patternToPatterns = {
    'Array': ['prefix-sum'],
    'Arrays & Hashing': ['prefix-sum'],
    'Two Pointers': ['two-pointers'],
    'Sliding Window': ['sliding-window'],
    'Stack': ['monotonic-stack'],
    'Binary Search': ['binary-search'],
    'Linked List': ['in-place-reversal'],
    'Trees': ['dfs'],
    'Tries': ['trie-pattern'],
    'Trie': ['trie-pattern'],
    'Heap / Priority Queue': ['top-k'],
    'Heap': ['top-k'],
    'Backtracking': ['backtracking'],
    'Graphs': ['dfs', 'bfs'],
    'Advanced Graphs': ['shortest-path'],
    '1-D Dynamic Programming': ['dp-fibonacci'],
    '2-D Dynamic Programming': ['dp-grid'],
    'Greedy': ['greedy'],
    'Intervals': ['merge-intervals'],
    'Math & Geometry': ['bit-manipulation'],
    'Bit Manipulation': ['bit-manipulation'],
    'Dynamic Programming': ['dp-fibonacci'],
    'Matrix': ['matrix-traversal'],
    'String': ['two-pointers'],
    'Sorting': ['two-pointers'],
    'Hashing': ['prefix-sum'],
    'Recursion': ['backtracking'],
    'Queue': ['bfs'],
    'Design': [],
    'Divide & Conquer': ['binary-search'],
    'Union Find': ['union-find'],
    'Math': ['bit-manipulation'],
};

// Difficulty to time/acceptance/frequency defaults
const diffDefaults = {
    'Easy': { timeEstimate: 15, acceptance: 72, frequency: 'medium' },
    'Medium': { timeEstimate: 25, acceptance: 50, frequency: 'medium' },
    'Hard': { timeEstimate: 35, acceptance: 38, frequency: 'low' },
};

// Find highest existing ID in frontend
const idMatches = [...feContent.matchAll(/id:\s*(\d+)/g)];
const maxFrontendId = Math.max(...idMatches.map(m => parseInt(m[1])));
console.log(`Highest frontend ID: ${maxFrontendId}`);

// Find problems that don't exist in frontend by title
const missing = allBackend.filter(p => !existingTitles.has(p.title.toLowerCase()));
console.log(`Missing problems: ${missing.length}`);

if (missing.length === 0) {
    console.log('All problems already in frontend!');
    process.exit(0);
}

// Generate frontend-format entries for missing problems
let nextId = maxFrontendId + 1;
const newEntries = missing.map(p => {
    const topics = patternToTopics[p.pattern] || ['Arrays'];
    const patterns = patternToPatterns[p.pattern] || [];
    const defs = diffDefaults[p.difficulty] || diffDefaults['Medium'];
    const companies = (p.companies || []).map(c => c.toLowerCase().replace(/\s+/g, ''));

    // Map company names to frontend IDs
    const companyMap = {
        'google': 'google', 'amazon': 'amazon', 'meta': 'meta', 'facebook': 'meta',
        'microsoft': 'microsoft', 'apple': 'apple', 'netflix': 'netflix',
        'uber': 'uber', 'twitter': 'twitter', 'adobe': 'adobe',
        'tcs': 'tcs', 'infosys': 'infosys', 'wipro': 'wipro',
        'flipkart': 'flipkart', 'paytm': 'paytm', 'swiggy': 'swiggy',
        'razorpay': 'razorpay', 'oracle': 'oracle', 'samsung': 'samsung',
        'goldmansachs': 'goldman', 'morganstanley': 'morgan',
    };

    const mappedCompanies = companies
        .map(c => companyMap[c] || c)
        .filter(c => ['google', 'amazon', 'meta', 'microsoft', 'apple', 'netflix', 'uber', 'twitter', 'adobe', 'tcs', 'infosys', 'wipro', 'flipkart', 'paytm', 'swiggy', 'razorpay', 'oracle', 'samsung', 'goldman', 'morgan'].includes(c));

    const entry = {
        id: nextId++,
        title: p.title,
        difficulty: p.difficulty,
        topics: topics,
        patterns: patterns,
        companies: mappedCompanies.length > 0 ? mappedCompanies : ['amazon', 'google'],
        frequency: defs.frequency,
        acceptance: defs.acceptance,
        timeEstimate: defs.timeEstimate,
        description: `Solve the ${p.title} problem. Pattern: ${p.pattern}. Difficulty: ${p.difficulty}.`,
        examples: [{ input: 'See problem description', output: 'See expected output' }],
        constraints: 'See problem constraints',
        hints: ['Think about the ' + p.pattern + ' approach', 'Consider edge cases', 'Optimize for time complexity'],
    };

    return entry;
});

// Generate JS code for new entries
let jsCode = newEntries.map(entry => {
    const escapedTitle = entry.title.replace(/'/g, "\\'");
    const escapedDesc = entry.description.replace(/'/g, "\\'");
    return `  { id: ${entry.id}, title: '${escapedTitle}', difficulty: '${entry.difficulty}', topics: ${JSON.stringify(entry.topics)}, patterns: ${JSON.stringify(entry.patterns)}, companies: ${JSON.stringify(entry.companies)}, frequency: '${entry.frequency}', acceptance: ${entry.acceptance}, timeEstimate: ${entry.timeEstimate}, description: '${escapedDesc}', examples: ${JSON.stringify(entry.examples)}, constraints: '${entry.constraints}', hints: ${JSON.stringify(entry.hints)} },`;
}).join('\n');

// Insert before the closing bracket of PROBLEMS array
// Find the position of the last entry in PROBLEMS
const closingBracketIndex = feContent.lastIndexOf('];');
const insertPos = feContent.lastIndexOf('},', closingBracketIndex);

if (insertPos === -1) {
    console.error('Could not find insertion point!');
    process.exit(1);
}

const newContent = feContent.slice(0, insertPos + 2) + '\n\n  // ══════════ SYNCED FROM BACKEND (425 total) ══════════\n' + jsCode + '\n' + feContent.slice(insertPos + 2);

fs.writeFileSync(fePath, newContent, 'utf-8');
console.log(`\n✅ Added ${newEntries.length} problems to frontend problemsDatabase.js`);
console.log(`Frontend now has IDs ${1} to ${nextId - 1}`);
