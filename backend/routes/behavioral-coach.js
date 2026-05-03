import express from 'express';
import Groq from 'groq-sdk';
import { authenticateToken } from '../middleware/auth.js';
import { supabaseAdmin } from '../db/supabaseClient.js';

const router = express.Router();
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'literally', 'sort of', 'right', 'actually', 'honestly'];

function countFillers(text) {
  const lower = text.toLowerCase();
  let count = 0;
  for (const filler of FILLER_WORDS) {
    const regex = new RegExp(`\\b${filler.replace(/\s/g, '\\s+')}\\b`, 'gi');
    count += (lower.match(regex) || []).length;
  }
  return count;
}

function heuristicScore(answer) {
  const lower = answer.toLowerCase();
  const wordCount = answer.split(/\s+/).filter(Boolean).length;
  const fillerCount = countFillers(answer);

  const hasSituation = /(situation|context|we were|at the time|when i|the project|the team)/i.test(lower);
  const hasTask = /(my task|my role|i was responsible|i needed to|i had to)/i.test(lower);
  const hasAction = /(i decided|i implemented|i led|i built|i created|i organized|i took|i proposed)/i.test(lower);
  const hasResult = /(result|outcome|impact|achieved|reduced|improved|increased|delivered|launched)/i.test(lower);
  const hasMetrics = /\d+%|\d+ team|\d+ month|\$\d|reduced by|increased by|saved|grew/i.test(lower);

  const starScore = (hasSituation ? 20 : 0) + (hasTask ? 15 : 0) + (hasAction ? 25 : 0) + (hasResult ? 25 : 0) + (hasMetrics ? 15 : 0);
  const confidenceScore = Math.max(30, Math.min(95, 60 + Math.min(wordCount, 100) * 0.2 - fillerCount * 5));
  const clarityScore = Math.max(30, Math.min(95, 50 + (hasSituation ? 10 : 0) + (hasAction ? 15 : 0) + (hasResult ? 15 : 0) - fillerCount * 3));

  return {
    starScore,
    confidenceScore: Math.round(confidenceScore),
    clarityScore: Math.round(clarityScore),
    overallScore: Math.round((starScore * 0.5 + confidenceScore * 0.25 + clarityScore * 0.25)),
    starBreakdown: { hasSituation, hasTask, hasAction, hasResult, hasMetrics },
    fillerCount,
    wordCount,
  };
}

// POST /api/behavioral-coach/analyze
router.post('/analyze', authenticateToken, async (req, res) => {
  try {
    const { answer, question = '', questionType = 'behavioral' } = req.body;
    if (!answer || answer.trim().length < 10) {
      return res.status(400).json({ error: 'Answer too short to analyze' });
    }

    const heuristic = heuristicScore(answer);
    let aiAnalysis = null;

    if (groq) {
      try {
        const completion = await groq.chat.completions.create({
          model: 'llama3-8b-8192',
          temperature: 0.3,
          max_tokens: 600,
          messages: [
            {
              role: 'system',
              content: `You are an expert behavioral interview coach. Analyze the candidate's answer using the STAR method (Situation, Task, Action, Result). Return ONLY valid JSON with these keys:
{
  "starScore": 0-100,
  "confidenceScore": 0-100,
  "clarityScore": 0-100,
  "overallScore": 0-100,
  "fillerWords": ["list of filler words found"],
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "rewrittenOpening": "A stronger opening sentence for this answer",
  "starBreakdown": { "situation": true/false, "task": true/false, "action": true/false, "result": true/false }
}`,
            },
            {
              role: 'user',
              content: `Question: ${question || 'Tell me about a challenging situation you faced.'}\n\nAnswer: ${answer}`,
            },
          ],
        });

        const raw = completion.choices[0]?.message?.content || '{}';
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) aiAnalysis = JSON.parse(jsonMatch[0]);
      } catch (e) {
        // fall through to heuristic
      }
    }

    const result = {
      starScore: aiAnalysis?.starScore ?? heuristic.starScore,
      confidenceScore: aiAnalysis?.confidenceScore ?? heuristic.confidenceScore,
      clarityScore: aiAnalysis?.clarityScore ?? heuristic.clarityScore,
      overallScore: aiAnalysis?.overallScore ?? heuristic.overallScore,
      fillerCount: heuristic.fillerCount,
      fillerWords: aiAnalysis?.fillerWords ?? FILLER_WORDS.filter(f => answer.toLowerCase().includes(f)),
      wordCount: heuristic.wordCount,
      starBreakdown: aiAnalysis?.starBreakdown ?? heuristic.starBreakdown,
      strengths: aiAnalysis?.strengths ?? (heuristic.starBreakdown.hasResult ? ['Included outcome/result'] : []),
      improvements: aiAnalysis?.improvements ?? (!heuristic.starBreakdown.hasMetrics ? ['Add specific numbers or metrics'] : []),
      rewrittenOpening: aiAnalysis?.rewrittenOpening ?? null,
      source: aiAnalysis ? 'ai' : 'heuristic',
    };

    // Save to DB (non-blocking)
    supabaseAdmin.from('behavioral_coach_sessions').insert({
      user_id: req.user.id,
      question,
      answer,
      question_type: questionType,
      overall_score: result.overallScore,
      star_score: result.starScore,
      filler_count: result.fillerCount,
      analysis: result,
    }).then(() => {}).catch(() => {});

    res.json(result);
  } catch (err) {
    console.error('Behavioral coach error:', err);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// GET /api/behavioral-coach/history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('behavioral_coach_sessions')
      .select('id, question, overall_score, star_score, filler_count, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default router;
