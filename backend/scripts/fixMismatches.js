/**
 * Fix remaining mismatches:
 * 1. Wrong descriptions: #230, #388, #404
 * 2. Wrong constraints: #218
 * 3. Placeholder examples on 15 class-based problems → proper examples
 * 4. Wrong description on #230 → fix to match "Merge Two Binary Trees"
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } });

// ============================================================
// 1. Fix wrong descriptions
// ============================================================
const descriptionFixes = {
    230: {
        title: "Merge Two Binary Trees",
        description: `You are given two binary trees root1 and root2.

Imagine that when you put one of them to cover the other, some nodes of the two trees are overlapped while the others are not. You need to merge the two trees into a new binary tree. The merge rule is that if two nodes overlap, then sum node values up as the new value of the merged node. Otherwise, the NOT null node will be used as the node of the new tree.

Return the merged tree.

Note: The merging process must start from the root nodes of both trees.`,
        examples: [
            {
                input: "root1 = [1,3,2,5], root2 = [2,1,3,null,4,null,7]",
                output: "[3,4,5,5,4,null,7]"
            },
            {
                input: "root1 = [1], root2 = [1,2]",
                output: "[2,2]"
            }
        ],
        constraints: "The number of nodes in both trees is in the range [0, 2000].\n-10^4 <= Node.val <= 10^4"
    },
    388: {
        title: "Find Median from Data Stream",
        description: `The median is the middle value in an ordered integer list. If the size of the list is even, there is no middle value, and the median is the mean of the two middle values.

For example, for arr = [2,3,4], the median is 3. For arr = [2,3], the median is (2 + 3) / 2 = 2.5.

Implement the MedianFinder class:
- MedianFinder() initializes the MedianFinder object.
- void addNum(int num) adds the integer num from the data stream to the data structure.
- double findMedian() returns the median of all elements so far. Answers within 10^-5 of the actual answer will be accepted.`,
        examples: [
            {
                input: '[\"MedianFinder\", \"addNum\", \"addNum\", \"findMedian\", \"addNum\", \"findMedian\"]\n[[], [1], [2], [], [3], []]',
                output: '[null, null, null, 1.5, null, 2.0]'
            }
        ],
        constraints: "-10^5 <= num <= 10^5\nThere will be at least one element in the data structure before calling findMedian.\nAt most 5 * 10^4 calls will be made to addNum and findMedian."
    },
    404: {
        title: "Design Search Autocomplete System",
        description: `Design a search autocomplete system for a search engine. Users may input a sentence (at least one word and end with a special character '#').

You are given a string array sentences and an integer array times where sentences[i] is a previously typed sentence and times[i] is the corresponding number of times the sentence has been typed. For each input character except '#', return the top 3 historical hot sentences that have the same prefix as the part of the sentence already typed.

Here are the specific rules:
- The hot degree for a sentence is defined as the number of times a user typed the exactly same sentence before.
- The returned top 3 hot sentences should be sorted by hot degree (the first is the hottest one). If several sentences have the same hot degree, use ASCII-code order (smaller one appears first).
- If less than 3 hot sentences exist, return as many as you can.
- When the input is '#', it means the sentence ends, and you need to store this sentence.`,
        examples: [
            {
                input: '[\"AutocompleteSystem\", \"input\", \"input\", \"input\", \"input\"]\n[[["i love you","island","iroman","i love leetcode"],[5,3,2,2]], ["i"], [" "], ["a"], ["#"]]',
                output: '[null, ["i love you","island","i love leetcode"], ["i love you","i love leetcode"], [], []]'
            }
        ],
        constraints: "n == sentences.length\nn == times.length\n1 <= n <= 100\n1 <= sentences[i].length <= 100\n1 <= times[i] <= 50\nAt most 5000 calls will be made to input."
    },
};

// ============================================================
// 2. Fix wrong constraints
// ============================================================
const constraintsFixes = {
    218: {
        title: "Find Median from Data Stream",
        constraints: "-10^5 <= num <= 10^5\nThere will be at least one element in the data structure before calling findMedian.\nAt most 5 * 10^4 calls will be made to addNum and findMedian."
    },
};

// ============================================================
// 3. Fix placeholder examples on class-based problems
// ============================================================
const examplesFixes = {
    142: {
        title: "Design Linked List",
        examples: [
            {
                input: '[\"MyLinkedList\", \"addAtHead\", \"addAtTail\", \"addAtIndex\", \"get\", \"deleteAtIndex\", \"get\"]\n[[], [1], [3], [1, 2], [1], [1], [1]]',
                output: '[null, null, null, null, 2, null, 3]'
            }
        ]
    },
    149: {
        title: "Design Browser History",
        examples: [
            {
                input: '[\"BrowserHistory\", \"visit\", \"visit\", \"visit\", \"back\", \"back\", \"forward\", \"visit\", \"forward\", \"back\", \"back\"]\n[[\"leetcode.com\"], [\"google.com\"], [\"facebook.com\"], [\"youtube.com\"], [1], [1], [1], [\"linkedin.com\"], [2], [2], [7]]',
                output: '[null, null, null, null, \"facebook.com\", \"google.com\", \"facebook.com\", null, \"linkedin.com\", \"google.com\", \"leetcode.com\"]'
            }
        ]
    },
    150: {
        title: "LRU Cache",
        examples: [
            {
                input: '[\"LRUCache\", \"put\", \"put\", \"get\", \"put\", \"get\", \"put\", \"get\", \"get\", \"get\"]\n[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]',
                output: '[null, null, null, 1, null, -1, null, -1, 3, 4]'
            }
        ]
    },
    151: {
        title: "LFU Cache",
        examples: [
            {
                input: '[\"LFUCache\", \"put\", \"put\", \"get\", \"put\", \"get\", \"get\", \"put\", \"get\", \"get\", \"get\"]\n[[2], [1, 1], [2, 2], [1], [3, 3], [2], [3], [4, 4], [1], [3], [4]]',
                output: '[null, null, null, 1, null, -1, 3, null, -1, 3, 4]'
            }
        ]
    },
    152: {
        title: "All O'one Data Structure",
        examples: [
            {
                input: '[\"AllOne\", \"inc\", \"inc\", \"getMaxKey\", \"getMinKey\", \"inc\", \"getMaxKey\", \"getMinKey\"]\n[[], [\"hello\"], [\"hello\"], [], [], [\"leet\"], [], []]',
                output: '[null, null, null, \"hello\", \"hello\", null, \"hello\", \"leet\"]'
            }
        ]
    },
    153: {
        title: "Design Skiplist",
        examples: [
            {
                input: '[\"Skiplist\", \"add\", \"add\", \"add\", \"search\", \"add\", \"search\", \"erase\", \"erase\", \"search\"]\n[[], [1], [2], [3], [0], [4], [1], [0], [1], [1]]',
                output: '[null, null, null, null, false, null, true, false, true, false]'
            }
        ]
    },
    160: {
        title: "Max Stack",
        examples: [
            {
                input: '[\"MaxStack\", \"push\", \"push\", \"push\", \"top\", \"popMax\", \"top\", \"peekMax\", \"pop\", \"top\"]\n[[], [5], [1], [5], [], [], [], [], [], []]',
                output: '[null, null, null, null, 5, 5, 1, 5, 1, 5]'
            }
        ]
    },
    161: {
        title: "Implement Queue using Stacks",
        examples: [
            {
                input: '[\"MyQueue\", \"push\", \"push\", \"peek\", \"pop\", \"empty\"]\n[[], [1], [2], [], [], []]',
                output: '[null, null, null, 1, 1, false]'
            }
        ]
    },
    162: {
        title: "Implement Stack using Queues",
        examples: [
            {
                input: '[\"MyStack\", \"push\", \"push\", \"top\", \"pop\", \"empty\"]\n[[], [1], [2], [], [], []]',
                output: '[null, null, null, 2, 2, false]'
            }
        ]
    },
    218: {
        title: "Find Median from Data Stream",
        examples: [
            {
                input: '[\"MedianFinder\", \"addNum\", \"addNum\", \"findMedian\", \"addNum\", \"findMedian\"]\n[[], [1], [2], [], [3], []]',
                output: '[null, null, null, 1.5, null, 2.0]'
            }
        ]
    },
    224: {
        title: "Invert Binary Tree",
        examples: [
            {
                input: "root = [4,2,7,1,3,6,9]",
                output: "[4,7,2,9,6,3,1]"
            },
            {
                input: "root = [2,1,3]",
                output: "[2,3,1]"
            }
        ]
    },
    254: {
        title: "Serialize and Deserialize BST",
        examples: [
            {
                input: "root = [2,1,3]",
                output: "[2,1,3]"
            },
            {
                input: "root = []",
                output: "[]"
            }
        ]
    },
};

// ============================================================
// Main
// ============================================================
async function main() {
    console.log('═══════════════════════════════════════════════════');
    console.log('   Fix Description, Examples & Constraints Mismatches');
    console.log('═══════════════════════════════════════════════════\n');

    let fixed = 0, errors = 0;

    // Fix wrong descriptions
    console.log('--- Fixing wrong descriptions ---');
    for (const [idStr, fix] of Object.entries(descriptionFixes)) {
        const id = parseInt(idStr);
        const { error } = await sb.from('problems')
            .update({
                description: fix.description,
                examples: fix.examples,
                constraints: fix.constraints
            })
            .eq('id', id);
        if (error) {
            console.log(`  ❌ [${id}] ${fix.title}: ${error.message}`);
            errors++;
        } else {
            console.log(`  ✅ [${id}] ${fix.title} (desc + examples + constraints)`);
            fixed++;
        }
    }

    // Fix wrong constraints only
    console.log('\n--- Fixing wrong constraints ---');
    for (const [idStr, fix] of Object.entries(constraintsFixes)) {
        const id = parseInt(idStr);
        const { error } = await sb.from('problems')
            .update({ constraints: fix.constraints })
            .eq('id', id);
        if (error) {
            console.log(`  ❌ [${id}] ${fix.title}: ${error.message}`);
            errors++;
        } else {
            console.log(`  ✅ [${id}] ${fix.title} (constraints only)`);
            fixed++;
        }
    }

    // Fix placeholder examples
    console.log('\n--- Fixing placeholder examples ---');
    for (const [idStr, fix] of Object.entries(examplesFixes)) {
        const id = parseInt(idStr);
        const { error } = await sb.from('problems')
            .update({ examples: fix.examples })
            .eq('id', id);
        if (error) {
            console.log(`  ❌ [${id}] ${fix.title}: ${error.message}`);
            errors++;
        } else {
            console.log(`  ✅ [${id}] ${fix.title} (examples)`);
            fixed++;
        }
    }

    console.log('\n═══════════════════════════════════════════════════');
    console.log(`   Done! Fixed: ${fixed}, Errors: ${errors}`);
    console.log('═══════════════════════════════════════════════════\n');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
