import { all425Problems } from '../data/allProblems.js';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('AgentTools');

// Built-in curated quiz bank for instant high-yield questions
const CURATED_QUIZZES = {
  'array': {
    id: 'quiz-array-1',
    topic: 'Arrays & Two Pointers',
    difficulty: 'Medium',
    question: 'In the Two-Pointer technique for "Container With Most Water", why do we always move the pointer pointing to the shorter vertical line inward?',
    options: [
      'Moving the shorter line might increase width and area',
      'Area is limited by the shorter line; keeping it cannot possibly yield a larger area as width decreases',
      'The taller line always causes an array index out of bounds exception',
      'It is arbitrary; moving either pointer yields an optimal O(N) solution'
    ],
    correctIndex: 1,
    explanation: 'The area is calculated as min(height[l], height[r]) * (r - l). Since the width (r - l) shrinks at each step, the only chance to find a larger area is if the bottleneck—the shorter line—is replaced by a taller one.'
  },
  'dynamic_programming': {
    id: 'quiz-dp-1',
    topic: 'Dynamic Programming',
    difficulty: 'Medium',
    question: 'What is the optimal time and space complexity for solving the "0/1 Knapsack" problem with N items and maximum weight W using space optimization?',
    options: [
      'Time: O(2^N), Space: O(N)',
      'Time: O(N * W), Space: O(W)',
      'Time: O(N + W), Space: O(1)',
      'Time: O(W * log N), Space: O(N * W)'
    ],
    correctIndex: 1,
    explanation: 'Using a 1D DP array traversed backwards from W down to item weight, we only need O(W) auxiliary space while evaluating N items in O(N * W) time.'
  },
  'trees': {
    id: 'quiz-trees-1',
    topic: 'Binary Search Trees',
    difficulty: 'Easy',
    question: 'Which tree traversal yields the elements of a Binary Search Tree (BST) in strictly ascending sorted order?',
    options: [
      'Pre-order traversal (Root -> Left -> Right)',
      'Post-order traversal (Left -> Right -> Root)',
      'In-order traversal (Left -> Root -> Right)',
      'Level-order traversal (BFS)'
    ],
    correctIndex: 2,
    explanation: 'For any BST node, all left subtree values are smaller and right subtree values are larger. In-order traversal visits Left, then Node, then Right, visiting all values in ascending order.'
  },
  'graphs': {
    id: 'quiz-graphs-1',
    topic: 'Graph Algorithms',
    difficulty: 'Medium',
    question: 'When finding the shortest path in a weighted graph with non-negative edge weights, which algorithm provides optimal O((V + E) log V) time complexity using a min-heap?',
    options: [
      'Bellman-Ford Algorithm',
      'Floyd-Warshall Algorithm',
      'Dijkstra\'s Algorithm',
      'Kruskal\'s Algorithm'
    ],
    correctIndex: 2,
    explanation: 'Dijkstra\'s algorithm with a binary min-priority queue achieves O((V + E) log V). Bellman-Ford is O(V * E) and handles negative weights, while Floyd-Warshall is O(V^3).'
  },
  'system_design': {
    id: 'quiz-sysdesign-1',
    topic: 'System Design',
    difficulty: 'Medium',
    question: 'Which consistency model ensures that once a read request returns a given value, all subsequent reads will return that value or a more recent one?',
    options: [
      'Eventual Consistency',
      'Monotonic Read Consistency',
      'Causal Consistency',
      'Weak Consistency'
    ],
    correctIndex: 1,
    explanation: 'Monotonic Read Consistency guarantees that if a process reads the value of data item X at time t, it will never see an older version of X at any subsequent time.'
  }
};

/**
 * Tool Specifications for OpenAI / Groq tool calling
 */
export const AGENT_TOOLS_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'get_user_context_and_stats',
      description: 'Fetch the authenticated user\'s current progress, solved problems count, interview performance, coins balance, and identified weak topics on PrepLoop.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_dsa_problems',
      description: 'Search DSA problems from PrepLoop\'s comprehensive problem bank (425+ problems) by pattern/topic, company tags, difficulty, or title keyword.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Keyword in problem title (e.g. "two sum", "lru", "invert")',
          },
          topic: {
            type: 'string',
            description: 'DSA topic/pattern (e.g., "Array", "Two Pointers", "Dynamic Programming", "Graph", "Tree", "Binary Search", "Heap", "Stack", "Linked List")',
          },
          difficulty: {
            type: 'string',
            enum: ['Easy', 'Medium', 'Hard'],
            description: 'Problem difficulty level',
          },
          company: {
            type: 'string',
            description: 'Target company tag (e.g., "Google", "Amazon", "Meta", "Microsoft", "Apple", "Uber")',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of problems to return (default: 5, max: 10)',
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'recommend_dsa_problem',
      description: 'Select targeted DSA problem(s) for the user to solve right now based on target company, topic, or weak area, providing 1-click solve links.',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'Topic or pattern to recommend',
          },
          difficulty: {
            type: 'string',
            enum: ['Easy', 'Medium', 'Hard'],
            description: 'Difficulty level',
          },
          company: {
            type: 'string',
            description: 'Target company (e.g. "Amazon", "Google")',
          },
          reason: {
            type: 'string',
            description: 'Concise 1-sentence pedagogical reason why this problem is recommended',
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'start_mock_interview',
      description: 'Configure and generate a 1-click launch session for a full AI Mock Interview tailored to a specific company, role, and round.',
      parameters: {
        type: 'object',
        properties: {
          company: {
            type: 'string',
            description: 'Target company (e.g. "Amazon", "Google", "Microsoft", "Meta", "TCS", "General")',
          },
          role: {
            type: 'string',
            description: 'Target job role (e.g. "SDE-1", "SDE-2", "Frontend Engineer", "Backend Engineer", "Fullstack", "Fresher")',
          },
          stage: {
            type: 'string',
            enum: ['Technical', 'Behavioral', 'System Design', 'Mixed'],
            description: 'Interview round focus',
          },
          difficulty: {
            type: 'string',
            enum: ['Easy', 'Medium', 'Hard'],
            description: 'Interview difficulty tier',
          },
        },
        required: ['company'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_interactive_quiz',
      description: 'Generate an interactive technical multiple-choice question in the chat for the user to test their knowledge immediately.',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'Topic to quiz (e.g. "Dynamic Programming", "Graphs", "Two Pointers", "Time Complexity", "System Design")',
          },
          difficulty: {
            type: 'string',
            enum: ['Easy', 'Medium', 'Hard'],
            description: 'Difficulty level',
          },
          question: {
            type: 'string',
            description: 'Custom question text if creating a new quiz question',
          },
          options: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of 4 distinct multiple-choice options',
          },
          correctIndex: {
            type: 'number',
            description: 'Zero-based index of the correct option (0 to 3)',
          },
          explanation: {
            type: 'string',
            description: 'In-depth explanation of why the correct option is right and others are wrong',
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_study_plan',
      description: 'Generate a structured multi-day interview preparation roadmap with milestone checkpoints, targeted problems, and mock interview practice.',
      parameters: {
        type: 'object',
        properties: {
          targetCompany: {
            type: 'string',
            description: 'Company being targeted (e.g. "Amazon", "Google", "Microsoft")',
          },
          targetRole: {
            type: 'string',
            description: 'Role (e.g. "SDE-2", "Junior Fullstack")',
          },
          timeframeDays: {
            type: 'number',
            description: 'Preparation timeline in days (e.g., 7, 14, 30)',
          },
          focusAreas: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific focus topics (e.g. ["Arrays & Hashing", "Dynamic Programming", "System Design"])',
          },
        },
        required: ['targetCompany'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_code_snippet',
      description: 'Analyze user-provided code for time/space complexity, potential edge cases, off-by-one errors, and optimization opportunities.',
      parameters: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'The source code snippet to analyze',
          },
          language: {
            type: 'string',
            description: 'Programming language (e.g. "javascript", "python", "java", "cpp")',
          },
          problemTitle: {
            type: 'string',
            description: 'Optional problem name or goal this code is intended to solve',
          },
        },
        required: ['code'],
        additionalProperties: false,
      },
    },
  },
];

/**
 * Tool Execution Handlers
 */
export async function executeAgentTool(toolName, args, context = {}) {
  const userId = context.userId;
  logger.info(`Executing tool: ${toolName}`, { args, userId });

  switch (toolName) {
    case 'get_user_context_and_stats': {
      const stats = {
        coins: 100,
        solvedCount: 0,
        streak: 1,
        recentScoreAvg: 75,
        weakTopics: ['Dynamic Programming', 'Graph Algorithms'],
        targetCompany: 'Google',
      };

      if (userId && supabaseAdmin) {
        try {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('coins, target_company, role')
            .eq('id', userId)
            .maybeSingle();

          if (profile) {
            stats.coins = profile.coins ?? stats.coins;
            stats.targetCompany = profile.target_company || stats.targetCompany;
            stats.targetRole = profile.role || 'Software Engineer';
          }

          // Check interview scores if available
          const { data: trends } = await supabaseAdmin
            .from('interview_performance_trends')
            .select('overall_score, weak_areas')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(3);

          if (trends && trends.length > 0) {
            const avg = Math.round(
              trends.reduce((sum, t) => sum + (Number(t.overall_score) || 75), 0) / trends.length
            );
            stats.recentScoreAvg = avg;
            const collectedWeaknesses = trends
              .flatMap((t) => t.weak_areas || [])
              .filter(Boolean);
            if (collectedWeaknesses.length > 0) {
              stats.weakTopics = [...new Set(collectedWeaknesses)].slice(0, 3);
            }
          }
        } catch (dbErr) {
          logger.warn('Failed to query user stats, using baseline', { error: dbErr?.message });
        }
      }

      return {
        thought: 'Inspected user profile, coins balance, and recent interview performance.',
        output: stats,
      };
    }

    case 'search_dsa_problems': {
      const { query, topic, difficulty, company, limit = 5 } = args || {};
      const maxResults = Math.min(Math.max(1, Number(limit) || 5), 10);

      let matched = all425Problems.filter((p) => {
        if (difficulty && p.difficulty?.toLowerCase() !== difficulty.toLowerCase()) {
          return false;
        }
        if (topic) {
          const tLower = topic.toLowerCase();
          const matchPattern = p.pattern?.toLowerCase().includes(tLower);
          const matchTitle = p.title?.toLowerCase().includes(tLower);
          if (!matchPattern && !matchTitle) return false;
        }
        if (company) {
          const cLower = company.toLowerCase();
          const hasCompany = (p.companies || []).some((c) => c.toLowerCase().includes(cLower));
          if (!hasCompany) return false;
        }
        if (query) {
          const qLower = query.toLowerCase();
          const matchTitle = p.title?.toLowerCase().includes(qLower);
          const matchPattern = p.pattern?.toLowerCase().includes(qLower);
          if (!matchTitle && !matchPattern) return false;
        }
        return true;
      });

      // If strict filter returns 0, try relaxing company or query
      if (matched.length === 0 && (company || topic)) {
        matched = all425Problems.filter((p) => {
          if (topic && p.pattern?.toLowerCase().includes(topic.toLowerCase())) return true;
          if (company && (p.companies || []).some((c) => c.toLowerCase().includes(company.toLowerCase()))) return true;
          return false;
        });
      }

      const results = matched.slice(0, maxResults).map((p) => ({
        id: p.id,
        title: p.title,
        pattern: p.pattern,
        difficulty: p.difficulty,
        companies: p.companies?.slice(0, 4) || [],
        url: `/dsa-editor/${p.id}`,
      }));

      // Create action cards for the top results
      const actionCards = results.slice(0, 3).map((p) => ({
        type: 'problem_card',
        data: p,
      }));

      return {
        thought: `Found ${results.length} DSA problem(s) matching criteria (${topic || 'all topics'}, ${difficulty || 'any'}, ${company || 'any'}).`,
        output: { count: results.length, problems: results },
        actionCards,
      };
    }

    case 'recommend_dsa_problem': {
      const { topic, difficulty, company, reason } = args || {};
      let candidates = all425Problems;

      if (difficulty) {
        candidates = candidates.filter((p) => p.difficulty?.toLowerCase() === difficulty.toLowerCase());
      }
      if (company) {
        candidates = candidates.filter((p) =>
          (p.companies || []).some((c) => c.toLowerCase().includes(company.toLowerCase()))
        );
      }
      if (topic) {
        candidates = candidates.filter((p) =>
          p.pattern?.toLowerCase().includes(topic.toLowerCase())
        );
      }

      if (candidates.length === 0) {
        candidates = all425Problems.slice(0, 10);
      }

      const selected = candidates[Math.floor(Math.random() * candidates.length)] || candidates[0];
      const problemData = {
        id: selected.id,
        title: selected.title,
        pattern: selected.pattern,
        difficulty: selected.difficulty,
        companies: selected.companies?.slice(0, 4) || [],
        url: `/dsa-editor/${selected.id}`,
        reason: reason || `Great practice problem for mastering ${selected.pattern} patterns.`,
      };

      return {
        thought: `Recommended "${selected.title}" (${selected.difficulty} ${selected.pattern}) for target practice.`,
        output: problemData,
        actionCards: [
          {
            type: 'problem_card',
            data: problemData,
          },
        ],
      };
    }

    case 'start_mock_interview': {
      const company = args?.company || 'General Tech';
      const role = args?.role || 'SDE-2';
      const stage = args?.stage || 'Technical';
      const difficulty = args?.difficulty || 'Medium';

      const launcherData = {
        company,
        role,
        stage,
        difficulty,
        url: `/company-interview?company=${encodeURIComponent(company.toLowerCase())}&role=${encodeURIComponent(role)}&stage=${encodeURIComponent(stage)}`,
        title: `${company} ${role} ${stage} Interview`,
        description: `Simulate a realistic live interview with adaptive questions, voice transcription, and comprehensive AI evaluation.`,
      };

      return {
        thought: `Prepared 1-click launch session for ${company} ${stage} mock interview.`,
        output: launcherData,
        actionCards: [
          {
            type: 'interview_launcher',
            data: launcherData,
          },
        ],
      };
    }

    case 'generate_interactive_quiz': {
      let quizData;
      const { topic, difficulty, question, options, correctIndex, explanation } = args || {};

      if (question && Array.isArray(options) && options.length >= 2 && typeof correctIndex === 'number') {
        quizData = {
          id: `quiz-custom-${Date.now()}`,
          topic: topic || 'Technical Assessment',
          difficulty: difficulty || 'Medium',
          question,
          options,
          correctIndex,
          explanation: explanation || 'Great job checking this solution!',
        };
      } else {
        // Fallback to vetted curated quiz
        const normalizedKey = (topic || '').toLowerCase().replace(/[^a-z]/g, '');
        const matchedKey = Object.keys(CURATED_QUIZZES).find((k) => normalizedKey.includes(k));
        quizData = CURATED_QUIZZES[matchedKey] || CURATED_QUIZZES['array'];
      }

      return {
        thought: `Generated interactive quiz on ${quizData.topic} (${quizData.difficulty}).`,
        output: {
          id: quizData.id,
          topic: quizData.topic,
          question: quizData.question,
          options: quizData.options,
        },
        actionCards: [
          {
            type: 'quiz_card',
            data: quizData,
          },
        ],
      };
    }

    case 'create_study_plan': {
      const company = args?.targetCompany || 'Top Tech';
      const role = args?.targetRole || 'Software Engineer';
      const days = Number(args?.timeframeDays) || 14;
      const focusAreas = args?.focusAreas || ['Arrays & Two Pointers', 'Trees & BSTs', 'Dynamic Programming', 'System Design'];

      // Pick relevant problems from dataset for milestones
      const sampleProblems = all425Problems
        .filter((p) => (p.companies || []).some((c) => c.toLowerCase().includes(company.toLowerCase())))
        .slice(0, 4);

      const milestones = [
        {
          dayRange: 'Day 1 - 3',
          focus: 'Core Data Structures & Pattern Foundations',
          tasks: [
            'Review Two Pointers & Sliding Window techniques',
            sampleProblems[0] ? `Solve "${sampleProblems[0].title}" (${sampleProblems[0].difficulty})` : 'Solve Two Sum and Container With Most Water',
            'Conduct a 20-min timed coding speed test',
          ],
        },
        {
          dayRange: 'Day 4 - 8',
          focus: 'Advanced Problem Solving & Graphs/Trees',
          tasks: [
            'Deep dive on Tree traversals and Graph BFS/DFS',
            sampleProblems[1] ? `Solve "${sampleProblems[1].title}" (${sampleProblems[1].difficulty})` : 'Solve Course Schedule and Number of Islands',
            'Practice explaining algorithmic complexity out loud',
          ],
        },
        {
          dayRange: 'Day 9 - 12',
          focus: 'Dynamic Programming & System Design Core',
          tasks: [
            '1D & 2D DP memoization and tabulation patterns',
            sampleProblems[2] ? `Solve "${sampleProblems[2].title}" (${sampleProblems[2].difficulty})` : 'Solve Coin Change and Longest Increasing Subsequence',
            'Review caching, rate limiting, and database sharding',
          ],
        },
        {
          dayRange: `Day 13 - ${days}`,
          focus: 'Full Mock Interview Simulations & Polish',
          tasks: [
            `Complete full ${company} ${role} Mock Interview on PrepLoop`,
            'Review detailed feedback score breakdown',
            'Final brush-up on behavioral STAR stories',
          ],
        },
      ];

      const planData = {
        title: `${days}-Day ${company} ${role} Preparation Roadmap`,
        targetCompany: company,
        role,
        days,
        focusAreas,
        milestones,
      };

      return {
        thought: `Generated structured ${days}-day study roadmap for ${company} ${role}.`,
        output: planData,
        actionCards: [
          {
            type: 'study_plan_card',
            data: planData,
          },
        ],
      };
    }

    case 'analyze_code_snippet': {
      const { code, language = 'javascript', problemTitle } = args || {};
      
      // Static algorithmic analyzer
      const lineCount = code.split('\n').length;
      const hasNestedLoops = /for\s*\(.*for\s*\(|while\s*\(.*while\s*\(/.test(code);
      const hasRecursion = /function\s+(\w+)\s*\(.*?\)\s*\{[\s\S]*?\1\s*\(/.test(code);
      const hasMapOrSet = /new\s+(Map|Set)\b|HashMap|HashSet|dict\(\)|set\(\)/.test(code);

      let estimatedTime = 'O(N)';
      let estimatedSpace = 'O(1)';

      if (hasNestedLoops) {
        estimatedTime = 'O(N^2)';
      } else if (hasRecursion) {
        estimatedTime = 'O(2^N) or O(N log N)';
        estimatedSpace = 'O(N) recursion stack';
      }

      if (hasMapOrSet) {
        estimatedSpace = 'O(N) hash space';
      }

      const analysisData = {
        problemTitle: problemTitle || 'Code Review',
        language,
        metrics: {
          lines: lineCount,
          estimatedTimeComplexity: estimatedTime,
          estimatedSpaceComplexity: estimatedSpace,
        },
        observations: [
          hasNestedLoops ? 'Nested loop detected; evaluate if a HashMap, Two Pointers, or Sorting can reduce this to O(N) or O(N log N).' : 'Linear scanning detected, good time complexity profile.',
          hasMapOrSet ? 'Utilizes auxiliary hash lookup for O(1) average time query.' : 'Constant auxiliary space utilized.',
        ],
        checklist: [
          'Verify edge cases: Empty input array, single element, negative numbers, overflow boundaries.',
          'Check pointer boundary conditions (< vs <=) to prevent off-by-one errors.',
        ],
      };

      return {
        thought: `Analyzed ${language} snippet (${lineCount} lines) for complexity and edge cases.`,
        output: analysisData,
      };
    }

    default:
      return {
        thought: `Unrecognized tool call: ${toolName}`,
        output: { error: `Tool ${toolName} not supported.` },
      };
  }
}

