import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../utils/apiClient';
import { useAuth } from '../context/AuthContext';
import { buildApiUrl } from '../utils/safeApiUrl';

const STORAGE_KEY = 'preploop_todo_list';
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

function buildTodoApiUrl(path) {
  return buildApiUrl(path, { rawBaseUrl: API_BASE_URL, apiPrefix: '/api' });
}

function loadFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function saveToStorage(todos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

export default function useTodos() {
  const { user } = useAuth();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isLoggedIn = !!user;
  const initialLoadDone = useRef(false);

  // Fetch todos on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchTodos() {
      setLoading(true);
      setError(null);

      if (!isLoggedIn) {
        // Guest mode: use localStorage
        setTodos(loadFromStorage());
        setLoading(false);
        initialLoadDone.current = true;
        return;
      }

      try {
        const res = await apiClient.get(buildTodoApiUrl('/user/todos'));
        if (!cancelled) {
          const serverTodos = res?.todos || res?.data?.todos || [];
          setTodos(prev => {
            const pendingLocal = prev.filter(t => t._localOnly);
            if (pendingLocal.length === 0) return serverTodos;
            const unsynced = pendingLocal.filter(
              local => !serverTodos.some(s => s.text === local.text && s.category === local.category)
            );
            return [...serverTodos, ...unsynced];
          });
          initialLoadDone.current = true;
        }
      } catch (err) {
        console.error('Failed to fetch todos:', err);
        if (!cancelled) {
          setError('Failed to load todos');
          // Fallback to localStorage
          setTodos(loadFromStorage());
          initialLoadDone.current = true;
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTodos();
    return () => { cancelled = true; };
  }, [isLoggedIn]);

  // Sync to localStorage for guest mode
  useEffect(() => {
    if (!isLoggedIn && initialLoadDone.current) {
      saveToStorage(todos);
    }
  }, [todos, isLoggedIn]);

  const addTodo = useCallback(async ({ text, priority, category, dueDate }) => {
    if (!text || !text.trim()) return;

    if (!isLoggedIn) {
      const newTodo = {
        id: Date.now(),
        text: text.trim(),
        done: false,
        priority: priority || 'medium',
        category: category || 'study',
        dueDate: dueDate || null,
        createdAt: new Date().toISOString(),
        subtasks: [],
      };
      setTodos(prev => [...prev, newTodo]);
      return newTodo;
    }

    try {
      const res = await apiClient.post(buildTodoApiUrl('/user/todos'), { text, priority, category, dueDate });
      const newTodo = res?.todo || res?.data?.todo || res;
      setTodos(prev => [...prev, newTodo]);
      return newTodo;
    } catch (err) {
      console.error('Failed to add todo:', err);
      // Optimistic fallback marked as local-only
      const newTodo = {
        id: `local_${Date.now()}`,
        _localOnly: true,
        text: text.trim(),
        done: false,
        priority: priority || 'medium',
        category: category || 'study',
        dueDate: dueDate || null,
        createdAt: new Date().toISOString(),
        subtasks: [],
      };
      setTodos(prev => [...prev, newTodo]);
      return newTodo;
    }
  }, [isLoggedIn]);

  const toggleTodo = useCallback(async (id) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    // Optimistic update
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));

    if (isLoggedIn && !todo._localOnly) {
      try {
        await apiClient.put(buildTodoApiUrl(`/user/todos/${id}`), { completed: !todo.done });
      } catch (err) {
        console.error('Failed to toggle todo:', err);
        // Revert on failure
        setTodos(prev => prev.map(t => t.id === id ? { ...t, done: todo.done } : t));
      }
    }
  }, [isLoggedIn, todos]);

  const updateTodo = useCallback(async (id, updates) => {
    // Optimistic update
    const targetTodo = todos.find(t => t.id === id);
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

    if (isLoggedIn && !targetTodo?._localOnly) {
      try {
        const payload = {};
        if (updates.text !== undefined) payload.text = updates.text;
        if (updates.done !== undefined) payload.completed = updates.done;
        if (updates.priority !== undefined) payload.priority = updates.priority;
        if (updates.category !== undefined) payload.category = updates.category;
        if (updates.dueDate !== undefined) payload.dueDate = updates.dueDate;
        if (updates.subtasks !== undefined) payload.subtasks = updates.subtasks;

        await apiClient.put(buildTodoApiUrl(`/user/todos/${id}`), payload);
      } catch (err) {
        console.error('Failed to update todo:', err);
      }
    }
  }, [isLoggedIn, todos]);

  const deleteTodo = useCallback(async (id) => {
    const prev = todos;
    const todoToDelete = prev.find(t => t.id === id);
    setTodos(p => p.filter(t => t.id !== id));

    if (isLoggedIn && !todoToDelete?._localOnly) {
      try {
        await apiClient.delete(buildTodoApiUrl(`/user/todos/${id}`));
      } catch (err) {
        console.error('Failed to delete todo:', err);
        setTodos(prev);
      }
    }
  }, [isLoggedIn, todos]);

  const clearCompleted = useCallback(async () => {
    const prev = todos;
    setTodos(p => p.filter(t => !t.done));

    if (isLoggedIn) {
      try {
        await apiClient.delete(buildTodoApiUrl('/user/todos'));
      } catch (err) {
        console.error('Failed to clear completed:', err);
        setTodos(prev);
      }
    }
  }, [isLoggedIn, todos]);

  // Reorder (local-only, persists ordering via next sync)
  const reorderTodos = useCallback((newTodos) => {
    setTodos(newTodos);
  }, []);

  return {
    todos,
    loading,
    error,
    addTodo,
    toggleTodo,
    updateTodo,
    deleteTodo,
    clearCompleted,
    reorderTodos,
    setTodos,
  };
}
