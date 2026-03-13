/**
 * Smart Description Re-shuffler
 * 
 * The descriptions in the database are correct LeetCode descriptions,
 * they're just assigned to the wrong problem IDs.
 * 
 * Strategy:
 * 1. Read all problems (id, title, description, examples, constraints, starter_code, solution_code, test_cases)
 * 2. For each description, figure out which problem title it SHOULD belong to
 * 3. Re-assign all data to the correct problem IDs
 */
import { supabaseAdmin } from '../db/supabaseClient.js';

// Keywords that strongly identify a problem from its description
function extractIdentityKeywords(title) {
    const t = title.toLowerCase();

    // Highly specific keyword mappings for ambiguous titles
    const specificMappings = {
        'two sum': ['two integers that add up to', 'indices of the two numbers'],
        'best time to buy and sell stock': ['prices where prices[i] is the price', 'buy one and choose a different day'],
        'contains duplicate': ['any value appears at least twice', 'every element is distinct'],
        'product of array except self': ['product of all the elements of nums except nums[i]'],
        'maximum subarray': ['subarray with the largest sum', 'find the subarray'],
        'maximum product subarray': ['largest product', 'contiguous non-empty sequence'],
        'find minimum in rotated sorted array': ['rotated between 1 and n times', 'return the minimum element'],
        'search in rotated sorted array': ['rotated at some pivot', 'return its index'],
        'container with most water': ['lines are drawn such that the two endpoints', 'n non-negative integers'],
        '3sum': ['triplets', 'three integers'],
        '4sum': ['quadruplets', 'four integers'],
        'valid palindrome': ['reads the same forward and backward', 'alphanumeric'],
        'valid palindrome ii': ['at most one character'],
        'reverse words in a string': ['reverse the order of the words'],
        'reverse string': ['reverse the string', 'do not return anything, modify s in-place'],
        'linked list cycle': ['linked list has a cycle'],
        'binary search': ['sorted in ascending order', 'target value to search'],
        'sqrt(x)': ['square root of x rounded down'],
        'valid perfect square': ['perfect square'],
        'guess number higher or lower': ['guess game', 'pick a number from 1 to n'],
        'first bad version': ['product manager', 'bad version', 'first bad version'],
        'search insert position': ['insert position', 'would be if it were inserted'],
        'peak index in a mountain array': ['mountain array'],
        'find peak element': ['peak element', 'strictly greater than its neighbors'],
        'koko eating bananas': ['koko loves to eat bananas', 'piles of bananas'],
        'valid parentheses': ['containing just the characters', 'determine if the input string is valid'],
        'min stack': ['push, pop, top, and retrieving the minimum'],
        'daily temperatures': ['temperatures', 'how many days you would have to wait'],
        'evaluate reverse polish notation': ['reverse polish notation', 'tokens'],
        'basic calculator': ['basic calculator', 'evaluate it'],
        'decode string': ['encoding rule', 'k[encoded_string]'],
        'asteroid collision': ['asteroids', 'collision'],
        'largest rectangle in histogram': ['histogram', 'largest rectangle'],
        'climbing stairs': ['climbing a staircase', 'n steps to reach the top'],
        'house robber': ['professional robber planning to rob houses along a street'],
        'house robber ii': ['robber', 'arranged in a circle'],
        'coin change': ['coins of different denominations', 'fewest number of coins'],
        'word break': ['word break', 'segmented into', 'dictionary'],
        'longest common subsequence': ['longest common subsequence'],
        'edit distance': ['minimum number of operations required to convert word1 to word2'],
        'unique paths': ['robot is located at the top-left corner', 'reach the bottom-right'],
        'minimum path sum': ['path from top left to bottom right', 'minimizes the sum'],
        'longest palindromic substring': ['longest palindromic substring'],
        'palindromic substrings': ['number of palindromic substrings'],
        'course schedule': ['total of numcourses courses', 'prerequisites'],
        'number of islands': ['2d binary grid', 'number of islands'],
        'clone graph': ['reference of a node', 'deep copy', 'clone'],
        'pacific atlantic water flow': ['pacific ocean and the atlantic ocean', 'water flow'],
        'word search': ['m x n grid of characters board', 'word exists in the grid'],
        'permutations': ['distinct integers', 'return all the possible permutations'],
        'subsets': ['integer array nums', 'return all possible subsets'],
        'combination sum': ['distinct positive integers candidates', 'target integer target'],
        'generate parentheses': ['n pairs of parentheses', 'generate all combinations'],
        'n-queens': ['n-queens puzzle', 'n queens on an n x n chessboard'],
        'sudoku solver': ['solve a sudoku puzzle', 'filling the empty cells'],
        'letter combinations of a phone number': ['digits from 2-9', 'letter combinations'],
        'palindrome partitioning': ['partition s such that every substring', 'palindrome'],
        'implement trie': ['trie', 'insert, search, and startswith'],
        'task scheduler': ['cpu needs to do', 'cooldown period'],
        'merge k sorted lists': ['k linked-lists', 'sorted in ascending order', 'merge all'],
        'find median from data stream': ['median is the middle value', 'data stream'],
        'top k frequent elements': ['k most frequent elements'],
        'reorganize string': ['rearrange the characters', 'no two adjacent characters are the same'],
        'meeting rooms': ['meeting time intervals'],
        'gas station': ['gas stations along a circular route'],
        'jump game': ['initially positioned at the array\'s first index', 'maximum jump length'],
        'candy': ['children standing in a line', 'rating value'],
        'partition labels': ['partition the string into as many parts as possible'],
        'serialize and deserialize binary tree': ['serialization is the process of converting a data structure'],
        'serialize and deserialize bst': ['serialization is the process'],
        'binary tree level order traversal': ['level order traversal'],
        'binary tree right side view': ['right side view', 'standing on the right side'],
        'invert binary tree': ['invert the tree'],
        'path sum': ['root-to-leaf path', 'targetsum'],
        'diameter of binary tree': ['diameter of the tree', 'length of the longest path'],
        'balanced binary tree': ['height-balanced'],
        'maximum depth of binary tree': ['maximum depth'],
        'minimum depth of binary tree': ['minimum depth'],
        'same tree': ['check if they are the same'],
        'symmetric tree': ['mirror of itself', 'symmetric'],
        'validate binary search tree': ['valid binary search tree', 'valid bst'],
        'kth smallest element in bst': ['kth smallest', 'binary search tree'],
        'lowest common ancestor': ['lowest common ancestor', 'lca'],
        'construct binary tree from preorder and inorder': ['preorder and inorder', 'construct the binary tree'],
        'construct binary tree from inorder and postorder': ['inorder and postorder', 'construct the binary tree'],
        'count complete tree nodes': ['complete binary tree', 'number of the nodes'],
        'populating next right pointers': ['populate each next pointer', 'next right node'],
        'delete node in a bst': ['delete the node with the given key'],
        'insert into a bst': ['insert a value into a binary search tree'],
        'recover binary search tree': ['exactly two nodes', 'swapped by mistake'],
        'unique binary search trees': ['structurally unique bst'],
        'number of provinces': ['n cities', 'directly connected'],
        'graph valid tree': ['determine if these edges make up a valid tree'],
        'redundant connection': ['redundant connection', 'additional edge'],
        'network delay time': ['network delay', 'signal sent from node'],
        'longest increasing subsequence': ['longest strictly increasing subsequence'],
        'russian doll envelopes': ['envelopes', 'wi, hi'],
        'target sum': ['expression out of nums', 'assign + or -'],
        'ones and zeroes': ['array of binary strings', 'largest subset'],
        'regular expression matching': ['regular expression matching', 'support for . and *'],
        'wildcard matching': ['wildcard pattern matching', '? and *'],
        'burst balloons': ['balloons', 'painted with a number', 'maximum coins'],
        'word search ii': ['find all words on the board'],
        'maximal square': ['largest square containing only 1s'],
        'triangle': ['triangle array', 'minimum path sum from top to bottom'],
        'interleaving string': ['interleaving of s1 and s2'],
        'super egg drop': ['identical eggs', 'which floor f that is'],
        'arithmetic slices': ['arithmetic sequence', 'at least three elements'],
        'longest valid parentheses': ['longest valid', 'well-formed parentheses'],
        'decode ways': ['encoded message', 'a = 1, b = 2', 'number of ways to decode'],
        'stock with cooldown': ['cooldown', 'after you sell your stock'],
        'stock with transaction fee': ['transaction fee'],
        'partition equal subset sum': ['partition the array into two subsets', 'sum of both subsets is equal'],
        'distinct subsequences': ['distinct subsequences of s which equals t'],
        'longest increasing path in a matrix': ['longest increasing path in the matrix'],
        'maximum length of pair chain': ['pair chain'],
        'wiggle subsequence': ['wiggle sequence'],
    };

    // Check specific mappings
    for (const [key, keywords] of Object.entries(specificMappings)) {
        if (t.includes(key)) return keywords;
    }

    // Fallback: use title words
    return t.split(/\s+/).filter(w => w.length >= 4);
}

function scoreMatch(description, keywords) {
    if (!description || !keywords || keywords.length === 0) return 0;
    const desc = description.toLowerCase();
    let score = 0;
    for (const kw of keywords) {
        if (desc.includes(kw.toLowerCase())) score++;
    }
    return score / keywords.length;
}

async function main() {
    console.log('=== SMART DESCRIPTION RE-SHUFFLER ===\n');

    // Fetch all problems with ALL data
    let allProblems = [];
    let offset = 0;
    const batchSize = 100;

    while (true) {
        const { data, error } = await supabaseAdmin
            .from('problems')
            .select('id, title, description, examples, constraints, starter_code, solution_code, test_cases')
            .order('id')
            .range(offset, offset + batchSize - 1);

        if (error) { console.error('Error:', error.message); break; }
        if (!data || data.length === 0) break;
        allProblems.push(...data);
        offset += batchSize;
        if (data.length < batchSize) break;
    }

    console.log(`Loaded ${allProblems.length} problems.\n`);

    // Build a pool of all "data bundles" (description + examples + constraints + starter_code + etc.)
    const dataBundles = allProblems.map(p => ({
        sourceId: p.id,
        sourceTitle: p.title,
        description: p.description,
        examples: p.examples,
        constraints: p.constraints,
        starter_code: p.starter_code,
        solution_code: p.solution_code,
        test_cases: p.test_cases,
    }));

    // For each problem, find which data bundle best matches its title
    const assignments = [];
    const usedBundles = new Set();

    // First pass: find strong matches
    for (const problem of allProblems) {
        const keywords = extractIdentityKeywords(problem.title);

        let bestScore = 0;
        let bestBundle = null;

        for (const bundle of dataBundles) {
            if (usedBundles.has(bundle.sourceId)) continue;
            const score = scoreMatch(bundle.description, keywords);
            if (score > bestScore) {
                bestScore = score;
                bestBundle = bundle;
            }
        }

        if (bestScore >= 0.5 && bestBundle) {
            assignments.push({
                targetId: problem.id,
                targetTitle: problem.title,
                sourceId: bestBundle.sourceId,
                sourceTitle: bestBundle.sourceTitle,
                score: bestScore,
                bundle: bestBundle,
            });
            usedBundles.add(bestBundle.sourceId);
        }
    }

    // Report matches
    let correctCount = 0;
    let needsSwap = 0;
    let unmatched = 0;
    const swapList = [];

    for (const a of assignments) {
        if (a.targetId === a.sourceId) {
            correctCount++;
        } else {
            needsSwap++;
            swapList.push(a);
        }
    }

    // Find unmatched problems
    const matchedIds = new Set(assignments.map(a => a.targetId));
    const unmatchedProblems = allProblems.filter(p => !matchedIds.has(p.id));
    unmatched = unmatchedProblems.length;

    console.log(`\n=== MATCH RESULTS ===`);
    console.log(`Already correct: ${correctCount}`);
    console.log(`Needs swap: ${needsSwap}`);
    console.log(`Unmatched: ${unmatched}`);

    if (swapList.length > 0) {
        console.log(`\n=== SWAPS NEEDED (first 30) ===\n`);
        for (const s of swapList.slice(0, 30)) {
            console.log(`[ID ${s.targetId}] "${s.targetTitle}" <- desc from [ID ${s.sourceId}] "${s.sourceTitle}" (score: ${s.score.toFixed(2)})`);
        }
    }

    if (unmatchedProblems.length > 0) {
        console.log(`\n=== UNMATCHED PROBLEMS (first 30) ===\n`);
        for (const p of unmatchedProblems.slice(0, 30)) {
            console.log(`[ID ${p.id}] "${p.title}" - desc: "${(p.description || '').substring(0, 60)}..."`);
        }
    }

    // Now apply the swaps
    console.log(`\n=== APPLYING ${swapList.length} SWAPS ===\n`);

    let applied = 0;
    let failed = 0;

    for (const swap of swapList) {
        const bundle = swap.bundle;
        const updateData = {};

        if (bundle.description) updateData.description = bundle.description;
        if (bundle.examples) updateData.examples = bundle.examples;
        if (bundle.constraints) updateData.constraints = bundle.constraints;
        if (bundle.starter_code) updateData.starter_code = bundle.starter_code;
        if (bundle.solution_code) updateData.solution_code = bundle.solution_code;
        if (bundle.test_cases) updateData.test_cases = bundle.test_cases;

        if (Object.keys(updateData).length === 0) continue;

        const { error } = await supabaseAdmin
            .from('problems')
            .update(updateData)
            .eq('id', swap.targetId);

        if (error) {
            console.log(`  ❌ [${swap.targetId}] ${swap.targetTitle}: ${error.message}`);
            failed++;
        } else {
            console.log(`  ✅ [${swap.targetId}] ${swap.targetTitle} <- from [${swap.sourceId}]`);
            applied++;
        }
    }

    console.log(`\n=== DONE ===`);
    console.log(`Applied: ${applied}, Failed: ${failed}`);

    // Report still-unmatched for manual fixing
    if (unmatchedProblems.length > 0) {
        console.log(`\n${unmatchedProblems.length} problems still need manual descriptions.`);
        console.log('IDs:', unmatchedProblems.map(p => p.id).join(', '));
    }
}

main().catch(console.error);
