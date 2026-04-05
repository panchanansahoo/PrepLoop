import express from 'express';
import Groq from 'groq-sdk';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { authenticateToken } from '../middleware/auth.js';
import { aiCallWithRetry } from '../utils/aiClient.js';
import dsaLearningPath from '../data/dsaLearningPath.js';
import { aptitudeLearningPath } from '../data/aptitudeLearningPath.js';
import lldLearningPath from '../data/lldLearningPath.js';

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

    const completion = await aiCallWithRetry({
      operation: () => groq.chat.completions.create({
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
      }),
      timeoutMs: 12000,
      maxRetries: 2,
      baseDelayMs: 250
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

    const completion = await aiCallWithRetry({
      operation: () => groq.chat.completions.create({
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
      }),
      timeoutMs: 12000,
      maxRetries: 2,
      baseDelayMs: 250
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

    const completion = await aiCallWithRetry({
      operation: () => groq.chat.completions.create({
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
      }),
      timeoutMs: 12000,
      maxRetries: 2,
      baseDelayMs: 250
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

// ==================== PERSONALIZED LEARNING PATH ====================
/**
 * Return a curriculum-backed learning path tailored to the user's real interview and practice data.
 */
router.get('/learning-path/personalized', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [interviewsResult, progressResult, submissionsResult, recommendationsResult] = await Promise.all([
      supabaseAdmin
        .from('mock_interviews')
        .select('interview_type, difficulty, overall_score, communication_score, technical_score, problem_solving_score, started_at, completed_at, duration')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false }),
      supabaseAdmin
        .from('user_progress')
        .select('problem_id, status')
        .eq('user_id', userId),
      supabaseAdmin
        .from('submissions')
        .select('submitted_at, status, execution_time, problems(title, difficulty, pattern_id)')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false }),
      supabaseAdmin
        .from('learning_recommendations')
        .select('recommendations, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1),
    ]);

    const interviews = interviewsResult.error ? [] : (interviewsResult.data || []);
    const progressItems = progressResult.error ? [] : (progressResult.data || []);
    const submissions = submissionsResult.error ? [] : (submissionsResult.data || []);
    const savedRecommendations = recommendationsResult.error ? [] : (recommendationsResult.data || []);

    const profileSummary = buildLearningProfile(interviews, progressItems, submissions);
    const pathCatalog = [
      buildCurriculumPath(dsaLearningPath, profileSummary.dsaScore, profileSummary, 'dsa'),
      buildCurriculumPath(aptitudeLearningPath, profileSummary.aptitudeScore, profileSummary, 'aptitude'),
      buildCurriculumPath(createSqlCurriculum(), profileSummary.sqlScore, profileSummary, 'sql'),
      buildCurriculumPath(lldLearningPath, profileSummary.systemDesignScore, profileSummary, 'system-design'),
    ]
      .sort((left, right) => left.progress - right.progress);

    const latestSaved = savedRecommendations[0]?.recommendations || null;
    const weakestPath = pathCatalog[0] || null;

    const quickRecommendations = latestSaved?.quick_wins?.length > 0
      ? latestSaved.quick_wins.slice(0, 3).map((item, index) => ({
          title: item.title || `Quick win ${index + 1}`,
          description: item.description || item,
        }))
      : buildQuickWinRecommendations(weakestPath, profileSummary);

    res.json({
      paths: pathCatalog,
      recommendations: quickRecommendations,
      selected_path_id: weakestPath?.id || pathCatalog[0]?.id || 'dsa',
      total_modules_completed: profileSummary.totalModulesCompleted,
      total_hours_learned: profileSummary.totalHoursLearned,
      current_streak: profileSummary.currentStreak,
      average_score: profileSummary.averageScore,
    });
  } catch (error) {
    console.error('Personalized learning path error:', error);
    res.status(500).json({ error: 'Failed to build personalized learning path' });
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
      const emptyInsights = buildInterviewAnalyticsInsights([]);
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
        recent_interviews: [],
        ...emptyInsights,
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

    const insights = buildInterviewAnalyticsInsights(interviews);

    res.json({
      stats,
      performance_by_type: performanceByType,
      recent_interviews: recentInterviews,
      score_distribution: getScoreDistribution(interviews),
      difficulty_breakdown: getDifficultyBreakdown(interviews),
      ...insights,
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

const clampPercent = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

const average = (values = []) => {
  const numbers = values.map((value) => Number(value)).filter((value) => Number.isFinite(value));
  if (numbers.length === 0) return 0;
  return Math.round(numbers.reduce((sum, value) => sum + value, 0) / numbers.length);
};

const normalizeDifficulty = (value) => {
  const text = String(value || '').toLowerCase();
  if (text.includes('beginner')) return 'beginner';
  if (text.includes('intermediate')) return 'intermediate';
  if (text.includes('advanced')) return 'advanced';
  if (text.includes('expert')) return 'advanced';
  return text || 'intermediate';
};

const parseWeeks = (duration = '') => {
  const matches = String(duration).match(/\d+(?:\.\d+)?/g);
  if (!matches || matches.length === 0) return 6;
  return average(matches.map((value) => Number(value)));
};

const estimatePathHours = (curriculum) => {
  const weeks = parseWeeks(curriculum?.duration);
  const moduleCount = curriculum?.modules?.length || 4;
  return Math.max(24, Math.round((weeks * 4) + (moduleCount * 2)));
};

const createSqlCurriculum = () => ({
  id: 'sql',
  title: 'SQL Mastery',
  description: 'Build practical SQL fluency with joins, aggregations, windows, and query optimization.',
  duration: '6-8 weeks',
  difficulty: 'Intermediate',
  color: '#06b6d4',
  icon: 'Database',
  modules: [
    {
      id: 'sql-fundamentals',
      slug: 'sql-fundamentals',
      title: 'SQL Fundamentals',
      description: 'SELECT, filtering, sorting, and grouping basics.',
      estimatedTime: '1 week',
      topics: ['SELECT basics', 'WHERE and ORDER BY', 'GROUP BY', 'HAVING', 'Set operations'],
    },
    {
      id: 'sql-joins',
      slug: 'sql-joins',
      title: 'Joins and Relationships',
      description: 'Join types, relationships, and normalized data modeling.',
      estimatedTime: '1-2 weeks',
      topics: ['INNER JOIN', 'LEFT and RIGHT JOIN', 'FULL OUTER JOIN', 'Self joins', 'Relationship modeling'],
    },
    {
      id: 'sql-analytics',
      slug: 'sql-analytics',
      title: 'Analytics Queries',
      description: 'Window functions, CTEs, and analytical SQL patterns.',
      estimatedTime: '1-2 weeks',
      topics: ['CTEs', 'Window functions', 'Ranking queries', 'Running totals', 'Percentiles'],
    },
    {
      id: 'sql-performance',
      slug: 'sql-performance',
      title: 'Query Optimization',
      description: 'Indexing, execution plans, transactions, and performance tuning.',
      estimatedTime: '1-2 weeks',
      topics: ['Indexes', 'EXPLAIN plans', 'Transactions', 'Isolation levels', 'Query tuning'],
    },
  ],
});

const toInterviewGroupScore = (interviews = [], keywords = [], fallbackFields = []) => {
  const normalizedKeywords = keywords.map((keyword) => String(keyword).toLowerCase());
  const matches = interviews.filter((interview) => {
    const label = String(interview.interview_type || '').toLowerCase();
    return normalizedKeywords.some((keyword) => label.includes(keyword));
  });

  if (matches.length > 0) {
    return average(matches.map((interview) => interview.overall_score || 0));
  }

  const fallbackScores = fallbackFields.flatMap((field) => interviews.map((interview) => interview[field] || 0));
  return average(fallbackScores);
};

const toIsoDateKey = (timestamp) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const calculateDateStreak = (timestamps = []) => {
  const uniqueDates = [...new Set(
    timestamps
      .filter(Boolean)
      .map((timestamp) => toIsoDateKey(timestamp))
      .filter(Boolean)
  )].sort().reverse();

  if (uniqueDates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = today.toISOString().slice(0, 10);
  const yesterdayKey = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (uniqueDates[0] !== todayKey && uniqueDates[0] !== yesterdayKey) {
    return 0;
  }

  let streak = 1;
  for (let index = 1; index < uniqueDates.length; index += 1) {
    const previous = new Date(uniqueDates[index - 1]);
    const current = new Date(uniqueDates[index]);
    const diffDays = Math.round((previous - current) / 86400000);
    if (diffDays === 1) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
};

const buildLearningProfile = (interviews = [], progressItems = [], submissions = []) => {
  const completedInterviews = interviews.filter((interview) => interview.completed_at);
  const acceptedSubmissions = submissions.filter((submission) => submission.status === 'accepted');

  const averageScore = average(completedInterviews.map((interview) => interview.overall_score || 0));
  const communicationScore = average(completedInterviews.map((interview) => interview.communication_score || interview.overall_score || 0));
  const technicalScore = average(completedInterviews.map((interview) => interview.technical_score || interview.overall_score || 0));
  const problemSolvingScore = average(completedInterviews.map((interview) => interview.problem_solving_score || interview.overall_score || 0));

  const interviewDates = [
    ...completedInterviews.map((interview) => interview.completed_at || interview.started_at),
    ...acceptedSubmissions.map((submission) => submission.submitted_at),
  ];

  const totalHoursLearned = Math.max(0, Math.round(
    (acceptedSubmissions.reduce((sum, submission) => sum + (Number(submission.execution_time) || 0), 0) / 3600)
      + (completedInterviews.reduce((sum, interview) => sum + (Number(interview.duration) || 0), 0) / 60)
  ));

  const totalModulesCompleted = progressItems.filter((item) => item.status === 'solved').length + acceptedSubmissions.length;
  const currentStreak = calculateDateStreak(interviewDates);

  const sqlScore = toInterviewGroupScore(completedInterviews, ['sql', 'database', 'query'], ['technical_score', 'problem_solving_score']);
  const aptitudeScore = toInterviewGroupScore(completedInterviews, ['aptitude', 'quant', 'reasoning', 'verbal'], ['overall_score']);
  const systemDesignScore = toInterviewGroupScore(completedInterviews, ['system', 'design', 'architecture'], ['technical_score', 'communication_score']);

  const dsaBase = Math.max(technicalScore, problemSolvingScore, averageScore);
  const dsaScore = clampPercent(dsaBase + Math.min(30, acceptedSubmissions.length * 3) + Math.min(10, totalModulesCompleted));

  return {
    averageScore,
    communicationScore,
    technicalScore,
    problemSolvingScore,
    sqlScore: clampPercent(sqlScore || (technicalScore * 0.75)),
    aptitudeScore: clampPercent(aptitudeScore || (averageScore * 0.8)),
    systemDesignScore: clampPercent(systemDesignScore || ((technicalScore + communicationScore) / 2)),
    dsaScore: clampPercent(dsaScore),
    totalModulesCompleted,
    totalHoursLearned,
    currentStreak,
  };
};

const buildModuleLessons = (module, moduleProgress) => {
  const topics = module.topics || [];
  const completedCount = Math.max(0, Math.min(topics.length, Math.round((moduleProgress / 100) * topics.length)));

  return topics.slice(0, 6).map((topic, index) => ({
    title: topic,
    description: `${topic} inside ${module.title}.`,
    duration: Math.max(15, 20 + (index * 5)),
    resource_type: index % 2 === 0 ? 'lesson' : 'practice',
    completed: index < completedCount,
  }));
};

const buildCurriculumPath = (curriculum, score, profileSummary, fallbackId) => {
  const modules = (curriculum.modules || []).slice(0, 4).map((module, index) => {
    const moduleProgress = clampPercent(score - (index * 12) + Math.min(12, profileSummary.currentStreak * 2));
    const topics = module.topics || [];

    return {
      id: `${curriculum.id || fallbackId}-${module.slug || module.id || index}`,
      title: module.title,
      lessons: topics.length || module.lessons?.length || 0,
      duration: Math.max(35, (topics.length * 15) + 20),
      progress: moduleProgress,
      completed: moduleProgress >= 80,
      in_progress: moduleProgress > 0 && moduleProgress < 80,
      lessons_list: buildModuleLessons(module, moduleProgress),
      recommendation: moduleProgress >= 80
        ? `Keep building speed with more practice inside ${module.title}.`
        : `Spend one focused session on ${topics[0] || module.title} before moving forward.`,
    };
  });

  return {
    id: curriculum.id || fallbackId,
    name: curriculum.title,
    icon: curriculum.icon || 'BookOpen',
    duration: curriculum.duration || '6-8 weeks',
    progress: clampPercent(score),
    total_hours: estimatePathHours(curriculum),
    difficulty: normalizeDifficulty(curriculum.difficulty),
    description: curriculum.description,
    modules,
  };
};

const buildQuickWinRecommendations = (weakestPath, profileSummary) => {
  const pathName = weakestPath?.name || 'your weakest track';
  const firstModule = weakestPath?.modules?.[0]?.title || 'the first module';
  const firstLesson = weakestPath?.modules?.[0]?.lessons_list?.[0]?.title || 'one focused topic';

  return [
    {
      title: `Start with ${firstModule}`,
      description: `Use a 45-minute block to finish ${firstLesson} and log a short summary of what you learned.`,
    },
    {
      title: `Run one timed review`,
      description: `Take one timed attempt from ${pathName} and compare your answer with the curriculum notes.`,
    },
    {
      title: `Revisit the latest weak interview area`,
      description: profileSummary.problemSolvingScore <= profileSummary.communicationScore
        ? 'Record one answer and tighten the structure, examples, and conclusion.'
        : 'Pick one pattern from your weakest path and solve it without hints.',
    },
  ];
};

const buildInterviewAnalyticsInsights = (interviews = []) => {
  const completedInterviews = interviews.filter((interview) => interview.completed_at);
  const averageScore = average(completedInterviews.map((interview) => interview.overall_score || 0));
  const improvementPercentage = completedInterviews.length > 1
    ? calculateImprovementTrend([...completedInterviews])
    : 0;

  const performanceTrend = [...completedInterviews]
    .slice(0, 8)
    .reverse()
    .map((interview, index) => ({
      date: toIsoDateKey(interview.completed_at || interview.started_at || Date.now()) || toIsoDateKey(Date.now()),
      score: interview.overall_score || 0,
      type: interview.interview_type || `Session ${index + 1}`,
    }));

  const performanceByType = getPerformanceByType(completedInterviews);
  const questionTypeScores = Object.entries(performanceByType).map(([type, info]) => ({
    type,
    score: info.avg_score || 0,
    count: info.count || 0,
  }));

  const difficultyCounts = getDifficultyBreakdown(completedInterviews);
  const difficultyDistribution = Object.entries(difficultyCounts).map(([name, info]) => ({
    name,
    value: info.count || 0,
  }));

  const categoryScores = [
    { name: 'Communication', score: average(completedInterviews.map((interview) => interview.communication_score || interview.overall_score || 0)) },
    { name: 'Technical', score: average(completedInterviews.map((interview) => interview.technical_score || interview.overall_score || 0)) },
    { name: 'Problem Solving', score: average(completedInterviews.map((interview) => interview.problem_solving_score || interview.overall_score || 0)) },
    { name: 'Confidence', score: average(completedInterviews.map((interview) => interview.communication_score || interview.overall_score || 0)) },
  ];

  const rankedCategories = [...categoryScores].sort((left, right) => right.score - left.score);
  const weakestCategories = [...categoryScores].sort((left, right) => left.score - right.score);

  const topStrengths = rankedCategories.slice(0, 3).filter((item) => item.score > 0);
  const areasToImprove = weakestCategories.slice(0, 3);

  const recommendations = areasToImprove.map((area) => ({
    title: `Improve ${area.name}`,
    description: area.score > 0
      ? `Your current ${area.name.toLowerCase()} average is ${area.score}/100. Focus one session on this area to lift the overall interview score.`
      : `Start tracking ${area.name.toLowerCase()} with one deliberate practice session and a short self-review.`,
    action_url: '/learning-path',
  }));

  return {
    average_score: averageScore,
    total_interviews: completedInterviews.length,
    improvement_percentage: improvementPercentage,
    current_streak: calculateDateStreak(completedInterviews.map((interview) => interview.completed_at || interview.started_at)),
    performance_trend: performanceTrend,
    question_type_scores: questionTypeScores,
    difficulty_distribution: difficultyDistribution,
    category_scores: categoryScores,
    top_strengths: topStrengths,
    areas_to_improve: areasToImprove,
    recommendations,
  };
};

export default router;
