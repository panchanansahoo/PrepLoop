import { supabaseAdmin } from '../db/supabaseClient.js';

export class ProductivityService {
  static async getTodos(userId) {
    const { data, error } = await supabaseAdmin
      .from("user_todos")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(200);

    if (error) throw error;

    return (data || []).map((t) => ({
      id: t.id,
      text: t.text,
      done: Boolean(t.completed),
      priority: t.priority || 'medium',
      category: (t.category || 'Study').toLowerCase(),
      dueDate: t.due_date,
      createdAt: t.created_at,
      subtasks: t.subtasks || [],
    }));
  }

  static async createTodo(userId, payload) {
    const { text, priority, category, dueDate, subtasks } = payload;
    const sanitizedText = String(text || '').trim().slice(0, 500);
    const { data, error } = await supabaseAdmin
      .from("user_todos")
      .insert({
        user_id: userId,
        text: sanitizedText,
        priority: priority || 'medium',
        category: category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Study',
        due_date: dueDate || null,
        subtasks: Array.isArray(subtasks) ? subtasks.slice(0, 50) : [],
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      text: data.text,
      done: Boolean(data.completed),
      priority: data.priority,
      category: (data.category || 'Study').toLowerCase(),
      dueDate: data.due_date,
      createdAt: data.created_at,
      subtasks: data.subtasks || [],
    };
  }

  static async updateTodo(userId, id, updates) {
    const patch = { updated_at: new Date().toISOString() };
    if (updates.text !== undefined) patch.text = String(updates.text).trim().slice(0, 500);
    if (updates.completed !== undefined) patch.completed = Boolean(updates.completed);
    if (updates.priority !== undefined) patch.priority = updates.priority;
    if (updates.category !== undefined) patch.category = updates.category.charAt(0).toUpperCase() + updates.category.slice(1);
    if (updates.dueDate !== undefined) patch.due_date = updates.dueDate;
    if (updates.subtasks !== undefined) patch.subtasks = Array.isArray(updates.subtasks) ? updates.subtasks.slice(0, 50) : [];

    const { data, error } = await supabaseAdmin
      .from("user_todos")
      .update(patch)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      text: data.text,
      done: Boolean(data.completed),
      priority: data.priority,
      category: (data.category || 'Study').toLowerCase(),
      dueDate: data.due_date,
      createdAt: data.created_at,
      subtasks: data.subtasks || [],
    };
  }

  static async deleteTodo(userId, id) {
    const { error } = await supabaseAdmin
      .from("user_todos")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
    return true;
  }

  static async clearCompletedTodos(userId) {
    const { error } = await supabaseAdmin
      .from("user_todos")
      .delete()
      .eq("user_id", userId)
      .eq("completed", true);

    if (error) throw error;
    return true;
  }

  static async getCalendarEvents(userId) {
    const { data, error } = await supabaseAdmin
      .from("user_calendar_events")
      .select("*")
      .eq("user_id", userId)
      .order("event_date", { ascending: true });

    if (error) throw error;

    const eventsByDate = {};
    (data || []).forEach((evt) => {
      const key = evt.event_date;
      if (!eventsByDate[key]) eventsByDate[key] = [];
      eventsByDate[key].push({
        id: evt.id,
        title: evt.title,
        time: evt.event_time || '',
        tag: evt.tag || 'study',
        date: evt.event_date,
      });
    });

    return eventsByDate;
  }

  static async createCalendarEvent(userId, payload) {
    const { title, date, time, tag } = payload;
    const { data, error } = await supabaseAdmin
      .from("user_calendar_events")
      .insert({
        user_id: userId,
        title: title.trim(),
        event_date: date,
        event_time: time || null,
        tag: tag || 'study',
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      time: data.event_time || '',
      tag: data.tag || 'study',
      date: data.event_date,
    };
  }

  static async updateCalendarEvent(userId, id, updates) {
    const patch = {};
    if (updates.title !== undefined) patch.title = updates.title.trim();
    if (updates.time !== undefined) patch.event_time = updates.time;
    if (updates.tag !== undefined) patch.tag = updates.tag;

    const { data, error } = await supabaseAdmin
      .from("user_calendar_events")
      .update(patch)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      time: data.event_time || '',
      tag: data.tag || 'study',
      date: data.event_date,
    };
  }

  static async deleteCalendarEvent(userId, id) {
    const { error } = await supabaseAdmin
      .from("user_calendar_events")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
    return true;
  }
}

export default ProductivityService;

