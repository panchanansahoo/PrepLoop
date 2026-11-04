import { getGroqClient } from '../utils/groqClient.js';
import { aiCallWithRetry } from '../utils/aiClient.js';
import { createLogger } from '../utils/structuredLogger.js';
import { AGENT_TOOLS_DEFINITIONS, executeAgentTool } from './agentTools.js';

const logger = createLogger('AgenticChatService');

const AGENT_SYSTEM_PROMPT = `You are PrepLoop Agentic AI Co-Pilot — an intelligent coding interview preparation coach and career strategist.
You don't just talk; you take proactive actions! You have access to real platform tools to inspect data, retrieve curated problems, generate quizzes, and configure mock interviews.

## Capabilities & Tool Usage:
1. Always use 'get_user_context_and_stats' if the user asks about their progress, weak areas, or what they should focus on next.
2. Always use 'search_dsa_problems' or 'recommend_dsa_problem' when the user asks for coding problems, algorithmic patterns, or company-specific questions (Google, Amazon, etc.).
3. Always use 'start_mock_interview' when the user wants to practice an interview, simulate a company round, or asks how to prepare for an upcoming interview.
4. Always use 'generate_interactive_quiz' when the user wants to test their knowledge, asks for a quiz/riddle, or finishes discussing a technical concept.
5. Always use 'create_study_plan' when the user asks for a prep roadmap, schedule, or time-bound study guide.
6. Always use 'analyze_code_snippet' when the user pastes code and asks for review, complexity, or edge case analysis.

## Style & Tone:
- Professional, supportive, and pedagogical (like a senior tech lead mentor).
- Keep text concise and actionable with Markdown formatting.
- Let the interactive platform cards accompany your explanation.`;

const MAX_ITERATIONS = 4;

/**
 * Generate contextual follow-up suggestions based on response & actions
 */
function generateContextualSuggestions(message, actions = []) {
  const lower = (message || '').toLowerCase();
  const suggestions = [];

  const hasProblemCard = actions.some((a) => a.type === 'problem_card');
  const hasInterviewCard = actions.some((a) => a.type === 'interview_launcher');
  const hasQuizCard = actions.some((a) => a.type === 'quiz_card');
  const hasStudyPlanCard = actions.some((a) => a.type === 'study_plan_card');

  if (hasProblemCard) {
    suggestions.push('Give me an optimal hint for this problem');
    suggestions.push('Show me a harder variation');
  }

  if (hasInterviewCard) {
    suggestions.push('What are the top 3 behavioral questions for this role?');
    suggestions.push('Test my knowledge with a quick quiz first');
  }

  if (hasQuizCard) {
    suggestions.push('Give me another quiz on this topic');
    suggestions.push('Recommend a DSA problem to practice this');
  }

  if (hasStudyPlanCard) {
    suggestions.push('Start a mock interview for Day 1');
    suggestions.push('Focus more on Dynamic Programming');
  }

  // Fallbacks if fewer than 2 suggestions
  if (suggestions.length < 3) {
    if (lower.includes('amazon') || lower.includes('google')) {
      suggestions.push('Launch full mock interview');
      suggestions.push('Show high-frequency company problems');
    } else {
      suggestions.push('Analyze my weak areas');
      suggestions.push('Quiz me on Tree traversals');
      suggestions.push('Recommend an Easy DSA problem');
    }
  }

  return [...new Set(suggestions)].slice(0, 3);
}

/**
 * Heuristic fallback agent when LLM is unavailable or fails tool calling
 */
async function runHeuristicAgentFallback(userId, message) {
  const lower = (message || '').toLowerCase();
  const thoughtProcess = ['Running in high-reliability fallback mode'];
  const actions = [];
  let responseText;

  if (lower.includes('quiz') || lower.includes('test me') || lower.includes('question')) {
    thoughtProcess.push('Generating interactive technical quiz');
    const quizTool = await executeAgentTool('generate_interactive_quiz', { topic: 'Arrays' }, { userId });
    actions.push(...(quizTool.actionCards || []));
    responseText = "Here is a high-yield technical question to test your algorithmic problem solving. Select an answer below to check your understanding!";
  } else if (lower.includes('interview') || lower.includes('mock') || lower.includes('amazon') || lower.includes('google')) {
    const company = lower.includes('google') ? 'Google' : lower.includes('microsoft') ? 'Microsoft' : 'Amazon';
    thoughtProcess.push(`Configuring 1-click ${company} mock interview`);
    const interviewTool = await executeAgentTool('start_mock_interview', { company, role: 'SDE-2' }, { userId });
    actions.push(...(interviewTool.actionCards || []));

    const problemTool = await executeAgentTool('search_dsa_problems', { company, limit: 2 }, { userId });
    actions.push(...(problemTool.actionCards || []));

    responseText = `I have set up a personalized **${company} SDE-2 Interview** session for you, along with top high-frequency practice problems from our question bank. Click below to launch your session or start coding!`;
  } else if (lower.includes('problem') || lower.includes('dsa') || lower.includes('solve')) {
    thoughtProcess.push('Searching top curated DSA problems');
    const problemTool = await executeAgentTool('search_dsa_problems', { limit: 3 }, { userId });
    actions.push(...(problemTool.actionCards || []));
    responseText = "Here are curated DSA problems from PrepLoop's 425+ problem bank to sharpen your patterns. Click **Solve Now** on any card to jump straight into the interactive code editor!";
  } else {
    thoughtProcess.push('Retrieved default prep recommendations');
    const problemTool = await executeAgentTool('recommend_dsa_problem', {}, { userId });
    actions.push(...(problemTool.actionCards || []));
    responseText = "Welcome! I'm your PrepLoop Agentic Co-Pilot. I can help you master Data Structures & Algorithms, run realistic AI mock interviews, test your skills with in-chat quizzes, or design a custom study roadmap.";
  }

  return {
    response: responseText,
    thoughtProcess,
    actions,
    suggestions: generateContextualSuggestions(message, actions),
    degraded: true,
  };
}

/**
 * Main Agentic Chat Runner
 */
export async function runAgenticChat({ userId, message, history = [] }) {
  const groq = getGroqClient();

  if (!groq) {
    logger.warn('Groq client not configured, falling back to heuristic agent');
    return runHeuristicAgentFallback(userId, message);
  }

  try {
    const messages = [
      { role: 'system', content: AGENT_SYSTEM_PROMPT },
      ...history.slice(-8).map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    const thoughtProcess = [];
    const collectedActions = [];
    let iteration = 0;
    let finalContent = '';

    while (iteration < MAX_ITERATIONS) {
      iteration++;

      const completion = await aiCallWithRetry({
        operation: () =>
          groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages,
            tools: AGENT_TOOLS_DEFINITIONS,
            tool_choice: 'auto',
            temperature: 0.6,
            max_tokens: 1200,
          }),
        timeoutMs: 14000,
        maxRetries: 1,
        baseDelayMs: 300,
      });

      const choice = completion.choices[0];
      const responseMessage = choice?.message;

      if (!responseMessage) {
        break;
      }

      // Check if tool calls were emitted
      const toolCalls = responseMessage.tool_calls;

      if (!toolCalls || toolCalls.length === 0) {
        finalContent = responseMessage.content || '';
        break;
      }

      // Append assistant's tool-call request to messages
      messages.push(responseMessage);

      // Execute each tool call
      for (const toolCall of toolCalls) {
        const fnName = toolCall.function.name;
        let fnArgs = {};
        try {
          fnArgs = JSON.parse(toolCall.function.arguments || '{}');
        } catch {
          fnArgs = {};
        }

        const execution = await executeAgentTool(fnName, fnArgs, { userId });

        if (execution.thought) {
          thoughtProcess.push(execution.thought);
        }

        if (execution.actionCards && Array.isArray(execution.actionCards)) {
          collectedActions.push(...execution.actionCards);
        }

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: fnName,
          content: JSON.stringify(execution.output ?? {}),
        });
      }
    }

    if (!finalContent) {
      finalContent =
        "I've processed your request and surfaced the relevant problems and actions for you below. Let me know what you'd like to explore next!";
    }

    // Deduplicate actions by type + id / title
    const seenActionKeys = new Set();
    const uniqueActions = collectedActions.filter((action) => {
      const key = `${action.type}_${action.data?.id || action.data?.title || action.data?.company || ''}`;
      if (seenActionKeys.has(key)) return false;
      seenActionKeys.add(key);
      return true;
    });

    const suggestions = generateContextualSuggestions(message, uniqueActions);

    return {
      response: finalContent,
      thoughtProcess,
      actions: uniqueActions,
      suggestions,
      degraded: false,
    };
  } catch (error) {
    logger.error('Agentic chat execution failed, using fallback', { error: error.message });
    return runHeuristicAgentFallback(userId, message);
  }
}

