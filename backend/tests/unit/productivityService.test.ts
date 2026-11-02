import { describe, it, expect } from 'vitest';
import { ProductivityService } from '../../services/productivityService.js';

describe('ProductivityService Data Mapping & Formatting', () => {
  it('verifies service exposes core todo and calendar methods', () => {
    expect(typeof ProductivityService.getTodos).toBe('function');
    expect(typeof ProductivityService.createTodo).toBe('function');
    expect(typeof ProductivityService.updateTodo).toBe('function');
    expect(typeof ProductivityService.deleteTodo).toBe('function');
    expect(typeof ProductivityService.clearCompletedTodos).toBe('function');
    expect(typeof ProductivityService.getCalendarEvents).toBe('function');
    expect(typeof ProductivityService.createCalendarEvent).toBe('function');
    expect(typeof ProductivityService.updateCalendarEvent).toBe('function');
    expect(typeof ProductivityService.deleteCalendarEvent).toBe('function');
  });
});

