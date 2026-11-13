import express from 'express';
import crypto from 'crypto';
import { supabaseAdmin } from '../../db/supabaseClient.js';
import { authenticateToken } from '../../middleware/auth.ts';
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

    const validDifficulties = ['easy', 'medium', 'hard', 'adaptive'];
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
    res.status(500).json({
      error: 'Failed to start interview',
      ...(process.env.NODE_ENV === 'development' ? { message: error.message } : {})
    });
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

    const validDifficulties = ['easy', 'medium', 'hard', 'adaptive'];
    if (!validDifficulties.includes(difficulty)) {
      return res.status(400).json({
        error: 'Invalid difficulty level',
        validDifficulties,
        received: difficulty
      });
    }

    // AI2: Cap history length and sanitize question content to prevent prompt injection and unbounded prompt growth
    const MAX_PREV_QUESTIONS = 10;
    const MAX_QUESTION_LEN = 300;

    const safeResponses = Array.isArray(previousResponses)
      ? previousResponses.slice(-MAX_PREV_QUESTIONS)
      : [];

    const previousQuestions = safeResponses
      .map(r => {
        const text = typeof r?.question === 'object' && r?.question !== null
          ? (r.question.question || r.question.text || '')
          : (typeof r?.question === 'string' ? r.question : (typeof r === 'string' ? r : ''));
        return String(text)
          .replace(/[\r\n\t]/g, ' ')
          .replace(/["\\]/g, '')
          .trim()
          .slice(0, MAX_QUESTION_LEN);
      })
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
    res.status(500).json({
      error: 'Failed to get next question',
      ...(process.env.NODE_ENV === 'development' ? { message: error.message } : {})
    });
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

    const validDifficulties = ['easy', 'medium', 'hard', 'adaptive'];
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

    // AI4: Validate duration (non-negative, finite integer, capped at 86400 seconds / 24 hours)
    const parsedDuration = Number(duration);
    const sanitizedDuration = Number.isFinite(parsedDuration)
      ? Math.min(86400, Math.max(0, Math.round(parsedDuration)))
      : 0;

    // AI3: Cap responses array size and sanitize/truncate entries
    const MAX_RESPONSES = 25;
    const MAX_RESPONSE_ANSWER_LENGTH = 1000;
    const MAX_RESPONSE_QUESTION_LENGTH = 300;

    const safeResponses = responses.slice(0, MAX_RESPONSES).map(r => {
      if (!r || typeof r !== 'object') return { question: 'Unknown', answer: '' };
      const qText = typeof r.question === 'object' && r.question !== null
        ? (r.question.question || r.question.text || 'Unknown')
        : (typeof r.question === 'string' ? r.question : 'Unknown');
      const aText = typeof r.answer === 'string' ? r.answer : (typeof r.response === 'string' ? r.response : '');

      return {
        ...r,
        question: typeof r.question === 'object' && r.question !== null
          ? { ...r.question, question: String(qText).slice(0, MAX_RESPONSE_QUESTION_LENGTH) }
          : String(qText).slice(0, MAX_RESPONSE_QUESTION_LENGTH),
        answer: String(aText).slice(0, MAX_RESPONSE_ANSWER_LENGTH),
        response: String(aText).slice(0, MAX_RESPONSE_ANSWER_LENGTH),
      };
    });

    let scores;

    if (groq && safeResponses.length > 0) {
      try {
        const responseSummary = safeResponses.map((r, i) => {
          const q = typeof r.question === 'object' && r.question !== null ? (r.question.question || 'Unknown') : r.question;
          const a = r.answer || '(no response)';
          return `Q${i + 1}: ${q}\nA: ${a}`;
        }).join('\n\n');

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
      const totalResponses = safeResponses.length;
      const answeredResponses = safeResponses.filter(r =>
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
        duration: sanitizedDuration,
        questions: safeResponses.map(r => r.question),
        responses: safeResponses,
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
    res.status(500).json({
      error: 'Failed to complete interview',
      ...(process.env.NODE_ENV === 'development' ? { message: error.message } : {})
    });
  }
});

router.get('/history', authenticateToken, async (req, res) => {
  try {
    const requestedLimit = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(50, requestedLimit)
      : 20;

    const { data: mockData } = await supabaseAdmin
      .from('mock_interviews')
      .select('id, interview_type, difficulty, duration, overall_score, completed_at, company, role')
      .eq('user_id', req.user.id)
      .order('completed_at', { ascending: false })
      .limit(limit);

    const { data: sessData } = await supabaseAdmin
      .from('interview_sessions')
      .select('id, session_id, interview_type, difficulty_level, company_focus, interview_score, performance_metrics, completed_at, created_at')
      .eq('user_id', req.user.id)
      .order('completed_at', { ascending: false })
      .limit(limit);

    let interviews = [];
    if (sessData && sessData.length > 0) {
      interviews = sessData.map(s => {
        const pm = s.performance_metrics || {};
        return {
          id: s.id,
          type: pm.stage || s.interview_type || 'technical',
          interview_type: pm.stage || s.interview_type || 'technical',
          difficulty: s.difficulty_level || pm.difficulty || 'medium',
          duration: pm.duration || null,
          overall_score: s.interview_score ?? pm.overallScore ?? 0,
          score: s.interview_score ?? pm.overallScore ?? 0,
          completed_at: s.completed_at || s.created_at,
          created_at: s.created_at || s.completed_at,
          company: s.company_focus || pm.company || 'General',
          role: pm.role || 'Software Engineer'
        };
      });
    }

    if (mockData && mockData.length > 0) {
      const mockMapped = mockData.map(m => ({
        id: m.id,
        type: m.interview_type || 'technical',
        interview_type: m.interview_type || 'technical',
        difficulty: m.difficulty || 'medium',
        duration: m.duration || null,
        overall_score: m.overall_score || 0,
        score: m.overall_score || 0,
        completed_at: m.completed_at,
        created_at: m.completed_at,
        company: m.company || 'General',
        role: m.role || 'Software Engineer'
      }));
      interviews = [...interviews, ...mockMapped];
    }

    // AI7: Sort merged results and apply final limit cap so result does not exceed limit (e.g. 20)
    interviews.sort((a, b) => new Date(b.completed_at || 0) - new Date(a.completed_at || 0));
    const cappedInterviews = interviews.slice(0, limit);

    res.json({ interviews: cappedInterviews });
  } catch (error) {
    console.error('Error fetching interview history:', error);
    res.status(500).json({
      error: 'Failed to fetch history',
      ...(process.env.NODE_ENV === 'development' ? { message: error.message } : {})
    });
  }
});

router.get('/sessions', authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  const { limit = 20, offset = 0 } = req.query;
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const parsedOffset = Math.max(0, parseInt(offset, 10) || 0);

  try {
    let sessions = [];
    const { data, error } = await supabaseAdmin
      .from('interview_sessions')
      .select('id, session_id, interview_type, company_focus, difficulty_level, interview_score, performance_metrics, completed_at, created_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .range(parsedOffset, parsedOffset + parsedLimit - 1);

    if (!error && Array.isArray(data) && data.length > 0) {
      sessions = data.map(s => {
        const pm = s.performance_metrics || {};
        return {
          id: s.id,
          session_id: s.session_id,
          session_type: pm.sessionType || 'single',
          company: s.company_focus || pm.company || 'General',
          role: pm.role || 'Software Engineer',
          stage: pm.stage || s.interview_type || 'Technical',
          difficulty: s.difficulty_level || pm.difficulty || 'medium',
          score: s.interview_score ?? pm.overallScore ?? null,
          overall_score: s.interview_score ?? pm.overallScore ?? null,
          completed_at: s.completed_at || s.created_at || null,
          created_at: s.created_at || s.completed_at || null,
          createdAt: s.completed_at || s.created_at || null,
        };
      });
    } else {
      const { data: mockData } = await supabaseAdmin
        .from('mock_interviews')
        .select('id, interview_type, difficulty, duration, overall_score, completed_at, started_at')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .range(parsedOffset, parsedOffset + parsedLimit - 1);
      sessions = mockData || [];
    }

    const normalized = sessions.map(s => ({
      ...s,
      score: s.overall_score ?? s.score ?? null,
      overall_score: s.overall_score ?? s.score ?? null,
      createdAt: s.completed_at || s.started_at || s.created_at || null,
      created_at: s.completed_at || s.started_at || s.created_at || null,
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
    const rawId = String(id || '');
    const cleanId = rawId.replace(/^(interview_session_|mock_interview_)/, '');
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
    const isNumeric = /^\d+$/.test(cleanId);

    let interviewData = null;

    // 1. If cleanId is UUID or alphanumeric session string, query interview_sessions first
    if (isUuid || !isNumeric) {
      let query = supabaseAdmin.from('interview_sessions').select('*').eq('user_id', req.user.id);
      if (isUuid) {
        query = query.eq('id', cleanId);
      } else {
        query = query.or(`session_id.eq.${cleanId},session_id.eq.${rawId}`);
      }
      const { data: sessionData, error: sessionError } = await query.maybeSingle();
      if (!sessionError && sessionData) {
        const pm = sessionData.performance_metrics || {};
        interviewData = {
          id: sessionData.id,
          session_id: sessionData.session_id,
          company: sessionData.company_focus || pm.company || 'General',
          role: pm.role || 'Software Engineer',
          stage: pm.stage || sessionData.interview_type || 'Technical',
          difficulty: sessionData.difficulty_level || pm.difficulty || 'medium',
          score: sessionData.interview_score ?? pm.overallScore ?? 0,
          overall_score: sessionData.interview_score ?? pm.overallScore ?? 0,
          feedback: sessionData.recommendations || pm.summaryData?.summary || pm.summaryData?.feedback || '',
          transcript: sessionData.transcript || [],
          created_at: sessionData.created_at,
          ...sessionData,
        };
      }
    }

    // 2. Fall back to mock_interviews if numeric or not found in interview_sessions
    if (!interviewData && isNumeric) {
      const { data, error } = await supabaseAdmin
        .from('mock_interviews')
        .select('*')
        .eq('id', Number(cleanId))
        .eq('user_id', req.user.id)
        .single();

      if (!error && data) {
        interviewData = data;
      }
    }

    if (!interviewData) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    res.json({ interview: interviewData, data: interviewData });
  } catch (error) {
    console.error('Error fetching interview:', error);
    res.status(500).json({
      error: 'Failed to fetch interview',
      ...(process.env.NODE_ENV === 'development' ? { message: error.message } : {})
    });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (isUuid) {
      await supabaseAdmin.from('interview_sessions').delete().eq('id', id).eq('user_id', userId);
    } else {
      await supabaseAdmin.from('interview_sessions').delete().eq('session_id', id).eq('user_id', userId);
    }

    const numericId = Number(id);
    if (Number.isInteger(numericId) && numericId > 0) {
      await supabaseAdmin.from('mock_interviews').delete().eq('id', numericId).eq('user_id', userId);
    }

    res.json({ success: true, deleted: true });
  } catch (error) {
    console.error('Delete interview error:', error.message);
    res.status(500).json({
      error: 'Failed to delete interview',
      ...(process.env.NODE_ENV === 'development' ? { message: error.message } : {})
    });
  }
});

export default router;

