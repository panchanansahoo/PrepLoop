import '../config/env.js';
import { supabaseAdmin } from '../db/supabaseClient.js';

const { data, error } = await supabaseAdmin.rpc('cleanup_interview_retention');
if (error) {
  console.error(`Interview retention cleanup failed: ${error.message}`);
  process.exit(1);
}

console.log('Interview retention cleanup completed:', data);
