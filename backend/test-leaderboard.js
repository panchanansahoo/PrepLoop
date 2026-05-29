import { supabaseAdmin } from "./db/supabaseClient.js";

async function test() {
  try {
    const candidatesToEvaluate = 80;
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, avatar_url, coins, created_at')
      .order('created_at', { ascending: false })
      .limit(candidatesToEvaluate);

    if (profilesError) throw profilesError;

    const userIds = profiles.map(p => p.id).filter(Boolean);
    console.log("Found", userIds.length, "profiles");

    if (userIds.length > 0) {
      const { data: progressRows, error: progressError } = await supabaseAdmin
        .from('user_progress')
        .select('user_id, solved_at, last_attempt')
        .in('user_id', userIds)
        .eq('status', 'solved');
        
      if (progressError) throw progressError;
      console.log("Found", progressRows?.length || 0, "progress rows");
    }
  } catch (err) {
    console.error("FAILED:", err);
  }
}

test();
