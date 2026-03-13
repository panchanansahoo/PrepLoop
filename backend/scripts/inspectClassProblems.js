import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
    // The class-based problems from the test report
    const classIds = [150, 153, 155, 156, 157, 158, 168, 169, 170, 171, 218, 249, 253, 254, 363, 388, 397, 398, 401, 404, 405, 410];

    // All failing problem IDs from the report  
    const failedIds = [
        // 4Sum, Remove Element, Rotate Image, Wiggle Sort
        23, 25, 32, 40,
        // Linked List Cycle II, Start of Cycle
        83, 86,
        // Minimum Window Sub, Max Sum Distinct Subarrays 
        57, 58,
        // Circular Array Loop
        93,
        // Copy List, Intersection, Design LL, Flatten multilevel, Linked List in Binary Tree
        145, 146, 150, 148, 149,
        // Design Browser History, LRU, LFU, All O'one, Design Skiplist
        153, 155, 156, 157, 158,
        // Flatten BT to LL, Convert Sorted List to BST
        154, 152,
        // Min Stack, Max Stack, Queue using Stacks, Stack using Queues
        168, 169, 170, 171,
        // Decode String, Number of Atoms
        172, 173,
        // First Bad Version, Guess Number, Search in Rotated I/II
        189, 192, 196, 197,
        // Min Days Bouquets, Magnetic Force, Find Median DS
        200, 201, 218,
        // Count of Smaller (runtime error)
        215,
        // Trees pattern 18
        225, 226, 230, 231, 232, 233, 234, 236, 237, 238, 240, 243, 245, 247, 249, 250, 252, 253, 254, 257, 258, 259, 261,
        // Graphs
        262, 264, 266, 282, 284,
        // Evaluate Division
        293,
        // DP
        301, 329, 333, 341, 342,
        // Coin Change
        306,
        // Backtracking
        360, 363, 372,
        // Heaps
        388, 389,
        // Trie
        397, 398, 401, 404, 405, 410,
    ];

    const uniqueIds = [...new Set(failedIds)];
    const { data } = await sb.from('problems').select('id,title,test_cases,starter_code,solution_code').in('id', uniqueIds).order('id');

    const output = {};
    for (const p of data) {
        output[p.id] = {
            title: p.title,
            test_cases: p.test_cases,
            starter_fn: p.starter_code?.python?.match(/(?:def |class )(\w+)/)?.[1],
            starter_py: p.starter_code?.python?.slice(0, 300),
            solution_py_first300: p.solution_code?.python?.slice(0, 300),
        };
    }

    fs.writeFileSync(path.resolve(__dirname, '..', 'failing_problems_data.json'), JSON.stringify(output, null, 2));
    console.log(`Wrote data for ${data.length} problems to failing_problems_data.json`);
}
main().catch(console.error);
