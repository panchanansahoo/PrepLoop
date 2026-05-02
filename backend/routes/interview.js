import express from 'express';
import Groq from 'groq-sdk';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { authenticateToken } from '../middleware/auth.js';
import { aiCallWithRetry } from '../utils/aiClient.js';
import { applyCoinTransaction } from '../utils/coinTransactions.js';
import InterviewCacheManager from '../services/interviewCacheManager.js';
import phase2Service from '../services/phase2IntegrationService.js';
import { sendError, sendSuccess, ErrorCodes } from '../utils/errorResponseFormatter.js';

const router = express.Router();
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const INTERVIEW_START_COIN_COST = Number(process.env.AI_INTERVIEW_COIN_COST || 5);

const spendCoinsForInterviewStart = async (userId, cost, referenceKey = null) => {
  const atomicResult = await applyCoinTransaction({
    userId,
    amount: cost,
    type: 'spend',
    description: 'AI interview session start',
    referenceKey,
  });

  if (atomicResult.handled) {
    if (!atomicResult.success) {
      return { ok: false, currentCoins: atomicResult.balance };
    }
    return { ok: true, newBalance: atomicResult.balance };
  }

  const { data: profile, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('coins')
    .eq('id', userId)
    .single();

  if (fetchError) throw fetchError;

  const currentCoins = profile?.coins || 0;
  if (currentCoins < cost) {
    return { ok: false, currentCoins };
  }

  const newBalance = currentCoins - cost;
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ coins: newBalance })
    .eq('id', userId);

  if (updateError) throw updateError;

  await supabaseAdmin.from('coin_transactions').insert({
    user_id: userId,
    amount: cost,
    type: 'spend',
    description: 'AI interview session start',
  });

  return { ok: true, newBalance };
};

const refundCoinsForInterviewStartFailure = async (userId, cost, referenceKey = null) => {
  const atomicResult = await applyCoinTransaction({
    userId,
    amount: cost,
    type: 'earn',
    description: 'AI interview refund (start failed)',
    referenceKey,
  });

  if (atomicResult.handled) {
    if (!atomicResult.success) {
      throw new Error(atomicResult.error || 'Failed to refund interview coins');
    }
    return atomicResult.balance;
  }

  const { data: profile, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('coins')
    .eq('id', userId)
    .single();

  if (fetchError) throw fetchError;

  const currentCoins = profile?.coins || 0;
  const refundedBalance = currentCoins + cost;

  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ coins: refundedBalance })
    .eq('id', userId);

  if (updateError) throw updateError;

  await supabaseAdmin.from('coin_transactions').insert({
    user_id: userId,
    amount: cost,
    type: 'earn',
    description: 'AI interview refund (start failed)',
  });

  return refundedBalance;
};

const getFallbackQuestions = (type, difficulty) => {
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
    },
    'system-design': {
      easy: [
        { question: "Design a parking lot system.", context: "Focus on the core entities and relationships." },
        { question: "Design a basic e-commerce shopping cart.", context: "Consider items, quantities, and basic operations." },
        { question: "Design a simple chat application.", context: "Think about users, messages, and real-time updates." },
        { question: "Design a basic file storage system.", context: "Consider upload, download, and organization." },
        { question: "Design a simple task management system.", context: "Include tasks, users, and status tracking." }
      ],
      medium: [
        { question: "Design Twitter. How would you handle the news feed?", context: "Consider scalability, fan-out, and caching." },
        { question: "Design a web crawler that can scale to billions of pages.", context: "Think about distribution, deduplication, and politeness." },
        { question: "Design Netflix's video streaming service.", context: "Cover CDN, encoding, adaptive bitrate streaming." },
        { question: "Design a ride-sharing service like Uber.", context: "Include matching, pricing, and real-time location." },
        { question: "Design Instagram's photo sharing and feed.", context: "Consider storage, CDN, and timeline generation." }
      ],
      hard: [
        { question: "Design Google Search. How would you rank results?", context: "Cover crawling, indexing, and ranking algorithms." },
        { question: "Design a global multiplayer game infrastructure.", context: "Consider latency, state synchronization, and cheating prevention." },
        { question: "Design a distributed file system like GFS or HDFS.", context: "Think about replication, consistency, and fault tolerance." },
        { question: "Design a real-time analytics system for billions of events.", context: "Consider stream processing, aggregation, and storage." },
        { question: "Design YouTube. How would you handle video processing and delivery?", context: "Cover upload, transcoding, storage, and global delivery." }
      ]
    },
    coding: {
      easy: [
        { question: "Write a function to reverse a string.", context: "Consider in-place reversal and edge cases." },
        { question: "Implement a function to check if a string is a palindrome.", context: "Think about case sensitivity and non-alphanumeric characters." },
        { question: "Write a function to find the maximum element in an array.", context: "Consider empty arrays and negative numbers." },
        { question: "Implement FizzBuzz.", context: "Print numbers 1-100, but replace multiples of 3 with Fizz, 5 with Buzz, both with FizzBuzz." },
        { question: "Write a function to count vowels in a string.", context: "Consider both uppercase and lowercase." }
      ],
      medium: [
        { question: "Implement a function to find all anagrams of a word in a dictionary.", context: "Think about efficient data structures." },
        { question: "Write a function to merge overlapping intervals.", context: "Consider sorting and edge cases." },
        { question: "Implement a LRU Cache with O(1) operations.", context: "Think about hash map + doubly linked list." },
        { question: "Write a function to validate a binary search tree.", context: "Consider the range constraint approach." },
        { question: "Implement a function to find the longest substring without repeating characters.", context: "Use sliding window technique." }
      ],
      hard: [
        { question: "Implement a trie (prefix tree) with insert, search, and startsWith methods.", context: "Consider memory efficiency." },
        { question: "Write a function to serialize and deserialize a binary tree.", context: "Think about different traversal approaches." },
        { question: "Implement a thread-safe bounded blocking queue.", context: "Consider synchronization and edge cases." },
        { question: "Write a function to find the median of two sorted arrays in O(log(m+n)).", context: "Use binary search approach." },
        { question: "Implement a regular expression matcher with . and * support.", context: "Consider dynamic programming or recursion." }
      ]
    }
  };

  const questions = questionSets[type]?.[difficulty] || questionSets.technical.medium;
  return questions;
};

  function buildInterviewAnalytics(interviews = []) {
    const totalInterviews = interviews.length;

    if (totalInterviews === 0) {
      return {
        totalInterviews: 0,
        averageOverallScore: 0,
        averageCommunicationScore: 0,
        averageTechnicalScore: 0,
        averageProblemSolvingScore: 0,
        bestScore: 0,
        currentStreak: 0,
        bestStreak: 0,
        consistency: 0,
        byType: {},
        byDifficulty: {},
        scoreTrend: 0,
        recentTrend: [],
        averageScores: {
          overall: 0,
          communication: 0,
          technical: 0,
          problemSolving: 0,
        },
        scoresByType: {},
        scoresByDifficulty: {},
      };
    }

    // Single-pass calculation for all scores and aggregations
    const scores = [];
    let totalOverallScore = 0;
    let totalCommunicationScore = 0;
    let totalTechnicalScore = 0;
    let totalProblemSolvingScore = 0;

    for (const interview of interviews) {
      const overallScore = interview.overall_score || 0;
      scores.push(overallScore);
      totalOverallScore += overallScore;
      totalCommunicationScore += interview.communication_score || 0;
      totalTechnicalScore += interview.technical_score || 0;
      totalProblemSolvingScore += interview.problem_solving_score || 0;
    }

    const averageOverallScore = Math.round(totalOverallScore / totalInterviews);
    const averageCommunicationScore = Math.round(totalCommunicationScore / totalInterviews);
    const averageTechnicalScore = Math.round(totalTechnicalScore / totalInterviews);
    const averageProblemSolvingScore = Math.round(totalProblemSolvingScore / totalInterviews);

    const bestScore = Math.max(...scores);
    const mean = averageOverallScore;
    const variance = scores.reduce((sum, score) => sum + ((score - mean) ** 2), 0) / totalInterviews;
    const consistency = Math.max(0, Math.min(100, Math.round(100 - Math.sqrt(variance))));

    const collectBreakdown = (field) => {
      const breakdown = {};

      interviews.forEach((interview) => {
        const group = interview[field] || 'unknown';

        if (!breakdown[group]) {
          breakdown[group] = { count: 0, total: 0 };
        }

        breakdown[group].count += 1;
        breakdown[group].total += interview.overall_score || 0;
      });

      Object.keys(breakdown).forEach((group) => {
        breakdown[group].avg = Math.round(breakdown[group].total / breakdown[group].count);
        breakdown[group].average = breakdown[group].avg;
        delete breakdown[group].total;
      });

      return breakdown;
    };

    const byType = collectBreakdown('interview_type');
    const byDifficulty = collectBreakdown('difficulty');

    const completedDates = [...new Set(
      interviews
        .filter((interview) => interview.completed_at)
        .map((interview) => new Date(interview.completed_at).toISOString().split('T')[0])
    )].sort().reverse();

    let currentStreak = 0;
    let bestStreak = 0;

    if (completedDates.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      if (completedDates[0] === today || completedDates[0] === yesterday) {
        currentStreak = 1;

        for (let index = 1; index < completedDates.length; index++) {
          const previous = new Date(completedDates[index - 1]);
          const current = new Date(completedDates[index]);
          const diffDays = Math.round((previous - current) / 86400000);

          if (diffDays === 1) {
            currentStreak += 1;
          } else {
            break;
          }
        }
      }

      let tempStreak = 1;
      const allDates = [...completedDates].sort();

      for (let index = 1; index < allDates.length; index++) {
        const previous = new Date(allDates[index - 1]);
        const current = new Date(allDates[index]);
        const diffDays = Math.round((current - previous) / 86400000);

        if (diffDays === 1) {
          tempStreak += 1;
        } else {
          bestStreak = Math.max(bestStreak, tempStreak);
          tempStreak = 1;
        }
      }

      bestStreak = Math.max(bestStreak, tempStreak);
    }

    const firstWindow = scores.slice(0, Math.min(5, scores.length));
    const lastWindow = scores.slice(-Math.min(5, scores.length));
    const firstAverage = firstWindow.reduce((sum, score) => sum + score, 0) / firstWindow.length;
    const lastAverage = lastWindow.reduce((sum, score) => sum + score, 0) / lastWindow.length;
    const scoreTrend = scores.length > 1 ? Math.round(lastAverage - firstAverage) : 0;

    const recentTrend = interviews.slice(0, 10).reverse().map((interview) => ({
      date: interview.completed_at,
      score: interview.overall_score || 0,
      type: interview.interview_type,
      difficulty: interview.difficulty,
    }));

    return {
      totalInterviews,
      averageOverallScore,
      averageCommunicationScore,
      averageTechnicalScore,
      averageProblemSolvingScore,
      bestScore,
      currentStreak,
      bestStreak,
      consistency,
      byType,
      byDifficulty,
      scoreTrend,
      recentTrend,
      averageScores: {
        overall: averageOverallScore,
        communication: averageCommunicationScore,
        technical: averageTechnicalScore,
        problemSolving: averageProblemSolvingScore,
      },
      scoresByType: Object.fromEntries(
        Object.entries(byType).map(([key, value]) => [key, { count: value.count, average: value.avg }])
      ),
      scoresByDifficulty: Object.fromEntries(
        Object.entries(byDifficulty).map(([key, value]) => [key, { count: value.count, average: value.avg }])
      ),
    };
  }

  export async function getInterviewAnalytics(req, res) {
    try {
      // Extract pagination parameters from query
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 50)); // Cap at 100
      const offset = (page - 1) * pageSize;

      // Get total count first
      const { count, error: countError } = await supabaseAdmin
        .from('mock_interviews')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', req.user.id);

      if (countError) throw countError;

      // Fetch paginated interviews
      const { data: interviews, error } = await supabaseAdmin
        .from('mock_interviews')
        .select('overall_score, communication_score, technical_score, problem_solving_score, interview_type, difficulty, completed_at')
        .eq('user_id', req.user.id)
        .order('completed_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;

      const analytics = buildInterviewAnalytics(interviews || []);
      
      // Add pagination metadata
      res.json({
        ...analytics,
        pagination: {
          currentPage: page,
          pageSize: pageSize,
          totalRecords: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize)
        }
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics', message: error.message });
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
      res.status(500).json({ error: 'Failed to fetch recommendations', message: error.message });
    }
  }

const generateAIQuestion = async (type, difficulty, previousQuestions = [], userId = null) => {
  if (!groq) return null;

  try {
    // Phase 2.1: Check for duplicates in question pool (if userId provided)
    let questionToGenerate = null;
    let regenerationAttempts = 0;
    const maxAttempts = 3;

    while (regenerationAttempts < maxAttempts) {
      // Create a simple key for caching
      const cacheKey = `question:${type}:${difficulty}:${regenerationAttempts}`;
      
      // Try to get from cache first
      const cachedQuestion = await InterviewCacheManager.get(cacheKey);
      if (cachedQuestion) {
        console.log(`Using cached question for ${type}/${difficulty}`);
        questionToGenerate = cachedQuestion;
        break;
      }

      const completion = await aiCallWithRetry({
        operation: () => groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are an expert technical interviewer. Generate a unique ${difficulty} ${type} interview question suitable for a STUDENT or RECENT GRADUATE.
            The candidate may have limited professional experience — frame questions around college projects, internships, coursework, or learning.
            Also provide a brief "context" or hint for the interviewer (or candidate) to understand what to focus on.
            Avoid repeating these previously asked questions: ${JSON.stringify(previousQuestions)}.
            ${regenerationAttempts > 0 ? `This is attempt ${regenerationAttempts + 1}. Make sure it's sufficiently different from previous attempts.` : ''}
            
            Format as JSON with "question" and "context" fields. Respond ONLY with valid JSON.`
            },
            {
              role: 'user',
              content: `Generate a ${difficulty} ${type} interview question.`
            }
          ],
          response_format: { type: 'json_object' }
        }),
        timeoutMs: 12000,
        maxRetries: 2,
        baseDelayMs: 250,
      });

      let parsed;
      try {
        const raw = completion.choices?.[0]?.message?.content || '';
        if (!raw || typeof raw !== 'string') {
          console.warn('Invalid response content from Groq API');
          regenerationAttempts++;
          continue;
        }
        const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
        if (!cleaned) {
          console.warn('Empty response after cleaning');
          regenerationAttempts++;
          continue;
        }
        parsed = JSON.parse(cleaned);
      } catch (parseError) {
        console.error('Failed to parse Groq response:', parseError.message);
        regenerationAttempts++;
        continue;
      }

      // Phase 2.1: Check if this question is a duplicate (if userId provided)
      if (userId && parsed && parsed.question) {
        const dupCheck = phase2Service.checkQuestionDuplicate(userId, parsed.question);
        if (dupCheck.isDuplicate) {
          console.log(`[Phase2] Question is duplicate (${dupCheck.similarityScore}% similar), regenerating...`);
          regenerationAttempts++;
          continue; // Try again
        }
      }

      questionToGenerate = parsed;
      break;
    }

    if (!questionToGenerate) {
      console.warn('Failed to generate unique question after 3 attempts');
      return null;
    }

    // Cache the question for future use
    if (questionToGenerate && questionToGenerate.question) {
      const cacheKey = `question:${type}:${difficulty}:0`;
      await InterviewCacheManager.set(cacheKey, questionToGenerate, 7200); // Cache for 2 hours
      console.log(`Cached question for ${type}/${difficulty}`);
    }

    return questionToGenerate;
  } catch (error) {
    console.error('Groq generation error:', error);
    return null;
  }
};

router.post('/start', authenticateToken, async (req, res) => {
  let didCharge = false;
  try {
    const { type, difficulty, duration } = req.body;

    // Validate interview type
    const validTypes = ['technical', 'behavioral', 'system-design', 'coding', 'dsa', 'mixed'];
    if (!type || !validTypes.includes(type)) {
      return sendError(res, ErrorCodes.INVALID_INTERVIEW_TYPE, 'Invalid interview type', {
        validTypes,
        received: type
      });
    }

    // Validate difficulty
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!difficulty || !validDifficulties.includes(difficulty)) {
      return sendError(res, ErrorCodes.INVALID_DIFFICULTY, 'Invalid difficulty level', {
        validDifficulties,
        received: difficulty
      });
    }

    // Fix #4: use req.requestId (set by requestIdMiddleware) instead of req.id which is always undefined
    const spendResult = await spendCoinsForInterviewStart(
      req.user.id,
      INTERVIEW_START_COIN_COST,
      req.requestId ? `interview-start:${req.requestId}` : null
    );

    if (!spendResult.ok) {
      return sendError(res, ErrorCodes.INSUFFICIENT_COINS, 'You do not have enough coins for this interview', {
        required: INTERVIEW_START_COIN_COST,
        available: spendResult.currentCoins,
      });
    }
    didCharge = true;

    // Try to get AI question first
    const aiQuestion = await generateAIQuestion(type, difficulty);

    if (aiQuestion) {
      res.json({
        questions: [aiQuestion],
        firstQuestion: aiQuestion,
        question: aiQuestion,
      });
    } else {
      // Fallback to static questions
      const questions = getFallbackQuestions(type, difficulty);
      const questionCount = 5;
      // Fix #5: sample without replacement to avoid duplicate questions
      const shuffled = [...questions].sort(() => Math.random() - 0.5);
      const selectedQuestions = shuffled.slice(0, Math.min(questionCount, shuffled.length));

      res.json({
        questions: selectedQuestions,
        firstQuestion: selectedQuestions[0] || null,
        question: selectedQuestions[0] || null,
      });
    }
  } catch (error) {
    // Fix: Add null check for req.user before refund
    if (didCharge && req.user?.id) {
      try {
      // Fix #4: use req.requestId for refund reference key
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
    sendError(res, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to start interview', {
      reason: error.message
    });
  }
});

router.post('/next-question', authenticateToken, async (req, res) => {
  try {
    const { previousResponses, type } = req.body;
    let difficulty = req.body.difficulty || 'medium';
    const userId = req.user?.id;

    // Validate interview type
    const validTypes = ['technical', 'behavioral', 'system-design', 'coding', 'dsa', 'mixed'];
    if (!type || !validTypes.includes(type)) {
      return sendError(res, ErrorCodes.INVALID_INTERVIEW_TYPE, 'Invalid interview type', {
        validTypes,
        received: type
      });
    }

    // Validate difficulty
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(difficulty)) {
      return sendError(res, ErrorCodes.INVALID_DIFFICULTY, 'Invalid difficulty level', {
        validDifficulties,
        received: difficulty
      });
    }

    // Phase 2.2: Get difficulty with auto-adjustment if user is authenticated
    let adjustedDifficulty = difficulty;
    let difficultyAdjusted = false;
    let adjustmentReason = null;

    if (userId) {
      try {
        const difficultyResult = phase2Service.getNextQuestionDifficulty(userId, type);
        adjustedDifficulty = difficultyResult.difficulty;
        difficultyAdjusted = difficultyResult.autoAdjusted;
        adjustmentReason = difficultyResult.adjustmentReason;

        if (difficultyAdjusted) {
          console.log(`[Phase2] Difficulty adjusted for user ${userId}: ${difficulty} → ${adjustedDifficulty} (${adjustmentReason})`);
        }
      } catch (adjustmentError) {
        console.warn('Failed to get adjusted difficulty, using default:', adjustmentError.message);
        // Fall back to requested difficulty
      }
    }

    // Fix #11: validate previousResponses is an array before calling .map
    const safeResponses = Array.isArray(previousResponses) ? previousResponses : [];
    const previousQuestions = safeResponses
      .map(r => r?.question?.question)
      .filter(Boolean);

    // Phase 2.1: Pass userId to generateAIQuestion for dedup checking
    const aiQuestion = await generateAIQuestion(type, adjustedDifficulty, previousQuestions, userId);

    if (aiQuestion) {
      // Phase 2.1: Track question as asked
      if (userId && aiQuestion.question) {
        try {
          phase2Service.trackQuestionAsked(userId, {
            id: `q-${Date.now()}`,
            text: aiQuestion.question,
            difficulty: adjustedDifficulty,
            category: type
          });
        } catch (trackError) {
          console.warn('Failed to track question:', trackError.message);
        }
      }

      res.json({
        question: aiQuestion,
        difficulty: adjustedDifficulty,
        difficultyAdjusted,
        adjustmentReason
      });
    } else {
      const questions = getFallbackQuestions(type, adjustedDifficulty);
      // Simple random fallback
      const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
      res.json({
        question: randomQuestion,
        difficulty: adjustedDifficulty,
        isFallback: true
      });
    }
  } catch (error) {
    console.error('Error getting next question:', error);
    sendError(res, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to get next question', {
      reason: error.message
    });
  }
});

router.post('/complete', authenticateToken, async (req, res) => {
  try {
    const { type, difficulty, duration, responses } = req.body;
    const userId = req.user?.id;

    // Validate interview type
    const validTypes = ['technical', 'behavioral', 'system-design', 'coding', 'dsa', 'mixed'];
    if (!type || !validTypes.includes(type)) {
      return sendError(res, ErrorCodes.INVALID_INTERVIEW_TYPE, 'Invalid interview type', {
        validTypes,
        received: type
      });
    }

    // Validate difficulty
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!difficulty || !validDifficulties.includes(difficulty)) {
      return sendError(res, ErrorCodes.INVALID_DIFFICULTY, 'Invalid difficulty level', {
        validDifficulties,
        received: difficulty
      });
    }

    // Validate responses
    if (!Array.isArray(responses)) {
      return sendError(res, ErrorCodes.VALIDATION_ERROR, 'Responses must be an array');
    }

    let scores;

    // Try AI-powered evaluation first
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
        scores = null; // Fall through to heuristic
      }
    }

    // Deterministic heuristic fallback (never random)
    if (!scores) {
      const totalResponses = (responses || []).length;
      const answeredResponses = (responses || []).filter(r =>
        (r.answer || r.response || '').trim().length > 20
      );
      const avgLength = answeredResponses.length > 0
        ? answeredResponses.reduce((sum, r) => sum + (r.answer || r.response || '').length, 0) / answeredResponses.length
        : 0;

      // Base score from completion rate
      const completionRate = totalResponses > 0 ? answeredResponses.length / totalResponses : 0;
      const baseScore = Math.round(completionRate * 60 + 20); // 20-80 range

      // Bonus for detailed answers (longer = more detailed, capped)
      const detailBonus = Math.min(15, Math.round(avgLength / 50));

      // Difficulty modifier
      const difficultyMod = difficulty === 'hard' ? -5 : difficulty === 'easy' ? 5 : 0;

      const heuristicScore = Math.max(0, Math.min(100, baseScore + detailBonus + difficultyMod));

      scores = {
        overall: heuristicScore,
        communication: Math.max(0, Math.min(100, heuristicScore + (avgLength > 100 ? 5 : -5))),
        technical: Math.max(0, Math.min(100, heuristicScore - 3)),
        problemSolving: Math.max(0, Math.min(100, heuristicScore - 2))
      };
    }

    // Phase 2.2 & 2.3: Record performance and determine follow-ups
    let performanceData = null;
    let followUpData = null;

    if (userId) {
      try {
        // Record performance for each response
        const responseCount = responses?.length || 0;
        for (let i = 0; i < responseCount; i++) {
          const response = responses[i];
          if (response && response.answer) {
            // Calculate component scores for this response
            const responseLength = response.answer.length;
            const isAnswered = responseLength > 20;

            // Phase 2.3: Check for follow-ups
            if (isAnswered && response.question?.question) {
              try {
                const followUpRec = phase2Service.getFollowUpRecommendation(
                  response.question.question,
                  response.answer,
                  difficulty
                );

                if (followUpRec && followUpRec.canFollowUp) {
                  // Generate follow-up prompt if needed
                  const followUpPrompt = phase2Service.generateFollowUpPrompt(
                    response.question.question,
                    response.answer,
                    difficulty
                  );

                  if (followUpPrompt) {
                    followUpData = followUpPrompt;
                    console.log(`[Phase2] Follow-up recommended for question ${i + 1}: ${followUpData.strategy}`);
                  }
                }
              } catch (followUpError) {
                console.warn('Failed to generate follow-up:', followUpError.message);
              }
            }

            // Record performance
            const scoreForResponse = isAnswered
              ? Math.max(50, Math.min(100, scores.overall + Math.random() * 20 - 10))
              : 30;

            performanceData = phase2Service.recordAnswer(userId, {
              category: type,
              difficulty,
              correctness: scoreForResponse,
              explanation: Math.max(0, scoreForResponse - 10),
              speed: Math.max(0, scoreForResponse - 5),
              questionId: `q-${i}`,
              responseTime: Math.ceil(Math.random() * 300) // Random 0-300s for now
            });
          }
        }

        // Finalize session
        phase2Service.finalizeInterviewSession(userId);
      } catch (phase2Error) {
        console.warn('Phase 2 tracking error:', phase2Error.message);
      }
    }

    const { data, error } = await supabaseAdmin
      .from('mock_interviews')
      .insert({
        user_id: userId,
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

    const result = {
      interviewId: data.id,
      scores
    };

    // Include Phase 2 data in response
    if (performanceData) {
      result.performanceTracking = performanceData;
    }
    if (followUpData) {
      result.followUp = followUpData;
    }

    res.json(result);
  } catch (error) {
    console.error('Error completing interview:', error);
    res.status(500).json({ error: 'Failed to complete interview', message: error.message });
  }
});

router.get('/history', authenticateToken, async (req, res) => {
  try {
    // Extract pagination parameters from query
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20)); // Default 20, max 100
    const offset = (page - 1) * pageSize;

    // Get total count first
    const { count, error: countError } = await supabaseAdmin
      .from('mock_interviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id);

    if (countError) throw countError;

    // Fetch paginated data
    const { data, error } = await supabaseAdmin
      .from('mock_interviews')
      .select('id, interview_type, difficulty, duration, overall_score, completed_at')
      .eq('user_id', req.user.id)
      .order('completed_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    
    res.json({ 
      interviews: data || [],
      pagination: {
        currentPage: page,
        pageSize: pageSize,
        totalRecords: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    });
  } catch (error) {
    console.error('Error fetching interview history:', error);
    res.status(500).json({ error: 'Failed to fetch history', message: error.message });
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

// Real-time feedback endpoint
router.post('/:id/feedback', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { questionIndex, answerText, audioTranscript } = req.body;

    if (!groq) {
      return res.status(503).json({ error: 'AI feedback unavailable' });
    }

    // Get the interview
    const { data: interview, error: fetchError } = await supabaseAdmin
      .from('mock_interviews')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const question = interview.questions[questionIndex];
    const responseText = answerText || audioTranscript || '';

    if (!question || !responseText) {
      return res.status(400).json({ error: 'Invalid question or response' });
    }

    // Generate real-time feedback using Groq
    const completion = await aiCallWithRetry({
      operation: () => groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are an expert interview coach. Provide real-time feedback on the candidate's answer.
          Consider: clarity, completeness, relevance, depth, technical accuracy (if technical), and STAR structure (if behavioral).
          Provide: 1) Overall assessment (1 sentence), 2) Strengths (2-3 bullet points), 3) Areas to improve (2-3 bullet points), 4) Specific tips for better response.
          Be constructive and encouraging. Keep total response under 200 words.
          Respond as JSON with fields: assessment, strengths, improvements, tips. Quote strengths and improvements as short phrases.`
          },
          {
            role: 'user',
            content: `Question: "${question.question}"\nContext: ${question.context}\nCandidate's Answer: "${responseText}"`
          }
        ],
        response_format: { type: 'json_object' }
      }),
      timeoutMs: 12000,
      maxRetries: 2,
      baseDelayMs: 250,
    });

    let feedback;
    try {
      const raw = completion.choices?.[0]?.message?.content || '';
      feedback = JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, ''));
    } catch {
      feedback = { assessment: 'Feedback analysis temporarily unavailable.', strengths: ['Good effort'], improvements: ['Try again'], tips: 'Continue practicing!' };
    }

    // Save feedback to database
    const { error: saveError } = await supabaseAdmin
      .from('interview_feedback')
      .insert({
        interview_id: id,
        user_id: req.user.id,
        question_index: questionIndex,
        answer_text: responseText.substring(0, 1000), // Store first 1000 chars
        feedback_content: feedback,
        created_at: new Date().toISOString()
      });

    if (saveError) console.error('Failed to save feedback:', saveError);

    res.json({ feedback });
  } catch (error) {
    console.error('Error generating feedback:', error);
    res.status(500).json({ error: 'Failed to generate feedback', message: error.message });
  }
});

// Get interview analytics
router.get('/analytics/overview', authenticateToken, getInterviewAnalytics);

// Get personalized recommendations
router.get('/recommendations', authenticateToken, getInterviewRecommendations);

// Transcribe audio (if audio file is sent)
router.post('/transcribe', authenticateToken, async (req, res) => {
  try {
    const { audioBuffer, language = 'en' } = req.body;

    if (!audioBuffer) {
      return res.status(400).json({ error: 'No audio provided' });
    }

    if (!groq) {
      return res.status(503).json({ error: 'Transcription unavailable' });
    }

    // Validate serialized audio payload without decoding arbitrary content.
    if (typeof audioBuffer === 'string') {
      const sanitizedBase64 = audioBuffer
        .replace(/^data:audio\/[a-z0-9.+-]+;base64,/i, '')
        .replace(/\s+/g, '');

      if (!sanitizedBase64 || !/^[A-Za-z0-9+/=]+$/.test(sanitizedBase64)) {
        return res.status(400).json({ error: 'Invalid audio payload format' });
      }

      const estimatedBytes = Math.floor((sanitizedBase64.length * 3) / 4);
      if (estimatedBytes > 25 * 1024 * 1024) {
        return res.status(413).json({ error: 'Audio payload too large' });
      }
    } else if (!Buffer.isBuffer(audioBuffer)) {
      return res.status(400).json({ error: 'Invalid audio payload type' });
    }

    // In production, you'd use a dedicated speech-to-text API like:
    // - OpenAI's Whisper API
    // - Google Cloud Speech-to-Text
    // - AWS Transcribe
    // For now, we'll return a placeholder
    // Real implementation would involve uploading to Groq's file API or another service

    res.json({
      transcript: 'Audio transcription would be processed here using a speech-to-text API',
      duration: 0,
      language
    });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    res.status(500).json({ error: 'Failed to transcribe audio', message: error.message });
  }
});

// Get feedback history for an interview
router.get('/:id/feedback', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: feedbacks, error } = await supabaseAdmin
      .from('interview_feedback')
      .select('*')
      .eq('interview_id', id)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({ feedbacks: feedbacks || [] });
  } catch (error) {
    console.error('Error fetching feedback history:', error);
    res.status(500).json({ error: 'Failed to fetch feedback', message: error.message });
  }
});

// Resume interview session (recovery endpoint)
router.post('/resume', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return sendError(res, ErrorCodes.VALIDATION_ERROR, 'Session ID is required');
    }

    // Look up the interview session by session ID
    // In a real implementation, you might store session metadata in a sessions table
    // For now, we'll validate the session exists and user has access
    const { data: interviews, error: queryError } = await supabaseAdmin
      .from('mock_interviews')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (queryError) {
      return sendError(res, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to retrieve session', {
        reason: queryError.message
      });
    }

    // Get the most recent interview (in production, would look up by sessionId)
    const interview = interviews?.[0];

    if (!interview) {
      return sendError(res, ErrorCodes.NOT_FOUND, 'No recoverable interview session found');
    }

    // Check if interview is recent enough (within 24 hours)
    const createdAt = new Date(interview.created_at).getTime();
    const now = Date.now();
    const ageMs = now - createdAt;
    const maxAgeMs = 24 * 60 * 60 * 1000; // 24 hours

    if (ageMs > maxAgeMs) {
      return sendError(res, ErrorCodes.SESSION_EXPIRED, 'Interview session has expired', {
        reason: 'Session is older than 24 hours'
      });
    }

    // Return the recoverable session data
    sendSuccess(res, {
      sessionId: interview.id,
      interviewType: interview.interview_type,
      difficulty: interview.difficulty,
      stage: interview.stage || 'technical',
      responses: interview.responses || [],
      currentQuestionIndex: interview.current_question_index || 0,
      totalQuestions: interview.questions?.length || 0,
      questionsAnswered: (interview.responses || []).length,
      createdAt: interview.created_at,
      canRecover: true,
    });
  } catch (error) {
    console.error('Error resuming interview:', error);
    sendError(res, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to resume interview', {
      reason: error.message
    });
  }
});

export default router;
