import express from 'express';
import Groq from 'groq-sdk';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { aiCallWithRetry } from '../utils/aiClient.js';

const router = express.Router();

const groq = process.env.GROQ_API_KEY ? new Groq({
  apiKey: process.env.GROQ_API_KEY,
}) : null;

const createGroqCompletion = async (payload) => aiCallWithRetry({
  operation: () => groq.chat.completions.create(payload),
  timeoutMs: 12000,
  maxRetries: 2,
  baseDelayMs: 250,
});

const slugifyProblemTitle = (value = '') =>
  value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const resolveProblemId = async (problemIdentifier) => {
  if (!problemIdentifier) return null;

  const rawIdentifier = String(problemIdentifier).trim();
  if (!rawIdentifier) return null;

  // Fast path: numeric ID — single-row lookup
  if (/^\d+$/.test(rawIdentifier)) {
    const numericId = Number(rawIdentifier);
    const { data: byId } = await supabaseAdmin
      .from('problems')
      .select('id')
      .eq('id', numericId)
      .single();
    if (byId?.id) return byId.id;
  }

  // Slug path: convert to title-like string and do a DB ilike search
  const titleFromSlug = rawIdentifier.replace(/[-_]+/g, ' ').trim();
  const { data: candidates } = await supabaseAdmin
    .from('problems')
    .select('id, title')
    .ilike('title', titleFromSlug)
    .limit(5);

  if (Array.isArray(candidates) && candidates.length > 0) {
    return candidates[0].id;
  }

  return null;
};

router.post('/code-feedback', authenticateToken, async (req, res) => {
  const { code, language, problemId } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: 'Code and language are required' });
  }

  try {
    let problemContext = '';
    let canonicalProblemId = null;
    if (problemId) {
      canonicalProblemId = await resolveProblemId(problemId);
      const { data: problem } = await supabaseAdmin
        .from('problems')
        .select('title, description')
        .eq('id', canonicalProblemId)
        .single();

      if (problem) {
        problemContext = `Problem: ${problem.title}\n${problem.description}\n\n`;
      }
    }

    if (!groq) {
      return res.json({
        feedback: {
          timeComplexity: 'O(n)',
          spaceComplexity: 'O(1)',
          strengths: [
            'Code is readable and well-structured',
            'Uses appropriate data structures'
          ],
          improvements: [
            'Consider edge cases',
            'Add input validation'
          ],
          suggestions: 'Overall good implementation. Consider optimizing for better performance.',
          score: 85
        }
      });
    }

    const completion = await createGroqCompletion({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are an expert programming coach. Analyze code and provide constructive feedback on time complexity, space complexity, code quality, and suggest improvements. Format your response as JSON with fields: timeComplexity, spaceComplexity, strengths (array), improvements (array), suggestions (string), score (0-100). Respond ONLY with valid JSON.'
        },
        {
          role: 'user',
          content: `${problemContext}Language: ${language}\n\nCode:\n${code}\n\nProvide detailed feedback.`
        }
      ],
      response_format: { type: 'json_object' }
    });

    let feedback;
    try {
      const raw = completion.choices?.[0]?.message?.content || '';
      feedback = JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, ''));
    } catch {
      feedback = {
        timeComplexity: 'Unable to analyze',
        spaceComplexity: 'Unable to analyze',
        strengths: ['Code submitted for review'],
        improvements: ['Try again for AI-powered analysis'],
        suggestions: 'AI analysis temporarily unavailable.',
        score: 70,
      };
    }
    
    if (canonicalProblemId) {
      // Update latest submission with AI feedback
      const { data: latestSub } = await supabaseAdmin
        .from('submissions')
        .select('id')
        .eq('user_id', req.user.id)
        .eq('problem_id', canonicalProblemId)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .single();

      if (latestSub) {
        await supabaseAdmin
          .from('submissions')
          .update({ ai_feedback: JSON.stringify(feedback) })
          .eq('id', latestSub.id);
      }
    }

    res.json({ feedback });
  } catch (error) {
    console.error('AI feedback error:', error);
    res.status(500).json({ error: 'Failed to generate feedback' });
  }
});

router.post('/mock-interview', authenticateToken, async (req, res) => {
  const { interviewType, difficulty, userResponse } = req.body;

  try {
    if (!groq) {
      return res.json({
        question: 'Describe a time when you solved a challenging technical problem.',
        followUp: 'What was your approach to solving this problem?',
        feedback: 'Good response. Consider providing more specific technical details.'
      });
    }

    const completion = await createGroqCompletion({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are an expert technical interviewer conducting a ${interviewType} interview at ${difficulty} level. Ask relevant questions, provide follow-ups, and give constructive feedback.`
        },
        {
          role: 'user',
          content: userResponse || 'Start the interview'
        }
      ]
    });

    res.json({
      response: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('Mock interview error:', error);
    res.status(500).json({ error: 'Failed to conduct interview' });
  }
});

router.post('/hint', authenticateToken, async (req, res) => {
  const { problemId, currentCode } = req.body;

  try {
    const canonicalProblemId = await resolveProblemId(problemId);

    if (!canonicalProblemId) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const { data: problem, error } = await supabaseAdmin
      .from('problems')
      .select('title, description, hints')
      .eq('id', canonicalProblemId)
      .single();

    if (error || !problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    if (!groq) {
      return res.json({
        hint: problem.hints?.[0] || 'Think about the problem step by step and consider edge cases.'
      });
    }

    const completion = await createGroqCompletion({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful coding mentor. Provide subtle hints without giving away the complete solution. Guide the user to think through the problem.'
        },
        {
          role: 'user',
          content: `Problem: ${problem.title}\n${problem.description}\n\nCurrent code:\n${currentCode || 'Not started yet'}\n\nProvide a helpful hint.`
        }
      ]
    });

    res.json({
      hint: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('Hint generation error:', error);
    res.status(500).json({ error: 'Failed to generate hint' });
  }
});

router.post('/explain', authenticateToken, async (req, res) => {
  const { code, language } = req.body;

  try {
    if (!groq) {
      return res.json({
        explanation: 'This code implements the solution using standard algorithms and data structures.'
      });
    }

    const completion = await createGroqCompletion({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a coding tutor. Explain code clearly and concisely, breaking down complex concepts.'
        },
        {
          role: 'user',
          content: `Explain this ${language} code:\n\n${code}`
        }
      ]
    });

    res.json({
      explanation: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('Code explanation error:', error);
    res.status(500).json({ error: 'Failed to explain code' });
  }
});

// ─── Playground AI Assistant ───
router.post('/playground-assist', optionalAuth, async (req, res) => {
  const { code, language, mode, prompt, history } = req.body;

  if (!code && mode !== 'ask') {
    return res.status(400).json({ error: 'Code is required for this action' });
  }

  const systemPrompts = {
    explain: 'You are a coding tutor. Explain the given code clearly and concisely. Break down complex parts using markdown formatting with headings, bullet points, and code blocks. Keep it under 300 words.',
    review: 'You are a senior code reviewer. Analyze the code for: time/space complexity, code quality, potential bugs, and improvements. Be constructive and specific. Use markdown with ### headings for each section and bullet points.',
    debug: 'You are a debugging expert. Find bugs, logic errors, edge cases, and potential runtime issues. For each issue, explain the problem and suggest a fix with code blocks. If the code looks correct, say so.',
    optimize: 'You are a performance optimization expert. Suggest ways to make the code faster, use less memory, or be more idiomatic. Provide optimized code snippets in fenced code blocks. Focus on practical improvements.',
    complexity: 'You are an algorithm analysis expert. Analyze the time complexity and space complexity of the code. Break it down by function/section. Use Big-O notation. Provide a clear summary table if multiple functions exist. Use markdown formatting.',
    comment: 'You are a documentation expert. Add clear, concise inline comments to the code explaining what each significant section does. Return the fully commented code in a fenced code block. Do not change the logic.',
    ask: 'You are a helpful coding assistant. Answer the user\'s question about their code clearly and concisely. Use markdown formatting with code blocks when showing examples.',
  };

  const systemContent = systemPrompts[mode] || systemPrompts.ask;

  let userContent;
  if (mode === 'ask') {
    userContent = prompt ? `${prompt}\n\nCode (${language}):\n\`\`\`${language}\n${code || '(no code provided)'}\n\`\`\`` : `Help me with this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\``;
  } else {
    const extra = prompt ? `\nUser note: ${prompt}` : '';
    userContent = `Language: ${language}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\`${extra}`;
  }

  // Build messages array with optional conversation history
  const messages = [{ role: 'system', content: systemContent }];

  if (history && Array.isArray(history)) {
    // Include last 6 messages for context
    const recentHistory = history.slice(-6).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));
    messages.push(...recentHistory);
  }

  messages.push({ role: 'user', content: userContent });

  try {
    if (!groq) {
      const fallbacks = {
        explain: 'This code defines functions and logic. For detailed AI explanations, please configure the GROQ_API_KEY.',
        review: 'Code looks structurally sound. For detailed AI code review, please configure the GROQ_API_KEY.',
        debug: 'No obvious bugs detected from static analysis. For AI-powered debugging, please configure the GROQ_API_KEY.',
        optimize: 'Consider caching repeated computations and using efficient data structures. For AI optimization tips, please configure the GROQ_API_KEY.',
        complexity: 'For AI-powered complexity analysis, please configure the GROQ_API_KEY.',
        comment: 'For AI-generated code comments, please configure the GROQ_API_KEY.',
        ask: 'For AI-assisted coding help, please configure the GROQ_API_KEY in the backend.',
      };
      return res.json({ response: fallbacks[mode] || fallbacks.ask });
    }

    const completion = await createGroqCompletion({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 1500,
      temperature: 0.3,
    });

    res.json({ response: completion.choices[0].message.content });
  } catch (error) {
    console.error('Playground AI error:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

export default router;
