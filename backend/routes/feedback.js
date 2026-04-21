import express from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { optionalAuth } from '../middleware/auth.js';
import { applyCoinTransaction } from '../utils/coinTransactions.js';

const router = express.Router();

router.post('/', optionalAuth, async (req, res) => {
  try {
    const { feedback_type, message } = req.body;

    if (!feedback_type || !message) {
      return res.status(400).json({ error: 'Feedback type and message are required' });
    }

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

    // Award 10 coins if user is authenticated
    let coinsAwarded = false;
    let newBalance = null;

    if (userId) {
      try {
        const atomicResult = await applyCoinTransaction({
          userId,
          amount: 10,
          type: 'earn',
          description: 'Feedback submitted',
        });
        
        if (atomicResult.handled && atomicResult.success) {
            coinsAwarded = true;
            newBalance = atomicResult.balance;
        } else if (!atomicResult.handled) {
            // Fallback for when atomic logic is not handled
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('coins')
              .eq('id', userId)
              .single();
              
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
      } catch (coinError) {
        console.error('Error awarding coins for feedback:', coinError);
        // Continue even if coin awarding fails
      }
    }

    res.status(200).json({ 
      success: true, 
      message: 'Feedback submitted successfully',
      coinsAwarded,
      newBalance
    });

  } catch (error) {
    console.error('Error processing feedback:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

export default router;
