import express from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

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

// Middleware: require HR or admin role
const requireHR = (req, res, next) => {
  if (!req.user || (req.user.role !== 'hr' && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'HR or Admin access required' });
  }
  next();
};

// HR creates available time slots
router.post('/slots', authenticateToken, requireHR, async (req, res) => {
  try {
    const { slots } = req.body;
    // slots: [{ date: '2026-04-01', startTime: '10:00', endTime: '11:00' }, ...]

    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ error: 'At least one slot is required' });
    }

    const records = slots.map(s => ({
      hr_id: req.user.id,
      slot_date: s.date,
      start_time: s.startTime,
      end_time: s.endTime,
      is_booked: false,
    }));

    const { data, error } = await supabaseAdmin
      .from('interview_slots')
      .insert(records)
      .select();

    if (error) throw error;
    res.json({ success: true, slots: data });
  } catch (error) {
    console.error('Error creating slots:', error);
    if (isSchemaMissingError(error)) {
      return res.status(503).json({
        error: 'Interview scheduling schema is missing. Run migration_interview_enhancement.sql.',
      });
    }
    res.status(500).json({ error: 'Failed to create slots' });
  }
});

// HR views their slots
router.get('/my-slots', authenticateToken, requireHR, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('interview_slots')
      .select(`
        id, slot_date, start_time, end_time, is_booked,
        booked_user:profiles!interview_slots_booked_by_fkey(id, full_name, email)
      `)
      .eq('hr_id', req.user.id)
      .gte('slot_date', new Date().toISOString().split('T')[0])
      .order('slot_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching HR slots:', error);
    if (isSchemaMissingError(error)) {
      return res.status(503).json({
        error: 'Interview scheduling schema is missing. Run migration_interview_enhancement.sql.',
      });
    }
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
});

// HR deletes a slot (only if not booked)
router.delete('/slots/:id', authenticateToken, requireHR, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('interview_slots')
      .delete()
      .eq('id', req.params.id)
      .eq('hr_id', req.user.id)
      .eq('is_booked', false);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting slot:', error);
    if (isSchemaMissingError(error)) {
      return res.status(503).json({
        error: 'Interview scheduling schema is missing. Run migration_interview_enhancement.sql.',
      });
    }
    res.status(500).json({ error: 'Failed to delete slot' });
  }
});

export default router;
