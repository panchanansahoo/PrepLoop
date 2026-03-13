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
    const results = JSON.parse(fs.readFileSync('test_case_results.json', 'utf8'));
    const failed = results.filter(r => r.status !== 'all_passed');

    for (const f of failed) {
        const { data } = await sb.from('problems').select('id,title,test_cases,starter_code,solution_code')
            .eq('id', f.id).single();
        if (!data) continue;
        console.log(`\n========================================`);
        console.log(`[${data.id}] ${data.title}`);
        console.log(`Status: ${f.status}, Passed: ${f.passed}/${f.total}`);
        console.log(`TC: ${JSON.stringify(data.test_cases)}`);
        console.log(`Starter: ${data.starter_code?.python}`);
        console.log(`Solution: ${data.solution_code?.python}`);
        console.log(`========================================`);
    }
}
main().catch(console.error);
