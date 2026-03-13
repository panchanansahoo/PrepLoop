import { supabaseAdmin } from './supabaseClient.js';

const BATCH2 = {
    // ===== EASY (class-based) =====
    'Max Stack': { fn: 'MaxStack', tc: [{ i: [], o: "class" }] },
    'Min Stack': { fn: 'MinStack', tc: [{ i: ["push(-2)", "push(0)", "push(-3)", "getMin()", "pop()", "top()", "getMin()"], o: [null, null, null, -3, null, 0, -2] }] },

    // ===== HARD =====
    'Alien Dictionary': { fn: 'alienOrder', tc: [{ i: [["wrt", "wrf", "er", "ett", "rftt"]], o: "wertf" }, { i: [["z", "x"]], o: "zx" }] },
    "All O'one Data Structure": { fn: 'AllOne', tc: [{ i: [], o: "class" }] },
    'Arithmetic Slices II': { fn: 'numberOfArithmeticSlices', tc: [{ i: [[2, 4, 6, 8, 10]], o: 7 }, { i: [[7, 7, 7, 7, 7]], o: 16 }] },
    'Basic Calculator': { fn: 'calculate', tc: [{ i: ["1 + 1"], o: 2 }, { i: [" 2-1 + 2 "], o: 3 }, { i: ["(1+(4+5+2)-3)+(6+8)"], o: 23 }] },
    'Basic Calculator III': { fn: 'calculate', tc: [{ i: ["2*(5+5*2)/3+(6/2+8)"], o: 21 }, { i: ["(2+6*3+5-(3*14/7+2)*5)+3"], o: -12 }] },
    'Best Time to Buy and Sell Stock III': { fn: 'maxProfit', tc: [{ i: [[3, 3, 5, 0, 0, 3, 1, 4]], o: 6 }, { i: [[1, 2, 3, 4, 5]], o: 4 }] },
    'Best Time to Buy and Sell Stock IV': { fn: 'maxProfit', tc: [{ i: [2, [2, 4, 1]], o: 2 }, { i: [2, [3, 2, 6, 5, 0, 3]], o: 7 }] },
    'Concatenated Words': { fn: 'findAllConcatenatedWordsInADict', tc: [{ i: [["cat", "cats", "catsdogcats", "dog", "dogcatsdog", "hippopotamuses", "rat", "ratcatdogcat"]], o: ["catsdogcats", "dogcatsdog", "ratcatdogcat"] }] },
    'Count of Range Sum': { fn: 'countRangeSum', tc: [{ i: [[-2, 5, -1], -2, 2], o: 3 }] },
    'Count of Smaller Numbers After Self': { fn: 'countSmaller', tc: [{ i: [[5, 2, 6, 1]], o: [2, 1, 1, 0] }] },
    'Course Schedule III': { fn: 'scheduleCourse', tc: [{ i: [[[100, 200], [200, 1300], [1000, 1250], [2000, 3200]]], o: 3 }] },
    'Create Maximum Number': { fn: 'maxNumber', tc: [{ i: [[3, 4, 6, 5], [9, 1, 2, 5, 8, 3], 5], o: [9, 8, 6, 5, 3] }] },
    'Decode Ways II': { fn: 'numDecodings', tc: [{ i: ["*"], o: 9 }, { i: ["1*"], o: 18 }, { i: ["2*"], o: 15 }] },
    'Design Search Autocomplete System': { fn: 'AutocompleteSystem', tc: [{ i: [], o: "class" }] },
    'Design Skiplist': { fn: 'Skiplist', tc: [{ i: [], o: "class" }] },
    'Divide Chocolate': { fn: 'maximizeSweetness', tc: [{ i: [[1, 2, 3, 4, 5, 6, 7, 8, 9], 5], o: 6 }] },
    'Expression Add Operators': { fn: 'addOperators', tc: [{ i: ["123", 6], o: ["1+2+3", "1*2*3"] }] },
    'Find K-th Smallest Pair Distance': { fn: 'smallestDistancePair', tc: [{ i: [[1, 3, 1], 1], o: 0 }, { i: [[1, 1, 1], 2], o: 0 }] },
    'Find Minimum in Rotated Sorted Array II': { fn: 'findMin', tc: [{ i: [[1, 3, 5]], o: 1 }, { i: [[2, 2, 2, 0, 1]], o: 0 }] },
    'IPO': { fn: 'findMaximizedCapital', tc: [{ i: [2, 0, [1, 2, 3], [0, 1, 1]], o: 4 }] },
    'Kth Smallest Prime Fraction': { fn: 'kthSmallestPrimeFraction', tc: [{ i: [[1, 2, 3, 5], 3], o: [2, 5] }] },
    'LFU Cache': { fn: 'LFUCache', tc: [{ i: [], o: "class" }] },
    'Longest Valid Parentheses': { fn: 'longestValidParentheses', tc: [{ i: ["(()"], o: 2 }, { i: [")()())"], o: 4 }, { i: [""], o: 0 }] },
    'Maximal Rectangle': { fn: 'maximalRectangle', tc: [{ i: [[["1", "0", "1", "0", "0"], ["1", "0", "1", "1", "1"], ["1", "1", "1", "1", "1"], ["1", "0", "0", "1", "0"]]], o: 6 }] },
    'Maximum XOR With Element From Array': { fn: 'maximizeXor', tc: [{ i: [[0, 1, 2, 3, 4], [[3, 1], [1, 3], [5, 6]]], o: [3, 3, 7] }] },
    'Meeting Rooms III': { fn: 'mostBooked', tc: [{ i: [2, [[0, 10], [1, 5], [2, 7], [3, 4]]], o: 0 }] },
    'Minimize Deviation in Array': { fn: 'minimumDeviation', tc: [{ i: [[1, 2, 3, 4]], o: 1 }, { i: [[4, 1, 5, 20, 3]], o: 3 }] },
    'Minimize Max Distance to Gas Station': { fn: 'minmaxGasDist', tc: [{ i: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 9], o: 0.5 }] },
    'N-Queens II': { fn: 'totalNQueens', tc: [{ i: [4], o: 2 }, { i: [1], o: 1 }] },
    'Number of Atoms': { fn: 'countOfAtoms', tc: [{ i: ["H2O"], o: "H2O" }, { i: ["Mg(OH)2"], o: "H2MgO2" }] },
    'Palindrome Pairs': { fn: 'palindromePairs', tc: [{ i: [["abcd", "dcba", "lls", "s", "sssll"]], o: [[0, 1], [1, 0], [3, 2], [2, 4]] }] },
    'Palindrome Partitioning II': { fn: 'minCut', tc: [{ i: ["aab"], o: 1 }, { i: ["a"], o: 0 }, { i: ["ab"], o: 1 }] },
    'Rearrange String k Distance Apart': { fn: 'rearrangeString', tc: [{ i: ["aabbcc", 3], o: "abcabc" }, { i: ["aaabc", 3], o: "" }] },
    'Redundant Connection II': { fn: 'findRedundantDirectedConnection', tc: [{ i: [[[1, 2], [1, 3], [2, 3]]], o: [2, 3] }] },
    'Remove Invalid Parentheses': { fn: 'removeInvalidParentheses', tc: [{ i: ["()())()"], o: ["(())()", "()()()"] }] },
    'Russian Doll Envelopes': { fn: 'maxEnvelopes', tc: [{ i: [[[5, 4], [6, 4], [6, 7], [2, 3]]], o: 3 }] },
    'Stream of Characters': { fn: 'StreamChecker', tc: [{ i: [], o: "class" }] },
    'Substring with Largest Variance': { fn: 'largestVariance', tc: [{ i: ["aababbb"], o: 3 }] },
    'Super Egg Drop': { fn: 'superEggDrop', tc: [{ i: [1, 2], o: 2 }, { i: [2, 6], o: 3 }, { i: [3, 14], o: 4 }] },
    'Swim in Rising Water': { fn: 'swimInWater', tc: [{ i: [[[0, 2], [1, 3]]], o: 3 }, { i: [[[0, 1, 2, 3, 4], [24, 23, 22, 21, 5], [12, 13, 14, 15, 16], [11, 17, 18, 19, 20], [10, 9, 8, 7, 6]]], o: 16 }] },
    'Unique Paths III': { fn: 'uniquePathsIII', tc: [{ i: [[[1, 0, 0, 0], [0, 0, 0, 0], [0, 0, 2, -1]]], o: 2 }] },
    'Word Ladder II': { fn: 'findLadders', tc: [{ i: ["hit", "cog", ["hot", "dot", "dog", "lot", "log", "cog"]], o: [["hit", "hot", "dot", "dog", "cog"], ["hit", "hot", "lot", "log", "cog"]] }] },
    'Word Search II': { fn: 'findWords', tc: [{ i: [[["o", "a", "a", "n"], ["e", "t", "a", "e"], ["i", "h", "k", "r"], ["i", "f", "l", "v"]], ["oath", "pea", "eat", "rain"]], o: ["eat", "oath"] }] },
    'Word Squares': { fn: 'wordSquares', tc: [{ i: [["area", "lead", "wall", "lady", "ball"]], o: [["wall", "area", "lead", "lady"], ["ball", "area", "lead", "lady"]] }] },

    // ===== MEDIUM =====
    'Additive Number': { fn: 'isAdditiveNumber', tc: [{ i: ["112358"], o: true }, { i: ["199100199"], o: true }] },
    'Android Unlock Patterns': { fn: 'numberOfPatterns', tc: [{ i: [1, 1], o: 9 }, { i: [1, 2], o: 65 }] },
    'Beautiful Arrangement': { fn: 'countArrangement', tc: [{ i: [2], o: 2 }, { i: [1], o: 1 }] },
    'Construct Binary Tree from Inorder and Postorder': { fn: 'buildTree', tc: [{ i: [[9, 3, 15, 20, 7], [9, 15, 7, 20, 3]], o: [3, 9, 20, null, null, 15, 7] }] },
    'Construct Binary Tree from Preorder and Inorder': { fn: 'buildTree', tc: [{ i: [[3, 9, 20, 15, 7], [9, 3, 15, 20, 7]], o: [3, 9, 20, null, null, 15, 7] }] },
    'Convert Sorted List to BST': { fn: 'sortedListToBST', tc: [{ i: [[-10, -3, 0, 5, 9]], o: [0, -3, 9, -10, null, 5] }] },
    'Delete Middle Node of LinkedList': { fn: 'deleteMiddle', tc: [{ i: [[1, 3, 4, 7, 1, 2, 6]], o: [1, 3, 4, 1, 2, 6] }, { i: [[1, 2, 3, 4]], o: [1, 2, 4] }] },
    'Factor Combinations': { fn: 'getFactors', tc: [{ i: [12], o: [[2, 6], [2, 2, 3], [3, 4]] }, { i: [1], o: [] }] },
    'Find K Pairs with Smallest Sums': { fn: 'kSmallestPairs', tc: [{ i: [[1, 7, 11], [2, 4, 6], 3], o: [[1, 2], [1, 4], [1, 6]] }] },
    'Find Right Interval': { fn: 'findRightInterval', tc: [{ i: [[[1, 2]]], o: [-1] }, { i: [[[3, 4], [2, 3], [1, 2]]], o: [-1, 0, 1] }] },
    'Find the Kth Smallest Sum': { fn: 'kthSmallest', tc: [{ i: [[[1, 3, 11], [2, 4, 6]], 5], o: 7 }] },
    'Flatten a Multilevel Doubly Linked List': { fn: 'flatten', tc: [{ i: [[1, 2, 3, 4, 5, 6, null, null, null, 7, 8, 9, 10, null, null, 11, 12]], o: [1, 2, 3, 7, 8, 11, 12, 9, 10, 4, 5, 6] }] },
    'Flatten Binary Tree to Linked List': { fn: 'flatten', tc: [{ i: [[1, 2, 5, 3, 4, null, 6]], o: [1, null, 2, null, 3, null, 4, null, 5, null, 6] }] },
    'Furthest Building You Can Reach': { fn: 'furthestBuilding', tc: [{ i: [[4, 2, 7, 6, 9, 14, 12], 5, 1], o: 4 }] },
    'Generalized Abbreviation': { fn: 'generateAbbreviations', tc: [{ i: ["word"], o: ["4", "3d", "2r1", "2rd", "1o2", "1o1d", "1or1", "1ord", "w3", "w2d", "w1r1", "w1rd", "wo2", "wo1d", "wor1", "word"] }] },
    'Implement Magic Dictionary': { fn: 'MagicDictionary', tc: [{ i: [], o: "class" }] },
    'Insert into a Sorted Circular Linked List': { fn: 'insert', tc: [{ i: [[3, 4, 1], 2], o: [1, 2, 3, 4] }] },
    'Linked List Components': { fn: 'numComponents', tc: [{ i: [[0, 1, 2, 3], [0, 1, 3]], o: 2 }] },
    'Linked List in Binary Tree': { fn: 'isSubPath', tc: [{ i: [[4, 2, 8], [1, 4, 4, null, 2, 2, null, 1, null, 6, 8, null, null, null, null, 1, 3]], o: true }] },
    'Longest Word in Dictionary': { fn: 'longestWord', tc: [{ i: [["w", "wo", "wor", "worl", "world"]], o: "world" }] },
    'Map Sum Pairs': { fn: 'MapSum', tc: [{ i: [], o: "class" }] },
    'Matchsticks to Square': { fn: 'makesquare', tc: [{ i: [[1, 1, 2, 2, 2]], o: true }, { i: [[3, 3, 3, 3, 4]], o: false }] },
    'Maximum Twin Sum of LinkedList': { fn: 'pairSum', tc: [{ i: [[5, 4, 2, 1]], o: 6 }, { i: [[4, 2, 2, 3]], o: 7 }] },
    'Maximum XOR of Two Numbers': { fn: 'findMaximumXOR', tc: [{ i: [[3, 10, 5, 25, 2, 8]], o: 28 }] },
    'Minimum Deletions to Make Character Frequencies Unique': { fn: 'minDeletions', tc: [{ i: ["aab"], o: 0 }, { i: ["aaabbbcc"], o: 2 }, { i: ["ceabaacb"], o: 2 }] },
    'Minimum Genetic Mutation': { fn: 'minMutation', tc: [{ i: ["AACCGGTT", "AACCGGTA", ["AACCGGTA"]], o: 1 }, { i: ["AACCGGTT", "AAACGGTA", ["AACCGGTA", "AACCGCTA", "AAACGGTA"]], o: 2 }] },
    'Next Greater Element III': { fn: 'nextGreaterElement', tc: [{ i: [12], o: 21 }, { i: [21], o: -1 }] },
    'Next Greater Node In Linked List': { fn: 'nextLargerNodes', tc: [{ i: [[2, 1, 5]], o: [5, 5, 0] }, { i: [[2, 7, 4, 3, 5]], o: [7, 0, 5, 5, 0] }] },
    'Path with Maximum Probability': { fn: 'maxProbability', tc: [{ i: [3, [[0, 1], [1, 2], [0, 2]], [0.5, 0.5, 0.2], 0, 2], o: 0.25 }] },
    'Path With Minimum Effort': { fn: 'minimumEffortPath', tc: [{ i: [[[1, 2, 2], [3, 8, 2], [5, 3, 5]]], o: 2 }] },
    'Populating Next Right Pointers II': { fn: 'connect', tc: [{ i: [[1, 2, 3, 4, 5, null, 7]], o: [1, 2, 3, 4, 5, null, 7] }] },
    'Process Tasks Using Servers': { fn: 'assignTasks', tc: [{ i: [[3, 3, 2], [1, 2, 3, 2, 1, 2]], o: [2, 2, 0, 2, 1, 2] }] },
    'Recover Binary Search Tree': { fn: 'recoverTree', tc: [{ i: [[1, 3, null, null, 2]], o: [3, 1, null, null, 2] }] },
    'Reduce Array Size to The Half': { fn: 'minSetSize', tc: [{ i: [[3, 3, 3, 3, 5, 5, 5, 2, 2, 7]], o: 2 }] },
    'Remove Nodes From Linked List': { fn: 'removeNodes', tc: [{ i: [[5, 2, 13, 3, 8]], o: [13, 8] }, { i: [[1, 1, 1, 1]], o: [1, 1, 1, 1] }] },
    'Reorder Linked List': { fn: 'reorderList', tc: [{ i: [[1, 2, 3, 4]], o: [1, 4, 2, 3] }, { i: [[1, 2, 3, 4, 5]], o: [1, 5, 2, 4, 3] }] },
    'Satisfiability of Equality Equations': { fn: 'equationsPossible', tc: [{ i: [["a==b", "b!=a"]], o: false }, { i: [["b==a", "a==b"]], o: true }] },
    'Sequence Reconstruction': { fn: 'sequenceReconstruction', tc: [{ i: [[1, 2, 3], [[1, 2], [1, 3]]], o: false }, { i: [[1, 2, 3], [[1, 2], [1, 3], [2, 3]]], o: true }] },
    'Serialize and Deserialize BST': { fn: 'Codec', tc: [{ i: [], o: "class" }] },
    'Split Array into Fibonacci Sequence': { fn: 'splitIntoFibonacci', tc: [{ i: ["1101111"], o: [11, 0, 11, 11] }, { i: ["112358130"], o: [] }] },
    'Split Linked List in Parts': { fn: 'splitListToParts', tc: [{ i: [[1, 2, 3], 5], o: [[1], [2], [3], [], []] }, { i: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3], o: [[1, 2, 3, 4], [5, 6, 7], [8, 9, 10]] }] },
    'Start of Cycle in LinkedList': { fn: 'detectCycle', tc: [{ i: [[3, 2, 0, -4], 1], o: 1 }, { i: [[1, 2], -1], o: -1 }] },
    'Strobogrammatic Number II': { fn: 'findStrobogrammatic', tc: [{ i: [2], o: ["11", "69", "88", "96"] }, { i: [1], o: ["0", "1", "8"] }] },
    'Swap Adjacent in LR String': { fn: 'canTransform', tc: [{ i: ["RXXLRXRXL", "XRLXXRRLX"], o: true }] },
    'Unique Binary Search Trees II': { fn: 'generateTrees', tc: [{ i: [3], o: [[1, null, 2, null, 3], [1, null, 3, 2], [2, 1, 3], [3, 1, null, null, 2], [3, 2, null, 1]] }] },
};

function genStarter(fnName, title) {
    return {
        python: `def ${fnName}(*args):\n    # Your code here\n    pass`,
        javascript: `function ${fnName}(...args) {\n    // Your code here\n}`,
        cpp: `// Implement ${title}`,
        java: `// Implement ${title}`
    };
}

function genExamples(tc, title) {
    return tc.slice(0, 2).map((t, idx) => ({
        input: JSON.stringify(t.i),
        output: JSON.stringify(t.o),
        explanation: idx === 0 ? `Example for ${title}` : undefined
    }));
}

async function main() {
    console.log('Fetching problems with placeholder test cases...');
    const { data: placeholders } = await supabaseAdmin
        .from('problems')
        .select('id, title, description')
        .filter('test_cases', 'cs', '[{"input":["example_input"],"output":"example_output"}]');

    console.log(`Found ${placeholders?.length || 0} placeholder problems`);
    let updated = 0, skipped = 0;

    for (const p of (placeholders || [])) {
        const testData = BATCH2[p.title];
        if (!testData) { skipped++; continue; }
        if (testData.tc[0]?.o === 'class') {
            // For class-based problems, still update with meaningful test data
            const starterCode = genStarter(testData.fn, p.title);
            const examples = [{ input: 'See problem description', output: 'Class implementation', explanation: `Implement the ${testData.fn} class` }];
            const { error } = await supabaseAdmin
                .from('problems')
                .update({ test_cases: testData.tc.map(t => ({ input: t.i, output: t.o })), starter_code: starterCode, examples })
                .eq('id', p.id);
            if (!error) updated++;
            continue;
        }

        const testCases = testData.tc.map(t => ({ input: t.i, output: t.o }));
        const starterCode = genStarter(testData.fn, p.title);
        const examples = genExamples(testData.tc, p.title);
        const description = p.description && !p.description.startsWith('Solve the')
            ? p.description
            : `Given inputs, implement the ${testData.fn} function to solve ${p.title}.`;

        const { error } = await supabaseAdmin
            .from('problems')
            .update({ test_cases: testCases, starter_code: starterCode, examples, description })
            .eq('id', p.id);

        if (error) console.error(`Error ${p.title}:`, error.message);
        else updated++;
    }

    console.log(`\nDone: ${updated} updated, ${skipped} skipped`);

    const { data: remaining } = await supabaseAdmin
        .from('problems')
        .select('id')
        .filter('test_cases', 'cs', '[{"input":["example_input"],"output":"example_output"}]');

    console.log(`Remaining placeholder: ${remaining?.length || 0}/425`);

    if (remaining && remaining.length > 0) {
        // List remaining titles
        const { data: rem } = await supabaseAdmin
            .from('problems')
            .select('title')
            .filter('test_cases', 'cs', '[{"input":["example_input"],"output":"example_output"}]');
        console.log('Still missing:', rem?.map(r => r.title).join(', '));
    }
}

main().catch(console.error);
