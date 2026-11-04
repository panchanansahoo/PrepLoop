import { describe, it, expect } from 'vitest';
import { executeAgentTool, AGENT_TOOLS_DEFINITIONS } from '../../services/agentTools.js';
import { runAgenticChat } from '../../services/agenticChatService.js';

describe('Agentic AI Tools & Registry', () => {
  it('has valid tool definitions with expected schemas', () => {
    expect(AGENT_TOOLS_DEFINITIONS).toBeInstanceOf(Array);
    const toolNames = AGENT_TOOLS_DEFINITIONS.map((t) => t.function.name);

    expect(toolNames).toContain('get_user_context_and_stats');
    expect(toolNames).toContain('search_dsa_problems');
    expect(toolNames).toContain('recommend_dsa_problem');
    expect(toolNames).toContain('start_mock_interview');
    expect(toolNames).toContain('generate_interactive_quiz');
    expect(toolNames).toContain('create_study_plan');
    expect(toolNames).toContain('analyze_code_snippet');
  });

  it('searches DSA problems and returns action cards with urls', async () => {
    const result = await executeAgentTool('search_dsa_problems', {
      company: 'Amazon',
      difficulty: 'Easy',
      limit: 3,
    });

    expect(result.thought).toContain('Found');
    expect(result.output.problems.length).toBeGreaterThan(0);
    expect(result.output.problems[0].url).toMatch(/^\/dsa-editor\/\d+/);
    expect(result.actionCards).toBeDefined();
    expect(result.actionCards[0].type).toBe('problem_card');
  });

  it('recommends DSA problem with pedagogical reason', async () => {
    const result = await executeAgentTool('recommend_dsa_problem', {
      topic: 'Array',
      difficulty: 'Medium',
      company: 'Google',
      reason: 'Reinforces sliding window pattern for Google tech screens',
    });

    expect(result.output.title).toBeDefined();
    expect(result.output.reason).toContain('sliding window');
    expect(result.actionCards[0].type).toBe('problem_card');
  });

  it('configures 1-click mock interview launcher', async () => {
    const result = await executeAgentTool('start_mock_interview', {
      company: 'Amazon',
      role: 'SDE-2',
      stage: 'Technical',
    });

    expect(result.output.company).toBe('Amazon');
    expect(result.output.url).toContain('/company-interview');
    expect(result.output.url).toContain('company=amazon');
    expect(result.actionCards[0].type).toBe('interview_launcher');
  });

  it('generates an interactive quiz with options and explanation', async () => {
    const result = await executeAgentTool('generate_interactive_quiz', {
      topic: 'trees',
    });

    expect(result.output.question).toBeDefined();
    expect(result.output.options).toHaveLength(4);
    expect(result.actionCards[0].type).toBe('quiz_card');
    expect(result.actionCards[0].data.correctIndex).toBeGreaterThanOrEqual(0);
    expect(result.actionCards[0].data.explanation).toBeDefined();
  });

  it('creates a multi-day study plan with milestones', async () => {
    const result = await executeAgentTool('create_study_plan', {
      targetCompany: 'Meta',
      timeframeDays: 14,
    });

    expect(result.output.targetCompany).toBe('Meta');
    expect(result.output.milestones.length).toBeGreaterThanOrEqual(3);
    expect(result.actionCards[0].type).toBe('study_plan_card');
  });

  it('analyzes code snippet and estimates complexity', async () => {
    const code = `
      function twoSum(nums, target) {
        const map = new Map();
        for (let i = 0; i < nums.length; i++) {
          const complement = target - nums[i];
          if (map.has(complement)) return [map.get(complement), i];
          map.set(nums[i], i);
        }
        return [];
      }
    `;

    const result = await executeAgentTool('analyze_code_snippet', {
      code,
      language: 'javascript',
      problemTitle: 'Two Sum',
    });

    expect(result.output.metrics.estimatedTimeComplexity).toBe('O(N)');
    expect(result.output.metrics.estimatedSpaceComplexity).toContain('O(N)');
    expect(result.output.observations.length).toBeGreaterThan(0);
  });
});

describe('Agentic Chat Execution & Resilience', () => {
  it('runs agentic chat execution in fallback/resilient mode without throwing', async () => {
    const result = await runAgenticChat({
      userId: 'test-user-id',
      message: 'Can you quiz me on arrays?',
      history: [],
    });

    expect(result).toBeDefined();
    expect(result.response).toBeTruthy();
    expect(result.thoughtProcess).toBeInstanceOf(Array);
    expect(result.actions).toBeInstanceOf(Array);
    expect(result.suggestions).toBeInstanceOf(Array);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it('handles interview preparation queries with mock interview cards', async () => {
    const result = await runAgenticChat({
      userId: 'test-user-id',
      message: 'I want to practice for an Amazon mock interview',
      history: [],
    });

    expect(result).toBeDefined();
    expect(result.actions.some((a) => a.type === 'interview_launcher' || a.type === 'problem_card')).toBe(true);
  });
});

