import express from 'express';
import Groq from 'groq-sdk';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// ==================== REAL-TIME FEEDBACK ====================
/**
 * Get real-time feedback as user answers
 * Provides instant analysis with strengths/improvements
 */
router.post('/feedback/realtime', authenticateToken, async (req, res) => {
  try {
    const { question, answer, type, difficulty } = req.body;

    if (!groq) {
      return res.json({
        feedback: {
          strengths: ['Good effort', 'Clear communication'],
          improvements: ['Add more specific examples', 'Provide technical depth'],
          score: 70,
          suggestion: 'Consider providing more technical details'
        }
      });
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are an expert interview coach providing real-time feedback.
          Analyze the candidate's answer and provide constructive, encouraging feedback.
          Interview Type: ${type}, Difficulty: ${difficulty}.
          
          Return JSON with:
          - strengths: array of 2-3 specific strengths observed
          - improvements: array of 2-3 specific areas to improve
          - score: 0-100 score for this answer
          - suggestion: one actionable tip to improve the next answer
          - confidence: your confidence in the score (0-100)
          
          Be encouraging but honest. Respond ONLY with valid JSON.`
        },
        {
          role: 'user',
          content: `Question: ${question}\n\nCandidate's Answer: ${answer}`
        }
      ],
      response_format: { type: 'json_object' }
    });

    const feedback = JSON.parse(completion.choices[0].message.content);
    res.json(feedback);
  } catch (error) {
    console.error('Real-time feedback error:', error);
    res.status(500).json({ error: 'Failed to generate feedback' });
  }
});

// ==================== ADVANCED SCORING ====================
/**
 * Generate detailed scoring report for interview
 */
router.post('/analysis/detailed', authenticateToken, async (req, res) => {
  try {
    const { responses, type, difficulty, duration } = req.body;

    if (!groq || !responses || responses.length === 0) {
      return res.json({
        overall_score: 70,
        scores: {
          communication: 72,
          technical_knowledge: 68,
          problem_solving: 70,
          clarity: 71,
          confidence: 69
        },
        strengths: ['Clear communication', 'Logical thinking'],
        weaknesses: ['Could provide more examples', 'Limited technical depth'],
        recommendations: ['Practice system design', 'Study advanced algorithms']
      });
    }

    const responseSummary = responses.map((r, i) =>
      `Q${i + 1}: ${r.question}\nA: ${r.answer || '(No response provided)'}`
    ).join('\n\n---\n\n');

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are an expert technical interviewer evaluating a complete interview.
          Interview Type: ${type}, Difficulty: ${difficulty}, Duration: ${duration}min.
          
          Provide comprehensive feedback with:
          - overall_score: 0-100
          - scores object with: communication, technical_knowledge, problem_solving, clarity, confidence (each 0-100)
          - strengths: array of 3-4 specific strengths
          - weaknesses: array of 3-4 specific weaknesses
          - recommendations: array of 3-5 specific action items
          - readiness_percentage: likelihood of passing real interview (0-100)
          - top_challenge: the biggest challenge observed
          
          Be balanced and constructive. Respond ONLY with valid JSON.`
        },
        {
          role: 'user',
          content: `Evaluate this interview:\n\n${responseSummary}`
        }
      ],
      response_format: { type: 'json_object' }
    });

    const analysis = JSON.parse(completion.choices[0].message.content);
    res.json(analysis);
  } catch (error) {
    console.error('Detailed analysis error:', error);
    res.status(500).json({ error: 'Failed to generate analysis' });
  }
});

// ==================== PERSONALIZED LEARNING PATHS ====================
/**
 * Generate personalized learning recommendations based on performance
 */
router.post('/recommendations/personalized', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, difficulty, weaknesses, score } = req.body;

    if (!groq) {
      return res.json({
        learning_path: [
          { topic: 'Basic Data Structures', priority: 'high', resources: [] },
          { topic: 'Algorithm Design', priority: 'medium', resources: [] }
        ],
        next_interview_topics: ['Arrays', 'Strings', 'Linked Lists'],
        estimated_improvement: '15-20% score increase with focused practice',
        study_duration: '2-3 weeks'
      });
    }

    // Get user's past interview history for context
    const { data: interviewHistory } = await supabaseAdmin
      .from('mock_interviews')
      .select('interview_type, difficulty, overall_score')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(5);

    const historyContext = interviewHistory?.length > 0
      ? `Past interviews: ${interviewHistory.map(i => `${i.interview_type}(${i.difficulty}): ${i.overall_score}`).join(', ')}`
      : 'First interview';

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are an expert career coach creating personalized learning paths.
          Student Profile: ${historyContext}.
          Current Performance: ${type}(${difficulty}) - Score: ${score}.
          Main Weaknesses: ${weaknesses?.join(', ') || 'General improvement needed'}.
          
          Create a strategic, personalized learning path. Return JSON with:
          - learning_path: array of topics ordered by priority (each with topic, priority, resources array)
          - next_interview_topics: array of 3 topics to focus on for next interview
          - estimated_improvement: expected score improvement with this path
          - study_duration: recommended time commitment
          - quick_wins: array of 2-3 quick improvements they can make today
          - long_term_goals: array of 3-4 long-term skills to develop
          
          Be specific and actionable. Respond ONLY with valid JSON.`
        },
        {
          role: 'user',
          content: `Create a personalized learning path for a candidate with these weaknesses: ${weaknesses?.join(', ')}`
        }
      ],
      response_format: { type: 'json_object' }
    });

    const recommendations = JSON.parse(completion.choices[0].message.content);
    
    // Save recommendations to database
    await supabaseAdmin
      .from('learning_recommendations')
      .insert({
        user_id: userId,
        interview_type: type,
        recommendations: recommendations,
        created_at: new Date().toISOString()
      });

    res.json(recommendations);
  } catch (error) {
    console.error('Recommendation generation error:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// ==================== INTERVIEW ANALYTICS ====================
/**
 * Get comprehensive analytics dashboard data
 */
router.get('/analytics/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: interviews } = await supabaseAdmin
      .from('mock_interviews')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (!interviews || interviews.length === 0) {
      return res.json({
        stats: {
          total_interviews: 0,
          average_score: 0,
          best_score: 0,
          most_attempted_type: 'N/A',
          improvement_trend: 0
        },
        performance: {},
        progress_by_type: {},
        recent_interviews: []
      });
    }

    const stats = {
      total_interviews: interviews.length,
      average_score: Math.round(
        interviews.reduce((sum, i) => sum + (i.overall_score || 0), 0) / interviews.length
      ),
      best_score: Math.max(...interviews.map(i => i.overall_score || 0)),
      worst_score: Math.min(...interviews.map(i => i.overall_score || 0)),
      most_attempted_type: getMostAttemptedType(interviews),
      total_duration_hours: Math.round(
        interviews.reduce((sum, i) => sum + (i.duration || 0), 0) / 60
      )
    };

    // Calculate improvement trend
    const improvementTrend = calculateImprovementTrend(interviews);
    stats.improvement_trend = improvementTrend;

    // Performance by type
    const performanceByType = getPerformanceByType(interviews);

    // Recent interviews
    const recentInterviews = interviews.slice(0, 5).map(interview => ({
      id: interview.id,
      type: interview.interview_type,
      difficulty: interview.difficulty,
      score: interview.overall_score,
      date: interview.completed_at,
      duration: interview.duration
    }));

    res.json({
      stats,
      performance_by_type: performanceByType,
      recent_interviews: recentInterviews,
      score_distribution: getScoreDistribution(interviews),
      difficulty_breakdown: getDifficultyBreakdown(interviews)
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// ==================== INTERVIEW REPLAY & NOTES ====================
/**
 * Get detailed interview replay data with notes
 */
router.get('/replay/:interviewId', authenticateToken, async (req, res) => {
  try {
    const { interviewId } = req.params;
    const userId = req.user.id;

    const { data: interview, error } = await supabaseAdmin
      .from('mock_interviews')
      .select('*')
      .eq('id', interviewId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    const { data: notes } = await supabaseAdmin
      .from('interview_notes')
      .select('*')
      .eq('interview_id', interviewId);

    res.json({
      interview: {
        id: interview.id,
        type: interview.interview_type,
        difficulty: interview.difficulty,
        duration: interview.duration,
        started_at: interview.started_at,
        completed_at: interview.completed_at,
        scores: {
          overall: interview.overall_score,
          communication: interview.communication_score,
          technical: interview.technical_score,
          problem_solving: interview.problem_solving_score
        },
        qa_pairs: formatQAPairs(interview.questions, interview.responses)
      },
      notes: notes || [],
      lessons_learned: generateLessonsLearned(interview)
    });
  } catch (error) {
    console.error('Replay error:', error);
    res.status(500).json({ error: 'Failed to fetch interview replay' });
  }
});

/**
 * Save notes for an interview
 */
router.post('/notes', authenticateToken, async (req, res) => {
  try {
    const { interviewId, content, question_index } = req.body;
    const userId = req.user.id;

    // Verify interview belongs to user
    const { data: interview } = await supabaseAdmin
      .from('mock_interviews')
      .select('user_id')
      .eq('id', interviewId)
      .single();

    if (interview.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { data: note, error } = await supabaseAdmin
      .from('interview_notes')
      .insert({
        user_id: userId,
        interview_id: interviewId,
        content,
        question_index,
        created_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (error) throw error;

    res.json(note);
  } catch (error) {
    console.error('Notes save error:', error);
    res.status(500).json({ error: 'Failed to save notes' });
  }
});

// ==================== AUDIO/VIDEO SUPPORT ====================
/**
 * Start a video/audio interview session
 */
router.post('/media/start-session', authenticateToken, async (req, res) => {
  try {
    const { type, difficulty } = req.body;
    const userId = req.user.id;

    // Generate session ID
    const sessionId = `${userId}-${Date.now()}`;

    // Create interview session record
    const { data: session, error } = await supabaseAdmin
      .from('interview_sessions')
      .insert({
        user_id: userId,
        session_id: sessionId,
        interview_type: type,
        difficulty,
        media_type: 'video', // or 'audio'
        status: 'active',
        started_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (error) throw error;

    res.json({
      session_id: sessionId,
      media_upload_url: `/api/ai/interview/media/upload/${sessionId}`,
      instructions: 'Your interview session has started. Speak your answers clearly.'
    });
  } catch (error) {
    console.error('Session start error:', error);
    res.status(500).json({ error: 'Failed to start media session' });
  }
});

/**
 * Upload audio/video chunk and get transcription
 */
router.post('/media/transcribe', authenticateToken, async (req, res) => {
  try {
    const { session_id, audio_data, question_index } = req.body;

    if (!groq) {
      return res.json({
        transcription: 'Sample transcription of your answer',
        confidence: 0.95,
        audio_length_seconds: 30
      });
    }

    // In real implementation, send audio to Groq or other transcription service
    // For now, return placeholder
    res.json({
      transcription: 'Your speech-to-text transcription will appear here',
      confidence: 0.92,
      processed_audio_length: 45
    });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

// ==================== HELPER FUNCTIONS ====================

function getMostAttemptedType(interviews) {
  const types = {};
  interviews.forEach(i => {
    types[i.interview_type] = (types[i.interview_type] || 0) + 1;
  });
  return Object.keys(types).reduce((a, b) => types[a] > types[b] ? a : b, 'unknown');
}

function calculateImprovementTrend(interviews) {
  if (interviews.length < 2) return 0;
  const sorted = interviews.sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at));
  const first = sorted[0].overall_score || 0;
  const last = sorted[sorted.length - 1].overall_score || 0;
  return Math.round(((last - first) / first) * 100);
}

function getPerformanceByType(interviews) {
  const performance = {};
  interviews.forEach(i => {
    if (!performance[i.interview_type]) {
      performance[i.interview_type] = {
        count: 0,
        avg_score: 0,
        best_score: 0,
        scores: []
      };
    }
    performance[i.interview_type].scores.push(i.overall_score || 0);
  });

  Object.keys(performance).forEach(type => {
    const scores = performance[type].scores;
    performance[type].count = scores.length;
    performance[type].avg_score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    performance[type].best_score = Math.max(...scores);
    delete performance[type].scores;
  });

  return performance;
}

function getScoreDistribution(interviews) {
  const distribution = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
  interviews.forEach(i => {
    const score = i.overall_score || 0;
    if (score <= 20) distribution['0-20']++;
    else if (score <= 40) distribution['21-40']++;
    else if (score <= 60) distribution['41-60']++;
    else if (score <= 80) distribution['61-80']++;
    else distribution['81-100']++;
  });
  return distribution;
}

function getDifficultyBreakdown(interviews) {
  const breakdown = {};
  interviews.forEach(i => {
    if (!breakdown[i.difficulty]) {
      breakdown[i.difficulty] = { count: 0, avg_score: 0 };
    }
    breakdown[i.difficulty].count++;
  });
  return breakdown;
}

function formatQAPairs(questions, responses) {
  if (!questions || !responses) return [];
  return questions.map((q, i) => ({
    index: i,
    question: typeof q === 'string' ? q : q.question,
    answer: responses[i]?.answer || responses[i]?.response || '',
    score: responses[i]?.score || null,
    feedback: responses[i]?.feedback || null
  }));
}

function generateLessonsLearned(interview) {
  return [
    {
      lesson: 'Focus Areas',
      points: [
        'Review weak areas identified in technical_score',
        'Practice problem-solving approaches',
        'Improve communication clarity'
      ]
    },
    {
      lesson: 'Next Steps',
      points: [
        'Study topics related to your weak areas',
        'Practice similar interview questions',
        'Record yourself and review'
      ]
    }
  ];
}

export default router;
