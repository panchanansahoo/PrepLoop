import { supabaseAdmin } from "./db/supabaseClient.js";

const computeCurrentStreak = (dateKeys = []) => {
  if (!Array.isArray(dateKeys) || dateKeys.length === 0) return 0;
  const uniqueSorted = [...new Set(dateKeys)].filter(Boolean).sort((left, right) => (left < right ? 1 : -1));
  if (!uniqueSorted.length) return 0;
  const todayKey = new Date().toISOString().slice(0, 10);
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayKey = yesterdayDate.toISOString().slice(0, 10);
  if (uniqueSorted[0] !== todayKey && uniqueSorted[0] !== yesterdayKey) return 0;
  let streak = 0;
  const cursor = uniqueSorted[0] === yesterdayKey ? new Date(yesterdayDate) : new Date();
  while (true) {
    const expected = cursor.toISOString().slice(0, 10);
    if (!uniqueSorted.includes(expected)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

const buildDateKey = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const toDisplayName = (profile) => {
  const fullName = String(profile?.full_name || '').trim();
  if (fullName.length > 0) return fullName;
  const id = String(profile?.id || '').trim();
  if (!id) return 'Anonymous Engineer';
  return `Engineer ${id.slice(0, 6)}`;
};

async function test() {
  try {
    const safeLimit = 8;
    const candidatesToEvaluate = Math.max(80, safeLimit * 8);

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, avatar_url, coins, created_at')
      .order('created_at', { ascending: false })
      .limit(candidatesToEvaluate);

    if (profilesError) throw profilesError;

    const profileRows = Array.isArray(profiles) ? profiles : [];
    const userIds = profileRows.map((row) => row.id).filter(Boolean);

    if (!userIds.length) {
      console.log("No users");
      return;
    }

    const { data: progressRows, error: progressError } = await supabaseAdmin
      .from('user_progress')
      .select('user_id, solved_at, last_attempt')
      .in('user_id', userIds)
      .eq('status', 'solved');

    if (progressError) throw progressError;

    const solvedByUser = new Map();
    const solvedDatesByUser = new Map();

    (progressRows || []).forEach((row) => {
      const userId = row.user_id;
      if (!userId) return;

      solvedByUser.set(userId, (solvedByUser.get(userId) || 0) + 1);

      const key = buildDateKey(row.solved_at || row.last_attempt);
      if (!key) return;

      const existing = solvedDatesByUser.get(userId) || [];
      existing.push(key);
      solvedDatesByUser.set(userId, existing);
    });

    const leaderboard = profileRows
      .map((profile) => {
        const solved = solvedByUser.get(profile.id) || 0;
        const streak = computeCurrentStreak(solvedDatesByUser.get(profile.id) || []);
        const coins = Number(profile.coins || 0);

        return {
          userId: profile.id,
          name: toDisplayName(profile),
          avatarUrl: profile.avatar_url || null,
          solved,
          streak,
          coins,
          points: solved * 100 + streak * 20 + Math.round(coins / 10),
        };
      })
      .filter((entry) => entry.solved > 0)
      .sort((left, right) => {
        if (right.solved !== left.solved) return right.solved - left.solved;
        if (right.streak !== left.streak) return right.streak - left.streak;
        if (right.coins !== left.coins) return right.coins - left.coins;
        return left.name.localeCompare(right.name);
      })
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }));

    console.log("Leaderboard:", leaderboard.slice(0, safeLimit));
  } catch (err) {
    console.error("FAILED:", err);
  }
}

test();
