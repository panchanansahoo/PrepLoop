import express from 'express';
import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateToken, requireHR } from '../middleware/auth.js';
import { hrLoginLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

const getJwtSigningSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is required');
  }
  return secret;
};

// HR Registration
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, company, designation, experience } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required' });
    }

    // Check if HR email already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (full_name, email, password, role, company, designation, experience_years, created_at)
       VALUES ($1, $2, $3, 'hr', $4, $5, $6, NOW())
       RETURNING id, full_name, email, role`,
      [fullName, email, hashedPassword, company || null, designation || null, experience || null]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: 'hr' },
      getJwtSigningSecret(),
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'HR account created successfully',
      token,
      user: { id: user.id, fullName: user.full_name, email: user.email, role: 'hr' },
    });
  } catch (error) {
    console.error('HR register error:', error);
    res.status(500).json({ error: 'Failed to register HR account' });
  }
});

// HR Login
router.post('/login', hrLoginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query(
      `SELECT id, full_name, email, password, role FROM users WHERE email = $1 AND role = 'hr'`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid HR credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid HR credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: 'hr' },
      getJwtSigningSecret(),
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, fullName: user.full_name, email: user.email, role: 'hr' },
    });
  } catch (error) {
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
      `INSERT INTO interview_slots (hr_id, slot_date, start_time, end_time, max_bookings, status)
       VALUES ($1, $2, $3, $4, $5, 'available')
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
        (SELECT COUNT(*) FROM interview_bookings WHERE slot_id = s.id AND status = 'scheduled') as booked_count
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
      `SELECT b.*, 
        s.slot_date, s.start_time, s.end_time,
        u.full_name as student_name, u.email as student_email
       FROM interview_bookings b
       JOIN interview_slots s ON b.slot_id = s.id
       JOIN users u ON b.user_id = u.id
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

    const result = await pool.query(
      `UPDATE interview_bookings AS b
       SET status = 'completed', rating = $1, feedback = $2
       FROM interview_slots AS s
       WHERE b.id = $3
         AND b.slot_id = s.id
         AND s.hr_id = $4
       RETURNING b.id`,
      [rating || null, feedback || null, req.params.bookingId, req.user.id]
    );

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

    const result = await pool.query(
      `INSERT INTO job_listings (posted_by, title, company, location, type, salary_range, description, requirements, apply_link, source, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'hr', true, NOW())
       RETURNING *`,
      [req.user.id, title, company, location || null, type || 'full-time', salary || null, description, requirements ? JSON.stringify(requirements.split(',').map(r => r.trim())) : '[]', applyUrl || null]
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
