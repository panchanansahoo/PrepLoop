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
  maxRedeemQuantity: 5,
};

const EARN_SOURCES = new Set(['manual', 'problem_solved', 'bonus']);

const REDEEM_OPTIONS = [
  {
    id: 'ai_tutor_pass',
    title: 'AI Tutor Pass',
    description: 'Unlock one AI Tutor session without separate spend prompts.',
    coinCost: 20,
    category: 'ai',
  },
  {
    id: 'interview_boost',
    title: 'Interview Boost',
    description: 'Priority interview analysis queue for your next session.',
    coinCost: 35,
    category: 'interview',
  },
  {
    id: 'resume_review_credit',
    title: 'Resume Review Credit',
    description: 'Redeem one AI resume review credit.',
    coinCost: 15,
    category: 'career',
  },
];

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

const toPositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const normalizeTxnType = (txn) => {
  if (txn?.type === 'spend' && String(txn?.description || '').toLowerCase().startsWith('redeem:')) {
    return 'redeem';
  }
  return txn?.type;
};

const isRedeemTxn = (txn) =>
  txn?.type === 'spend' && String(txn?.description || '').toLowerCase().startsWith('redeem:');

const isDirectSpendTxn = (txn) => txn?.type === 'spend' && !isRedeemTxn(txn);

const buildHistoryQuery = ({ userId, limit, page, typeFilter, queryText }) => {
  const offset = (page - 1) * limit;
  const validTypeFilter = ['', 'earn', 'spend', 'redeem'].includes(typeFilter) ? typeFilter : '';

  let query = supabaseAdmin
    .from('coin_transactions')
    .select('id, user_id, amount, type, description, created_at', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (validTypeFilter === 'earn') {
    query = query.eq('type', 'earn');
  } else if (validTypeFilter === 'spend') {
    query = query.eq('type', 'spend').not('description', 'ilike', 'Redeem:%');
  } else if (validTypeFilter === 'redeem') {
    query = query.eq('type', 'spend').ilike('description', 'Redeem:%');
  }

  if (queryText) {
    query = query.ilike('description', `%${queryText}%`);
  }

  return query;
};

const summarizeTransactions = (items) => {
  return items.reduce(
    (acc, item) => {
      const txnType = normalizeTxnType(item);
      const amount = Number(item?.amount || 0);

      if (txnType === 'earn') acc.totalEarned += amount;
      if (txnType === 'spend') acc.totalSpent += amount;
      if (txnType === 'redeem') acc.totalRedeemed += amount;

      return acc;
    },
    { totalEarned: 0, totalSpent: 0, totalRedeemed: 0 }
  );
};

// Get coin balance
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('coins')
      .eq('id', req.user.id)
      .maybeSingle();

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
    const source = String(req.body?.source || 'manual').trim().toLowerCase();
    const rawAmount = req.body?.amount ?? (source === 'problem_solved' ? 5 : 10);
    const amount = toSafeAmount(rawAmount);
    const sourceRef = String(req.body?.sourceRef || '').trim();
    const fallbackDescription = source === 'problem_solved'
      ? 'Problem solved'
      : source === 'bonus'
      ? 'Bonus reward'
      : 'Manual earn';
    const description = sanitizeDescription(req.body?.description, fallbackDescription);

    if (!EARN_SOURCES.has(source)) {
      return res.status(400).json({ error: 'Invalid earn source' });
    }

    const referenceKey = req.body?.referenceKey || (sourceRef ? `earn:${source}:${sourceRef}` : null);

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
      referenceKey,
    });
    if (atomicResult.handled) {
      if (!atomicResult.success) {
        return res.status(400).json({ error: atomicResult.error, coins: atomicResult.balance });
      }
      return res.json({
        coins: atomicResult.balance,
        earned: atomicResult.applied ? amount : 0,
        applied: atomicResult.applied,
        source,
      });
    }

    // Get current balance
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('coins')
      .eq('id', req.user.id)
      .maybeSingle();

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

// Available redeem options
router.get('/redeem-options', authenticateToken, (_req, res) => {
  res.json({
    options: REDEEM_OPTIONS,
    limits: {
      maxQuantity: COIN_LIMITS.maxRedeemQuantity,
    },
  });
});

// Redeem coins for in-app rewards
router.post('/redeem', authenticateToken, async (req, res) => {
  try {
    const optionId = String(req.body?.optionId || '').trim();
    const quantity = toPositiveInteger(req.body?.quantity, 1);
    const option = REDEEM_OPTIONS.find((item) => item.id === optionId);

    if (!option) {
      return res.status(400).json({ error: 'Invalid redeem option' });
    }

    if (quantity > COIN_LIMITS.maxRedeemQuantity) {
      return res.status(400).json({
        error: `Quantity must be between 1 and ${COIN_LIMITS.maxRedeemQuantity}`,
      });
    }

    const totalCost = option.coinCost * quantity;
    const description = sanitizeDescription(
      req.body?.description,
      `Redeem: ${option.title} x${quantity}`
    );
    const referenceKey = req.body?.referenceKey || null;

    const atomicResult = await applyCoinTransaction({
      userId: req.user.id,
      amount: totalCost,
      type: 'spend',
      description,
      referenceKey,
    });

    if (atomicResult.handled) {
      if (!atomicResult.success) {
        return res.status(400).json({
          error: atomicResult.error,
          coins: atomicResult.balance,
          required: totalCost,
        });
      }

      return res.json({
        coins: atomicResult.balance,
        spent: atomicResult.applied ? totalCost : 0,
        applied: atomicResult.applied,
        redeemed: {
          optionId: option.id,
          title: option.title,
          quantity,
          unitCost: option.coinCost,
          totalCost,
          category: option.category,
        },
      });
    }

    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('coins')
      .eq('id', req.user.id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    const currentCoins = profile?.coins || 0;
    if (currentCoins < totalCost) {
      return res.status(400).json({
        error: 'Insufficient coins',
        coins: currentCoins,
        required: totalCost,
      });
    }

    const newBalance = currentCoins - totalCost;
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ coins: newBalance })
      .eq('id', req.user.id);

    if (updateError) throw updateError;

    await supabaseAdmin.from('coin_transactions').insert({
      user_id: req.user.id,
      amount: totalCost,
      type: 'spend',
      description,
    });

    res.json({
      coins: newBalance,
      spent: totalCost,
      redeemed: {
        optionId: option.id,
        title: option.title,
        quantity,
        unitCost: option.coinCost,
        totalCost,
        category: option.category,
      },
    });
  } catch (error) {
    console.error('Error redeeming coins:', error);
    if (isSchemaMissingError(error)) {
      return res.status(503).json({
        error: 'Coins feature schema is missing. Run migration_coins_streaks.sql.',
      });
    }
    res.status(500).json({ error: 'Failed to redeem coins' });
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
      .maybeSingle();

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
    const limit = Math.min(toPositiveInteger(req.query?.limit, 50), 100);
    const page = toPositiveInteger(req.query?.page, 1);
    const typeFilter = String(req.query?.type || '').trim().toLowerCase();
    const queryText = String(req.query?.q || '').trim();
    const detailed = String(req.query?.detailed || '').trim() === '1';
    const offset = (page - 1) * limit;

    const historyQuery = buildHistoryQuery({
      userId: req.user.id,
      limit,
      page,
      typeFilter,
      queryText,
    });

    const { data: filteredRows, error: queryError, count } = await historyQuery;

    if (queryError) throw queryError;

    const items = (filteredRows || []).map((item) => ({
      ...item,
      displayType: normalizeTxnType(item),
    }));
    const summary = summarizeTransactions(filteredRows || []);

    if (!detailed) {
      return res.json(items);
    }

    res.json({
      items,
      page,
      limit,
      total: count || 0,
      summary,
      hasMore: offset + items.length < (count || 0),
    });
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

router.get('/spend-history', authenticateToken, async (req, res) => {
  try {
    const limit = Math.min(toPositiveInteger(req.query?.limit, 50), 100);
    const page = toPositiveInteger(req.query?.page, 1);
    const queryText = String(req.query?.q || '').trim();
    const detailed = String(req.query?.detailed || '').trim() === '1';
    const offset = (page - 1) * limit;

    const spendHistoryQuery = buildHistoryQuery({
      userId: req.user.id,
      limit,
      page,
      typeFilter: 'spend',
      queryText,
    });

    const { data: filteredRows, error, count } = await spendHistoryQuery;

    if (error) throw error;

    const spendRows = (filteredRows || []).filter(isDirectSpendTxn).map((item) => ({
      ...item,
      displayType: 'spend',
    }));

    const summary = summarizeTransactions(spendRows);

    if (!detailed) {
      return res.json(spendRows);
    }

    return res.json({
      items: spendRows,
      page,
      limit,
      total: count || 0,
      summary,
      hasMore: offset + spendRows.length < (count || 0),
    });
  } catch (error) {
    console.error('Error fetching coin spend history:', error);
    if (isSchemaMissingError(error)) {
      return res.status(503).json({
        error: 'Coins feature schema is missing. Run migration_coins_streaks.sql.',
      });
    }
    res.status(500).json({ error: 'Failed to fetch spend history' });
  }
});

export default router;
