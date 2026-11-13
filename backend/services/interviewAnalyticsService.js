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
        logger.warn('Could not query interview data for user, using default analytics baseline', { error: error.message, userId });
        return this.getDefaultAnalytics();
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
        skillDeltas: this.calculateSkillDeltas(interviews),

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

  static calculateSkillDeltas(interviews = []) {
    const valid = [...interviews]
      .filter(i => i.status === 'completed' || i.interview_score !== null)
      .sort((a, b) => new Date(b.started_at || b.completed_at || 0) - new Date(a.started_at || a.completed_at || 0));

    if (valid.length < 2) {
      return {
        hasComparison: false,
        overallDelta: 0,
        skills: {
          communication: { current: null, previous: null, delta: 0, trend: 'neutral' },
          problemSolving: { current: null, previous: null, delta: 0, trend: 'neutral' },
          technicalDepth: { current: null, previous: null, delta: 0, trend: 'neutral' },
        },
      };
    }

    const latest = valid[0];
    const previous = valid[1];

    const calcDelta = (cur, prev) => {
      const c = Number(cur);
      const p = Number(prev);
      if (!Number.isFinite(c) || !Number.isFinite(p)) {
        return { current: Number.isFinite(c) ? c : null, previous: Number.isFinite(p) ? p : null, delta: 0, trend: 'neutral' };
      }
      const delta = Math.round(c - p);
      const trend = delta > 3 ? 'improving' : delta < -3 ? 'declining' : 'stable';
      return { current: c, previous: p, delta, trend };
    };

    const overallDelta = Math.round((Number(latest.interview_score) || 0) - (Number(previous.interview_score) || 0));

    return {
      hasComparison: true,
      overallDelta,
      overallTrend: overallDelta > 3 ? 'improving' : overallDelta < -3 ? 'declining' : 'stable',
      latestSessionId: latest.id,
      previousSessionId: previous.id,
      skills: {
        communication: calcDelta(latest.communication_clarity_score, previous.communication_clarity_score),
        problemSolving: calcDelta(latest.problem_solving_score, previous.problem_solving_score),
        technicalDepth: calcDelta(latest.technical_depth_score, previous.technical_depth_score),
      },
    };
  }

  static calculatePercentileRanking(interviews) {
    if (!Array.isArray(interviews) || interviews.length === 0) return 0;

    // Using the latest completed interview score
    const latestCompleted = interviews.find(i => i.status === 'completed' && Number.isFinite(Number(i.interview_score)));
    if (!latestCompleted) return 0;

    const score = Number(latestCompleted.interview_score);
    const type = String(latestCompleted.interview_type || 'dsa').toLowerCase();

    // Type-calibrated cohort parameters (mean and stdDev)
    const cohortDistributions = {
      dsa: { mean: 66, std: 14 },
      system_design: { mean: 68, std: 13 },
      'system-design': { mean: 68, std: 13 },
      behavioral: { mean: 72, std: 12 },
      hr: { mean: 74, std: 11 },
    };

    const { mean, std } = cohortDistributions[type] || { mean: 70, std: 13 };
    const z = (score - mean) / (std * Math.SQRT2);

    // Standard Horner's approximation for erf(z)
    const t = 1.0 / (1.0 + 0.3275911 * Math.abs(z));
    const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
    const erf = Math.sign(z) * (1.0 - poly * Math.exp(-z * z));
    const cdf = 0.5 * (1.0 + erf);

    return Math.min(99, Math.max(1, Math.round(cdf * 100)));
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
        .filter(i => i.status === 'completed' && i.completed_at)
        .map(i => {
          const d = new Date(i.completed_at);
          return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
        })
        .filter(Boolean)
    )].sort();

    let streak = 0;
    if (dates.length > 0) {
      // Calculate current streak of consecutive days with interviews
      const today = new Date();
      const currentDate = new Date(today.toDateString()); // Just the date, no time
      let currentStreak = 0;

      for (let i = dates.length - 1; i >= 0; i--) {
        const interviewDate = new Date(`${dates[i]}T00:00:00`);
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

  /**
   * Generates a tailored 4-week preparation roadmap based on user's interview history
   */
  static async generatePersonalizedRoadmap(userId, options = {}) {
    try {
      const analytics = await this.getAdvancedAnalytics(userId);
      const targetRole = options.targetRole || 'Software Engineer';
      const targetCompany = options.targetCompany || 'Top Tech';

      const avgScores = analytics.averageScores || { overall: 70, communication: 70, problemSolving: 70, technicalDepth: 70 };
      const gaps = analytics.skillGaps || [];
      const primaryGap = gaps.length > 0 ? gaps[0].area : 'System decomposition & edge cases';
      const secondaryGap = gaps.length > 1 ? gaps[1].area : 'Time/Space complexity communication';

      // Identify priority track based on lowest dimension
      let focusTrack = 'Algorithmic Problem Solving';
      if (avgScores.communication <= avgScores.problemSolving && avgScores.communication <= avgScores.technicalDepth) {
        focusTrack = 'Technical Communication & Thought Articulation';
      } else if (avgScores.technicalDepth <= avgScores.problemSolving) {
        focusTrack = 'Architecture & Deep System Knowledge';
      }

      const roadmap = {
        userId,
        targetRole,
        targetCompany,
        focusTrack,
        overallReadinessScore: analytics.averageScores?.overall || 65,
        readinessScore: analytics.averageScores?.overall || 65,
        domainScores: {
          dsa: avgScores.problemSolving || 70,
          systemDesign: avgScores.technicalDepth || 70,
          behavioral: avgScores.communication || 70,
          domainKnowledge: 70,
        },
        diagnostics: {
          communication: avgScores.communication,
          problemSolving: avgScores.problemSolving,
          technicalDepth: avgScores.technicalDepth,
          primaryGaps: [primaryGap, secondaryGap],
          trend: analytics.performanceTrends?.trend || 'improving',
        },
        weeks: [
          {
            weekNumber: 1,
            title: 'Diagnostic Gaps & Core Decomposition',
            objective: `Address ${primaryGap} and solidify core problem breakdown habits.`,
            description: `Address ${primaryGap} and solidify core problem breakdown habits.`,
            estimatedHours: 6,
            milestones: [
              { id: 'm1_1', title: 'Complete 3 Two-Pointer / Sliding Window problems', completed: false, type: 'dsa' },
              { id: 'm1_2', title: 'Practice out-loud verbalization of time/space complexity', completed: false, type: 'practice' },
              { id: 'm1_3', title: 'Take 1 Diagnostic AI Mock Interview', completed: false, type: 'interview' }
            ]
          },
          {
            weekNumber: 2,
            title: 'Intermediate Patterns & Edge-Case Fortification',
            objective: `Master ${secondaryGap} with focus on tree traversal and dynamic programming.`,
            description: `Master ${secondaryGap} with focus on tree traversal and dynamic programming.`,
            estimatedHours: 8,
            milestones: [
              { id: 'm2_1', title: 'Solve 4 Tree & Graph (BFS/DFS) practice problems', completed: false, type: 'dsa' },
              { id: 'm2_2', title: 'Conduct 1 Peer Mock Interview on PrepLoop', completed: false, type: 'peer' },
              { id: 'm2_3', title: 'Document test cases before writing code in playground', completed: false, type: 'habit' }
            ]
          },
          {
            weekNumber: 3,
            title: `${targetCompany} Domain Focus & System Scaling`,
            objective: `Align technical depth with typical ${targetCompany} ${targetRole} expectations.`,
            description: `Align technical depth with typical ${targetCompany} ${targetRole} expectations.`,
            estimatedHours: 7,
            milestones: [
              { id: 'm3_1', title: `Complete company-specific questions for ${targetCompany}`, completed: false, type: 'company' },
              { id: 'm3_2', title: 'Design high-throughput rate limiter or URL shortener', completed: false, type: 'system-design' },
              { id: 'm3_3', title: 'Practice STAR behavioral responses for leadership principles', completed: false, type: 'behavioral' }
            ]
          },
          {
            weekNumber: 4,
            title: 'High-Pressure Simulation & Final Polish',
            objective: 'Simulate full timed interview loops with comprehensive rubric scoring.',
            description: 'Simulate full timed interview loops with comprehensive rubric scoring.',
            estimatedHours: 8,
            milestones: [
              { id: 'm4_1', title: 'Complete full multi-round simulation (DSA + Behavioral)', completed: false, type: 'simulation' },
              { id: 'm4_2', title: 'Achieve >80% rubric score across communication and decomposition', completed: false, type: 'score' },
              { id: 'm4_3', title: 'Export AI Study Notes & review weakness telemetry', completed: false, type: 'notes' }
            ]
          }
        ],
        createdAt: new Date().toISOString()
      };

      return roadmap;
    } catch (err) {
      logger.error('Failed to generate personalized roadmap', { error: err.message, userId });
      throw err;
    }
  }
}