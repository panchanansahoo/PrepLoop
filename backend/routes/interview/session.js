import express from 'express';
import crypto from 'crypto';
import { supabaseAdmin } from '../../db/supabaseClient.js';
import { authenticateToken } from '../../middleware/auth.js';
import { aiCallWithRetry } from '../../utils/aiClient.js';
import {
  groq,
  INTERVIEW_START_COIN_COST,
  spendCoinsForInterviewStart,
  refundCoinsForInterviewStartFailure,
  generateAIQuestion,
  getFallbackQuestions,
} from './helpers.js';

const router = express.Router();

router.post('/start', authenticateToken, async (req, res) => {
  let didCharge = false;
  try {
    const { type, difficulty, duration: _duration } = req.body;

    const validTypes = ['technical', 'behavioral', 'system-design', 'coding', 'dsa', 'mixed'];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid interview type',
        validTypes,
        received: type
      });
    }

    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!difficulty || !validDifficulties.includes(difficulty)) {
      return res.status(400).json({
        error: 'Invalid difficulty level',
        validDifficulties,
        received: difficulty
      });
    }

    const spendResult = await spendCoinsForInterviewStart(
      req.user.id,
      INTERVIEW_START_COIN_COST,
      req.requestId ? `interview-start:${req.requestId}` : null
    );

    if (!spendResult.ok) {
      return res.status(400).json({
        error: 'Insufficient coins',
        required: INTERVIEW_START_COIN_COST,
        coins: spendResult.currentCoins,
      });
    }
    didCharge = true;

    const aiQuestion = await generateAIQuestion(type, difficulty);

    if (aiQuestion) {
      res.json({
        questions: [aiQuestion],
        firstQuestion: aiQuestion,
        question: aiQuestion,
      });
    } else {
      const questions = getFallbackQuestions(type, difficulty);
      const questionCount = 5;
      const shuffled = [...questions];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = crypto.randomInt(i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const selectedQuestions = shuffled.slice(0, Math.min(questionCount, shuffled.length));

      res.json({
        questions: selectedQuestions,
        firstQuestion: selectedQuestions[0] || null,
        question: selectedQuestions[0] || null,
      });
    }
  } catch (error) {
    if (didCharge && req.user?.id) {
      try {
        await refundCoinsForInterviewStartFailure(
          req.user.id,
          INTERVIEW_START_COIN_COST,
          req.requestId ? `interview-refund:${req.requestId}` : null
        );
      } catch (refundError) {
        console.error('Interview coin refund error:', refundError);
      }
    }
    console.error('Error starting interview:', error);
    res.status(500).json({ error: 'Failed to start interview', message: error.message });
  }
});

router.post('/next-question', authenticateToken, async (req, res) => {
  try {
    const { previousResponses, type } = req.body;
    const difficulty = req.body.difficulty || 'medium';

    const validTypes = ['technical', 'behavioral', 'system-design', 'coding', 'dsa', 'mixed'];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid interview type',
        validTypes,
        received: type
      });
    }

    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(difficulty)) {
      return res.status(400).json({
        error: 'Invalid difficulty level',
        validDifficulties,
        received: difficulty
      });
    }

    const safeResponses = Array.isArray(previousResponses) ? previousResponses : [];
    const previousQuestions = safeResponses
      .map(r => r?.question?.question)
      .filter(Boolean);

    const aiQuestion = await generateAIQuestion(type, difficulty, previousQuestions);

    if (aiQuestion) {
      res.json({ question: aiQuestion });
    } else {
      const questions = getFallbackQuestions(type, difficulty);
      const randomQuestion = questions[crypto.randomInt(questions.length)];
      res.json({ question: randomQuestion });
    }
  } catch (error) {
    console.error('Error getting next question:', error);
    res.status(500).json({ error: 'Failed to get next question', message: error.message });
  }
});

router.post('/complete', authenticateToken, async (req, res) => {
  try {
    const { type, difficulty, duration, responses } = req.body;

    const validTypes = ['technical', 'behavioral', 'system-design', 'coding', 'dsa', 'mixed'];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid interview type',
        validTypes,
        received: type
      });
    }

    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!difficulty || !validDifficulties.includes(difficulty)) {
      return res.status(400).json({
        error: 'Invalid difficulty level',
        validDifficulties,
        received: difficulty
      });
    }

    if (!Array.isArray(responses)) {
      return res.status(400).json({
        error: 'Responses must be an array'
      });
    }

    let scores;

    if (groq && responses && responses.length > 0) {
      try {
        const responseSummary = responses.map((r, i) =>
          `Q${i + 1}: ${r.question?.question || r.question || 'Unknown'}\nA: ${r.answer || r.response || '(no response)'}`
        ).join('\n\n');

        const completion = await aiCallWithRetry({
          operation: () => groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
              {
                role: 'system',
                content: `You are an expert interview evaluator. Score the candidate's interview responses on a scale of 0-100.
              Interview type: ${type}, Difficulty: ${difficulty}.
              Provide scores as JSON with fields: overall, communication, technical, problemSolving.
              Be fair but rigorous. Consider: depth of answer, clarity, technical accuracy, structure (STAR method for behavioral).
              Short or empty answers should get lower scores. Respond ONLY with valid JSON.`
              },
              {
                role: 'user',
                content: `Evaluate these interview responses:\n\n${responseSummary}`
              }
            ],
            response_format: { type: 'json_object' }
          }),
          timeoutMs: 12000,
          maxRetries: 2,
          baseDelayMs: 250,
        });

        let aiScores;
        try {
          const raw = completion.choices?.[0]?.message?.content || '';
          aiScores = JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, ''));
        } catch {
          aiScores = null;
        }
        if (aiScores) {
          scores = {
            overall: Math.max(0, Math.min(100, Math.round(aiScores.overall || 50))),
            communication: Math.max(0, Math.min(100, Math.round(aiScores.communication || 50))),
            technical: Math.max(0, Math.min(100, Math.round(aiScores.technical || 50))),
            problemSolving: Math.max(0, Math.min(100, Math.round(aiScores.problemSolving || 50)))
          };
        }
      } catch (aiError) {
        console.error('AI scoring failed, using heuristic:', aiError.message);
        scores = null;
      }
    }

    if (!scores) {
      const totalResponses = (responses || []).length;
      const answeredResponses = (responses || []).filter(r =>
        (r.answer || r.response || '').trim().length > 20
      );
      const avgLength = answeredResponses.length > 0
        ? answeredResponses.reduce((sum, r) => sum + (r.answer || r.response || '').length, 0) / answeredResponses.length
        : 0;

      const completionRate = totalResponses > 0 ? answeredResponses.length / totalResponses : 0;
      const baseScore = Math.round(completionRate * 60 + 20);
      const detailBonus = Math.min(15, Math.round(avgLength / 50));
      const difficultyMod = difficulty === 'hard' ? -5 : difficulty === 'easy' ? 5 : 0;
      const heuristicScore = Math.max(0, Math.min(100, baseScore + detailBonus + difficultyMod));

      scores = {
        overall: heuristicScore,
        communication: Math.max(0, Math.min(100, heuristicScore + (avgLength > 100 ? 5 : -5))),
        technical: Math.max(0, Math.min(100, heuristicScore - 3)),
        problemSolving: Math.max(0, Math.min(100, heuristicScore - 2))
      };
    }

    const { data, error } = await supabaseAdmin
      .from('mock_interviews')
      .insert({
        user_id: req.user.id,
        interview_type: type,
        difficulty,
        duration,
        questions: (responses || []).map(r => r.question),
        responses,
        overall_score: scores.overall,
        communication_score: scores.communication,
        technical_score: scores.technical,
        problem_solving_score: scores.problemSolving,
        completed_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) throw error;

    res.json({
      interviewId: data.id,
      scores
    });
  } catch (error) {
    console.error('Error completing interview:', error);
    res.status(500).json({ error: 'Failed to complete interview', message: error.message });
  }
});

router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('mock_interviews')
      .select('id, interview_type, difficulty, duration, overall_score, completed_at')
      .eq('user_id', req.user.id)
      .order('completed_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json({ interviews: data || [] });
  } catch (error) {
    console.error('Error fetching interview history:', error);
    res.status(500).json({ error: 'Failed to fetch history', message: error.message });
  }
});

router.get('/sessions', authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  const { limit = 20, offset = 0 } = req.query;

  try {
    let sessions = [];
    const { data, error } = await supabaseAdmin
      .from('interview_sessions')
      .select('id, session_type, company, role, stage, difficulty, overall_score, completed_at, created_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (!error && Array.isArray(data) && data.length > 0) {
      sessions = data;
    } else {
      const { data: mockData } = await supabaseAdmin
        .from('mock_interviews')
        .select('id, interview_type, difficulty, duration, overall_score, completed_at, created_at')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
      sessions = mockData || [];
    }

    const normalized = sessions.map(s => ({
      ...s,
      score: s.overall_score ?? s.score ?? null,
      overall_score: s.overall_score ?? s.score ?? null,
      createdAt: s.completed_at || s.created_at || null,
      created_at: s.completed_at || s.created_at || null,
    }));

    res.json({ sessions: normalized, data: normalized });
  } catch (error) {
    console.error('List interview sessions error:', error.message);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('mock_interviews')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    res.json({ interview: data });
  } catch (error) {
    console.error('Error fetching interview:', error);
    res.status(500).json({ error: 'Failed to fetch interview', message: error.message });
  }
});

export default router;

