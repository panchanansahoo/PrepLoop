import express from 'express';
import { supabaseAdmin } from '../../db/supabaseClient.js';
import { authenticateToken } from '../../middleware/auth.ts';
import { aiCallWithRetry } from '../../utils/aiClient.js';
import { groq } from './helpers.js';
import { feedbackStreamLimiter, aiEndpointsLimiter } from '../../middleware/apiRateLimiter.js';

const router = express.Router();

const MAX_FEEDBACK_ANSWER_LENGTH = 1000;
const MAX_FEEDBACK_QUESTION_LENGTH = 500;

router.post('/:id/feedback', authenticateToken, aiEndpointsLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { questionIndex, answerText, audioTranscript, answer } = req.body;

    if (!groq) {
      return res.status(503).json({ error: 'AI feedback unavailable' });
    }

    const rawResponse = answer || answerText || audioTranscript || '';
    if (!rawResponse || (typeof rawResponse !== 'string' && typeof rawResponse !== 'number')) {
      return res.status(400).json({ error: 'Invalid question or response' });
    }

    // AI1: Cap responseText before sending to AI to prevent unbounded payloads
    const responseText = String(rawResponse).trim().slice(0, MAX_FEEDBACK_ANSWER_LENGTH);
    if (!responseText) {
      return res.status(400).json({ error: 'Invalid question or response' });
    }

    let question = req.body?.questionText || req.body?.question;

    if (!question && id !== '0') {
      try {
        const { data: interview, error: fetchError } = await supabaseAdmin
          .from('mock_interviews')
          .select('*')
          .eq('id', id)
          .eq('user_id', req.user.id)
          .single();

        if (!fetchError && interview?.questions) {
          question = interview.questions[questionIndex];
        }
      } catch (err) {
        console.warn('Mock interview lookup skipped:', err.message);
      }
    }

    const questionTitle = typeof question === 'object' && question !== null
      ? (question.question || question.text || `Technical Interview Question #${(Number(questionIndex) || 0) + 1}`)
      : (question || `Technical Interview Question #${(Number(questionIndex) || 0) + 1}`);
    const questionContext = typeof question === 'object' && question !== null && question.context
      ? String(question.context).slice(0, MAX_FEEDBACK_QUESTION_LENGTH)
      : '';
    const safeQuestion = String(questionTitle).slice(0, MAX_FEEDBACK_QUESTION_LENGTH);

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
            content: `Question: "${safeQuestion}"\n${questionContext ? `Context: ${questionContext}\n` : ''}Candidate's Answer: "${responseText}"`
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

    const { error: saveError } = await supabaseAdmin
      .from('interview_feedback')
      .insert({
        interview_id: id,
        user_id: req.user.id,
        question_index: questionIndex,
        answer_text: responseText,
        feedback_content: feedback,
        created_at: new Date().toISOString()
      });

    if (saveError) console.error('Failed to save feedback:', saveError);

    res.json({ feedback });
  } catch (error) {
    console.error('Error generating feedback:', error);
    res.status(500).json({
      error: 'Failed to generate feedback',
      ...(process.env.NODE_ENV === 'development' ? { message: error.message } : {})
    });
  }
});

// SSE Streaming feedback endpoint for real-time AI responses
// AI5: Rate limiter applied to prevent unlimited parallel stream consumption
router.post('/:id/feedback/stream', authenticateToken, feedbackStreamLimiter, async (req, res) => {
  const { questionIndex = 0, answerText, audioTranscript, answer } = req.body;
  const rawResponse = answer || answerText || audioTranscript || '';

  if (!rawResponse || (typeof rawResponse !== 'string' && typeof rawResponse !== 'number')) {
    return res.status(400).json({ error: 'Invalid question or response' });
  }

  // AI1: Cap responseText before sending to AI streaming endpoint
  const responseText = String(rawResponse).trim().slice(0, MAX_FEEDBACK_ANSWER_LENGTH);
  if (!responseText) {
    return res.status(400).json({ error: 'Invalid question or response' });
  }

  if (!groq) {
    return res.status(503).json({ error: 'AI streaming feedback unavailable' });
  }

  const rawQuestion = req.body?.questionText || req.body?.question || `Question #${Number(questionIndex) + 1}`;
  const safeQuestion = String(
    typeof rawQuestion === 'object' && rawQuestion !== null
      ? (rawQuestion.question || rawQuestion.text || 'Interview Question')
      : rawQuestion
  ).slice(0, MAX_FEEDBACK_QUESTION_LENGTH);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  let isAborted = false;
  req.on('close', () => { isAborted = true; });

  try {
    const stream = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: 'You are an expert interview coach. Provide immediate, constructive real-time feedback on the candidate\'s response. Focus on key strengths and actionable improvements. Keep tone encouraging and professional.'
        },
        {
          role: 'user',
          content: `Question: "${safeQuestion}"\nCandidate's Answer: "${responseText}"`
        }
      ],
      stream: true,
      max_tokens: 350,
    });

    for await (const chunk of stream) {
      if (isAborted) break;
      const token = chunk.choices[0]?.delta?.content || '';
      if (token) {
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
    }

    if (!isAborted) {
      res.write(`data: [DONE]\n\n`);
      res.end();
    }
  } catch (err) {
    console.error('Streaming feedback error:', err.message);
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
});

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
    res.status(500).json({
      error: 'Failed to fetch feedback',
      ...(process.env.NODE_ENV === 'development' ? { message: error.message } : {})
    });
  }
});

/**
 * GET /api/interview/:id/study-notes
 * Generates or downloads a structured Markdown study sheet from the interview session
 */
router.get('/:id/study-notes', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const format = req.query.format; // 'json' | 'download'

    const [interviewRes, feedbackRes] = await Promise.all([
      supabaseAdmin
        .from('mock_interviews')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle(),
      supabaseAdmin
        .from('interview_feedback')
        .select('*')
        .eq('interview_id', id)
        .eq('user_id', userId)
        .order('created_at', { ascending: true }),
    ]);

    const interview = interviewRes.data;
    const feedbacks = feedbackRes.data || [];

    const interviewTitle = interview?.role || interview?.title || 'Technical Interview';
    const dateStr = interview?.created_at ? new Date(interview.created_at).toLocaleDateString() : new Date().toLocaleDateString();

    const markdownParts = [
      `# 📝 PrepLoop Interview Study Sheet: ${interviewTitle}`,
      `**Session Date:** ${dateStr}  `,
      `**Candidate:** ${req.user.email || 'Engineer'}  `,
      `**Session ID:** \`${id}\`\n`,
      `---\n`,
      `## 🎯 Executive Performance Summary`,
      `- **Completed Questions:** ${feedbacks.length}`,
      `- **Primary Focus Track:** Algorithmic Clarity & Trade-off Articulation`,
      `\n---\n`,
      `## 🔍 Question-by-Question Diagnostic Breakdown\n`
    ];

    if (feedbacks.length === 0) {
      markdownParts.push(`*No recorded feedback items found for this session yet.*`);
    } else {
      feedbacks.forEach((fb, idx) => {
        const rawFeedback = fb.feedback_content ?? fb.feedback;
        const feedbackObj = typeof rawFeedback === 'object' && rawFeedback !== null ? rawFeedback : {};
        const questionItem = Array.isArray(interview?.questions) ? interview.questions[fb.question_index] : null;
        const resolvedQuestion =
          fb.question_text ||
          (typeof questionItem === 'object' && questionItem !== null
            ? (questionItem.question || questionItem.text)
            : questionItem) ||
          'Technical question';
        const answerText = fb.answer_text || fb.response_text || '';

        markdownParts.push(`### Question ${idx + 1}`);
        markdownParts.push(`**Prompt / Context:**`);
        markdownParts.push(`> ${resolvedQuestion}\n`);
        
        if (answerText) {
          markdownParts.push(`**Your Key Responses:**`);
          markdownParts.push(`\`\`\`\n${String(answerText).trim()}\n\`\`\`\n`);
        }

        if (feedbackObj.strengths?.length) {
          markdownParts.push(`**Key Strengths Demonstrated:**`);
          feedbackObj.strengths.forEach((s) => markdownParts.push(`- ✅ ${s}`));
          markdownParts.push(``);
        }

        if (feedbackObj.improvements?.length) {
          markdownParts.push(`**Areas for Immediate Growth:**`);
          feedbackObj.improvements.forEach((imp) => markdownParts.push(`- ⚠️ ${imp}`));
          markdownParts.push(``);
        }

        if (feedbackObj.tips) {
          markdownParts.push(`**Coach's Tactical Tip:**`);
          markdownParts.push(`💡 *${feedbackObj.tips}*\n`);
        }
        markdownParts.push(`---\n`);
      });
    }

    markdownParts.push(`## 📚 Recommended Next Practice Problems`);
    markdownParts.push(`1. Two-Pointer & Sliding Window practice patterns ([PrepLoop DSA Catalog](/dsa-patterns))`);
    markdownParts.push(`2. Re-test this interview loop to verify metric improvement ([Interview Suite](/interview-suite))\n`);

    const markdownNotes = markdownParts.join('\n');

    if (format === 'download') {
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="PrepLoop_Notes_${id}.md"`);
      return res.send(markdownNotes);
    }

    return res.json({
      success: true,
      title: `${interviewTitle} Study Notes`,
      exportedAt: new Date().toISOString(),
      markdownNotes,
    });
  } catch (err) {
    console.error('Error generating study notes:', err);
    return res.status(500).json({ error: 'Failed to generate study notes' });
  }
});

export default router;

