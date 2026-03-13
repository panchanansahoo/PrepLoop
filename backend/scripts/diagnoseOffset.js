/**
 * Diagnose the systematic description offset issue.
 * For each mismatched problem, find which problem's description it actually has
 * by checking if the current description matches any OTHER problem's correct description.
 */
import { supabaseAdmin } from '../db/supabaseClient.js';

async function diagnose() {
    console.log('=== DIAGNOSING DESCRIPTION OFFSET ===\n');

    // Fetch all problems
    let allProblems = [];
    let offset = 0;
    const batchSize = 100;

    while (true) {
        const { data, error } = await supabaseAdmin
            .from('problems')
            .select('id, title, description')
            .order('id')
            .range(offset, offset + batchSize - 1);

        if (error) { console.error('Error:', error.message); break; }
        if (!data || data.length === 0) break;
        allProblems.push(...data);
        offset += batchSize;
        if (data.length < batchSize) break;
    }

    console.log(`Loaded ${allProblems.length} problems.\n`);

    // Build ID ranges to check
    // The audit showed mismatches around certain ranges. Let's check sequential blocks.

    // Check problems 183-221 (Binary Search section had many issues)
    // Check problems 216-260 (Tree/BST section)
    // Check problems 260-340 (Graph/DP section)
    // Check problems 340-425 (remaining)

    const ranges = [
        [183, 225],
        [225, 270],
        [270, 340],
        [340, 425],
    ];

    for (const [start, end] of ranges) {
        console.log(`\n--- Range ${start}-${end} ---`);
        const inRange = allProblems.filter(p => p.id >= start && p.id <= end);

        for (const p of inRange) {
            const desc = (p.description || '').substring(0, 80).replace(/\n/g, ' ');
            console.log(`[${p.id}] "${p.title}" => "${desc}..."`);
        }
    }
}

diagnose().catch(console.error);
