import express from 'express';
import { CreateJobApplicationSchema, UpdateJobApplicationSchema } from '@preploop/contracts/jobs';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { authenticateToken } from '../middleware/auth.ts';
import { validateBody } from '../middleware/validateZod.js';

const router = express.Router();

function isMissingTableError(error) {
  const code = String(error?.code || '').toUpperCase();
  const msg = String(error?.message || '').toLowerCase();
  return code === '42P01' || msg.includes('does not exist') || msg.includes('could not find');
}

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    company: row.company,
    role: row.role,
    status: row.status,
    notes: row.notes || '',
    jobUrl: row.job_url || '',
    location: row.location || '',
    salaryRange: row.salary_range || '',
    appliedAt: row.applied_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('job_applications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('applied_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      if (isMissingTableError(error)) {
        return res.json({ applications: [], schemaReady: false });
      }
      throw error;
    }

    return res.json({ applications: (data || []).map(mapRow), schemaReady: true });
  } catch (err) {
    console.error('[job-applications] GET failed:', err?.message || err);
    return res.status(500).json({ error: 'Failed to load job applications' });
  }
});

router.post('/', authenticateToken, validateBody(CreateJobApplicationSchema), async (req, res) => {
  try {
    const { company, role, status, notes, jobUrl, location, salaryRange, appliedAt } = req.body;
    const payload = {
      user_id: req.user.id,
      company,
      role,
      status,
      notes: notes || '',
      job_url: jobUrl || '',
      location: location || '',
      salary_range: salaryRange || '',
      applied_at: appliedAt || (status !== 'bookmarked' ? new Date().toISOString() : null),
    };

    const { data, error } = await supabaseAdmin
      .from('job_applications')
      .insert(payload)
      .select()
      .single();

    if (error) {
      if (isMissingTableError(error)) {
        return res.status(503).json({ error: 'Job applications table not yet migrated' });
      }
      throw error;
    }

    return res.status(201).json({ application: mapRow(data) });
  } catch (err) {
    console.error('[job-applications] POST failed:', err?.message || err);
    return res.status(500).json({ error: 'Failed to create job application' });
  }
});

router.patch('/:id', authenticateToken, validateBody(UpdateJobApplicationSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { updated_at: new Date().toISOString() };
    if (req.body.company !== undefined) updates.company = req.body.company;
    if (req.body.role !== undefined) updates.role = req.body.role;
    if (req.body.status !== undefined) updates.status = req.body.status;
    if (req.body.notes !== undefined) updates.notes = req.body.notes;
    if (req.body.jobUrl !== undefined) updates.job_url = req.body.jobUrl;
    if (req.body.location !== undefined) updates.location = req.body.location;
    if (req.body.salaryRange !== undefined) updates.salary_range = req.body.salaryRange;
    if (req.body.appliedAt !== undefined) updates.applied_at = req.body.appliedAt;

    const { data, error } = await supabaseAdmin
      .from('job_applications')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error)) {
        return res.status(503).json({ error: 'Job applications table not yet migrated' });
      }
      throw error;
    }
    if (!data) {
      return res.status(404).json({ error: 'Job application not found' });
    }

    return res.json({ application: mapRow(data) });
  } catch (err) {
    console.error('[job-applications] PATCH failed:', err?.message || err);
    return res.status(500).json({ error: 'Failed to update job application' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('job_applications')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select('id')
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error)) {
        return res.status(503).json({ error: 'Job applications table not yet migrated' });
      }
      throw error;
    }
    if (!data) {
      return res.status(404).json({ error: 'Job application not found' });
    }

    return res.json({ deleted: true, id: data.id });
  } catch (err) {
    console.error('[job-applications] DELETE failed:', err?.message || err);
    return res.status(500).json({ error: 'Failed to delete job application' });
  }
});

export default router;
