import React, { useState, useRef, useMemo } from 'react';
import { Plus, Trash2, CheckSquare, Square, ListTodo, Flag, Search, Filter, ChevronDown, ChevronRight, GripVertical, CalendarDays, X, CheckCheck } from 'lucide-react';
import useTodos from '../hooks/useTodos';

const PRIORITIES = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };
const CATEGORIES = [
    { id: 'all', label: 'All', color: '#94a3b8' },
    { id: 'study', label: 'Study', color: '#a78bfa' },
    { id: 'interview', label: 'Interview', color: '#f472b6' },
    { id: 'project', label: 'Project', color: '#60a5fa' },
    { id: 'personal', label: 'Personal', color: '#34d399' },
];

function isOverdue(dueDate) {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dueDate + 'T00:00:00') < today;
}

function isDueToday(dueDate) {
    if (!dueDate) return false;
    return dueDate === new Date().toISOString().split('T')[0];
}

function formatDueDate(dueDate) {
    if (!dueDate) return '';
    const d = new Date(dueDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((d - today) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    if (diff <= 7) return `in ${diff}d`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function TodoList() {
    const { todos, loading, addTodo, toggleTodo, updateTodo, deleteTodo, clearCompleted, reorderTodos } = useTodos();
    const [input, setInput] = useState('');
    const [priority, setPriority] = useState('medium');
    const [category, setCategory] = useState('study');
    const [dueDate, setDueDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('created');
    const [dragId, setDragId] = useState(null);
    const [expandedTodos, setExpandedTodos] = useState({});
    const [subtaskInput, setSubtaskInput] = useState({});
    const inputRef = useRef(null);

    const handleAddTodo = async () => {
        const text = input.trim();
        if (!text) return;
        await addTodo({ text, priority, category, dueDate: dueDate || null });
        setInput('');
        setDueDate(new Date().toISOString().split('T')[0]);
        inputRef.current?.focus();
    };

    const handleToggleTodo = (id) => {
        toggleTodo(id);
    };

    const handleDeleteTodo = (id) => {
        deleteTodo(id);
    };

    const handleClearCompleted = () => {
        clearCompleted();
    };

    // Subtask management
    const addSubtask = (todoId) => {
        const text = (subtaskInput[todoId] || '').trim();
        if (!text) return;
        const todo = todos.find(t => t.id === todoId);
        if (!todo) return;
        const newSubtasks = [...(todo.subtasks || []), { id: Date.now(), text, done: false }];
        updateTodo(todoId, { subtasks: newSubtasks });
        setSubtaskInput(prev => ({ ...prev, [todoId]: '' }));
    };

    const toggleSubtask = (todoId, subtaskId) => {
        const todo = todos.find(t => t.id === todoId);
        if (!todo) return;
        const newSubtasks = (todo.subtasks || []).map(st =>
            st.id === subtaskId ? { ...st, done: !st.done } : st
        );
        updateTodo(todoId, { subtasks: newSubtasks });
    };

    const deleteSubtask = (todoId, subtaskId) => {
        const todo = todos.find(t => t.id === todoId);
        if (!todo) return;
        const newSubtasks = (todo.subtasks || []).filter(st => st.id !== subtaskId);
        updateTodo(todoId, { subtasks: newSubtasks });
    };

    const toggleExpand = (id) => {
        setExpandedTodos(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Drag and drop
    const handleDragStart = (e, id) => {
        setDragId(id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, targetId) => {
        e.preventDefault();
        if (dragId === targetId) return;
        const items = [...todos];
        const dragIdx = items.findIndex(t => t.id === dragId);
        const targetIdx = items.findIndex(t => t.id === targetId);
        const [dragged] = items.splice(dragIdx, 1);
        items.splice(targetIdx, 0, dragged);
        reorderTodos(items);
        setDragId(null);
    };

    // Filtered & sorted todos
    const filteredTodos = useMemo(() => {
        let result = [...todos];

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(t => t.text.toLowerCase().includes(q));
        }

        if (filterCategory !== 'all') {
            result = result.filter(t => t.category === filterCategory);
        }

        if (filterStatus === 'active') result = result.filter(t => !t.done);
        else if (filterStatus === 'done') result = result.filter(t => t.done);

        if (sortBy === 'priority') {
            const order = { high: 0, medium: 1, low: 2 };
            result.sort((a, b) => order[a.priority] - order[b.priority]);
        } else if (sortBy === 'due') {
            result.sort((a, b) => {
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return a.dueDate.localeCompare(b.dueDate);
            });
        }

        return result;
    }, [todos, searchQuery, filterCategory, filterStatus, sortBy]);

    const completedCount = todos.filter(t => t.done).length;
    const totalCount = todos.length;
    const overdueCount = todos.filter(t => !t.done && isOverdue(t.dueDate)).length;
    const todayCount = todos.filter(t => !t.done && isDueToday(t.dueDate)).length;
    const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    if (loading) {
        return (
            <div className="todo-widget todo-advanced">
                <div className="todo-header">
                    <div className="todo-title-row">
                        <div className="todo-icon-wrap"><ListTodo size={18} /></div>
                        <div>
                            <h3 className="todo-title">Todo List</h3>
                            <p className="todo-subtitle">Loading...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="todo-widget todo-advanced">
            {/* Header */}
            <div className="todo-header">
                <div className="todo-title-row">
                    <div className="todo-icon-wrap">
                        <ListTodo size={18} />
                    </div>
                    <div>
                        <h3 className="todo-title">Todo List</h3>
                        <p className="todo-subtitle">{completedCount}/{totalCount} done</p>
                    </div>
                </div>
                <div className="todo-header-badges">
                    {overdueCount > 0 && <span className="todo-badge overdue">{overdueCount} overdue</span>}
                    {todayCount > 0 && <span className="todo-badge today">{todayCount} today</span>}
                </div>
            </div>

            {/* Progress Bar */}
            {totalCount > 0 && (
                <div className="todo-progress-wrap">
                    <div className="todo-progress-bar">
                        <div className="todo-progress-fill" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <span className="todo-progress-label">{Math.round(progressPercent)}%</span>
                </div>
            )}

            {/* Search & Filters */}
            <div className="todo-toolbar">
                <div className="todo-search-wrap">
                    <Search size={14} />
                    <input
                        type="text"
                        className="todo-search"
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button className="todo-search-clear" onClick={() => setSearchQuery('')}><X size={12} /></button>
                    )}
                </div>
                <div className="todo-filter-row">
                    <div className="todo-category-pills">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                className={`todo-cat-pill ${filterCategory === cat.id ? 'active' : ''}`}
                                style={filterCategory === cat.id ? { background: cat.color, borderColor: cat.color } : { borderColor: cat.color, color: cat.color }}
                                onClick={() => setFilterCategory(cat.id)}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                    <div className="todo-status-filter">
                        {['all', 'active', 'done'].map(s => (
                            <button
                                key={s}
                                className={`todo-status-btn ${filterStatus === s ? 'active' : ''}`}
                                onClick={() => setFilterStatus(s)}
                            >
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>
                    <select className="todo-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        <option value="created">Created</option>
                        <option value="priority">Priority</option>
                        <option value="due">Due Date</option>
                    </select>
                </div>
            </div>

            {/* Add Task */}
            <div className="todo-add-section">
                <div className="todo-add-row">
                    <div className="todo-input-wrap">
                        <input
                            ref={inputRef}
                            type="text"
                            className="todo-input"
                            placeholder="Add a task..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddTodo()}
                        />
                    </div>
                    <button className="todo-add-btn" onClick={handleAddTodo} disabled={!input.trim()}>
                        <Plus size={16} />
                    </button>
                </div>
                <div className="todo-add-controls">
                    <div className="todo-priority-selector" title="Priority">
                        {Object.entries(PRIORITIES).map(([key, color]) => (
                            <button
                                key={key}
                                className={`todo-priority-dot ${priority === key ? 'active' : ''}`}
                                style={{ background: priority === key ? color : 'transparent', borderColor: color }}
                                onClick={() => setPriority(key)}
                                title={`Priority: ${key}`}
                            />
                        ))}
                    </div>
                    <select
                        className="todo-cat-select"
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        title="Category"
                    >
                        {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                        ))}
                    </select>
                    <div className="todo-due-input" title="Due date">
                        <CalendarDays size={13} />
                        <input
                            type="date"
                            value={dueDate}
                            onChange={e => setDueDate(e.target.value)}
                            className="todo-date-input"
                        />
                    </div>
                </div>
            </div>

            {/* Todo Items */}
            <div className="todo-list-items">
                {filteredTodos.length === 0 && (
                    <div className="todo-empty">
                        <ListTodo size={28} />
                        <span>{searchQuery ? 'No matching tasks' : 'No tasks yet. Add one above!'}</span>
                    </div>
                )}
                {filteredTodos.map(todo => {
                    const catInfo = CATEGORIES.find(c => c.id === todo.category) || CATEGORIES[1];
                    const hasSubtasks = todo.subtasks && todo.subtasks.length > 0;
                    const isExpanded = expandedTodos[todo.id];
                    const subtaskDone = hasSubtasks ? todo.subtasks.filter(st => st.done).length : 0;
                    const overdue = !todo.done && isOverdue(todo.dueDate);

                    return (
                        <div
                            key={todo.id}
                            className={`todo-item ${todo.done ? 'done' : ''} ${overdue ? 'overdue' : ''} ${dragId === todo.id ? 'dragging' : ''}`}
                            draggable
                            onDragStart={e => handleDragStart(e, todo.id)}
                            onDragOver={handleDragOver}
                            onDrop={e => handleDrop(e, todo.id)}
                        >
                            <div className="todo-item-main">
                                <div className="todo-drag-handle">
                                    <GripVertical size={12} />
                                </div>
                                <button className="todo-check" onClick={() => handleToggleTodo(todo.id)}>
                                    {todo.done
                                        ? <CheckSquare size={18} style={{ color: '#22c55e' }} />
                                        : <Square size={18} />
                                    }
                                </button>
                                <div className="todo-item-content">
                                    <div className="todo-item-top">
                                        <span className="todo-item-text">{todo.text}</span>
                                        <Flag size={10} style={{ color: PRIORITIES[todo.priority], flexShrink: 0 }} />
                                    </div>
                                    <div className="todo-item-meta">
                                        <span className="todo-cat-badge" style={{ borderColor: catInfo.color, color: catInfo.color }}>
                                            {catInfo.label}
                                        </span>
                                        {todo.dueDate && (
                                            <span className={`todo-due-badge ${overdue ? 'overdue' : isDueToday(todo.dueDate) ? 'today' : ''}`}>
                                                <CalendarDays size={10} />
                                                {formatDueDate(todo.dueDate)}
                                            </span>
                                        )}
                                        {hasSubtasks && (
                                            <span className="todo-subtask-count">{subtaskDone}/{todo.subtasks.length}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="todo-item-actions">
                                    {(hasSubtasks || true) && (
                                        <button className="todo-expand-btn" onClick={() => toggleExpand(todo.id)}>
                                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        </button>
                                    )}
                                    <button className="todo-delete" onClick={() => handleDeleteTodo(todo.id)}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Subtasks */}
                            {isExpanded && (
                                <div className="todo-subtasks">
                                    {(todo.subtasks || []).map(st => (
                                        <div key={st.id} className={`todo-subtask ${st.done ? 'done' : ''}`}>
                                            <button onClick={() => toggleSubtask(todo.id, st.id)} className="todo-st-check">
                                                {st.done ? <CheckSquare size={14} style={{ color: '#22c55e' }} /> : <Square size={14} />}
                                            </button>
                                            <span className="todo-st-text">{st.text}</span>
                                            <button onClick={() => deleteSubtask(todo.id, st.id)} className="todo-st-del">
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    <div className="todo-add-subtask">
                                        <input
                                            type="text"
                                            placeholder="Add subtask..."
                                            value={subtaskInput[todo.id] || ''}
                                            onChange={e => setSubtaskInput(prev => ({ ...prev, [todo.id]: e.target.value }))}
                                            onKeyDown={e => e.key === 'Enter' && addSubtask(todo.id)}
                                            className="todo-st-input"
                                        />
                                        <button onClick={() => addSubtask(todo.id)} className="todo-st-add">
                                            <Plus size={12} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer actions */}
            {completedCount > 0 && (
                <div className="todo-footer">
                    <button className="todo-clear-btn" onClick={handleClearCompleted}>
                        <CheckCheck size={14} />
                        Clear {completedCount} completed
                    </button>
                </div>
            )}
        </div>
    );
}
