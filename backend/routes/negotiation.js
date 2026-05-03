import express from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Gemini AI initialization (reuse pattern from aiService.js)
let geminiAi = null;
if (process.env.GEMINI_API_KEY) {
  try {
    const mod = await import('@google/generative-ai').catch(() => null) ||
                await import('google-gen-ai').catch(() => null) || null;
    const GoogleGenAI = mod?.GoogleGenAI || mod?.default?.GoogleGenAI || mod?.default || null;
    if (GoogleGenAI) {
      geminiAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
  } catch (err) {
    console.warn('Negotiation: Gemini init failed:', err.message);
  }
}

const NEGOTIATION_SCENARIOS = [
  {
    id: 'initial_offer',
    name: 'Initial Offer Response',
    description: 'You just received your first offer. Practice how to respond strategically.',
    difficulty: 'beginner',
  },
  {
    id: 'counter_offer',
    name: 'Counter Offer Strategy',
    description: 'Negotiate a higher base salary with data-backed reasoning.',
    difficulty: 'intermediate',
  },
  {
    id: 'competing_offers',
    name: 'Competing Offers Leverage',
    description: 'Use multiple offers to negotiate the best package.',
    difficulty: 'advanced',
  },
  {
    id: 'equity_negotiation',
    name: 'Equity & Stock Options',
    description: 'Negotiate RSUs, stock options, and vesting schedules.',
    difficulty: 'advanced',
  },
  {
    id: 'benefits_perks',
    name: 'Benefits & Perks',
    description: 'Negotiate signing bonus, remote work, PTO, and other benefits.',
    difficulty: 'intermediate',
  },
];

const NEGOTIATION_TIPS = [
  { category: 'Anchoring', tip: 'Always let the employer name the first number, or anchor high with market data.', icon: '⚓' },
  { category: 'BATNA', tip: 'Know your Best Alternative To Negotiated Agreement — your walkaway power.', icon: '🛡️' },
  { category: 'Market Data', tip: 'Use Levels.fyi, Glassdoor, and Blind to research compensation ranges.', icon: '📊' },
  { category: 'Total Comp', tip: 'Negotiate total compensation, not just base salary (RSUs, bonus, signing).', icon: '💰' },
  { category: 'Timing', tip: 'Negotiate after receiving the offer, not during interviews.', icon: '⏰' },
  { category: 'Silence', tip: 'Use strategic silence. Don\'t rush to fill awkward pauses.', icon: '🤫' },
  { category: 'Written', tip: 'Always get the final offer in writing before accepting.', icon: '📝' },
  { category: 'Enthusiasm', tip: 'Show genuine excitement about the role while negotiating firmly.', icon: '🔥' },
];

// POST /api/negotiation/simulate — AI conversation turn
router.post('/simulate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId, message, scenario, companyName, roleTitle, baseOffer } = req.body;

    let session;

    if (sessionId) {
      // Continue existing session
      const { data, error } = await supabaseAdmin
        .from('negotiation_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .single();

      if (error || !data) return res.status(404).json({ error: 'Session not found' });
      session = data;
    } else {
      // Create new session
      if (!scenario) return res.status(400).json({ error: 'scenario is required for new sessions' });

      const { data, error } = await supabaseAdmin
        .from('negotiation_sessions')
        .insert({
          user_id: userId,
          scenario,
          company_name: companyName || 'Tech Corp',
          role_title: roleTitle || 'Software Engineer',
          base_offer: baseOffer || 120000,
          messages: [],
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      session = data;
    }

    // Add user message
    const messages = session.messages || [];
    if (message) {
      messages.push({ role: 'user', content: message, timestamp: new Date().toISOString() });
    }

    // Generate AI response
    let aiResponse = '';
    if (geminiAi) {
      try {
        const systemPrompt = `You are an HR recruiter at ${session.company_name} negotiating a ${session.role_title} offer.
The initial base offer is $${session.base_offer?.toLocaleString() || '120,000'}.
Scenario: ${session.scenario}

Rules:
- Be professional but firm about budget constraints
- Show some flexibility on non-salary items
- React realistically to negotiation tactics
- If the candidate uses good tactics (data, competing offers), show more flexibility
- Keep responses concise (2-3 sentences max)
- After 8+ exchanges, wrap up the negotiation naturally

Conversation so far:
${messages.map(m => `${m.role === 'user' ? 'Candidate' : 'Recruiter'}: ${m.content}`).join('\n')}`;

        const result = await geminiAi.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: systemPrompt,
          config: { temperature: 0.8, maxOutputTokens: 300 },
        });

        aiResponse = result.text || 'Let me think about that and get back to you.';
      } catch (err) {
        console.warn('Negotiation AI error:', err.message);
        aiResponse = 'That\'s an interesting point. Let me discuss this with the compensation team and circle back.';
      }
    } else {
      aiResponse = 'Thank you for sharing that. I\'ll need to review this with our hiring manager. Can you tell me more about your expectations?';
    }

    messages.push({ role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() });

    // Check if negotiation should conclude
    const isComplete = messages.filter(m => m.role === 'user').length >= 8;

    // Update session
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('negotiation_sessions')
      .update({
        messages,
        status: isComplete ? 'completed' : 'active',
      })
      .eq('id', session.id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // If complete, generate score
    let score = null;
    let feedback = null;
    if (isComplete && geminiAi) {
      try {
        const scoreResult = await geminiAi.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Score this salary negotiation on a scale of 0-100. The candidate was negotiating for a ${session.role_title} at ${session.company_name} with base offer $${session.base_offer}.

Conversation:
${messages.map(m => `${m.role === 'user' ? 'Candidate' : 'Recruiter'}: ${m.content}`).join('\n')}

Return JSON only: {"score": number, "feedback": "brief feedback", "strengths": ["..."], "improvements": ["..."]}`,
          config: { temperature: 0.3, maxOutputTokens: 400, responseMimeType: 'application/json' },
        });

        const parsed = JSON.parse(scoreResult.text || '{}');
        score = parsed.score;
        feedback = parsed.feedback;

        await supabaseAdmin
          .from('negotiation_sessions')
          .update({ score, feedback })
          .eq('id', session.id);
      } catch (err) {
        console.warn('Negotiation scoring error:', err.message);
      }
    }

    res.json({
      sessionId: session.id,
      messages,
      status: isComplete ? 'completed' : 'active',
      score,
      feedback,
    });
  } catch (err) {
    console.error('Negotiation simulate error:', err);
    res.status(500).json({ error: 'Failed to simulate negotiation' });
  }
});

// GET /api/negotiation/history — past sessions
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabaseAdmin
      .from('negotiation_sessions')
      .select('id, scenario, company_name, role_title, base_offer, score, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Negotiation history error:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// GET /api/negotiation/scenarios — available scenarios
router.get('/scenarios', async (req, res) => {
  res.json(NEGOTIATION_SCENARIOS);
});

// GET /api/negotiation/tips — strategy library
router.get('/tips', async (req, res) => {
  res.json(NEGOTIATION_TIPS);
});

export default router;
