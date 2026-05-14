import express from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { authenticateToken } from '../middleware/auth.js';
import { getGroqClient } from '../utils/groqClient.js';
import { aiCallWithRetry } from '../utils/aiClient.js';
import { applyCoinTransaction } from '../utils/coinTransactions.js';

const router = express.Router();

const groq = getGroqClient();

const parsedChatCost = Number(process.env.AI_CHAT_COIN_COST || 0);
const CHAT_QUERY_COST = Number.isFinite(parsedChatCost) ? Math.max(0, parsedChatCost) : 0;

const isSchemaMissingError = (error) => {
  const code = String(error?.code || '').toUpperCase();
  const combined = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase();
  return (
    code === '42703' ||
    code === '42P01' ||
    combined.includes('does not exist') ||
    combined.includes('could not find') ||
    combined.includes('relationship')
  );
};

const isProfilesAccessBlocked = (error) => {
  const code = String(error?.code || '').toUpperCase();
  const message = String(error?.message || '').toLowerCase();
  return code === '42P17' || message.includes('infinite recursion detected in policy');
};

const SYSTEM_PROMPT = `You are PrepLoop AI Assistant — a friendly, expert coding interview preparation coach. You help with:
- Data Structures & Algorithms explanations
- Problem-solving strategies and hints
- Interview tips (behavioral, technical, system design)
- Code review and optimization suggestions
- General career guidance for software engineers

Keep responses concise, practical, and encouraging. Use code examples when helpful. Format with markdown.`;

const spendCoinsForChat = async (userId, cost) => {
  const atomicResult = await applyCoinTransaction({
    userId,
    amount: cost,
    type: 'spend',
    description: 'AI assistant query',
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
    description: 'AI assistant query',
  });

  return { ok: true, newBalance };
};

const refundCoinsForChatFailure = async (userId, cost) => {
  const atomicResult = await applyCoinTransaction({
    userId,
    amount: cost,
    type: 'earn',
    description: 'AI assistant refund (upstream failure)',
  });

  if (atomicResult.handled) {
    if (!atomicResult.success) {
      throw new Error(atomicResult.error || 'Failed to refund coins');
    }
    return atomicResult.balance;
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('coins')
    .eq('id', userId)
    .single();

  const currentCoins = profile?.coins || 0;
  const refundedBalance = currentCoins + cost;

  await supabaseAdmin
    .from('profiles')
    .update({ coins: refundedBalance })
    .eq('id', userId);

  await supabaseAdmin.from('coin_transactions').insert({
    user_id: userId,
    amount: cost,
    type: 'earn',
    description: 'AI assistant refund (upstream failure)',
  });

  return refundedBalance;
};

// Send message and get AI response
router.post('/message', authenticateToken, async (req, res) => {
  let didCharge = false;
  let degraded = false;
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let spendResult = { ok: true, newBalance: null };
    if (CHAT_QUERY_COST > 0) {
      try {
        spendResult = await spendCoinsForChat(req.user.id, CHAT_QUERY_COST);
        if (!spendResult.ok) {
          return res.status(400).json({
            error: 'Insufficient coins',
            required: CHAT_QUERY_COST,
            coins: spendResult.currentCoins,
          });
        }
        didCharge = true;
      } catch (error) {
        if (isSchemaMissingError(error) || isProfilesAccessBlocked(error)) {
          degraded = true;
        } else {
          throw error;
        }
      }
    }

    // Save user message
    try {
      await supabaseAdmin.from('chat_messages').insert({
        user_id: req.user.id,
        role: 'user',
        content: message.trim(),
      });
    } catch (error) {
      if (isSchemaMissingError(error)) {
        degraded = true;
      } else {
        throw error;
      }
    }

    // Fetch recent history for context (last 10 messages)
    let history = [];
    try {
      const historyResult = await supabaseAdmin
        .from('chat_messages')
        .select('role, content')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (historyResult.error) throw historyResult.error;
      history = historyResult.data || [];
    } catch (error) {
      if (isSchemaMissingError(error)) {
        degraded = true;
        history = [];
      } else {
        throw error;
      }
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.reverse().map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
    ];

    // Get AI response
    if (!groq) {
      return res.status(503).json({
        error: 'AI service is not configured',
        message: 'GROQ_API_KEY is not set in the environment',
      });
    }

    const completion = await aiCallWithRetry({
      operation: () => groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
      timeoutMs: 12000,
      maxRetries: 2,
      baseDelayMs: 250,
    });

    const aiResponse = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Save assistant message
    try {
      await supabaseAdmin.from('chat_messages').insert({
        user_id: req.user.id,
        role: 'assistant',
        content: aiResponse,
      });
    } catch (error) {
      if (isSchemaMissingError(error)) {
        degraded = true;
      } else {
        throw error;
      }
    }

    res.json({
      response: aiResponse,
      coins: didCharge ? spendResult.newBalance : null,
      spent: didCharge ? CHAT_QUERY_COST : 0,
      degraded,
    });
  } catch (error) {
    console.error('Chat error:', error);

    if (isSchemaMissingError(error) || isProfilesAccessBlocked(error)) {
      return res.status(500).json({
        error: 'Failed to get response',
        degraded: true,
      });
    }

    if (didCharge) {
      try {
        await refundCoinsForChatFailure(req.user.id, CHAT_QUERY_COST);
      } catch (refundError) {
        console.error('Failed to refund chat coins:', refundError);
      }
    }

    res.status(500).json({ error: 'Failed to get response' });
  }
});

// Get chat history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    if (isSchemaMissingError(error)) {
      return res.json([]);
    }
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Clear chat history
router.delete('/clear', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('chat_messages')
      .delete()
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing chat:', error);
    if (isSchemaMissingError(error)) {
      return res.json({ success: true, degraded: true });
    }
    res.status(500).json({ error: 'Failed to clear chat' });
  }
});

export default router;
