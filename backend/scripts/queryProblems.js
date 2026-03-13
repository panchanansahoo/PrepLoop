import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } });

const ids = [25, 57, 58, 59, 60, 84, 85, 118, 125, 126, 156, 183, 184, 185, 186, 218, 220, 232, 233, 236, 247, 249, 254, 259, 260, 261, 270, 279, 292, 294, 316, 344, 378, 384, 385, 412];

async function main() {
    const { data, error } = await sb
        .from('problems')
        .select('id, title, description')
        .in('id', ids)
        .order('id');

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    const output = data.map(p => {
        const desc = (p.description || '').replace(/\n/g, ' ').substring(0, 120);
        return `${p.id} | ${p.title} | ${desc || '(empty)'}`;
    }).join('\n');

    fs.writeFileSync('/tmp/problems_query_result.txt', output);
    console.log('Wrote ' + data.length + ' results to /tmp/problems_query_result.txt');
}

main().catch(console.error);
