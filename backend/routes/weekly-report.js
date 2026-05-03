import express from 'express';
import Groq from 'groq-sdk';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { authenticateToken } from '../middleware/auth.js';
import { aiCallWithRetry } from '../utils/aiClient.js';

const router = express.Router();
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// ─── Generate weekly report ───
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekStartStr = weekStart.toISOString().split('T')[0];

    // Aggregate activity data
    const [dailyWins, patternAttempts, timerAttempts, interviewSessions] = await Promise.all([
      supabaseAdmin.from('daily_wins').select('*')
        .eq('user_id', userId)
        .gte('date', weekStartStr)
        .lt('date', weekEnd.toISOString().split('T')[0]),

      supabaseAdmin.from('pattern_trainer_attempts').select('*')
        .eq('user_id', userId)
        .gte('created_at', weekStart.toISOString())
        .lt('created_at', weekEnd.toISOString()),

      supabaseAdmin.from('timer_attempts').select('*')
        .eq('user_id', userId)
        .gte('created_at', weekStart.toISOString())
        .lt('created_at', weekEnd.toISOString()),

      supabaseAdmin.from('interview_sessions').select('id, score, company, stage, created_at')
        .eq('user_id', userId)
        .gte('created_at', weekStart.toISOString())
        .lt('created_at', weekEnd.toISOString()),
    ]);

    const wins = dailyWins.data || [];
    const patterns = patternAttempts.data || [];
    const timers = timerAttempts.data || [];
    const interviews = interviewSessions.data || [];

    // Calculate metrics
    const totalMinutes = wins.reduce((sum, w) => sum + (w.minutes || 0), 0);
    const patternAccuracy = patterns.length > 0
      ? Math.round((patterns.filter(p => p.is_correct).length / patterns.length) * 100)
      : 0;
    const timerCompletion = timers.length > 0
      ? Math.round((timers.filter(t => t.completed_in_time).length / timers.length) * 100)
      : 0;
    const avgInterviewScore = interviews.length > 0
      ? Math.round(interviews.reduce((sum, i) => sum + (i.score || 0), 0) / interviews.length)
      : 0;

    // Identify weak topics
    const wrongPatterns = patterns.filter(p => !p.is_correct);
    const weakPatternCounts = {};
    wrongPatterns.forEach(p => {
      weakPatternCounts[p.correct_pattern] = (weakPatternCounts[p.correct_pattern] || 0) + 1;
    });
    const weakTopics = Object.entries(weakPatternCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic, count]) => ({ topic, missCount: count }));

    // Build streaks
    const activeDays = new Set(wins.map(w => w.date));
    const streak = activeDays.size;

    const reportData = {
      weekStart: weekStartStr,
      totalMinutes,
      activeDays: activeDays.size,
      streak,
      problemsSolved: wins.length,
      patternAttempts: patterns.length,
      patternAccuracy,
      timerAttempts: timers.length,
      timerCompletion,
      interviewCount: interviews.length,
      avgInterviewScore,
      weakTopics,
      topicsStudied: [...new Set(wins.map(w => w.topic).filter(Boolean))],
    };

    // Generate AI focus recommendation
    let focusRecommendation = '';
    if (groq) {
      try {
        const prompt = `Based on this weekly prep data, give 2-3 specific focus areas for next week in a friendly, motivating tone. Keep it under 100 words.

Data:
- Practice days: ${activeDays.size}/7
- Problems solved: ${wins.length}
- Pattern recognition accuracy: ${patternAccuracy}%
- Timer completion: ${timerCompletion}%
- Weak areas: ${weakTopics.map(w => w.topic).join(', ') || 'None detected'}
- Mock interviews: ${interviews.length}
- Avg interview score: ${avgInterviewScore}/100`;

        const completion = await aiCallWithRetry({
          operation: () => groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
              { role: 'system', content: 'You are a supportive coding interview coach. Be specific and actionable.' },
              { role: 'user', content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 200,
          }),
          maxRetries: 1,
        });

        focusRecommendation = completion?.choices?.[0]?.message?.content?.trim() || '';
      } catch (err) {
        console.warn('AI focus recommendation failed:', err.message);
      }
    }

    reportData.focusRecommendation = focusRecommendation;

    // Upsert report in DB
    const { data: savedReport, error: saveErr } = await supabaseAdmin
      .from('weekly_reports')
      .upsert({
        user_id: userId,
        week_start: weekStartStr,
        report_data: reportData,
      }, { onConflict: 'user_id,week_start' })
      .select()
      .single();

    if (saveErr) {
      console.warn('Failed to save report:', saveErr.message);
    }

    res.json({ report: reportData, saved: !saveErr });
  } catch (err) {
    console.error('Weekly report generation error:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// ─── Get latest report ───
router.get('/latest', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('weekly_reports')
      .select('*')
      .eq('user_id', req.user.id)
      .order('week_start', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    res.json({ report: data?.report_data || null, weekStart: data?.week_start || null });
  } catch (err) {
    console.error('Get latest report error:', err);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// ─── Get report history ───
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('weekly_reports')
      .select('id, week_start, created_at')
      .eq('user_id', req.user.id)
      .order('week_start', { ascending: false })
      .limit(12);

    if (error) throw error;
    res.json({ reports: data || [] });
  } catch (err) {
    console.error('Report history error:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// ─── Subscribe/unsubscribe to email digest ───
router.post('/subscribe', authenticateToken, async (req, res) => {
  try {
    const { enabled } = req.body;

    const { error } = await supabaseAdmin
      .from('email_subscriptions')
      .upsert({
        user_id: req.user.id,
        weekly_report: Boolean(enabled),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) throw error;
    res.json({ subscribed: Boolean(enabled) });
  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// ─── Get subscription status ───
router.get('/subscription', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('email_subscriptions')
      .select('weekly_report')
      .eq('user_id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    res.json({ subscribed: data?.weekly_report || false });
  } catch (err) {
    console.error('Get subscription error:', err);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

export default router;
