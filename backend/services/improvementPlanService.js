import Groq from 'groq-sdk';
import { randomUUID, createHash } from 'crypto';
import { supabaseAdmin } from '../db/index.js';
import { createLogger } from '../utils/structuredLogger.js';
import { aiCallWithRetry } from '../utils/aiClient.js';
import { getRedisClient } from '../config/redis.js';
import { 
  DIFFICULTY_LEVELS, 
  ACHIEVEMENTS, 
  calculateDifficulty, 
  adjustDayDifficulty, 
  calculateTaskPoints,
  getPotentialAchievements,
  calculateStreak
} from './improvementPlanEnhancements.js';

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const logger = createLogger('ImprovementPlanService');
const redis = getRedisClient();

const SKILL_AREAS = [
  'communication',
  'problem_solving',
  'technical_depth',
  'complexity_analysis',
  'edge_case_handling',
  'system_design',
  'behavioral_storytelling',
  'code_quality',
  'debugging',
  'confidence'
];

export class ImprovementPlanService {
  static async generatePlan(userId, options = {}) {
    const { sessionIds, focusAreas, timeframe = 7 } = options;

    try {
      logger.info('Generating improvement plan', { userId, sessionIds, focusAreas, timeframe });

      // Create cache key with checksum to avoid extremely long keys
      const cacheKey = `improvement_plan:${userId}:${this._generateCacheKeyHash({sessionIds, focusAreas, timeframe})}`;
      
      // Try to get from cache first
      if (redis) {
        try {
          const cachedPlan = await redis.get(cacheKey);
          if (cachedPlan) {
            logger.info('Returning cached improvement plan', { userId });
            return JSON.parse(cachedPlan);
          }
        } catch (cacheErr) {
          logger.warn('Cache retrieval failed, continuing with generation', { error: cacheErr.message });
        }
      }

      // Fetch interview sessions
      const sessions = await this._fetchInterviewSessions(userId, sessionIds);
      
      if (!sessions || sessions.length === 0) {
        throw new Error('No interview sessions found for analysis');
      }

      // Analyze weaknesses
      const analysis = this._analyzeWeaknesses(sessions, focusAreas);

      // Generate improvement plan
      const plan = await this._buildImprovementPlan(analysis, timeframe);

      // Save to database
      const savedPlan = await this._savePlan(userId, plan, sessions.map(s => s.id));

      // Cache the result if Redis is available
      if (redis) {
        try {
          await redis.setex(cacheKey, 60 * 60, JSON.stringify(savedPlan)); // Cache for 1 hour
        } catch (cacheErr) {
          logger.warn('Cache storage failed, plan still generated successfully', { error: cacheErr.message });
        }
      }

      logger.info('Improvement plan generated', { userId, planId: savedPlan.id });

      return savedPlan;
    } catch (error) {
      logger.error('Plan generation failed', { userId, error: error.message, stack: error.stack });
      throw error;
    }
  }

  // Helper to generate shorter cache key
  static _generateCacheKeyHash(params) {
    // Create a short hash of the params to avoid long keys
    const str = JSON.stringify(params);
    return createHash('md5').update(str).digest('hex').substring(0, 16);
  }

  static async _fetchInterviewSessions(userId, sessionIds = null) {
    let query = supabaseAdmin
      .from('interview_sessions')
      .select('id, user_id, performance_metrics, interview_score, overall_score, completed_at, status')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    if (sessionIds && sessionIds.length > 0) {
      query = query.in('id', sessionIds);
    } else {
      query = query.limit(10);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('_fetchInterviewSessions failed', { userId, error: error.message });
      throw error;
    }
    
    return data || [];
  }

  static _analyzeWeaknesses(sessions, focusAreas = null) {
    const weaknessScores = {};
    SKILL_AREAS.forEach(area => {
      weaknessScores[area] = [];
    });

    sessions.forEach(session => {
      const metrics = session.performance_metrics || {};
      
      // Map metrics to skill areas
      if (metrics.communication !== undefined) {
        weaknessScores.communication.push(metrics.communication);
      }
      if (metrics.problemDecomposition !== undefined) {
        weaknessScores.problem_solving.push(metrics.problemDecomposition);
      }
      if (metrics.efficiency !== undefined) {
        weaknessScores.technical_depth.push(metrics.efficiency);
      }
      if (metrics.clarity !== undefined) {
        weaknessScores.communication.push(metrics.clarity);
      }

      // Overall scores
      const overallScore = session.interview_score || session.overall_score || 0;
      if (overallScore > 0) {
        weaknessScores.communication.push(Math.max(0, overallScore - 5));
        weaknessScores.problem_solving.push(Math.max(0, overallScore - 3));
        weaknessScores.confidence.push(Math.max(0, overallScore - 8));
      }
    });

    // Calculate weakness intensity
    const weaknesses = Object.entries(weaknessScores)
      .map(([area, scores]) => {
        if (scores.length === 0) return null;
        
        const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        const weakness = 100 - avg;
        
        return {
          area,
          averageScore: Math.round(avg),
          weaknessLevel: Math.round(weakness),
          intensity: weakness >= 40 ? 'high' : weakness >= 25 ? 'medium' : 'low',
          sampleSize: scores.length
        };
      })
      .filter(w => w !== null)
      .sort((a, b) => b.weaknessLevel - a.weaknessLevel);

    // Filter by focus areas if specified
    const filteredWeaknesses = focusAreas && focusAreas.length > 0
      ? weaknesses.filter(w => focusAreas.includes(w.area))
      : weaknesses;

    return {
      weaknesses: filteredWeaknesses,
      topWeaknesses: filteredWeaknesses.slice(0, 3),
      sessionsAnalyzed: sessions.length,
      overallTrend: this._calculateTrend(sessions)
    };
  }

  static _calculateTrend(sessions) {
    if (sessions.length < 2) return 'insufficient_data';

    const scores = sessions
      .map(s => s.interview_score || s.overall_score || 0)
      .filter(s => s > 0);

    if (scores.length < 2) return 'insufficient_data';

    const recent = scores.slice(0, Math.ceil(scores.length / 2));
    const older = scores.slice(Math.ceil(scores.length / 2));

    const recentAvg = recent.reduce((sum, s) => sum + s, 0) / recent.length;
    const olderAvg = older.reduce((sum, s) => sum + s, 0) / older.length;

    const diff = recentAvg - olderAvg;

    if (diff > 5) return 'improving';
    if (diff < -5) return 'declining';
    return 'stable';
  }

  static async _buildImprovementPlan(analysis, timeframe) {
    const { topWeaknesses, overallTrend } = analysis;

    // Build daily tasks with adaptive difficulty
    const dailyPlan = this._generateDailyTasks(topWeaknesses, timeframe);

    // Generate AI recommendations if available
    let aiRecommendations = null;
    if (groq) {
      try {
        aiRecommendations = await this._generateAIRecommendations(analysis);
      } catch (error) {
        logger.warn('AI recommendations failed, using fallback', { error: error.message });
      }
    }

    return {
      summary: this._generateSummary(topWeaknesses, overallTrend),
      topWeaknesses,
      dailyPlan,
      recommendations: aiRecommendations || this._generateFallbackRecommendations(topWeaknesses),
      resources: this._generateResources(topWeaknesses),
      milestones: this._generateMilestones(topWeaknesses, timeframe),
      timeframe,
      overallTrend,
      // Add adaptive difficulty and gamification metadata
      difficulty: 'intermediate', // Default, will be adjusted per day based on user progress
      achievements: getPotentialAchievements(timeframe)
    };
  }

  static _generateDailyTasks(weaknesses, days) {
    const tasks = [];
    
    for (let day = 1; day <= days; day++) {
      const weakness = weaknesses[(day - 1) % weaknesses.length];
      
      tasks.push({
        day,
        focusArea: weakness.area,
        intensity: weakness.intensity,
        tasks: this._getTasksForArea(weakness.area, weakness.intensity),
        estimatedTime: weakness.intensity === 'high' ? 60 : weakness.intensity === 'medium' ? 45 : 30,
        goal: this._getGoalForArea(weakness.area)
      });
    }

    return tasks;
  }

  static _getTasksForArea(area, intensity) {
    const taskMap = {
      communication: [
        'Record yourself explaining a solution and review for clarity',
        'Practice the STAR method with 2 behavioral examples',
        'Do a mock interview focusing on verbal communication'
      ],
      problem_solving: [
        'Solve 2 medium problems and explain your approach out loud',
        'Practice breaking down complex problems into smaller steps',
        'Review and optimize a previous solution'
      ],
      technical_depth: [
        'Deep dive into one data structure with implementation',
        'Study time/space complexity for 5 common algorithms',
        'Implement a solution with multiple optimization approaches'
      ],
      complexity_analysis: [
        'Analyze complexity of 5 different algorithms',
        'Practice explaining Big O notation in simple terms',
        'Compare time/space tradeoffs for different approaches'
      ],
      edge_case_handling: [
        'List 10 edge cases for a problem before solving',
        'Review failed test cases from previous attempts',
        'Practice defensive programming techniques'
      ],
      system_design: [
        'Design a scalable system with clear tradeoffs',
        'Study one distributed system pattern in depth',
        'Practice capacity estimation and back-of-envelope calculations'
      ],
      behavioral_storytelling: [
        'Write 3 STAR stories with measurable outcomes',
        'Practice delivering stories in under 2 minutes',
        'Get feedback on story structure and impact'
      ],
      code_quality: [
        'Refactor old code for readability',
        'Review code review best practices',
        'Practice writing self-documenting code'
      ],
      debugging: [
        'Debug 3 intentionally broken code snippets',
        'Practice systematic debugging methodology',
        'Learn one new debugging tool or technique'
      ],
      confidence: [
        'Practice positive self-talk before mock interviews',
        'Record yourself and note confident vs hesitant language',
        'Do timed practice to build comfort with pressure'
      ]
    };

    const tasks = taskMap[area] || ['Practice this skill area'];
    return intensity === 'high' ? tasks : tasks.slice(0, 2);
  }

  static _getGoalForArea(area) {
    const goals = {
      communication: 'Explain solutions clearly and concisely',
      problem_solving: 'Break down problems systematically',
      technical_depth: 'Demonstrate strong fundamentals',
      complexity_analysis: 'Analyze and explain complexity confidently',
      complexity_analysis: 'Analyze and explain complexity confidently',
      edge_case_handling: 'Identify edge cases proactively',
      system_design: 'Design scalable systems with clear tradeoffs',
      behavioral_storytelling: 'Tell compelling stories with impact',
      code_quality: 'Write clean, maintainable code',
      debugging: 'Debug efficiently and systematically',
      confidence: 'Communicate with authority and clarity'
    };

    return goals[area] || 'Improve this skill';
  }

  static async _generateAIRecommendations(analysis) {
    const prompt = `You are an expert interview coach. Based on this analysis, provide specific, actionable recommendations.

Analysis:
${JSON.stringify(analysis, null, 2)}

Provide recommendations in JSON format with keys:
- immediate_actions: Array of 3 specific actions to take this week
- practice_focus: Array of 2-3 specific topics to practice
- mindset_tips: Array of 2 mental strategies
- resources: Array of 2-3 specific resources (books, courses, websites)`;

    const completion = await aiCallWithRetry({
      operation: () => groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are an expert technical interview coach. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1024
      }),
      timeoutMs: 15000,
      maxRetries: 2
    });

    const content = completion.choices?.[0]?.message?.content || '{}';
    return JSON.parse(content);
  }

  static _generateFallbackRecommendations(weaknesses) {
    const top = weaknesses[0];
    
    return {
      immediate_actions: [
        `Focus on ${top.area.replace(/_/g, ' ')} in your next 3 practice sessions`,
        'Record yourself and identify specific improvement areas',
        'Get feedback from peers or mentors on your weak areas'
      ],
      practice_focus: [
        `${top.area.replace(/_/g, ' ')} fundamentals`,
        'Mock interviews with focus on identified weaknesses'
      ],
      mindset_tips: [
        'Progress over perfection - small improvements compound',
        'Treat each practice session as a learning opportunity'
      ],
      resources: [
        'LeetCode for problem-solving practice',
        'Pramp for mock interviews',
        'System Design Primer for architecture skills'
      ]
    };
  }

  static _generateResources(weaknesses) {
    const resourceMap = {
      communication: [
        { type: 'article', title: 'How to Explain Technical Concepts', url: '#' },
        { type: 'video', title: 'Communication Skills for Engineers', url: '#' }
      ],
      problem_solving: [
        { type: 'course', title: 'Problem Solving Patterns', url: '#' },
        { type: 'book', title: 'Cracking the Coding Interview', url: '#' }
      ],
      technical_depth: [
        { type: 'course', title: 'Data Structures Deep Dive', url: '#' },
        { type: 'practice', title: 'LeetCode Patterns', url: '#' }
      ],
      system_design: [
        { type: 'book', title: 'Designing Data-Intensive Applications', url: '#' },
        { type: 'course', title: 'System Design Interview Course', url: '#' }
      ]
    };

    const resources = [];
    weaknesses.slice(0, 3).forEach(w => {
      if (resourceMap[w.area]) {
        resources.push(...resourceMap[w.area]);
      }
    });

    return resources;
  }

  static _generateMilestones(weaknesses, timeframe) {
    const milestones = [];
    const checkpoints = [
      Math.floor(timeframe * 0.33),
      Math.floor(timeframe * 0.66),
      timeframe
    ];

    checkpoints.forEach((day, index) => {
      const weakness = weaknesses[index % weaknesses.length];
      milestones.push({
        day,
        title: `${weakness.area.replace(/_/g, ' ')} checkpoint`,
        description: `Assess improvement in ${weakness.area.replace(/_/g, ' ')}`,
        criteria: [
          'Complete assigned practice tasks',
          'Show measurable improvement in mock interviews',
          'Demonstrate confidence in this area'
        ]
      });
    });

    return milestones;
  }

  static _generateSummary(weaknesses, trend) {
    const top = weaknesses[0];
    const trendText = {
      improving: 'Your performance is improving! Keep up the momentum.',
      declining: 'Your scores show room for improvement. This plan will help.',
      stable: 'Your performance is consistent. Let\'s push to the next level.',
      insufficient_data: 'Complete more interviews to track your progress.'
    };

    return `Based on your recent interviews, your primary focus area is ${top.area.replace(/_/g, ' ')} (weakness level: ${top.weaknessLevel}%). ${trendText[trend]} This personalized plan targets your top 3 weakness areas with daily practice tasks.`;
  }

  static async _savePlan(userId, plan, sessionIds) {
    const { data, error } = await supabaseAdmin
      .from('improvement_plans')
      .insert({
        id: randomUUID(),
        user_id: userId,
        plan_data: plan,
        session_ids: sessionIds,
        status: 'active',
        progress: {
          completedTasks: [],
          lastUpdated: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (error) {
      logger.error('_savePlan failed', { userId, error: error.message });
      throw error;
    }
    return data;
  }
  
  /**
   * Get user's latest improvement plan with additional analytics
   */
  static async getLatestPlan(userId) {
    const { data: plan, error } = await supabaseAdmin
      .from('improvement_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return plan || null;
  }
  
  /**
   * Update progress on an improvement plan with enhanced validation
   */
  static async updatePlanProgress(planId, userId, progressUpdates) {
    const { completedTasks, notes } = progressUpdates;
    
    const { data: plan, error: fetchError } = await supabaseAdmin
      .from('improvement_plans')
      .select('*')
      .eq('id', planId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !plan) {
      throw new Error('Plan not found or unauthorized');
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('improvement_plans')
      .update({
        progress: {
          ...(plan.progress || {}),
          completedTasks: completedTasks || [],
          lastUpdated: new Date().toISOString(),
          notes: notes || ''
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', planId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Invalidate cache if Redis is available
    if (redis) {
      try {
        const cacheKey = `improvement_plan:${userId}:${this._generateCacheKeyHash({planId})}`;
        await redis.del(cacheKey);
      } catch (cacheErr) {
        logger.warn('Cache invalidation failed', { error: cacheErr.message });
      }
    }

    return updated;
  }
  
  /**
   * Get improvement plan by ID
   */
  static async getPlanById(planId, userId) {
    const { data: plan, error } = await supabaseAdmin
      .from('improvement_plans')
      .select('*')
      .eq('id', planId)
      .eq('user_id', userId)
      .single();

    if (error) {
      logger.error('Failed to fetch plan by ID', { planId, userId, error: error.message });
      throw error;
    }

    return plan;
  }
  
  /**
   * Mark plan as completed
   */
  static async markPlanCompleted(planId, userId) {
    const { data, error } = await supabaseAdmin
      .from('improvement_plans')
      .update({ 
        status: 'completed', 
        completed_at: new Date().toISOString() 
      })
      .eq('id', planId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to mark plan as completed', { planId, userId, error: error.message });
      throw error;
    }

    return data;
  }
}

export default ImprovementPlanService;