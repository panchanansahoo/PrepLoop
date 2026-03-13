// Quick diagnostic: check solution code format for passing vs failing problems
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
    // Check a few passing and failing
    const checkIds = [1, 2, 3, 14, 21, 25, 40, 58, 182, 224];

    for (const id of checkIds) {
        const { data } = await supabase
            .from('problems')
            .select('id, title, solution_code, starter_code, test_cases')
            .eq('id', id)
            .single();

        const sol = data.solution_code || {};
        const pySol = sol.python || '';
        const starter = data.starter_code || {};
        const pyStarter = starter.python || '';
        const tc = data.test_cases || [];

        const hasDefInSol = /def\s+\w+/.test(pySol);
        const hasClassInSol = /class\s+Solution/.test(pySol);
        const hasPass = /\bpass\b/.test(pySol);
        const solLength = pySol.length;

        console.log(`\n=== ID ${id}: ${data.title} ===`);
        console.log(`  solution.python length: ${solLength}`);
        console.log(`  has def: ${hasDefInSol}`);
        console.log(`  has class Solution: ${hasClassInSol}`);
        console.log(`  has pass: ${hasPass}`);
        console.log(`  solution keys: ${Object.keys(sol).join(', ')}`);
        console.log(`  starter.python length: ${pyStarter.length}`);
        console.log(`  test_cases count: ${tc.length}`);
        console.log(`  solution.python first 250:`);
        console.log(`  ${pySol.substring(0, 250)}`);
    }
}

main().catch(err => { console.error(err); process.exit(1); });
