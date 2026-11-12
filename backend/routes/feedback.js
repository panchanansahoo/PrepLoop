import express from 'express';
import rateLimit from 'express-rate-limit';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { optionalAuth } from '../middleware/auth.ts';
import { applyCoinTransaction } from '../utils/coinTransactions.js';
import { sanitizeString } from '../middleware/sanitization.js';

const router = express.Router();

export const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'test' ? 100 : 5, // 5 submissions per hour
  keyGenerator: (req) => req.user?.id || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Feedback submission limit reached. Please try again later.' },
});

router.post('/', optionalAuth, feedbackLimiter, async (req, res) => {
  try {
    const rawType = typeof req.body.feedback_type === 'string' ? req.body.feedback_type.trim() : '';
    const rawMessage = typeof req.body.message === 'string' ? req.body.message.trim() : '';

    if (!rawType || !rawMessage) {
      return res.status(400).json({ error: 'Feedback type and message are required' });
    }

    if (rawType.length > 50) {
      return res.status(400).json({ error: 'Feedback type must not exceed 50 characters' });
    }

    if (rawMessage.length > 5000) {
      return res.status(400).json({ error: 'Feedback message must not exceed 5000 characters' });
    }

    const feedback_type = sanitizeString(rawType).slice(0, 50);
    const message = sanitizeString(rawMessage).slice(0, 5000);
    const userId = req.user?.id || null;

    // Insert feedback into database
    const { error: insertError } = await supabaseAdmin
      .from('feedbacks')
      .insert({
        user_id: userId,
        feedback_type,
        message,
      });

    if (insertError) {
      console.error('Error inserting feedback:', insertError);
      return res.status(500).json({ error: 'Failed to submit feedback' });
    }

    // Award 10 coins if user is authenticated (max once per calendar day)
    let coinsAwarded = false;
    let newBalance = null;

    if (userId) {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const referenceKey = `feedback:${userId}:${today}`;

        const atomicResult = await applyCoinTransaction({
          userId,
          amount: 10,
          type: 'earn',
          description: 'Feedback submitted',
          referenceKey,
        });

        if (atomicResult.handled) {
          if (atomicResult.success && atomicResult.applied) {
            coinsAwarded = true;
            newBalance = atomicResult.balance;
          }
        } else {
          // Fallback when atomic function is missing: prevent duplicate awards today
          const { data: existingTx } = await supabaseAdmin
            .from('coin_transactions')
            .select('id')
            .eq('user_id', userId)
            .eq('description', 'Feedback submitted')
            .gte('created_at', `${today}T00:00:00.000Z`)
            .maybeSingle();

          if (!existingTx) {
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('coins')
              .eq('id', userId)
              .maybeSingle();

            const balance = (profile?.coins || 0) + 10;

            await supabaseAdmin
              .from('profiles')
              .update({ coins: balance })
              .eq('id', userId);

            await supabaseAdmin.from('coin_transactions').insert({
              user_id: userId,
              amount: 10,
              type: 'earn',
              description: 'Feedback submitted',
            });

            coinsAwarded = true;
            newBalance = balance;
          }
        }
      } catch (coinError) {
        console.error('Error awarding coins for feedback:', coinError);
        // Continue even if coin awarding fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully',
      coinsAwarded,
      newBalance,
    });
  } catch (error) {
    console.error('Error processing feedback:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

export default router;
