import express from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Update activity time
router.post('/update', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const { date, seconds } = req.body;
        if (!date || seconds === undefined) {
            return res.status(400).json({ error: 'Missing date or seconds' });
        }

        const { data, error } = await supabaseAdmin
            .from('user_activity')
            .upsert({
                user_id: userId,
                date,
                seconds_active: seconds,
                last_updated: new Date().toISOString()
            }, {
                onConflict: 'user_id, date'
            })
            .select();

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error updating activity:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

// Get weekly activity
router.get('/weekly', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);

        const dateStr = sevenDaysAgo.toISOString().split('T')[0];

        const { data, error } = await supabaseAdmin
            .from('user_activity')
            .select('date, seconds_active')
            .eq('user_id', userId)
            .gte('date', dateStr)
            .order('date', { ascending: true });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error fetching activity:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
