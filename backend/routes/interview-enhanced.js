import express from 'express';
import crypto from 'crypto';
import Groq from 'groq-sdk';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { authenticateToken } from '../middleware/auth.js';
import { aiCallWithRetry } from '../utils/aiClient.js';
import dsaLearningPath from '../data/dsaLearningPath.js';
import { aptitudeLearningPath } from '../data/aptitudeLearningPath.js';
import lldLearningPath from '../data/lldLearningPath.js';
import { InterviewAnalyticsService } from '../services/interviewAnalyticsService.js'; // New analytics service

const router = express.Router();
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// ==================== ENHANCED ANALYTICS ====================
/**
 * Get advanced analytics for user's interview performance
 */
router.get('/analytics/advanced', authenticateToken, async (req, res) => {
  try {
    const analytics = await InterviewAnalyticsService.getAdvancedAnalytics(req.user.id);
    
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching advanced analytics:', error);
    res.status(500).json({ error: 'Failed to fetch advanced analytics' });
  }
});

// ==================== ENHANCED REAL-TIME FEEDBACK ====================
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
            - category: the skill category this feedback applies to (e.g. "communication", "technical", "problem-solving")
            
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

    let feedback;
    try {
      const raw = completion.choices?.[0]?.message?.content || '';
      feedback = JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, ''));
    } catch {
      feedback = { strengths: ['Good effort'], improvements: ['Add more detail'], score: 70, suggestion: 'Try elaborating on your answer', category: 'general' };
    }
    res.json(feedback);
  } catch (error) {
    console.error('Real-time feedback error:', error);
    res.status(500).json({ error: 'Failed to generate feedback' });
  }
});

// ==================== ENHANCED SCORING ====================
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

    // Generate comprehensive analysis using AI
    const responseText = responses.map((r, i) => 
      `Q${i+1}: ${r.question || 'Question'}\nA: ${r.answer || r.response || 'No response'}`
    ).join('\n\n');

    const completion = await aiCallWithRetry({
      operation: () => groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are an expert interview evaluator. Analyze the candidate's responses across multiple dimensions.
            Interview Type: ${type}, Difficulty: ${difficulty}, Duration: ${duration || 'N/A'} minutes.
            
            Provide detailed analysis in JSON format with these fields:
            - overall_score: 0-100 aggregate score
            - scores: object with communication, technical_knowledge, problem_solving, clarity, confidence (0-100 each)
            - strengths: array of 3-5 specific positive observations
            - weaknesses: array of 3-5 specific areas for improvement
            - recommendations: array of 3-5 actionable improvement suggestions
            - time_management: rating of how well candidate used the time
            - technical_depth: assessment of technical understanding depth
            - improvement_priority: array of improvement areas ranked by importance
            
            Be thorough but constructive. Respond ONLY with valid JSON.`
          },
          {
            role: 'user',
            content: `Analyze these interview responses:\n\n${responseText}`
          }
        ],
        response_format: { type: 'json_object' }
      }),
      timeoutMs: 15000,
      maxRetries: 2,
      baseDelayMs: 250
    });

    let analysis;
    try {
      const raw = completion.choices?.[0]?.message?.content || '';
      analysis = JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, ''));
    } catch (parseError) {
      console.error('Failed to parse AI analysis:', parseError);
      analysis = {
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
        recommendations: ['Practice system design', 'Study advanced algorithms'],
        improvement_priority: ['technical_knowledge', 'problem_solving']
      };
    }

    res.json(analysis);
  } catch (error) {
    console.error('Detailed analysis error:', error);
    res.status(500).json({ error: 'Failed to generate detailed analysis' });
  }
});

// ==================== NEW: ADAPTIVE QUESTION GENERATION ====================
/**
 * Generates adaptive questions based on user performance
 */
router.post('/questions/adaptive', authenticateToken, async (req, res) => {
  try {
    const { type, difficulty, previousResponses = [], userHistory = [] } = req.body;

    // Calculate user's performance in each area
    const performanceAnalysis = analyzeUserPerformance(userHistory, previousResponses);
    
    // Determine next question difficulty based on performance
    let nextDifficulty = difficulty;
    if (performanceAnalysis.accuracy > 0.8 && difficulty !== 'hard') {
      nextDifficulty = 'medium';
    } else if (performanceAnalysis.accuracy < 0.5 && difficulty !== 'easy') {
      nextDifficulty = 'easy';
    } else if (performanceAnalysis.accuracy > 0.9 && difficulty === 'hard') {
      nextDifficulty = 'hard'; // Maintain hard difficulty for high performers
    }

    // Try to generate AI question based on performance analysis
    if (groq) {
      try {
        const completion = await aiCallWithRetry({
          operation: () => groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content: `You are an expert interviewer creating adaptive questions based on user's performance. 
                User's recent performance: ${JSON.stringify(performanceAnalysis)}.
                Generate a ${nextDifficulty} ${type} interview question appropriate for their skill level. 
                Also provide a brief "context" or hint for the interviewer to understand what to focus on.
                Respond ONLY with valid JSON with "question" and "context" fields.`
              },
              {
                role: 'user',
                content: `Generate an adaptive ${type} question for difficulty: ${nextDifficulty}`
              }
            ],
            response_format: { type: 'json_object' }
          }),
          timeoutMs: 12000,
          maxRetries: 2,
          baseDelayMs: 250
        });

        let aiQuestion;
        try {
          const raw = completion.choices?.[0]?.message?.content || '';
          aiQuestion = JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, ''));
        } catch {
          aiQuestion = null;
        }

        if (aiQuestion) {
          return res.json({ question: aiQuestion, adaptiveDifficulty: nextDifficulty });
        }
      } catch (error) {
        console.error('AI question generation failed:', error);
      }
    }

    // Fallback to static questions based on performance
    const fallbackQuestions = getAdaptiveFallbackQuestions(type, nextDifficulty, performanceAnalysis);
    const randomQuestion = fallbackQuestions[crypto.randomInt(fallbackQuestions.length)];

    res.json({ question: randomQuestion, adaptiveDifficulty: nextDifficulty });
  } catch (error) {
    console.error('Adaptive question generation error:', error);
    res.status(500).json({ error: 'Failed to generate adaptive question' });
  }
});

// Helper function to analyze user performance
function analyzeUserPerformance(history, currentResponses) {
  if (!history || history.length === 0) {
    return { accuracy: 0.6, strengths: [], weaknesses: [] }; // Default to medium performance
  }

  // Calculate accuracy based on historical data
  const scores = history.map(session => session.interview_score || 0).filter(score => score > 0);
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 60;
  const accuracy = avgScore / 100; // Normalize to 0-1 scale
  
  // Extract strengths and weaknesses from previous feedback
  const strengths = [];
  const weaknesses = [];
  
  // Process current responses to determine quality
  const detailedResponses = currentResponses.filter(r => (r.answer || '').length > 100).length;
  const totalResponses = currentResponses.length;
  const responseQuality = totalResponses > 0 ? detailedResponses / totalResponses : 0;
  
  return {
    accuracy,
    responseQuality,
    strengths,
    weaknesses
  };
}

// Helper function to get fallback questions based on performance
function getAdaptiveFallbackQuestions(type, difficulty, performance) {
  const questionSets = {
    technical: {
      easy: [
        { question: "Explain what happens when you type a URL in the browser and press Enter.", context: "Focus on the high-level flow from DNS to rendering." },
        { question: "What is the difference between == and === in JavaScript?", context: "Explain type coercion and strict equality." },
        { question: "Explain what closures are in JavaScript with an example.", context: "Make sure to explain the practical use cases." },
        { question: "What are the differences between var, let, and const?", context: "Cover scope, hoisting, and reassignment." },
        { question: "Describe how you would implement a simple cache.", context: "Consider eviction policies and data structures." }
      ],
      medium: [
        { question: "Design a rate limiter for an API. What approach would you use?", context: "Consider different algorithms like token bucket or sliding window." },
        { question: "Explain how React's Virtual DOM works and why it's beneficial.", context: "Discuss reconciliation and performance benefits." },
        { question: "How would you optimize a slow database query?", context: "Cover indexing, query optimization, and caching strategies." },
        { question: "Explain the Event Loop in Node.js. How does it handle async operations?", context: "Include call stack, callback queue, and microtasks." },
        { question: "Design a simple pub/sub system. What components would you need?", context: "Think about publishers, subscribers, and message brokers." }
      ],
      hard: [
        { question: "Design a distributed cache system like Redis. How would you handle consistency?", context: "Consider CAP theorem and replication strategies." },
        { question: "Explain how you would implement a real-time collaboration feature like Google Docs.", context: "Discuss OT or CRDT, WebSockets, and conflict resolution." },
        { question: "How would you design a URL shortener that can handle millions of requests?", context: "Cover hashing, collision handling, and scalability." },
        { question: "Design a system to detect fraudulent transactions in real-time.", context: "Consider ML models, streaming data, and low latency requirements." },
        { question: "Explain how you would implement distributed transactions across microservices.", context: "Discuss saga pattern, 2PC, and eventual consistency." }
      ]
    },
    behavioral: {
      easy: [
        { question: "Tell me about a project you worked on in college or during an internship that you're proud of.", context: "Use the STAR format: Situation, Task, Action, Result." },
        { question: "Describe a time you had to learn a new technology or tool quickly for a project or assignment.", context: "Focus on your learning approach and outcomes." },
        { question: "How do you handle constructive criticism from professors, mentors, or teammates?", context: "Provide a specific example from your experience." },
        { question: "Tell me about a time you helped a classmate or team member with something they were struggling with.", context: "Highlight collaboration and impact." },
        { question: "What motivates you as someone getting into the tech field?", context: "Be authentic and connect to your career goals." }
      ],
      medium: [
        { question: "Tell me about a time you disagreed with your team in a group project. How did you handle it?", context: "Show conflict resolution and communication skills." },
        { question: "Describe a project that didn't go as planned. What did you learn from it?", context: "Demonstrate ownership and growth mindset." },
        { question: "Tell me about a time you had to make a trade-off decision in a project — maybe between features, time, or quality.", context: "Explain your reasoning and the impact." },
        { question: "How do you prioritize when you have multiple assignments or deadlines approaching at the same time?", context: "Discuss your prioritization approach." },
        { question: "Describe a time you gave feedback to a teammate on their work. How did you approach it?", context: "Show empathy and professionalism." }
      ],
      hard: [
        { question: "Tell me about the most complex technical challenge you've faced in a project.", context: "Go deep into the technical details and your thought process." },
        { question: "Describe a time you had to make a decision with incomplete information — maybe in a hackathon or project.", context: "Show decision-making under uncertainty." },
        { question: "How have you handled a situation where you missed a deadline for an assignment or project?", context: "Demonstrate accountability and problem-solving." },
        { question: "Tell me about a time you had to convince others to go with your approach or idea.", context: "Show leadership and persuasion skills." },
        { question: "Describe a time something you built or worked on didn't work out. What did you learn?", context: "Be honest and show growth." }
      ]
    }
  };

  return questionSets[type]?.[difficulty] || questionSets.technical.medium;
}

// ==================== PERSONALIZED RECOMMENDATIONS ====================
/**
 * Generate personalized improvement recommendations
 */
router.get('/recommendations/personalized', authenticateToken, async (req, res) => {
  try {
    const { data: interviews, error } = await supabaseAdmin
      .from('interview_sessions')
      .select(`
        id,
        interview_type,
        difficulty_level,
        interview_score,
        communication_clarity_score,
        problem_solving_score,
        technical_depth_score,
        strengths,
        areas_for_improvement,
        started_at
      `)
      .eq('user_id', req.user.id)
      .order('started_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!interviews || interviews.length === 0) {
      return res.json({
        recommendations: [{
          category: 'getting_started',
          priority: 'low',
          title: 'Start with your first mock interview',
          description: 'Complete your first mock interview to receive personalized recommendations.',
          actions: [
            'Choose an interview type that matches your goals',
            'Select an appropriate difficulty level',
            'Practice regularly to build confidence'
          ]
        }]
      });
    }

    // Calculate averages
    const avgScores = {
      overall: interviews.reduce((sum, i) => sum + (i.interview_score || 0), 0) / interviews.length,
      communication: interviews.reduce((sum, i) => sum + (i.communication_clarity_score || 0), 0) / interviews.length,
      problemSolving: interviews.reduce((sum, i) => sum + (i.problem_solving_score || 0), 0) / interviews.length,
      technical: interviews.reduce((sum, i) => sum + (i.technical_depth_score || 0), 0) / interviews.length
    };

    const recommendations = [];

    // Identify weak areas
    if (avgScores.communication < 70) {
      recommendations.push({
        category: 'communication',
        priority: 'high',
        title: 'Improve Communication Skills',
        description: 'Your communication scores are below average. Focus on explaining your thought process clearly.',
        actions: [
          'Practice speaking aloud while solving problems',
          'Explain concepts to others to improve articulation',
          'Slow down and be more deliberate in your explanations'
        ],
        resources: [
          { title: 'Effective Communication in Tech Interviews', url: '/resources/communication-guide' },
          { title: 'STAR Method for Behavioral Questions', url: '/resources/star-method' }
        ]
      });
    }

    if (avgScores.problemSolving < 70) {
      recommendations.push({
        category: 'problem_solving',
        priority: 'high',
        title: 'Enhance Problem-Solving Approach',
        description: 'Your problem-solving skills need improvement. Work on breaking down complex problems.',
        actions: [
          'Practice more problems in this area',
          'Focus on pattern recognition',
          'Learn to identify the right data structures and algorithms'
        ],
        resources: [
          { title: 'Problem Solving Framework', url: '/resources/problem-solving' },
          { title: 'Algorithm Patterns', url: '/resources/algorithms' }
        ]
      });
    }

    if (avgScores.technical < 70) {
      recommendations.push({
        category: 'technical_depth',
        priority: 'high',
        title: 'Deepen Technical Knowledge',
        description: 'Your technical depth scores indicate room for improvement.',
        actions: [
          'Review fundamental CS concepts',
          'Study common algorithms and data structures',
          'Practice system design principles'
        ],
        resources: [
          { title: 'CS Fundamentals Review', url: '/resources/cs-fundamentals' },
          { title: 'System Design Basics', url: '/resources/system-design' }
        ]
      });
    }

    // Identify specific areas for improvement from interview feedback
    const allImprovementAreas = [];
    interviews.forEach(interview => {
      if (Array.isArray(interview.areas_for_improvement)) {
        allImprovementAreas.push(...interview.areas_for_improvement);
      }
    });

    if (allImprovementAreas.length > 0) {
      const mostCommonArea = allImprovementAreas.reduce((acc, curr) => {
        acc[curr] = (acc[curr] || 0) + 1;
        return acc;
      }, {});

      const topArea = Object.entries(mostCommonArea).sort(([,a], [,b]) => b - a)[0];
      if (topArea) {
        recommendations.push({
          category: 'specific_weakness',
          priority: 'medium',
          title: `Focus on ${topArea[0]}`,
          description: `You've consistently struggled with ${topArea[0]} across multiple interviews.`,
          actions: [
            `Practice problems that emphasize ${topArea[0]}`,
            `Study resources specifically addressing ${topArea[0]}`,
            `Request more questions on ${topArea[0]} during practice interviews`
          ],
          resources: [
            { title: `${topArea[0]} Resources`, url: `/resources/${topArea[0].toLowerCase().replace(/\s+/g, '-')}` }
          ]
        });
      }
    }

    // Add positive reinforcement if scores are improving
    if (interviews.length >= 2) {
      const recentScore = interviews[0].interview_score;
      const previousScore = interviews[1].interview_score;
      
      if (recentScore > previousScore + 5) {
        recommendations.unshift({
          category: 'progress',
          priority: 'low',
          title: 'Positive Trend Detected',
          description: 'Your interview scores are showing improvement! Keep up the good work.',
          actions: [
            'Maintain your current practice routine',
            'Try increasing the difficulty level gradually',
            'Focus on maintaining consistency across all areas'
          ],
          resources: [
            { title: 'Advanced Interview Preparation', url: '/resources/advanced-prep' }
          ]
        });
      }
    }

    res.json({ recommendations: recommendations.slice(0, 5) }); // Limit to top 5
  } catch (error) {
    console.error('Personalized recommendations error:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// ==================== COMPANY-SPECIFIC PREPARATION ====================
/**
 * Get company-specific interview preparation
 */
router.get('/prepare/:company', authenticateToken, async (req, res) => {
  try {
    const { company } = req.params;
    const { type = 'dsa' } = req.query;

    // In a real implementation, this would fetch company-specific questions
    // from a database or API based on the company name
    const companyPrep = {
      company: company,
      interviewType: type,
      frequentlyAskedTopics: [],
      recommendedResources: [],
      specialCharacteristics: '',
      preparationPlan: []
    };

    // Placeholder implementation with general guidance
    if (company.toLowerCase().includes('google') || company.toLowerCase().includes('meta')) {
      companyPrep.frequentlyAskedTopics = ['System Design', 'Algorithm Complexity', 'Scalability'];
      companyPrep.recommendedResources = ['LeetCode Hard Problems', 'System Design Primer'];
      companyPrep.specialCharacteristics = 'Focus on open-ended problems and trade-offs';
      companyPrep.preparationPlan = [
        'Week 1-2: Master algorithmic coding challenges (Hard level)',
        'Week 3-4: Deep dive into system design patterns',
        'Week 5-6: Practice scalability and performance optimization questions'
      ];
    } else if (company.toLowerCase().includes('amazon')) {
      companyPrep.frequentlyAskedTopics = ['Leadership Principles', 'System Design', 'Optimization'];
      companyPrep.recommendedResources = ['Behavioral Questions', 'System Design'];
      companyPrep.specialCharacteristics = 'Emphasis on leadership principles and customer obsession';
      companyPrep.preparationPlan = [
        'Week 1-2: Study Amazon Leadership Principles with real examples',
        'Week 3-4: Practice system design focusing on scalability',
        'Week 5-6: Combine behavioral and technical skills in mock interviews'
      ];
    } else if (company.toLowerCase().includes('microsoft')) {
      companyPrep.frequentlyAskedTopics = ['Algorithms', 'Data Structures', 'Design Patterns'];
      companyPrep.recommendedResources = ['LeetCode Medium Problems', 'OOD Principles'];
      companyPrep.specialCharacteristics = 'Focus on collaborative problem-solving';
      companyPrep.preparationPlan = [
        'Week 1-2: Focus on arrays, strings, and trees problems',
        'Week 3-4: Practice designing patterns and object-oriented solutions',
        'Week 5-6: Emphasize communication and approach explanation'
      ];
    } else {
      companyPrep.frequentlyAskedTopics = ['Algorithms', 'Data Structures', 'Problem Solving'];
      companyPrep.recommendedResources = ['LeetCode Medium Problems', 'Core CS Concepts'];
      companyPrep.specialCharacteristics = 'Standard technical interview format';
      companyPrep.preparationPlan = [
        'Week 1-2: Master core data structures and algorithms',
        'Week 3-4: Practice system design basics',
        'Week 5-6: Mock interviews focusing on communication skills'
      ];
    }

    res.json(companyPrep);
  } catch (error) {
    console.error('Company prep error:', error);
    res.status(500).json({ error: 'Failed to generate company-specific prep' });
  }
});

// ==================== PERFORMANCE TRENDS ====================
/**
 * Get performance trend analysis over time
 */
router.get('/trends/performance', authenticateToken, async (req, res) => {
  try {
    const { data: interviews, error } = await supabaseAdmin
      .from('interview_sessions')
      .select('interview_score, started_at')
      .eq('user_id', req.user.id)
      .order('started_at', { ascending: true });

    if (error) throw error;

    if (!interviews || interviews.length === 0) {
      return res.json({ trend: [], average: 0, trendDirection: 'insufficient_data' });
    }

    // Calculate trend direction
    let trendDirection = 'stable';
    if (interviews.length >= 2) {
      const recentScore = interviews[interviews.length - 1].interview_score;
      const olderScore = interviews[0].interview_score;
      
      if (recentScore > olderScore + 5) {
        trendDirection = 'improving';
      } else if (recentScore < olderScore - 5) {
        trendDirection = 'declining';
      }
    }

    // Calculate average
    const average = interviews.reduce((sum, i) => sum + (i.interview_score || 0), 0) / interviews.length;

    // Format data for charting
    const trend = interviews.map(interview => ({
      date: interview.started_at,
      score: interview.interview_score
    }));

    res.json({
      trend,
      average: Math.round(average),
      trendDirection,
      totalInterviews: interviews.length
    });
  } catch (error) {
    console.error('Performance trends error:', error);
    res.status(500).json({ error: 'Failed to fetch performance trends' });
  }
});

export default router;