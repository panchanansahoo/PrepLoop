/**
 * Verify the 8 fixed problems pass their test cases
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { buildTestWrapper, executeCode, parseTestResults } from '../utils/executeCode.js';
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

const ids = [205, 217, 224, 230, 251, 252, 363, 364];

async function main() {
    console.log('=== Verify Fixed Problems ===\n');
    let allPass = 0, allFail = 0;

    for (const id of ids) {
        const { data: p } = await supabase
            .from('problems')
            .select('id, title, test_cases, solution_code, starter_code')
            .eq('id', id)
            .single();

        if (!p?.solution_code?.python || !p?.test_cases?.length) {
            console.log(`${id}: SKIP (no solution or test cases)`);
            continue;
        }

        const fnMatch = p.starter_code?.python?.match(/def\s+(\w+)/);
        const fnName = fnMatch?.[1] || 'solve';

        const wrapped = buildTestWrapper(
            p.solution_code.python, 'python',
            p.test_cases, fnName,
            p.starter_code?.python || ''
        );

        const result = await executeCode(wrapped, 'python');
        const parsed = parseTestResults(result.output);
        const pass = parsed.filter(r => r.passed).length;
        const total = parsed.length;

        if (pass === total) {
            console.log(`  ✅ ${id}: ${p.title} => ${pass}/${total}`);
            allPass++;
        } else {
            console.log(`  ❌ ${id}: ${p.title} => ${pass}/${total}`);
            parsed.filter(r => !r.passed).forEach(r =>
                console.log(`      FAIL: ${r.error || JSON.stringify(r)}`)
            );
            allFail++;
        }
    }

    console.log(`\n=== ${allPass} passed, ${allFail} failed ===`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
