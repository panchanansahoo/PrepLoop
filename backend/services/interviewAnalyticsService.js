import { supabaseAdmin } from '../db/supabaseClient.js';
import { createLogger } from '../utils/structuredLogger.js';

// Create a logger instance
const logger = createLogger('InterviewAnalyticsService');

/**
 * Enhanced Interview Analytics Service
 * Provides advanced analytics, trend analysis, and performance insights
 */
export class InterviewAnalyticsService {
  /**
   * Gets comprehensive analytics for a user's interview history
   */
  static async getAdvancedAnalytics(userId) {
    try {
      // Fetch interview sessions from the database
      const { data: interviews, error } = await supabaseAdmin
        .from('interview_sessions')
        .select(`
          id,
          interview_type,
          difficulty_level,
          company_focus,
          status,
          started_at,
          completed_at,
          interview_score,
          communication_clarity_score,
          problem_solving_score,
          technical_depth_score,
          performance_metrics,
          strengths,
          areas_for_improvement,
          transcript
        `)
        .eq('user_id', userId)
        .order('started_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch interview data for analytics', { error: error.message, userId });
        throw error;
      }

      if (!interviews || interviews.length === 0) {
        return this.getDefaultAnalytics();
      }

      // Calculate comprehensive analytics
      const analytics = {
        // Basic metrics
        totalInterviews: interviews.length,
        completedInterviews: interviews.filter(i => i.status === 'completed').length,
        byType: this.calculateByType(interviews),
        byDifficulty: this.calculateByDifficulty(interviews),
        byCompany: this.calculateByCompany(interviews),

        // Scores overview
        averageScores: this.calculateAverageScores(interviews),
        scoreDistribution: this.calculateScoreDistribution(interviews),

        // Performance trends
        performanceTrends: this.calculatePerformanceTrends(interviews),
        skillGaps: this.analyzeSkillGaps(interviews),
        improvementTracking: this.calculateImprovementTracking(interviews),

        // Comparative analysis
        percentileRanking: this.calculatePercentileRanking(interviews),
        
        // Recommendations
        personalizedRecommendations: this.generatePersonalizedRecommendations(interviews),
        
        // Retention and consistency metrics
        consistencyMetrics: this.calculateConsistencyMetrics(interviews)
      };

      return analytics;
    } catch (error) {
      logger.error('Error calculating advanced analytics', { error: error.message, userId });
      throw error;
    }
  }

  static getDefaultAnalytics() {
    return {
      totalInterviews: 0,
      completedInterviews: 0,
      byType: {},
      byDifficulty: {},
      byCompany: {},
      averageScores: {
        overall: 0,
        communication: 0,
        problemSolving: 0,
        technicalDepth: 0
      },
      scoreDistribution: { excellent: 0, good: 0, average: 0, belowAverage: 0, poor: 0 },
      performanceTrends: { trend: 'neutral', slope: 0, volatility: 'moderate' },
      skillGaps: [],
      improvementTracking: { percentage: 0, trend: 'neutral' },
      percentileRanking: 0,
      personalizedRecommendations: [],
      consistencyMetrics: { consistency: 0, streak: 0 }
    };
  }

  static calculateByType(interviews) {
    const byType = {};
    
    interviews.forEach(interview => {
      const type = interview.interview_type || 'unknown';
      if (!byType[type]) {
        byType[type] = { count: 0, totalScore: 0, avgScore: 0 };
      }
      byType[type].count++;
      byType[type].totalScore += interview.interview_score || 0;
    });
    
    Object.keys(byType).forEach(type => {
      byType[type].avgScore = Math.round(byType[type].totalScore / byType[type].count);
    });
    
    return byType;
  }

  static calculateByDifficulty(interviews) {
    const byDifficulty = {};
    
    interviews.forEach(interview => {
      const difficulty = interview.difficulty_level || 'unknown';
      if (!byDifficulty[difficulty]) {
        byDifficulty[difficulty] = { count: 0, totalScore: 0, avgScore: 0 };
      }
      byDifficulty[difficulty].count++;
      byDifficulty[difficulty].totalScore += interview.interview_score || 0;
    });
    
    Object.keys(byDifficulty).forEach(diff => {
      byDifficulty[diff].avgScore = Math.round(byDifficulty[diff].totalScore / byDifficulty[diff].count);
    });
    
    return byDifficulty;
  }

  static calculateByCompany(interviews) {
    const byCompany = {};
    
    interviews.forEach(interview => {
      const company = interview.company_focus || 'generic';
      if (!byCompany[company]) {
        byCompany[company] = { count: 0, totalScore: 0, avgScore: 0 };
      }
      byCompany[company].count++;
      byCompany[company].totalScore += interview.interview_score || 0;
    });
    
    Object.keys(byCompany).forEach(comp => {
      byCompany[comp].avgScore = Math.round(byCompany[comp].totalScore / byCompany[comp].count);
    });
    
    return byCompany;
  }

  static calculateAverageScores(interviews) {
    const totals = {
      overall: 0,
      communication: 0,
      problemSolving: 0,
      technicalDepth: 0
    };
    const counts = {
      overall: 0,
      communication: 0,
      problemSolving: 0,
      technicalDepth: 0
    };

    interviews.forEach(interview => {
      if (interview.interview_score !== null) {
        totals.overall += interview.interview_score;
        counts.overall++;
      }
      if (interview.communication_clarity_score !== null) {
        totals.communication += interview.communication_clarity_score;
        counts.communication++;
      }
      if (interview.problem_solving_score !== null) {
        totals.problemSolving += interview.problem_solving_score;
        counts.problemSolving++;
      }
      if (interview.technical_depth_score !== null) {
        totals.technicalDepth += interview.technical_depth_score;
        counts.technicalDepth++;
      }
    });

    return {
      overall: counts.overall ? Math.round(totals.overall / counts.overall) : 0,
      communication: counts.communication ? Math.round(totals.communication / counts.communication) : 0,
      problemSolving: counts.problemSolving ? Math.round(totals.problemSolving / counts.problemSolving) : 0,
      technicalDepth: counts.technicalDepth ? Math.round(totals.technicalDepth / counts.technicalDepth) : 0
    };
  }

  static calculateScoreDistribution(interviews) {
    const distribution = { 
      excellent: 0,  // 80-100
      good: 0,       // 70-79
      average: 0,    // 60-69
      belowAverage: 0, // 50-59
      poor: 0        // 0-49
    };

    interviews.forEach(interview => {
      const score = interview.interview_score;
      if (score >= 80) distribution.excellent++;
      else if (score >= 70) distribution.good++;
      else if (score >= 60) distribution.average++;
      else if (score >= 50) distribution.belowAverage++;
      else distribution.poor++;
    });

    return distribution;
  }

  static calculatePerformanceTrends(interviews) {
    if (interviews.length < 2) {
      return { trend: 'insufficient_data', slope: 0, volatility: 'insufficient_data' };
    }

    // Sort by date to get chronological order
    const sorted = [...interviews].sort((a, b) => 
      new Date(a.started_at) - new Date(b.started_at)
    );

    // Calculate trend using linear regression
    const scores = sorted.map(i => i.interview_score).filter(s => s !== null);
    if (scores.length < 2) {
      return { trend: 'insufficient_data', slope: 0, volatility: 'insufficient_data' };
    }

    // Calculate slope using least squares method
    const n = scores.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    scores.forEach((y, x) => {
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const trend = slope > 0.5 ? 'improving' : slope < -0.5 ? 'declining' : 'stable';

    // Calculate volatility (standard deviation)
    const mean = sumY / n;
    const variance = scores.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
    const volatility = Math.sqrt(variance);

    return {
      trend,
      slope: parseFloat(slope.toFixed(2)),
      volatility: volatility > 15 ? 'high' : volatility > 8 ? 'moderate' : 'low'
    };
  }

  static analyzeSkillGaps(interviews) {
    // Aggregate all areas for improvement
    const gapMap = new Map();
    
    interviews.forEach(interview => {
      if (Array.isArray(interview.areas_for_improvement)) {
        interview.areas_for_improvement.forEach(area => {
          gapMap.set(area, (gapMap.get(area) || 0) + 1);
        });
      }
    });

    // Convert to sorted array
    const gaps = Array.from(gapMap.entries())
      .map(([area, count]) => ({ area, frequency: count }))
      .sort((a, b) => b.frequency - a.frequency);

    return gaps.slice(0, 5); // Top 5 gaps
  }

  static calculateImprovementTracking(interviews) {
    if (interviews.length < 2) {
      return { percentage: 0, trend: 'insufficient_data' };
    }

    // Get first and last scores
    const sorted = [...interviews]
      .filter(i => i.interview_score !== null)
      .sort((a, b) => new Date(a.started_at) - new Date(b.started_at));

    if (sorted.length < 2) {
      return { percentage: 0, trend: 'insufficient_data' };
    }

    const firstScore = sorted[0].interview_score;
    const lastScore = sorted[sorted.length - 1].interview_score;
    const improvement = lastScore - firstScore;
    const percentage = firstScore ? Math.round((improvement / firstScore) * 100) : 0;

    return {
      percentage,
      trend: improvement > 5 ? 'improving' : improvement < -5 ? 'declining' : 'stable'
    };
  }

  static calculatePercentileRanking(interviews) {
    // For demo purposes - in a real implementation, this would compare against
    // a larger dataset of all users
    if (interviews.length === 0) return 0;

    // Using the latest completed interview score
    const latestCompleted = interviews.find(i => i.status === 'completed' && i.interview_score);
    if (!latestCompleted) return 0;

    // Placeholder calculation - in reality, this would require comparing against
    // a large dataset of all users' scores
    const score = latestCompleted.interview_score;
    // Assuming a normal distribution, convert score to approximate percentile
    // 70 is roughly 50th percentile, higher scores proportionally higher percentiles
    return Math.min(99, Math.max(1, Math.round(50 + (score - 70) * 0.8)));
  }

  static generatePersonalizedRecommendations(interviews) {
    const recommendations = [];
    const avgScores = this.calculateAverageScores(interviews);
    
    // Add recommendations based on weak areas
    if (avgScores.communication < 70) {
      recommendations.push({
        category: 'communication',
        priority: 'high',
        message: 'Focus on improving communication clarity. Practice explaining your thought process out loud.',
        actions: [
          'Record yourself explaining solutions',
          'Practice with the STAR method for behavioral questions',
          'Join mock interviews with peers'
        ]
      });
    }
    
    if (avgScores.problemSolving < 70) {
      recommendations.push({
        category: 'problemSolving',
        priority: 'high',
        message: 'Work on your problem-solving approach. Break down problems systematically.',
        actions: [
          'Practice identifying patterns in problems',
          'Spend more time understanding the problem before coding',
          'Trace through examples step by step'
        ]
      });
    }
    
    if (avgScores.technicalDepth < 70) {
      recommendations.push({
        category: 'technicalDepth',
        priority: 'high',
        message: 'Deepen your technical knowledge. Focus on understanding underlying concepts.',
        actions: [
          'Review fundamental CS concepts',
          'Study common algorithms and data structures',
          'Analyze time and space complexity regularly'
        ]
      });
    }
    
    // Add recommendations based on performance trends
    const trends = this.calculatePerformanceTrends(interviews);
    if (trends.trend === 'declining') {
      recommendations.push({
        category: 'performance_trend',
        priority: 'medium',
        message: 'Your performance has been declining recently. Consider taking a break or changing your study approach.',
        actions: [
          'Reduce interview frequency temporarily',
          'Focus on quality over quantity',
          'Review your preparation strategy'
        ]
      });
    } else if (trends.trend === 'improving') {
      recommendations.push({
        category: 'performance_trend',
        priority: 'low',
        message: 'Great job! Your performance is improving. Keep up the good work.',
        actions: [
          'Maintain your current approach',
          'Challenge yourself with harder problems',
          'Help others to reinforce your knowledge'
        ]
      });
    }
    
    // Add recommendations based on skill gaps
    const gaps = this.analyzeSkillGaps(interviews);
    if (gaps.length > 0) {
      recommendations.push({
        category: 'skill_gaps',
        priority: 'high',
        message: `You consistently struggle with ${gaps[0].area}. Address this area specifically.`,
        actions: [
          `Focus practice on ${gaps[0].area}`,
          `Study resources related to ${gaps[0].area}`,
          `Track improvement in ${gaps[0].area} specifically`
        ]
      });
    }
    
    return recommendations.slice(0, 5); // Top 5 recommendations
  }

  static calculateConsistencyMetrics(interviews) {
    if (interviews.length === 0) {
      return { consistency: 0, streak: 0 };
    }

    // Calculate consistency as the inverse of score volatility
    const scores = interviews
      .map(i => i.interview_score)
      .filter(score => score !== null);

    if (scores.length === 0) {
      return { consistency: 0, streak: 0 };
    }

    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    // Consistency is inversely related to standard deviation
    // Scale from 0-100 where 0 is highly inconsistent and 100 is perfectly consistent
    const consistency = Math.max(0, Math.min(100, Math.round(100 - (stdDev * 2))));

    // Calculate streak - number of consecutive days with interviews
    const dates = [...new Set(
      interviews
        .filter(i => i.status === 'completed')
        .map(i => new Date(i.completed_at).toDateString())
    )].sort();

    let streak = 0;
    if (dates.length > 0) {
      // Calculate current streak of consecutive days with interviews
      const today = new Date();
      const currentDate = new Date(today.toDateString()); // Just the date, no time
      let currentStreak = 0;

      for (let i = dates.length - 1; i >= 0; i--) {
        const interviewDate = new Date(dates[i]);
        if (
          currentDate.getDate() === interviewDate.getDate() &&
          currentDate.getMonth() === interviewDate.getMonth() &&
          currentDate.getFullYear() === interviewDate.getFullYear()
        ) {
          currentStreak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          // Check if it was yesterday, meaning we can continue the streak
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          if (
            yesterday.getDate() === interviewDate.getDate() &&
            yesterday.getMonth() === interviewDate.getMonth() &&
            yesterday.getFullYear() === interviewDate.getFullYear()
          ) {
            currentStreak++;
            currentDate.setDate(currentDate.getDate() - 2); // Skip yesterday
          } else {
            break;
          }
        }
      }
      streak = currentStreak;
    }

    return { consistency, streak };
  }
}