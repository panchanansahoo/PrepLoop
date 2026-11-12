import express from 'express';
import { supabaseAdmin } from '../../db/supabaseClient.js';
import { authenticateToken } from '../../middleware/auth.ts';
import { buildInterviewAnalytics } from './helpers.js';

const router = express.Router();

export async function getInterviewAnalytics(req, res) {
  try {
    const { data: interviews, error } = await supabaseAdmin
      .from('mock_interviews')
      .select('overall_score, communication_score, technical_score, problem_solving_score, interview_type, difficulty, completed_at')
      .eq('user_id', req.user.id)
      .order('completed_at', { ascending: false });

    if (error) throw error;

    res.json(buildInterviewAnalytics(interviews || []));
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics',
      ...(process.env.NODE_ENV === 'development' ? { message: error.message } : {})
    });
  }
}

export async function getInterviewRecommendations(req, res) {
  try {
    const { data: interviews, error } = await supabaseAdmin
      .from('mock_interviews')
      .select('communication_score, technical_score, problem_solving_score, interview_type, difficulty')
      .eq('user_id', req.user.id)
      .order('completed_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    const recommendations = [];

    if (!interviews || interviews.length === 0) {
      return res.json({
        recommendations: [
          { type: 'general', message: 'Complete your first mock interview to get personalized recommendations!' },
          { type: 'system-design', message: 'Try a System Design interview to practice architectural thinking.' },
          { type: 'behavioral', message: 'Practice Behavioral interviews to master the STAR method.' }
        ]
      });
    }

    const avgComm = interviews.reduce((sum, interview) => sum + (interview.communication_score || 0), 0) / interviews.length;
    const avgTech = interviews.reduce((sum, interview) => sum + (interview.technical_score || 0), 0) / interviews.length;
    const avgProblem = interviews.reduce((sum, interview) => sum + (interview.problem_solving_score || 0), 0) / interviews.length;

    const typeCount = {};
    interviews.forEach((interview) => {
      typeCount[interview.interview_type] = (typeCount[interview.interview_type] || 0) + 1;
    });

    const types = ['technical', 'behavioral', 'system-design', 'coding'];
    const leastPracticed = types.sort((a, b) => (typeCount[a] || 0) - (typeCount[b] || 0))[0];

    if (avgComm < 65) {
      recommendations.push({
        type: 'communication',
        priority: 'high',
        message: 'Focus on improving communication clarity. Practice speaking slowly and structuring your thoughts better.',
        tips: ['Use the STAR method for behavioral questions', 'Explain your thought process out loud', 'Practice with a friend for feedback']
      });
    }

    if (avgTech < 65) {
      recommendations.push({
        type: 'technical',
        priority: 'high',
        message: 'Your technical scores need improvement. Review fundamentals and practice more coding problems.',
        tips: ['Solve 5-10 LeetCode problems daily', 'Review system design patterns', 'Learn about trade-offs and scaling']
      });
    }

    if (avgProblem < 65) {
      recommendations.push({
        type: 'problem-solving',
        priority: 'high',
        message: 'Improve your problem-solving approach. Think through problems step by step.',
        tips: ['Clarify requirements before solving', 'Consider edge cases', 'Discuss your approach before coding']
      });
    }

    recommendations.push({
      type: 'practice',
      priority: 'medium',
      message: `Practice more ${leastPracticed} interviews. You've focused mainly on other types.`,
      suggestedType: leastPracticed
    });

    const easyCount = interviews.filter((interview) => interview.difficulty === 'easy').length;
    const hardCount = interviews.filter((interview) => interview.difficulty === 'hard').length;

    if (hardCount === 0 && easyCount > 3) {
      recommendations.push({
        type: 'difficulty',
        priority: 'medium',
        message: 'Time to level up! Try medium or hard difficulty interviews to challenge yourself.',
        suggestion: 'Move to medium difficulty'
      });
    }

    res.json({ recommendations });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({
      error: 'Failed to fetch recommendations',
      ...(process.env.NODE_ENV === 'development' ? { message: error.message } : {})
    });
  }
}

router.get('/analytics/overview', authenticateToken, getInterviewAnalytics);
router.get('/recommendations', authenticateToken, getInterviewRecommendations);

export default router;

