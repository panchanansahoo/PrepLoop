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
} = {}) {
  if (!supabase) {
    throw new Error('supabase client is required');
  }

  const today = now.toISOString().split('T')[0];
  let { data: streaks, error } = await supabase
    .from('user_streaks')
    .select('user_id, current_streak, last_active_date, last_reminded_date')
    .gt('current_streak', 0)
    .neq('last_active_date', today);

  if (error && (error.code === '42703' || String(error.message || '').includes('last_reminded_date'))) {
    const fallback = await supabase
      .from('user_streaks')
      .select('user_id, current_streak, last_active_date')
      .gt('current_streak', 0)
      .neq('last_active_date', today);
    streaks = fallback.data;
    error = fallback.error;
  }

  if (error) throw error;

  const results = {
    evaluated: (streaks || []).length,
    emailsSent: 0,
    pushesSent: 0,
    skipped: 0,
    errors: 0,
  };

  for (const row of streaks || []) {
    try {
      let { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', row.user_id)
        .maybeSingle();

      if (profileErr && (profileErr.code === '42703' || String(profileErr.message || '').includes('email'))) {
        const fallback = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', row.user_id)
          .maybeSingle();
        profile = fallback.data;
        profileErr = fallback.error;
      }

      if (profileErr) {
        results.errors++;
        continue;
      }

      const { data: tokens, error: tokensErr } = await supabase
        .from('user_push_tokens')
        .select('expo_push_token, email_reminders_enabled, push_reminders_enabled, last_reminded_date')
        .eq('user_id', row.user_id);

      if (tokensErr) {
        results.errors++;
        continue;
      }

      const alreadyReminded =
        row.last_reminded_date === today ||
        (tokens || []).some((t) => t.last_reminded_date === today);
      if (alreadyReminded) {
        results.skipped++;
        continue;
      }

      let reminded = false;
      const emailAllowed = !tokens?.length || tokens.some((t) => t.email_reminders_enabled !== false);
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

      for (const tokenRow of tokens || []) {
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
        if (tokens?.length) {
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

  return results;
}
