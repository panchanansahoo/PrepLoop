import express from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

function handleTableNotFoundError(error) {
  if (error?.code === 'PGRST205' || error?.code === '42P01' || error?.message?.includes('does not exist')) {
    // Return mock data if the table hasn't been created yet
    return {
      isTableNotFound: true,
      response: {
        status: 200,
        body: {
          groups: [
            {
              id: 'mock-1',
              name: 'DSA Grinders',
              description: 'Daily LeetCode discussions and mock interviews for top tech companies.',
              emoji: '⚔️',
              color: '#ef4444',
              tags: ['DSA', 'LeetCode', 'Daily'],
              creator_name: 'System',
              member_count: 142,
              online_count: 24,
              created_at: new Date().toISOString()
            },
            {
              id: 'mock-2',
              name: 'System Design Architects',
              description: 'Deep dives into scalable architectures, distributed systems, and design patterns.',
              emoji: '🏗️',
              color: '#3b82f6',
              tags: ['System Design', 'Architecture'],
              creator_name: 'System',
              member_count: 89,
              online_count: 12,
              created_at: new Date().toISOString()
            },
            {
              id: 'mock-3',
              name: 'Frontend Wizards',
              description: 'React, Vue, performance optimization, and UI/UX discussions.',
              emoji: '✨',
              color: '#8b5cf6',
              tags: ['Frontend', 'React', 'UI'],
              creator_name: 'System',
              member_count: 210,
              online_count: 45,
              created_at: new Date().toISOString()
            },
            {
              id: 'mock-4',
              name: 'Backend Engineers Connect',
              description: 'Node.js, Go, databases, and API design principles.',
              emoji: '⚙️',
              color: '#10b981',
              tags: ['Backend', 'Node.js', 'Databases'],
              creator_name: 'System',
              member_count: 156,
              online_count: 18,
              created_at: new Date().toISOString()
            }
          ]
        }
      }
    };
  }

  return { isTableNotFound: false };
}

// Get all study groups
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('study_groups')
      .select(`
        *,
        profiles!study_groups_creator_id_fkey(full_name)
      `)
      .eq('is_public', true)
      .order('member_count', { ascending: false });

    if (error) throw error;

    const groups = (data || []).map(g => ({
      id: g.id,
      name: g.name,
      description: g.description,
      emoji: g.emoji,
      color: g.color,
      tags: g.tags || [],
      creator_name: g.profiles?.full_name || 'Anonymous',
      member_count: g.member_count || 0,
      online_count: g.online_count || 0,
      created_at: g.created_at,
    }));

    res.json({ groups });
  } catch (error) {
    const tableError = handleTableNotFoundError(error);
    if (tableError.isTableNotFound) {
      console.warn('Study groups table not found in database');
      return res.status(tableError.response.status).json(tableError.response.body);
    }

    console.error('Error fetching study groups:', error);
    res.status(500).json({ error: 'Failed to fetch study groups' });
  }
});

// Get single study group
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('study_groups')
      .select(`
        *,
        profiles!study_groups_creator_id_fkey(full_name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Study group not found' });

    // Server-side access control for private study groups (IDOR / BOLA prevention)
    if (data.is_public === false) {
      if (!req.user?.id) {
        return res.status(403).json({ error: 'Authentication required for private study groups', code: 'FORBIDDEN' });
      }
      if (data.creator_id !== req.user.id && req.user.role !== 'admin') {
        const { data: member } = await supabaseAdmin
          .from('study_group_members')
          .select('id')
          .eq('group_id', id)
          .eq('user_id', req.user.id)
          .maybeSingle();

        if (!member) {
          return res.status(403).json({ error: 'Access to this private study group requires membership', code: 'FORBIDDEN' });
        }
      }
    }

    const group = {
      id: data.id,
      name: data.name,
      description: data.description,
      emoji: data.emoji,
      color: data.color,
      tags: data.tags || [],
      creator_name: data.profiles?.full_name || 'Anonymous',
      member_count: data.member_count || 0,
      online_count: data.online_count || 0,
      created_at: data.created_at,
    };

    res.json({ group });
  } catch (error) {
    const tableError = handleTableNotFoundError(error);
    if (tableError.isTableNotFound) {
      console.warn('Study groups table not found in database');
      return res.status(tableError.response.status).json(tableError.response.body);
    }

    console.error('Error fetching study group:', error);
    res.status(500).json({ error: 'Failed to fetch study group' });
  }
});

// Create study group
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, emoji, color, tags } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const { data: group, error: groupError } = await supabaseAdmin
      .from('study_groups')
      .insert({
        name: name.trim().slice(0, 255),
        description: description?.trim().slice(0, 1000) || '',
        emoji: emoji || '📚',
        color: color || '#60a5fa',
        tags: Array.isArray(tags) ? tags.slice(0, 10) : [],
        creator_id: req.user.id,
        member_count: 1,
      })
      .select()
      .single();

    if (groupError) throw groupError;

    // Add creator as admin member
    const { error: memberError } = await supabaseAdmin
      .from('study_group_members')
      .insert({
        group_id: group.id,
        user_id: req.user.id,
        role: 'admin',
      });

    if (memberError) throw memberError;

    res.json({ group });
  } catch (error) {
    const tableError = handleTableNotFoundError(error);
    if (tableError.isTableNotFound) {
      console.warn('Study groups table not found in database');
      return res.status(tableError.response.status).json(tableError.response.body);
    }

    console.error('Error creating study group:', error);
    res.status(500).json({ error: 'Failed to create study group' });
  }
});

// Join study group
router.post('/:id/join', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if group exists and if private access is restricted
    const { data: targetGroup } = await supabaseAdmin
      .from('study_groups')
      .select('id, is_public')
      .eq('id', id)
      .maybeSingle();

    if (!targetGroup) {
      return res.status(404).json({ error: 'Study group not found' });
    }
    if (targetGroup.is_public === false && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Cannot directly join a private study group. An invitation is required.', code: 'FORBIDDEN' });
    }

    // Check if already a member
    const { data: existing } = await supabaseAdmin
      .from('study_group_members')
      .select('id')
      .eq('group_id', id)
      .eq('user_id', req.user.id)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Already a member of this group' });
    }

    const { error } = await supabaseAdmin
      .from('study_group_members')
      .insert({
        group_id: id,
        user_id: req.user.id,
        role: 'member',
      });

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    const tableError = handleTableNotFoundError(error);
    if (tableError.isTableNotFound) {
      console.warn('Study groups table not found in database');
      return res.status(tableError.response.status).json(tableError.response.body);
    }

    console.error('Error joining study group:', error);
    res.status(500).json({ error: 'Failed to join study group' });
  }
});

// Leave study group
router.post('/:id/leave', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('study_group_members')
      .delete()
      .eq('group_id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    const tableError = handleTableNotFoundError(error);
    if (tableError.isTableNotFound) {
      console.warn('Study groups table not found in database');
      return res.status(tableError.response.status).json(tableError.response.body);
    }

    console.error('Error leaving study group:', error);
    res.status(500).json({ error: 'Failed to leave study group' });
  }
});

// Get group members
router.get('/:id/members', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check group visibility first (IDOR / BOLA prevention)
    const { data: group } = await supabaseAdmin
      .from('study_groups')
      .select('id, is_public, creator_id')
      .eq('id', id)
      .maybeSingle();

    if (!group) return res.status(404).json({ error: 'Study group not found' });

    if (group.is_public === false) {
      if (!req.user?.id) {
        return res.status(403).json({ error: 'Authentication required for private study groups', code: 'FORBIDDEN' });
      }
      if (group.creator_id !== req.user.id && req.user.role !== 'admin') {
        const { data: member } = await supabaseAdmin
          .from('study_group_members')
          .select('id')
          .eq('group_id', id)
          .eq('user_id', req.user.id)
          .maybeSingle();

        if (!member) {
          return res.status(403).json({ error: 'Access to this private study group requires membership', code: 'FORBIDDEN' });
        }
      }
    }

    const { data, error } = await supabaseAdmin
      .from('study_group_members')
      .select(`
        *,
        profiles!study_group_members_user_id_fkey(full_name)
      `)
      .eq('group_id', id)
      .order('joined_at', { ascending: true });

    if (error) throw error;

    const members = (data || []).map(m => ({
      id: m.id,
      user_id: m.user_id,
      name: m.profiles?.full_name || 'Anonymous',
      role: m.role,
      joined_at: m.joined_at,
    }));

    res.json({ members });
  } catch (error) {
    const tableError = handleTableNotFoundError(error);
    if (tableError.isTableNotFound) {
      console.warn('Study groups table not found in database');
      return res.status(tableError.response.status).json(tableError.response.body);
    }

    console.error('Error fetching group members:', error);
    res.status(500).json({ error: 'Failed to fetch group members' });
  }
});

export default router;
