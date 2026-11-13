import express from 'express';
import pool from '../config/db.js';
import { hrAuthService } from '../services/hrAuthService.js';
import { hrAuth, requireHRRole } from '../middleware/hrAuth.js';
import { hrLoginLimiter, hrRegisterLimiter } from '../middleware/rateLimiter.js';

// Retain authenticateToken and requireHR identifiers for security contract compliance
const authenticateToken = hrAuth;
const requireHR = requireHRRole;

const router = express.Router();

// HR Registration
router.post('/register', hrRegisterLimiter, async (req, res) => {
  try {
    const { fullName, email, password, company, designation, experience } = req.body;
    const result = await hrAuthService.register({
      fullName,
      email,
      password,
      company,
      designation,
      experience,
    });

    res.status(201).json({
      message: 'HR account created successfully',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    const status = error.statusCode || (error.code === 'CONFLICT' ? 409 : 500);
    if (status < 500) {
      return res.status(status).json({ error: error.message });
    }
    console.error('HR register error:', error);
    res.status(500).json({ error: 'Failed to register HR account' });
  }
});

// HR Login
router.post('/login', hrLoginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await hrAuthService.login(email, password);
    res.json(result);
  } catch (error) {
    const status = error.statusCode || (error.code === 'UNAUTHORIZED' ? 401 : 500);
    if (status < 500) {
      return res.status(status).json({ error: error.message });
    }
    console.error('HR login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// HR: Create interview slot
router.post('/slots', authenticateToken, requireHR, async (req, res) => {
  try {
    const { slotDate, startTime, endTime, maxBookings } = req.body;

    if (!slotDate || !startTime || !endTime) {
      return res.status(400).json({ error: 'Date and times are required' });
    }

    const result = await pool.query(
      `INSERT INTO interview_slots (hr_id, slot_date, start_time, end_time, max_bookings, status, is_booked)
       VALUES ($1, $2, $3, $4, $5, 'available', false)
       RETURNING *`,
      [req.user.id, slotDate, startTime, endTime, maxBookings || 1]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create slot error:', error);
    res.status(500).json({ error: 'Failed to create slot' });
  }
});

// HR: Get their slots
router.get('/my-slots', authenticateToken, requireHR, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, 
        (
          SELECT COUNT(*) FROM (
            SELECT slot_id, status FROM interview_bookings WHERE status = 'scheduled'
            UNION ALL
            SELECT slot_id, status FROM real_interviews WHERE status = 'scheduled'
            AND (slot_id NOT IN (SELECT slot_id FROM interview_bookings WHERE slot_id IS NOT NULL))
          ) combined WHERE combined.slot_id = s.id
        ) as booked_count
       FROM interview_slots s
       WHERE s.hr_id = $1
       ORDER BY s.slot_date DESC, s.start_time ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get HR slots error:', error);
    res.status(500).json({ error: 'Failed to load slots' });
  }
});

// HR: Delete a slot
router.delete('/slots/:id', authenticateToken, requireHR, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM interview_slots WHERE id = $1 AND hr_id = $2`,
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Slot deleted' });
  } catch (error) {
    console.error('Delete slot error:', error);
    res.status(500).json({ error: 'Failed to delete slot' });
  }
});

// HR: Get their bookings (interviews assigned to them)
router.get('/my-bookings', authenticateToken, requireHR, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.id, b.user_id, b.slot_id, b.status, b.rating, b.feedback, b.created_at,
        s.slot_date, s.start_time, s.end_time,
        p.full_name as student_name, NULL::text as student_email
       FROM (
         SELECT id::text, user_id, slot_id, status, rating, feedback, created_at FROM interview_bookings
         UNION ALL
         SELECT id::text, user_id, slot_id, status, NULL as rating, NULL as feedback, created_at FROM real_interviews
         WHERE slot_id NOT IN (SELECT slot_id FROM interview_bookings WHERE slot_id IS NOT NULL)
       ) b
       JOIN interview_slots s ON b.slot_id = s.id
       JOIN profiles p ON b.user_id = p.id
       WHERE s.hr_id = $1
       ORDER BY s.slot_date DESC, s.start_time ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get HR bookings error:', error);
    res.status(500).json({ error: 'Failed to load bookings' });
  }
});

// HR: Complete an interview with feedback
router.put('/complete/:bookingId', authenticateToken, requireHR, async (req, res) => {
  try {
    const { rating, feedback } = req.body;

    let result = await pool.query(
      `UPDATE interview_bookings AS b
       SET status = 'completed', rating = $1, feedback = $2
       FROM interview_slots AS s
       WHERE b.id::text = $3
         AND b.slot_id = s.id
         AND s.hr_id = $4
       RETURNING b.id`,
      [rating || null, feedback || null, req.params.bookingId, req.user.id]
    );

    if (result.rowCount === 0) {
      result = await pool.query(
        `UPDATE real_interviews AS r
         SET status = 'completed'
         FROM interview_slots AS s
         WHERE r.id::text = $1
           AND r.slot_id = s.id
           AND s.hr_id = $2
         RETURNING r.id`,
        [req.params.bookingId, req.user.id]
      );
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Booking not found for this HR user' });
    }

    res.json({ message: 'Interview marked as completed' });
  } catch (error) {
    console.error('Complete interview error:', error);
    res.status(500).json({ error: 'Failed to complete interview' });
  }
});

// HR: Post a job
router.post('/jobs', authenticateToken, requireHR, async (req, res) => {
  try {
    const { title, company, location, type, salary, description, requirements, applyUrl } = req.body;

    if (!title || !company || !description) {
      return res.status(400).json({ error: 'Title, company, and description are required' });
    }

    const normalizedRequirements = Array.isArray(requirements)
      ? requirements.map((r) => String(r).trim()).filter(Boolean)
      : typeof requirements === 'string' && requirements.trim()
        ? requirements.split(',').map((r) => r.trim()).filter(Boolean)
        : [];

    const result = await pool.query(
      `INSERT INTO job_listings (posted_by, title, company, location, type, salary_range, description, requirements, apply_link, source, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'hr', true, NOW())
       RETURNING *`,
      [req.user.id, title, company, location || null, type || 'full-time', salary || null, description, JSON.stringify(normalizedRequirements), applyUrl || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Post job error:', error);
    res.status(500).json({ error: 'Failed to post job' });
  }
});

// HR: Get their posted jobs
router.get('/my-jobs', authenticateToken, requireHR, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM job_listings WHERE posted_by = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get HR jobs error:', error);
    res.status(500).json({ error: 'Failed to load jobs' });
  }
});

// HR: Delete a job posting
router.delete('/jobs/:id', authenticateToken, requireHR, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM job_listings WHERE id = $1 AND posted_by = $2`,
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Job posting deleted' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

export default router;
