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

// Get available interview slots
router.get('/slots', authenticateToken, async (req, res) => {
  try {
    const { date } = req.query;

    let query = supabaseAdmin
      .from('interview_slots')
      .select(`
        id, slot_date, start_time, end_time, is_booked,
        hr:profiles!interview_slots_hr_id_fkey(id, full_name)
      `)
      .eq('is_booked', false)
      .gte('slot_date', new Date().toISOString().split('T')[0])
      .order('slot_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (date) {
      query = query.eq('slot_date', date);
    }

    const { data, error } = await query.limit(50);
    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching slots:', error);
    if (isSchemaMissingError(error)) {
      return res.status(503).json({
        error: 'Interview scheduling schema is missing. Run migration_interview_enhancement.sql.',
      });
    }
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
});

// Book a slot (premium users only)
router.post('/book', authenticateToken, async (req, res) => {
  try {
    const { slotId } = req.body;
    if (!slotId) return res.status(400).json({ error: 'Slot ID is required' });

    // Check if user is premium
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('subscription_tier')
      .eq('id', req.user.id)
      .single();

    if (!profile || profile.subscription_tier === 'free') {
      return res.status(403).json({ error: 'Premium subscription required to book real interviews' });
    }

    // Fetch slot to compute schedule timestamp.
    const { data: slot, error: slotError } = await supabaseAdmin
      .from('interview_slots')
      .select('id, hr_id, slot_date, start_time, is_booked')
      .eq('id', slotId)
      .single();

    if (slotError || !slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    if (slot.is_booked) {
      return res.status(409).json({ error: 'Slot is no longer available' });
    }

    // Conditionally book slot to reduce race-condition double booking.
    const { data: updatedSlot, error: bookError } = await supabaseAdmin
      .from('interview_slots')
      .update({ is_booked: true, booked_by: req.user.id })
      .eq('id', slotId)
      .eq('is_booked', false)
      .select('id')
      .single();

    if (bookError || !updatedSlot) {
      return res.status(409).json({ error: 'Slot is no longer available' });
    }

    // Create real interview record
    const scheduledAt = `${slot.slot_date}T${slot.start_time}`;
    const { data: interview, error: interviewError } = await supabaseAdmin
      .from('real_interviews')
      .insert({
        user_id: req.user.id,
        hr_id: slot.hr_id,
        slot_id: slotId,
        scheduled_at: scheduledAt,
        status: 'scheduled',
      })
      .select()
      .single();

    if (interviewError) throw interviewError;

    res.json({ success: true, interview });
  } catch (error) {
    console.error('Error booking interview:', error);
    if (isSchemaMissingError(error)) {
      return res.status(503).json({
        error: 'Interview scheduling schema is missing. Run migration_interview_enhancement.sql.',
      });
    }
    res.status(500).json({ error: 'Failed to book interview' });
  }
});

// Get user's booked interviews
router.get('/my-bookings', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('real_interviews')
      .select(`
        id, scheduled_at, status, meeting_link, notes, feedback, rating, created_at,
        hr:profiles!real_interviews_hr_id_fkey(id, full_name),
        slot:interview_slots(slot_date, start_time, end_time)
      `)
      .eq('user_id', req.user.id)
      .order('scheduled_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    if (isSchemaMissingError(error)) {
      return res.status(503).json({
        error: 'Interview scheduling schema is missing. Run migration_interview_enhancement.sql.',
      });
    }
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Cancel a booking
router.put('/cancel/:id', authenticateToken, async (req, res) => {
  try {
    const interviewId = req.params.id;

    // Get the interview
    const { data: interview, error: fetchError } = await supabaseAdmin
      .from('real_interviews')
      .select('slot_id')
      .eq('id', interviewId)
      .eq('user_id', req.user.id)
      .eq('status', 'scheduled')
      .single();

    if (fetchError || !interview) {
      return res.status(404).json({ error: 'Interview not found or cannot be cancelled' });
    }

    // Update interview status
    await supabaseAdmin
      .from('real_interviews')
      .update({ status: 'cancelled' })
      .eq('id', interviewId);

    // Free up the slot
    if (interview.slot_id) {
      await supabaseAdmin
        .from('interview_slots')
        .update({ is_booked: false, booked_by: null })
        .eq('id', interview.slot_id);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error cancelling interview:', error);
    if (isSchemaMissingError(error)) {
      return res.status(503).json({
        error: 'Interview scheduling schema is missing. Run migration_interview_enhancement.sql.',
      });
    }
    res.status(500).json({ error: 'Failed to cancel interview' });
  }
});

export default router;
