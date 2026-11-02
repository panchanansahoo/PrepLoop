import { supabaseAdmin } from '../db/supabaseClient.js';

export interface FormattedTodo {
  id: string;
  text: string;
  done: boolean;
  priority: string;
  category: string;
  dueDate: string | null;
  createdAt: string;
  subtasks: any[];
}

export interface FormattedCalendarEvent {
  id: string;
  title: string;
  time: string;
  tag: string;
  date: string;
}

export class ProductivityService {
  static async getTodos(userId: string): Promise<FormattedTodo[]> {
    const { data, error } = await supabaseAdmin
      .from("user_todos")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return (data || []).map((t: any) => ({
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

  static async createTodo(
    userId: string,
    payload: { text: string; priority?: string; category?: string; dueDate?: string; subtasks?: any[] }
  ): Promise<FormattedTodo> {
    const { text, priority, category, dueDate, subtasks } = payload;
    const { data, error } = await supabaseAdmin
      .from("user_todos")
      .insert({
        user_id: userId,
        text: text.trim(),
        priority: priority || 'medium',
        category: category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Study',
        due_date: dueDate || null,
        subtasks: subtasks || [],
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

  static async updateTodo(
    userId: string,
    id: string,
    updates: { text?: string; completed?: boolean; priority?: string; category?: string; dueDate?: string; subtasks?: any[] }
  ): Promise<FormattedTodo> {
    const patch: Record<string, any> = { updated_at: new Date().toISOString() };
    if (updates.text !== undefined) patch.text = updates.text.trim();
    if (updates.completed !== undefined) patch.completed = updates.completed;
    if (updates.priority !== undefined) patch.priority = updates.priority;
    if (updates.category !== undefined) patch.category = updates.category.charAt(0).toUpperCase() + updates.category.slice(1);
    if (updates.dueDate !== undefined) patch.due_date = updates.dueDate;
    if (updates.subtasks !== undefined) patch.subtasks = updates.subtasks;

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

  static async deleteTodo(userId: string, id: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from("user_todos")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
    return true;
  }

  static async clearCompletedTodos(userId: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from("user_todos")
      .delete()
      .eq("user_id", userId)
      .eq("completed", true);

    if (error) throw error;
    return true;
  }

  static async getCalendarEvents(userId: string): Promise<Record<string, FormattedCalendarEvent[]>> {
    const { data, error } = await supabaseAdmin
      .from("user_calendar_events")
      .select("*")
      .eq("user_id", userId)
      .order("event_date", { ascending: true });

    if (error) throw error;

    const eventsByDate: Record<string, FormattedCalendarEvent[]> = {};
    (data || []).forEach((evt: any) => {
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

  static async createCalendarEvent(
    userId: string,
    payload: { title: string; date: string; time?: string; tag?: string }
  ): Promise<FormattedCalendarEvent> {
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

  static async updateCalendarEvent(
    userId: string,
    id: string,
    updates: { title?: string; time?: string; tag?: string }
  ): Promise<FormattedCalendarEvent> {
    const patch: Record<string, any> = {};
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

  static async deleteCalendarEvent(userId: string, id: string): Promise<boolean> {
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

