import express from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MAX_SECONDS_PER_DAY = 86400;

// Update activity time
router.post('/update', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const { date, seconds } = req.body;
        if (!date || seconds === undefined) {
            return res.status(400).json({ error: 'Missing date or seconds' });
        }

        // Validate date format YYYY-MM-DD
        if (typeof date !== 'string' || !DATE_REGEX.test(date)) {
            return res.status(400).json({ error: 'date must be in YYYY-MM-DD format' });
        }

        // Validate real calendar date
        const parsedDate = new Date(`${date}T00:00:00Z`);
        if (isNaN(parsedDate.getTime()) || !parsedDate.toISOString().startsWith(date)) {
            return res.status(400).json({ error: 'Invalid calendar date' });
        }

        // Reject future dates beyond today
        const todayStr = new Date().toISOString().split('T')[0];
        if (date > todayStr) {
            return res.status(400).json({ error: 'date cannot be in the future' });
        }

        // Validate seconds is a non-negative integer bounded by 24h
        const safeSeconds = Math.floor(Number(seconds));
        if (!Number.isFinite(safeSeconds) || safeSeconds < 0 || safeSeconds > MAX_SECONDS_PER_DAY) {
            return res.status(400).json({ error: 'seconds must be a non-negative number up to 86400' });
        }

        const { data, error } = await supabaseAdmin
            .from('user_activity')
            .upsert({
                user_id: userId,
                date,
                seconds_active: safeSeconds,
                last_updated: new Date().toISOString()
            }, {
                onConflict: 'user_id, date'
            })
            .select();

        if (error) throw error;

        // Update profile last_active_date
        await supabaseAdmin
            .from('profiles')
            .update({ last_active_date: date })
            .eq('id', userId);

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error updating activity:', error);
        res.status(500).json({ error: 'Failed to update activity' });
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
