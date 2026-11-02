import express from 'express';
import { supabaseAdmin } from '../../db/supabaseClient.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.get("/todos", authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_todos")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Transform to match frontend format
    const todos = (data || []).map(t => ({
      id: t.id,
      text: t.text,
      done: t.completed,
      priority: t.priority || 'medium',
      category: (t.category || 'Study').toLowerCase(),
      dueDate: t.due_date,
      createdAt: t.created_at,
      subtasks: t.subtasks || [],
    }));

    res.json({ todos });
  } catch (error) {
    console.error("Error fetching todos:", error);
    res.status(500).json({ error: "Failed to fetch todos" });
  }
});

router.post("/todos", authenticateToken, async (req, res) => {
  try {
    const { text, priority, category, dueDate, subtasks } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Todo text is required" });
    }

    const { data, error } = await supabaseAdmin
      .from("user_todos")
      .insert({
        user_id: req.user.id,
        text: text.trim(),
        priority: priority || 'medium',
        category: category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Study',
        due_date: dueDate || null,
        subtasks: subtasks || [],
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      todo: {
        id: data.id,
        text: data.text,
        done: data.completed,
        priority: data.priority,
        category: (data.category || 'Study').toLowerCase(),
        dueDate: data.due_date,
        createdAt: data.created_at,
        subtasks: data.subtasks || [],
      }
    });
  } catch (error) {
    console.error("Error creating todo:", error);
    res.status(500).json({ error: "Failed to create todo" });
  }
});

router.put("/todos/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { text, completed, priority, category, dueDate, subtasks } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (text !== undefined) updates.text = text.trim();
    if (completed !== undefined) updates.completed = completed;
    if (priority !== undefined) updates.priority = priority;
    if (category !== undefined) updates.category = category.charAt(0).toUpperCase() + category.slice(1);
    if (dueDate !== undefined) updates.due_date = dueDate;
    if (subtasks !== undefined) updates.subtasks = subtasks;

    const { data, error } = await supabaseAdmin
      .from("user_todos")
      .update(updates)
      .eq("id", id)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      todo: {
        id: data.id,
        text: data.text,
        done: data.completed,
        priority: data.priority,
        category: (data.category || 'Study').toLowerCase(),
        dueDate: data.due_date,
        createdAt: data.created_at,
        subtasks: data.subtasks || [],
      }
    });
  } catch (error) {
    console.error("Error updating todo:", error);
    res.status(500).json({ error: "Failed to update todo" });
  }
});

router.delete("/todos/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from("user_todos")
      .delete()
      .eq("id", id)
      .eq("user_id", req.user.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting todo:", error);
    res.status(500).json({ error: "Failed to delete todo" });
  }
});

router.delete("/todos", authenticateToken, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from("user_todos")
      .delete()
      .eq("user_id", req.user.id)
      .eq("completed", true);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error("Error clearing completed todos:", error);
    res.status(500).json({ error: "Failed to clear completed todos" });
  }
});

router.get("/calendar-events", authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_calendar_events")
      .select("*")
      .eq("user_id", req.user.id)
      .order("event_date", { ascending: true });

    if (error) throw error;

    // Group events by date key (YYYY-MM-DD)
    const eventsByDate = {};
    (data || []).forEach(evt => {
      const key = evt.event_date;
      if (!eventsByDate[key]) eventsByDate[key] = [];
      eventsByDate[key].push({
        id: evt.id,
        title: evt.title,
        time: evt.event_time || '',
        tag: evt.tag || 'study',
      });
    });

    res.json({ events: eventsByDate });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    res.status(500).json({ error: "Failed to fetch calendar events" });
  }
});

router.post("/calendar-events", authenticateToken, async (req, res) => {
  try {
    const { title, date, time, tag } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Event title is required" });
    }
    if (!date) {
      return res.status(400).json({ error: "Event date is required" });
    }

    const { data, error } = await supabaseAdmin
      .from("user_calendar_events")
      .insert({
        user_id: req.user.id,
        title: title.trim(),
        event_date: date,
        event_time: time || null,
        tag: tag || 'study',
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      event: {
        id: data.id,
        title: data.title,
        time: data.event_time || '',
        tag: data.tag || 'study',
        date: data.event_date,
      }
    });
  } catch (error) {
    console.error("Error creating calendar event:", error);
    res.status(500).json({ error: "Failed to create calendar event" });
  }
});

router.put("/calendar-events/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, time, tag } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (time !== undefined) updates.event_time = time;
    if (tag !== undefined) updates.tag = tag;

    const { data, error } = await supabaseAdmin
      .from("user_calendar_events")
      .update(updates)
      .eq("id", id)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      event: {
        id: data.id,
        title: data.title,
        time: data.event_time || '',
        tag: data.tag || 'study',
        date: data.event_date,
      }
    });
  } catch (error) {
    console.error("Error updating calendar event:", error);
    res.status(500).json({ error: "Failed to update calendar event" });
  }
});

router.delete("/calendar-events/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from("user_calendar_events")
      .delete()
      .eq("id", id)
      .eq("user_id", req.user.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    res.status(500).json({ error: "Failed to delete calendar event" });
  }
});

export default router;
