/**
 * F2-4: Daily Streak Reminder Worker
 * Schedule: Daily at 7:00 PM IST (13:30 UTC -> cron "30 13 * * *")
 * Finds users with active streaks who haven't practiced today and sends
 * an email reminder (Nodemailer) + Expo Push notification.
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const TWENTY_HOURS_MS = 20 * 60 * 60 * 1000;

export function isStreakAtRisk(lastActiveDate, now = new Date()) {
  if (!lastActiveDate) return false;
  const todayStr = now.toISOString().split('T')[0];
  if (String(lastActiveDate).startsWith(todayStr)) {
    return false;
  }
  const parsed = new Date(lastActiveDate);
  if (Number.isNaN(parsed.getTime())) return false;
  return now.getTime() - parsed.getTime() >= TWENTY_HOURS_MS;
}

export async function sendExpoPushNotification({ to, title, body, data = {} }, fetchImpl = fetch) {
  if (!to || (!String(to).startsWith('ExponentPushToken') && !String(to).startsWith('ExpoPushToken'))) {
    return { skipped: true, reason: 'invalid_token' };
  }

  const response = await fetchImpl(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ to, sound: 'default', title, body, data }),
  });

  if (!response.ok) {
    throw new Error(`Expo push failed with HTTP ${response.status}`);
  }
  return response.json();
}

export async function sendStreakReminderEmail({ transporter, to, streak, name = 'there' }) {
  if (!transporter || !to) {
    return { skipped: true, reason: 'missing_mailer_or_recipient' };
  }

  return transporter.sendMail({
    from: process.env.SMTP_FROM || 'PrepLoop <noreply@preploop.io>',
    to,
    subject: `🔥 Keep your ${streak}-day PrepLoop streak alive!`,
    text: `Hi ${name},\n\nYou're on a ${streak}-day practice streak on PrepLoop! Complete one DSA problem or mock interview question today to keep your streak alive.\n\nKeep going,\nThe PrepLoop Team`,
    html: `<p>Hi ${name},</p><p>You're on a <strong>${streak}-day practice streak</strong> on PrepLoop! Complete one DSA problem or mock interview question today to keep your flame alive.</p><p>— The PrepLoop Team</p>`,
  });
}

export async function runStreakReminderJob({
  supabase,
  transporter = null,
  sendPush = sendExpoPushNotification,
  now = new Date(),
  batchSize = 100,
  concurrencyLimit = 10,
} = {}) {
  if (!supabase) {
    throw new Error('supabase client is required');
  }

  const today = now.toISOString().split('T')[0];
  const results = {
    evaluated: 0,
    emailsSent: 0,
    pushesSent: 0,
    skipped: 0,
    errors: 0,
  };

  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * batchSize;
    const to = from + batchSize - 1;
    let streaksChunk = [];

    let streakQuery = supabase
      .from('user_streaks')
      .select('user_id, current_streak, last_active_date, last_reminded_date')
      .gt('current_streak', 0)
      .neq('last_active_date', today);

    if (typeof streakQuery.range === 'function') {
      let { data, error } = await streakQuery.range(from, to);
      if (error && (error.code === '42703' || String(error.message || '').includes('last_reminded_date'))) {
        const fallback = await supabase
          .from('user_streaks')
          .select('user_id, current_streak, last_active_date')
          .gt('current_streak', 0)
          .neq('last_active_date', today)
          .range(from, to);
        data = fallback.data;
        error = fallback.error;
      }
      if (error) throw error;
      streaksChunk = data || [];
      if (streaksChunk.length < batchSize) {
        hasMore = false;
      }
    } else {
      let { data, error } = await streakQuery;
      if (error && (error.code === '42703' || String(error.message || '').includes('last_reminded_date'))) {
        const fallback = await supabase
          .from('user_streaks')
          .select('user_id, current_streak, last_active_date')
          .gt('current_streak', 0)
          .neq('last_active_date', today);
        data = fallback.data;
        error = fallback.error;
      }
      if (error) throw error;
      const allRows = data || [];
      streaksChunk = allRows.slice(from, to + 1);
      if (from + streaksChunk.length >= allRows.length) {
        hasMore = false;
      }
    }

    page++;
    if (!streaksChunk || streaksChunk.length === 0) {
      break;
    }

    results.evaluated += streaksChunk.length;

    // 1. Batch fetch profiles and push tokens for all users in this chunk using .in('user_id', userIds)
    const userIds = Array.from(new Set(streaksChunk.map((s) => s.user_id).filter(Boolean)));
    const profilesMap = new Map();
    const tokensMap = new Map();

    if (userIds.length > 0) {
      try {
        let { data: profiles, error: profileErr } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        if (profileErr && (profileErr.code === '42703' || String(profileErr.message || '').includes('email'))) {
          const fallback = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds);
          profiles = fallback.data;
          profileErr = fallback.error;
        }

        if (!profileErr && Array.isArray(profiles)) {
          for (const p of profiles) {
            profilesMap.set(p.id, p);
          }
        }
      } catch {
        // Silently continue with empty profile map
      }

      try {
        const { data: tokens, error: tokensErr } = await supabase
          .from('user_push_tokens')
          .select('user_id, expo_push_token, email_reminders_enabled, push_reminders_enabled, last_reminded_date')
          .in('user_id', userIds);

        if (!tokensErr && Array.isArray(tokens)) {
          for (const t of tokens) {
            if (!tokensMap.has(t.user_id)) {
              tokensMap.set(t.user_id, []);
            }
            tokensMap.get(t.user_id).push(t);
          }
        }
      } catch {
        // Silently continue with empty tokens map
      }
    }

    // 2. Process reminders in a bounded concurrent pool
    let workerIndex = 0;
    const poolWorkers = Array.from(
      { length: Math.min(concurrencyLimit, streaksChunk.length) },
      async () => {
        while (workerIndex < streaksChunk.length) {
          const row = streaksChunk[workerIndex++];
          try {
            let profile = profilesMap.get(row.user_id);
            if (!profile && typeof supabase.from === 'function') {
              try {
                const singleRes = await supabase
                  .from('profiles')
                  .select('id, full_name, email')
                  .eq('id', row.user_id)
                  .maybeSingle?.();
                if (singleRes && singleRes.data) {
                  profile = singleRes.data;
                }
              } catch {
                // Ignore fallback error
              }
            }

            let tokens = tokensMap.get(row.user_id);
            if (!tokens && typeof supabase.from === 'function') {
              try {
                const tokensRes = await supabase
                  .from('user_push_tokens')
                  .select('user_id, expo_push_token, email_reminders_enabled, push_reminders_enabled, last_reminded_date')
                  .eq('user_id', row.user_id);
                tokens = (tokensRes && tokensRes.data) || [];
              } catch {
                tokens = [];
              }
            }
            if (!tokens) {
              tokens = [];
            }

            const alreadyReminded =
              row.last_reminded_date === today ||
              tokens.some((t) => t.last_reminded_date === today);

            if (alreadyReminded) {
              results.skipped++;
              continue;
            }

            let reminded = false;
            const emailAllowed = !tokens.length || tokens.some((t) => t.email_reminders_enabled !== false);
            if (emailAllowed && transporter) {
              let recipientEmail = profile?.email;
              if (!recipientEmail && supabase.auth?.admin?.getUserById) {
                try {
                  const { data: authData } = await supabase.auth.admin.getUserById(row.user_id);
                  recipientEmail = authData?.user?.email;
                } catch {
                  recipientEmail = undefined;
                }
              }

              if (recipientEmail) {
                try {
                  await sendStreakReminderEmail({
                    transporter,
                    to: recipientEmail,
                    streak: row.current_streak,
                    name: profile?.full_name || 'there',
                  });
                  results.emailsSent++;
                  reminded = true;
                } catch {
                  results.errors++;
                }
              }
            }

            for (const tokenRow of tokens) {
              if (tokenRow.push_reminders_enabled !== false && tokenRow.expo_push_token) {
                try {
                  const pushRes = await sendPush({
                    to: tokenRow.expo_push_token,
                    title: `🔥 ${row.current_streak}-day streak at risk!`,
                    body: 'Practice 1 question today to keep your PrepLoop streak going.',
                    data: { screen: 'Dashboard', streak: row.current_streak },
                  });
                  if (!pushRes?.skipped) {
                    results.pushesSent++;
                    reminded = true;
                  }
                } catch {
                  results.errors++;
                }
              }
            }

            if (reminded) {
              if (tokens.length) {
                const { error: tokenUpdateErr } = await supabase
                  .from('user_push_tokens')
                  .update({ last_reminded_date: today })
                  .eq('user_id', row.user_id);
                if (tokenUpdateErr) {
                  results.errors++;
                }
              }

              const { error: streakUpdateErr } = await supabase
                .from('user_streaks')
                .update({ last_reminded_date: today })
                .eq('user_id', row.user_id);
              if (
                streakUpdateErr &&
                streakUpdateErr.code !== '42703' &&
                !String(streakUpdateErr.message || '').includes('last_reminded_date')
              ) {
                results.errors++;
              }
            }
          } catch {
            results.errors++;
          }
        }
      }
    );

    await Promise.all(poolWorkers);
  }

  return results;
}
