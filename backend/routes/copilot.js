import express from 'express';
import Groq from 'groq-sdk';
import { authenticateToken } from '../middleware/auth.ts';
import { aiCallWithRetry } from '../utils/aiClient.js';

const router = express.Router();

const groq = process.env.GROQ_API_KEY ? new Groq({
  apiKey: process.env.GROQ_API_KEY,
}) : null;

const COPILOT_SYSTEM_PROMPT = `You are an expert career coach and interview strategist specializing in tech industry job searches. Your role is to provide actionable, specific advice for:

- Behavioral interview questions (STAR method responses)
- Technical interview preparation
- Salary negotiation strategies
- Resume and cover letter optimization
- Company research and "Why [Company]?" questions
- Career transitions and role selection
- Offer evaluation and decision-making

## Response Guidelines:
- Be concise but thorough (2-4 paragraphs max)
- Provide specific examples and frameworks
- Use bullet points for actionable steps
- Reference real industry practices
- Be encouraging but realistic
- Tailor advice to the user's context when provided

## Tone:
Professional yet approachable, like a mentor who's been through the process.`;

router.post('/ask', authenticateToken, async (req, res) => {
  try {
    const { query, context } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length < 3) {
      return res.status(400).json({ error: 'Please provide a question (at least 3 characters).' });
    }

    if (query.trim().length > 2000) {
      return res.status(400).json({ error: 'Question is too long (maximum 2000 characters).' });
    }

    if (context !== undefined && context !== null) {
      if (typeof context !== 'string') {
        return res.status(400).json({ error: 'Context must be a string.' });
      }
      if (context.trim().length > 4000) {
        return res.status(400).json({ error: 'Context is too long (maximum 4000 characters).' });
      }
    }

    if (!groq) {
      return res.status(503).json({ 
        error: 'AI service is currently unavailable. Please try again later.',
        fallback: 'The AI Job Copilot requires the Groq API to be configured.'
      });
    }

    const sanitizedQuery = query.trim().slice(0, 2000);
    const sanitizedContext = typeof context === 'string' ? context.trim().slice(0, 4000) : '';
    const userMessage = sanitizedContext 
      ? `Context: ${sanitizedContext}\n\nQuestion: ${sanitizedQuery}`
      : sanitizedQuery;

    const completion = await aiCallWithRetry({
      operation: () => groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: COPILOT_SYSTEM_PROMPT },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
      timeoutMs: 15000,
      maxRetries: 2,
      baseDelayMs: 500
    });

    const response = completion.choices?.[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try rephrasing your question.';

    res.json({
      response,
      query: sanitizedQuery,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Copilot ask error:', error);
    res.status(500).json({ error: 'Failed to process your question. Please try again.' });
  }
});

router.post('/job-fit', authenticateToken, async (req, res) => {
  try {
    const { jobTitle, jobDescription, userProfile } = req.body;

    if (!jobTitle || !jobDescription || typeof jobTitle !== 'string' || typeof jobDescription !== 'string') {
      return res.status(400).json({ error: 'Job title and description are required strings.' });
    }

    if (jobTitle.trim().length > 200) {
      return res.status(400).json({ error: 'Job title is too long (maximum 200 characters).' });
    }

    if (jobDescription.trim().length > 8000) {
      return res.status(400).json({ error: 'Job description is too long (maximum 8000 characters).' });
    }

    if (userProfile !== undefined && userProfile !== null) {
      const profileStr = typeof userProfile === 'string' ? userProfile : JSON.stringify(userProfile);
      if (profileStr.length > 8000) {
        return res.status(400).json({ error: 'User profile is too long (maximum 8000 characters).' });
      }
    }

    if (!groq) {
      return res.status(503).json({ error: 'AI service is currently unavailable.' });
    }

    const safeJobTitle = jobTitle.trim().slice(0, 200);
    const safeJobDescription = jobDescription.trim().slice(0, 8000);
    const safeUserProfile = userProfile
      ? (typeof userProfile === 'string' ? userProfile.trim().slice(0, 4000) : JSON.stringify(userProfile).slice(0, 4000))
      : null;

    const prompt = `Analyze this job opportunity for the candidate:

Job Title: ${safeJobTitle}
Job Description: ${safeJobDescription}

${safeUserProfile ? `Candidate Profile: ${safeUserProfile}` : 'No candidate profile provided.'}

Provide:
1. Key skills match (what aligns well)
2. Potential gaps (what might be missing)
3. Interview preparation focus areas
4. Tailored "Why this role?" talking points

Keep it concise and actionable.`;

    const completion = await aiCallWithRetry({
      operation: () => groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: COPILOT_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 1024,
      }),
      timeoutMs: 15000,
      maxRetries: 2,
      baseDelayMs: 500
    });

    const analysis = completion.choices?.[0]?.message?.content || 'Unable to analyze job fit.';

    res.json({
      analysis,
      jobTitle,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Job fit analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze job fit.' });
  }
});

export default router;
