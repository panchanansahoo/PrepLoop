import { supabase } from '../db/supabaseClient.js';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('adaptive-interview');

class AdaptiveInterviewService {
  async calculateDifficultyAdjustment(userId, interviewHistory) {
    if (!interviewHistory || interviewHistory.length === 0) {
      return 'beginner'; // Start with beginner level
    }

    // Calculate performance metrics
    const recentSessions = interviewHistory.slice(-5); // Last 5 sessions
    const avgScore = recentSessions.reduce((sum, session) => sum + (session.score || 0), 0) / recentSessions.length;
    const successRate = recentSessions.filter(session => session.passed).length / recentSessions.length;
    
    // Determine difficulty based on performance
    if (avgScore >= 80 && successRate >= 0.7) {
      return 'increase'; // Increase difficulty
    } else if (avgScore <= 50 && successRate <= 0.4) {
      return 'decrease'; // Decrease difficulty
    }
    return 'maintain'; // Keep current difficulty
  }

  async getAdaptiveQuestions(userId, topic, currentDifficulty) {
    try {
      // Get user's historical performance
      const { data: performanceData } = await supabase
        .from('interview_performance')
        .select('topic, difficulty, score, completed_at')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(10);

      // Adjust difficulty based on performance
      const adjustment = await this.calculateDifficultyAdjustment(userId, performanceData || []);
      let adjustedDifficulty = currentDifficulty;

      if (adjustment === 'increase') {
        adjustedDifficulty = this.increaseDifficulty(currentDifficulty);
      } else if (adjustment === 'decrease') {
        adjustedDifficulty = this.decreaseDifficulty(currentDifficulty);
      }

      // Fetch questions matching the adjusted difficulty
      const { data: questions, error } = await supabase
        .from('questions')
        .select('*')
        .eq('topic', topic)
        .eq('difficulty', adjustedDifficulty)
        .limit(5)
        .order('random()', { ascending: true });  // Random ordering

      if (error) {
        logger.error('Error fetching adaptive questions:', error);
        return [];
      }

      return questions;
    } catch (error) {
      logger.error('Error in adaptive question selection:', error);
      return [];
    }
  }

  increaseDifficulty(currentDifficulty) {
    const levels = ['beginner', 'easy', 'medium', 'hard', 'expert'];
    const currentIndex = levels.indexOf(currentDifficulty);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : currentDifficulty;
  }

  decreaseDifficulty(currentDifficulty) {
    const levels = ['beginner', 'easy', 'medium', 'hard', 'expert'];
    const currentIndex = levels.indexOf(currentDifficulty);  // Fixed: was 'currentDirection'
    return currentIndex > 0 ? levels[currentIndex - 1] : currentDifficulty;
  }

  async updatePerformanceTracking(userId, interviewId, performanceMetrics) {
    try {
      const { error } = await supabase
        .from('interview_performance')
        .insert([{
          user_id: userId,
          interview_id: interviewId,
          score: performanceMetrics.score,
          topics_covered: performanceMetrics.topicsCovered,
          time_taken: performanceMetrics.timeTaken,
          passed: performanceMetrics.score >= 70, // Threshold for passing
          feedback: performanceMetrics.feedback
        }]);

      if (error) {
        logger.error('Error updating performance tracking:', error);
      }
    } catch (error) {
      logger.error('Error in performance tracking update:', error);
    }
  }
}

export default new AdaptiveInterviewService();