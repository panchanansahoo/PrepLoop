import express from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { authenticateToken } from '../middleware/auth.js';
import { applyCoinTransaction } from '../utils/coinTransactions.js';

const router = express.Router();

const COIN_LIMITS = {
  minSpend: 1,
  maxSpend: 50,
  minEarn: 1,
  maxEarn: 100,
};

const isSchemaMissingError = (error) => {
  const code = String(error?.code || '').toUpperCase();
  return code === '42703' || code === '42P01';
};

const toSafeAmount = (value) => {
  const num = Number(value);
  if (!Number.isInteger(num)) return null;
  return num;
};

const sanitizeDescription = (value, fallback) => {
  const text = String(value || fallback || '').trim();
  return text.slice(0, 160);
};

// Get coin balance
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('coins')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    res.json({ coins: data?.coins || 0 });
  } catch (error) {
    console.error('Error fetching coin balance:', error);
    if (isSchemaMissingError(error)) {
      return res.json({ coins: 0, degraded: true });
    }
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

// Earn coins (called after solving a problem)
router.post('/earn', authenticateToken, async (req, res) => {
  try {
    const rawAmount = req.body?.amount ?? 10;
    const amount = toSafeAmount(rawAmount);
    const description = sanitizeDescription(req.body?.description, 'Problem solved');

    if (!amount || amount < COIN_LIMITS.minEarn || amount > COIN_LIMITS.maxEarn) {
      return res.status(400).json({
        error: `Amount must be an integer between ${COIN_LIMITS.minEarn} and ${COIN_LIMITS.maxEarn}`,
      });
    }

    const atomicResult = await applyCoinTransaction({
      userId: req.user.id,
      amount,
      type: 'earn',
      description,
      referenceKey: req.body?.referenceKey,
    });
    if (atomicResult.handled) {
      if (!atomicResult.success) {
        return res.status(400).json({ error: atomicResult.error, coins: atomicResult.balance });
      }
      return res.json({
        coins: atomicResult.balance,
        earned: atomicResult.applied ? amount : 0,
        applied: atomicResult.applied,
      });
    }

    // Get current balance
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('coins')
      .eq('id', req.user.id)
      .single();

    if (fetchError) throw fetchError;

    const newBalance = (profile?.coins || 0) + amount;

    // Update balance
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ coins: newBalance })
      .eq('id', req.user.id);

    if (updateError) throw updateError;

    // Log transaction
    await supabaseAdmin.from('coin_transactions').insert({
      user_id: req.user.id,
      amount,
      type: 'earn',
      description,
    });

    res.json({ coins: newBalance, earned: amount });
  } catch (error) {
    console.error('Error earning coins:', error);
    if (isSchemaMissingError(error)) {
      return res.status(503).json({
        error: 'Coins feature schema is missing. Run migration_coins_streaks.sql.',
      });
    }
    res.status(500).json({ error: 'Failed to earn coins' });
  }
});

// Spend coins (called before AI query)
router.post('/spend', authenticateToken, async (req, res) => {
  try {
    const rawAmount = req.body?.amount ?? 5;
    const amount = toSafeAmount(rawAmount);
    const description = sanitizeDescription(req.body?.description, 'AI assistant query');

    if (!amount || amount < COIN_LIMITS.minSpend || amount > COIN_LIMITS.maxSpend) {
      return res.status(400).json({
        error: `Amount must be an integer between ${COIN_LIMITS.minSpend} and ${COIN_LIMITS.maxSpend}`,
      });
    }

    const atomicResult = await applyCoinTransaction({
      userId: req.user.id,
      amount,
      type: 'spend',
      description,
      referenceKey: req.body?.referenceKey,
    });
    if (atomicResult.handled) {
      if (!atomicResult.success) {
        return res.status(400).json({
          error: atomicResult.error,
          coins: atomicResult.balance,
          required: amount,
        });
      }
      return res.json({
        coins: atomicResult.balance,
        spent: atomicResult.applied ? amount : 0,
        applied: atomicResult.applied,
      });
    }

    // Get current balance
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('coins')
      .eq('id', req.user.id)
      .single();

    if (fetchError) throw fetchError;

    const currentCoins = profile?.coins || 0;
    if (currentCoins < amount) {
      return res.status(400).json({
        error: 'Insufficient coins',
        coins: currentCoins,
        required: amount,
      });
    }

    const newBalance = currentCoins - amount;

    // Update balance
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ coins: newBalance })
      .eq('id', req.user.id);

    if (updateError) throw updateError;

    // Log transaction
    await supabaseAdmin.from('coin_transactions').insert({
      user_id: req.user.id,
      amount,
      type: 'spend',
      description,
    });

    res.json({ coins: newBalance, spent: amount });
  } catch (error) {
    console.error('Error spending coins:', error);
    if (isSchemaMissingError(error)) {
      return res.status(503).json({
        error: 'Coins feature schema is missing. Run migration_coins_streaks.sql.',
      });
    }
    res.status(500).json({ error: 'Failed to spend coins' });
  }
});

// Get transaction history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('coin_transactions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching coin history:', error);
    if (isSchemaMissingError(error)) {
      return res.status(503).json({
        error: 'Coins feature schema is missing. Run migration_coins_streaks.sql.',
      });
    }
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default router;
