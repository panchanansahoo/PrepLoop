import express from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import { ProductivityService } from '../../services/productivityService.js';

const router = express.Router();

router.get("/todos", authenticateToken, async (req, res) => {
  try {
    const todos = await ProductivityService.getTodos(req.user.id);
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

    const todo = await ProductivityService.createTodo(req.user.id, {
      text,
      priority,
      category,
      dueDate,
      subtasks,
    });
    res.json({ todo });
  } catch (error) {
    console.error("Error creating todo:", error);
    res.status(500).json({ error: "Failed to create todo" });
  }
});

router.put("/todos/:id", authenticateToken, async (req, res) => {
  try {
    const todo = await ProductivityService.updateTodo(req.user.id, req.params.id, req.body);
    res.json({ todo });
  } catch (error) {
    console.error("Error updating todo:", error);
    res.status(500).json({ error: "Failed to update todo" });
  }
});

router.delete("/todos/:id", authenticateToken, async (req, res) => {
  try {
    await ProductivityService.deleteTodo(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting todo:", error);
    res.status(500).json({ error: "Failed to delete todo" });
  }
});

router.delete("/todos", authenticateToken, async (req, res) => {
  try {
    await ProductivityService.clearCompletedTodos(req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error clearing completed todos:", error);
    res.status(500).json({ error: "Failed to clear completed todos" });
  }
});

router.get("/calendar-events", authenticateToken, async (req, res) => {
  try {
    const events = await ProductivityService.getCalendarEvents(req.user.id);
    res.json({ events });
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

    const event = await ProductivityService.createCalendarEvent(req.user.id, {
      title,
      date,
      time,
      tag,
    });
    res.json({ event });
  } catch (error) {
    console.error("Error creating calendar event:", error);
    res.status(500).json({ error: "Failed to create calendar event" });
  }
});

router.put("/calendar-events/:id", authenticateToken, async (req, res) => {
  try {
    const event = await ProductivityService.updateCalendarEvent(req.user.id, req.params.id, req.body);
    res.json({ event });
  } catch (error) {
    console.error("Error updating calendar event:", error);
    res.status(500).json({ error: "Failed to update calendar event" });
  }
});

router.delete("/calendar-events/:id", authenticateToken, async (req, res) => {
  try {
    await ProductivityService.deleteCalendarEvent(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    res.status(500).json({ error: "Failed to delete calendar event" });
  }
});

export default router;
