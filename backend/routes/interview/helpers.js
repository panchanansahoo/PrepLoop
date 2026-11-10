import { getGroqClient } from '../../utils/groqClient.js';
import { supabaseAdmin } from '../../db/supabaseClient.js';
import { aiCallWithRetry } from '../../utils/aiClient.js';
import { applyCoinTransaction } from '../../utils/coinTransactions.js';

export const groq = getGroqClient();
export const INTERVIEW_START_COIN_COST = Number(process.env.AI_INTERVIEW_COIN_COST || 5);

export const spendCoinsForInterviewStart = async (userId, cost, referenceKey = null) => {
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

export const refundCoinsForInterviewStartFailure = async (userId, cost, referenceKey = null) => {
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

export const getFallbackQuestions = (type, difficulty) => {
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

export function buildInterviewAnalytics(interviews = []) {
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

  const scores = interviews.map((interview) => interview.overall_score || 0);
  const averageOverallScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / totalInterviews);
  const averageCommunicationScore = Math.round(
    interviews.reduce((sum, interview) => sum + (interview.communication_score || 0), 0) / totalInterviews
  );
  const averageTechnicalScore = Math.round(
    interviews.reduce((sum, interview) => sum + (interview.technical_score || 0), 0) / totalInterviews
  );
  const averageProblemSolvingScore = Math.round(
    interviews.reduce((sum, interview) => sum + (interview.problem_solving_score || 0), 0) / totalInterviews
  );

  const bestScore = Math.max(...scores);
  const mean = scores.reduce((sum, score) => sum + score, 0) / totalInterviews;
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

export const generateAIQuestion = async (type, difficulty, previousQuestions = []) => {
  if (!groq) return null;

  try {
    const MAX_PREV_QUESTIONS = 10;
    const MAX_PREV_QUESTION_LEN = 300;

    const safePrevious = (Array.isArray(previousQuestions) ? previousQuestions.slice(-MAX_PREV_QUESTIONS) : [])
      .map(q => {
        const text = typeof q === 'object' && q !== null
          ? (q.question || q.text || '')
          : (typeof q === 'string' ? q : '');
        return String(text)
          .replace(/[\r\n\t]/g, ' ')
          .replace(/["\\]/g, '')
          .trim()
          .slice(0, MAX_PREV_QUESTION_LEN);
      })
      .filter(Boolean);

    const completion = await aiCallWithRetry({
      operation: () => groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are an expert technical interviewer. Generate a unique ${difficulty} ${type} interview question suitable for a STUDENT or RECENT GRADUATE.
          The candidate may have limited professional experience — frame questions around college projects, internships, coursework, or learning.
          Also provide a brief "context" or hint for the interviewer (or candidate) to understand what to focus on.${safePrevious.length > 0 ? `\n          Avoid repeating these previously asked questions: ${JSON.stringify(safePrevious)}.` : ''}
          
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
      parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, ''));
    } catch {
      return null;
    }
    return parsed;
  } catch (error) {
    console.error('Groq generation error:', error);
    return null;
  }
};

