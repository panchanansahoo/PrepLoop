/**
 * Comprehensive audit of ALL problems in the database.
 * Checks for mismatches between title, description, starter_code, and examples.
 * 
 * Detects:
 * 1. starter_code function name doesn't match expected function for the problem title
 * 2. Description contains keywords clearly from a different problem
 * 3. Examples are placeholders
 * 4. Description is a placeholder
 */
import { supabaseAdmin } from '../db/supabaseClient.js';

// Map of problem ID -> expected function name keywords (derived from title)
function titleToExpectedKeywords(title) {
    const t = title.toLowerCase();
    const keywords = [];

    // Extract key terms from the title
    const words = t.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
    keywords.push(...words);

    return keywords;
}

function titleToExpectedFnName(title) {
    // Convert "Two Sum" -> "twoSum", "Reverse Linked List" -> "reverseLinkedList" etc.
    const words = title.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/);
    if (words.length === 0) return null;
    return words[0].toLowerCase() + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
}

// Known function name mappings for common problems
const KNOWN_FN_NAMES = {
    'Two Sum': ['twoSum', 'two_sum'],
    'Best Time to Buy and Sell Stock': ['maxProfit', 'max_profit'],
    'Contains Duplicate': ['containsDuplicate', 'contains_duplicate'],
    'Product of Array Except Self': ['productExceptSelf', 'product_except_self'],
    'Maximum Subarray': ['maxSubArray', 'max_sub_array', 'maxSubarray'],
    'Reverse Linked List': ['reverseList', 'reverse_list'],
    'Valid Parentheses': ['isValid', 'is_valid'],
    'Merge Two Sorted Lists': ['mergeTwoLists', 'merge_two_lists'],
    'Binary Search': ['search', 'binarySearch'],
    'Reverse Words in a String': ['reverseWords', 'reverse_words'],
};

function extractFnName(starterCode) {
    if (!starterCode) return null;
    const py = typeof starterCode === 'string' ? starterCode : (starterCode.python || '');
    const cleaned = py.replace(/\\n/g, '\n').replace(/\\t/g, '\t');

    // Match "def funcName(" pattern
    const defMatch = cleaned.match(/def\s+(\w+)\s*\(/);
    if (defMatch) return defMatch[1];

    // Match class-based "class ClassName" with method
    const classMethodMatch = cleaned.match(/def\s+(\w+)\s*\(\s*self/);
    if (classMethodMatch) return classMethodMatch[1];

    return null;
}

// Check if function name is reasonable for the problem title
function isFnNameReasonable(fnName, title) {
    if (!fnName || !title) return true; // Can't check, assume OK

    const fn = fnName.toLowerCase();
    const t = title.toLowerCase();

    // Check known mappings first
    if (KNOWN_FN_NAMES[title]) {
        return KNOWN_FN_NAMES[title].some(known => fn === known.toLowerCase());
    }

    // Extract meaningful words from title (3+ chars)
    const titleWords = t.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length >= 3);

    // Check if at least one title word appears in the function name
    const fnWords = fn.replace(/_/g, ' ').split(/(?=[A-Z])/).join(' ').toLowerCase().split(/\s+/);

    const overlap = titleWords.some(tw => {
        return fnWords.some(fw => fw.includes(tw) || tw.includes(fw));
    });

    // If function name is generic (solve, solution, etc.), that's OK
    const genericNames = ['solve', 'solution', 'main', 'run', 'process', 'execute'];
    if (genericNames.includes(fn)) return true;

    return overlap;
}

// Check if description seems to match the title
function isDescriptionMismatched(description, title) {
    if (!description || !title) return false;

    const desc = description.toLowerCase();
    const t = title.toLowerCase();

    // Skip placeholder descriptions
    if (desc.includes('solve the') && desc.includes('problem')) return false;

    // Build a set of "problem identity" keywords for common problem types
    const mismatchPatterns = [
        // If title mentions "linked list" but desc doesn't, or vice versa
        { titleHas: 'linked list', descMustHave: ['linked list', 'node', 'head', 'list'] },
        { titleHas: 'tree', descMustHave: ['tree', 'node', 'root', 'binary'] },
        { titleHas: 'graph', descMustHave: ['graph', 'node', 'edge', 'vertex', 'adjacent'] },
        { titleHas: 'string', descMustHave: ['string', 'character', 'substring', 'word'] },
        { titleHas: 'palindrome', descMustHave: ['palindrome', 'reverse', 'reads the same'] },
        { titleHas: 'anagram', descMustHave: ['anagram', 'rearrange', 'permutation'] },
        { titleHas: 'parenthes', descMustHave: ['parenthes', 'bracket', '(', ')'] },
        { titleHas: 'matrix', descMustHave: ['matrix', 'grid', 'row', 'column', 'm x n', 'n x n'] },
        { titleHas: 'binary search', descMustHave: ['sorted', 'search', 'find', 'target'] },
    ];

    for (const pattern of mismatchPatterns) {
        if (t.includes(pattern.titleHas)) {
            const hasRequired = pattern.descMustHave.some(kw => desc.includes(kw));
            if (!hasRequired) return true; // Mismatch detected
        }
    }

    // Check for cross-contamination: description mentions a completely different problem type
    const crossChecks = [
        // Title is about strings but description talks about linked lists
        { titleLacks: 'linked list', descHasWrong: 'head of a sorted linked list' },
        { titleLacks: 'linked list', descHasWrong: 'head of a linked list' },
        { titleLacks: 'tree', descHasWrong: 'root of a binary tree' },
        { titleLacks: 'duplicate', descHasWrong: 'delete all duplicates' },
    ];

    for (const check of crossChecks) {
        if (!t.includes(check.titleLacks) && desc.includes(check.descHasWrong)) {
            return true;
        }
    }

    return false;
}

async function audit() {
    console.log('=== COMPREHENSIVE PROBLEM AUDIT ===\n');
    console.log('Fetching all problems from database...\n');

    // Fetch all problems
    let allProblems = [];
    let offset = 0;
    const batchSize = 100;

    while (true) {
        const { data, error } = await supabaseAdmin
            .from('problems')
            .select('id, title, description, examples, constraints, starter_code, solution_code, test_cases')
            .order('id')
            .range(offset, offset + batchSize - 1);

        if (error) {
            console.error('Error fetching:', error.message);
            break;
        }
        if (!data || data.length === 0) break;
        allProblems.push(...data);
        offset += batchSize;
        if (data.length < batchSize) break;
    }

    console.log(`Found ${allProblems.length} problems in database.\n`);

    const issues = [];
    let placeholderDescCount = 0;
    let placeholderExamplesCount = 0;
    let fnMismatchCount = 0;
    let descMismatchCount = 0;

    for (const p of allProblems) {
        const problemIssues = [];

        // 1. Check description
        const desc = p.description || '';
        const isPlaceholderDesc = !desc ||
            desc.startsWith('Solve the') ||
            desc.includes('Write an efficient solution') && desc.length < 100;

        if (isPlaceholderDesc) {
            placeholderDescCount++;
            problemIssues.push('PLACEHOLDER_DESC');
        }

        // 2. Check description mismatch with title
        if (!isPlaceholderDesc && isDescriptionMismatched(desc, p.title)) {
            descMismatchCount++;
            problemIssues.push('DESC_MISMATCH');
        }

        // 3. Check examples
        const examples = p.examples;
        const hasRealExamples = examples && Array.isArray(examples) && examples.length > 0 &&
            examples[0]?.input &&
            !String(examples[0].input).toLowerCase().includes('see problem') &&
            !String(examples[0].input).toLowerCase().includes('see expected');

        if (!hasRealExamples) {
            placeholderExamplesCount++;
            problemIssues.push('PLACEHOLDER_EXAMPLES');
        }

        // 4. Check starter_code function name
        const starterCode = p.starter_code;
        if (starterCode) {
            const fnName = extractFnName(starterCode);
            if (fnName && !isFnNameReasonable(fnName, p.title)) {
                fnMismatchCount++;
                problemIssues.push(`FN_MISMATCH (${fnName})`);
            }
        }

        // Only report problems with actual mismatches (not just placeholders)
        if (problemIssues.some(i => i.includes('MISMATCH'))) {
            issues.push({
                id: p.id,
                title: p.title,
                issues: problemIssues,
                fnName: extractFnName(p.starter_code),
                descPreview: desc.substring(0, 100),
            });
        }
    }

    // Print summary
    console.log('=== AUDIT RESULTS ===\n');
    console.log(`Total problems: ${allProblems.length}`);
    console.log(`Placeholder descriptions: ${placeholderDescCount}`);
    console.log(`Placeholder examples: ${placeholderExamplesCount}`);
    console.log(`Function name mismatches: ${fnMismatchCount}`);
    console.log(`Description mismatches: ${descMismatchCount}`);
    console.log('');

    if (issues.length > 0) {
        console.log(`\n=== ${issues.length} PROBLEMS WITH MISMATCHES ===\n`);
        for (const issue of issues) {
            console.log(`[ID ${issue.id}] ${issue.title}`);
            console.log(`  Issues: ${issue.issues.join(', ')}`);
            if (issue.fnName) console.log(`  Starter fn: ${issue.fnName}`);
            console.log(`  Desc: "${issue.descPreview}..."`);
            console.log('');
        }
    } else {
        console.log('\n✅ No mismatched problems found!');
    }

    // Also list function name mismatches separately (even without desc mismatch)
    console.log('\n=== ALL FUNCTION NAME MISMATCHES ===\n');
    let fnIssueCount = 0;
    for (const p of allProblems) {
        const fnName = extractFnName(p.starter_code);
        if (fnName && !isFnNameReasonable(fnName, p.title)) {
            console.log(`[ID ${p.id}] "${p.title}" -> fn: ${fnName}`);
            fnIssueCount++;
        }
    }
    if (fnIssueCount === 0) console.log('No function name mismatches found.');

    console.log(`\n=== AUDIT COMPLETE ===`);
}

audit().catch(console.error);
