import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  process.exit(1);
}

async function run() {
  try {
    const url = `${supabaseUrl}/rest/v1/quiz_attempts?select=id&limit=1`;
    const response = await fetch(url, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });

    const body = await response.json().catch(() => ({}));

    if (response.ok) {
      console.log('Quiz migration is applied: quiz_attempts is accessible via REST.');
      process.exit(0);
    }

    const isMissingTable = body?.code === 'PGRST205';
    if (isMissingTable) {
      console.error('Quiz migration is NOT applied: quiz_attempts table missing in schema cache.');
      console.error('Apply backend/db/migration_quiz_feature.sql in Supabase SQL Editor, then rerun this script.');
      process.exit(1);
    }

    console.error(`Unexpected verification failure (${response.status}):`, body);
    process.exit(1);
  } catch (error) {
    console.error('Failed to verify quiz migration:', error.message || error);
    process.exit(1);
  }
}

run();
