import { useState, useRef, useMemo } from 'react';
import './TodoList.css';
import {Plus, Trash2, CheckSquare, Square, ListTodo, Flag, Search, ChevronDown, ChevronRight, GripVertical, CalendarDays, X, CheckCheck} from 'lucide-react';
import useTodos from '../hooks/useTodos';
import { useTheme } from '../context/ThemeContext';

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
    const { theme } = useTheme();
    const isLight = theme === 'light';

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

    const accentColor = '#60a5fa'; // Blue accent for Todo

    const c = {
        bg: isLight ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9))' : 'linear-gradient(135deg, rgba(18, 18, 24, 0.6), rgba(20, 20, 28, 0.4))',
        border: isLight ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
        shadow: isLight ? '0 12px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)' : '0 24px 64px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
        cardBg: isLight ? 'rgba(15, 23, 42, 0.02)' : 'rgba(255, 255, 255, 0.02)',
        cardBorder: isLight ? '1px solid rgba(15, 23, 42, 0.05)' : '1px solid rgba(255, 255, 255, 0.05)',
        title: isLight ? '#0f172a' : '#f8fafc',
        text: isLight ? '#475569' : '#cbd5e1',
        muted: isLight ? '#94a3b8' : '#64748b',
        inputBg: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.2)',
    };

    if (loading) {
        return (
            <div style={{
                padding: '24px 28px', background: c.bg, borderRadius: '24px', border: c.border, boxShadow: c.shadow,
                backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'grid', placeItems: 'center', background: 'rgba(96, 165, 250, 0.15)', border: `1px solid rgba(96, 165, 250, 0.3)` }}>
                        <ListTodo size={18} style={{ color: accentColor }} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: c.title, letterSpacing: '-0.3px' }}>Todo List</h3>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', color: c.muted, fontWeight: 500 }}>Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            padding: '24px 28px', background: c.bg, borderRadius: '24px', border: c.border, boxShadow: c.shadow,
            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%',
        }}>
            <style>{`
                .todo-toolbar { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
                .todo-search-wrap { position: relative; display: flex; align-items: center; }
                .todo-search { width: 100%; padding: 10px 10px 10px 36px; border-radius: 12px; border: ${c.cardBorder}; background: ${c.inputBg}; color: ${c.title}; font-size: 13px; outline: none; transition: border-color 0.2s; }
                .todo-search:focus { border-color: ${accentColor}; }
                .todo-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: ${c.muted}; }
                .todo-search-clear { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: transparent; border: none; color: ${c.muted}; cursor: pointer; padding: 4px; }
                .todo-filter-row { display: flex; flex-wrap: wrap; gap: 8px; justify-content: space-between; align-items: center; }
                .todo-category-pills { display: flex; gap: 6px; flex-wrap: wrap; }
                .todo-cat-pill { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; cursor: pointer; background: transparent; transition: all 0.2s; border: 1px solid transparent; }
                .todo-status-filter { display: flex; gap: 4px; background: ${c.cardBg}; padding: 4px; border-radius: 8px; }
                .todo-status-btn { padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; background: transparent; border: none; color: ${c.muted}; transition: all 0.2s; }
                .todo-status-btn.active { background: ${accentColor}; color: white; }
                .todo-sort-select { padding: 6px 12px; border-radius: 8px; border: ${c.cardBorder}; background: ${c.cardBg}; color: ${c.text}; font-size: 12px; font-weight: 600; outline: none; cursor: pointer; }
                
                .todo-add-section { background: ${c.cardBg}; border: ${c.cardBorder}; border-radius: 16px; padding: 12px; margin-bottom: 20px; }
                .todo-add-row { display: flex; gap: 8px; margin-bottom: 12px; }
                .todo-input { flex: 1; padding: 10px 14px; border-radius: 10px; border: 1px solid transparent; background: transparent; color: ${c.title}; font-size: 14px; outline: none; }
                .todo-input::placeholder { color: ${c.muted}; }
                .todo-add-btn { width: 40px; height: 40px; border-radius: 10px; border: none; background: ${accentColor}; color: white; display: grid; place-items: center; cursor: pointer; opacity: 1; transition: opacity 0.2s; }
                .todo-add-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .todo-add-controls { display: flex; gap: 12px; align-items: center; padding: 0 14px; }
                .todo-priority-selector { display: flex; gap: 6px; }
                .todo-priority-dot { width: 12px; height: 12px; border-radius: 50%; border: 2px solid; cursor: pointer; padding: 0; transition: transform 0.2s; }
                .todo-priority-dot:hover { transform: scale(1.2); }
                .todo-cat-select { padding: 4px 8px; border-radius: 6px; border: ${c.cardBorder}; background: ${isLight ? 'white' : 'rgba(0,0,0,0.2)'}; color: ${c.text}; font-size: 11px; outline: none; cursor: pointer; }
                .todo-due-input { display: flex; align-items: center; gap: 6px; color: ${c.muted}; background: ${isLight ? 'white' : 'rgba(0,0,0,0.2)'}; border: ${c.cardBorder}; padding: 4px 8px; border-radius: 6px; }
                .todo-date-input { background: transparent; border: none; color: ${c.text}; font-size: 11px; outline: none; cursor: pointer; color-scheme: ${isLight ? 'light' : 'dark'}; }
                
                .todo-list-items { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 4px; }
                .todo-list-items::-webkit-scrollbar { width: 4px; }
                .todo-list-items::-webkit-scrollbar-thumb { background: ${c.cardBorder}; border-radius: 4px; }
                
                .todo-item { background: ${c.cardBg}; border: ${c.cardBorder}; border-radius: 12px; padding: 12px; transition: all 0.2s; border-left: 3px solid transparent; }
                .todo-item:hover { background: ${isLight ? 'rgba(15,23,42,0.04)' : 'rgba(255,255,255,0.04)'}; }
                .todo-item.done { opacity: 0.6; border-left-color: #22c55e; }
                .todo-item.done .todo-item-text { text-decoration: line-through; color: ${c.muted}; }
                .todo-item.overdue:not(.done) { border-left-color: #ef4444; }
                .todo-item.dragging { opacity: 0.5; transform: scale(0.98); }
                
                .todo-item-main { display: flex; align-items: flex-start; gap: 10px; }
                .todo-drag-handle { color: ${c.cardBorder}; cursor: grab; padding-top: 2px; }
                .todo-drag-handle:active { cursor: grabbing; }
                .todo-check { background: transparent; border: none; color: ${c.muted}; cursor: pointer; padding: 0; display: grid; place-items: center; margin-top: 1px; transition: color 0.2s; }
                .todo-check:hover { color: ${accentColor}; }
                .todo-item-content { flex: 1; min-width: 0; }
                .todo-item-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 4px; }
                .todo-item-text { font-size: 14px; font-weight: 600; color: ${c.title}; word-break: break-word; line-height: 1.4; }
                .todo-item-meta { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
                .todo-cat-badge { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; border: 1px solid; }
                .todo-due-badge { display: flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 600; color: ${c.muted}; background: ${isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)'}; padding: 2px 6px; border-radius: 4px; }
                .todo-due-badge.overdue { color: #ef4444; background: rgba(239,68,68,0.1); }
                .todo-due-badge.today { color: #f59e0b; background: rgba(245,158,11,0.1); }
                .todo-subtask-count { font-size: 10px; font-weight: 600; color: ${c.muted}; }
                
                .todo-item-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s; }
                .todo-item:hover .todo-item-actions { opacity: 1; }
                .todo-action-btn { background: transparent; border: none; color: ${c.muted}; cursor: pointer; padding: 4px; border-radius: 4px; display: grid; place-items: center; }
                .todo-action-btn:hover { background: ${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)'}; color: ${c.title}; }
                .todo-action-btn.delete:hover { color: #ef4444; background: rgba(239,68,68,0.1); }
                
                .todo-subtasks { margin-top: 12px; padding-top: 12px; border-top: ${c.cardBorder}; padding-left: 24px; display: flex; flex-direction: column; gap: 8px; }
                .todo-subtask { display: flex; align-items: center; gap: 8px; }
                .todo-subtask.done .todo-st-text { text-decoration: line-through; color: ${c.muted}; }
                .todo-st-check { background: transparent; border: none; color: ${c.muted}; cursor: pointer; padding: 0; display: grid; place-items: center; }
                .todo-st-text { flex: 1; font-size: 13px; color: ${c.text}; }
                .todo-st-del { background: transparent; border: none; color: ${c.muted}; cursor: pointer; padding: 2px; opacity: 0; transition: opacity 0.2s; }
                .todo-subtask:hover .todo-st-del { opacity: 1; }
                .todo-st-del:hover { color: #ef4444; }
                .todo-add-subtask { display: flex; gap: 6px; margin-top: 4px; }
                .todo-st-input { flex: 1; padding: 6px 10px; border-radius: 6px; border: ${c.cardBorder}; background: ${c.inputBg}; color: ${c.title}; font-size: 12px; outline: none; }
                .todo-st-add { width: 28px; border-radius: 6px; background: transparent; border: 1px solid ${c.cardBorder}; color: ${c.muted}; cursor: pointer; display: grid; place-items: center; transition: all 0.2s; }
                .todo-st-add:hover { background: ${c.cardBg}; color: ${c.title}; }
            `}</style>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'grid', placeItems: 'center', background: 'rgba(96, 165, 250, 0.15)', border: `1px solid rgba(96, 165, 250, 0.3)` }}>
                        <ListTodo size={18} style={{ color: accentColor }} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: c.title, letterSpacing: '-0.3px' }}>Todo List</h3>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', color: c.muted, fontWeight: 500 }}>{completedCount}/{totalCount} done</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                    {overdueCount > 0 && <span style={{ fontSize: '10px', fontWeight: 700, padding: '4px 8px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{overdueCount} overdue</span>}
                    {todayCount > 0 && <span style={{ fontSize: '10px', fontWeight: 700, padding: '4px 8px', borderRadius: '20px', background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.2)' }}>{todayCount} today</span>}
                </div>
            </div>

            {/* Progress Bar */}
            {totalCount > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ flex: 1, height: '6px', background: isLight ? 'rgba(15,23,42,0.05)' : 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${progressPercent}%`, background: accentColor, borderRadius: '3px', transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: c.muted }}>{Math.round(progressPercent)}%</span>
                </div>
            )}

            {/* Search & Filters */}
            <div className="todo-toolbar">
                <div className="todo-search-wrap">
                    <Search className="todo-search-icon" size={14} />
                    <input
                        type="text"
                        className="todo-search"
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && <button className="todo-search-clear" onClick={() => setSearchQuery('')}><X size={12} /></button>}
                </div>
                <div className="todo-filter-row">
                    <div className="todo-category-pills">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                className={`todo-cat-pill ${filterCategory === cat.id ? 'active' : ''}`}
                                style={filterCategory === cat.id ? { background: cat.color, borderColor: cat.color, color: 'white' } : { borderColor: cat.color, color: cat.color }}
                                onClick={() => setFilterCategory(cat.id)}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div className="todo-status-filter">
                            {['all', 'active', 'done'].map(s => (
                                <button key={s} className={`todo-status-btn ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilterStatus(s)}>
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
            </div>

            {/* Add Task */}
            <div className="todo-add-section">
                <div className="todo-add-row">
                    <input
                        ref={inputRef}
                        type="text"
                        className="todo-input"
                        placeholder="What needs to be done?"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddTodo()}
                    />
                    <button className="todo-add-btn" onClick={handleAddTodo} disabled={!input.trim()}>
                        <Plus size={18} />
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
                    <select className="todo-cat-select" value={category} onChange={e => setCategory(e.target.value)} title="Category">
                        {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                        ))}
                    </select>
                    <div className="todo-due-input" title="Due date">
                        <CalendarDays size={13} />
                        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="todo-date-input" />
                    </div>
                </div>
            </div>

            {/* Todo Items */}
            <div className="todo-list-items">
                {filteredTodos.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: c.muted, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <ListTodo size={32} style={{ opacity: 0.5, margin: '0 auto' }} />
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{searchQuery ? 'No matching tasks' : 'No tasks yet. Add one above!'}</span>
                    </div>
                )}
                {filteredTodos.map(todo => {
                    const catInfo = CATEGORIES.find(c => c.id === todo.category) || CATEGORIES[1];
                    const hasSubtasks = todo.subtasks && todo.subtasks.length > 0;
                    const isExpanded = expandedTodos[todo.id];
                    const subtaskDone = hasSubtasks ? todo.subtasks.filter(st => st.done).length : 0;
                    const overdue = !todo.done && isOverdue(todo.dueDate);

                    return (
                        <div key={todo.id} className={`todo-item ${todo.done ? 'done' : ''} ${overdue ? 'overdue' : ''} ${dragId === todo.id ? 'dragging' : ''}`} draggable onDragStart={e => handleDragStart(e, todo.id)} onDragOver={handleDragOver} onDrop={e => handleDrop(e, todo.id)}>
                            <div className="todo-item-main">
                                <div className="todo-drag-handle"><GripVertical size={14} /></div>
                                <button className="todo-check" onClick={() => handleToggleTodo(todo.id)}>
                                    {todo.done ? <CheckSquare size={18} style={{ color: '#22c55e' }} /> : <Square size={18} />}
                                </button>
                                <div className="todo-item-content">
                                    <div className="todo-item-top">
                                        <span className="todo-item-text">{todo.text}</span>
                                        <Flag size={12} style={{ color: PRIORITIES[todo.priority], flexShrink: 0, marginTop: '2px' }} />
                                    </div>
                                    <div className="todo-item-meta">
                                        <span className="todo-cat-badge" style={{ borderColor: catInfo.color, color: catInfo.color }}>{catInfo.label}</span>
                                        {todo.dueDate && (
                                            <span className={`todo-due-badge ${overdue ? 'overdue' : isDueToday(todo.dueDate) ? 'today' : ''}`}>
                                                <CalendarDays size={10} /> {formatDueDate(todo.dueDate)}
                                            </span>
                                        )}
                                        {hasSubtasks && <span className="todo-subtask-count">{subtaskDone}/{todo.subtasks.length} subtasks</span>}
                                    </div>
                                </div>
                                <div className="todo-item-actions">
                                    <button className="todo-action-btn" onClick={() => toggleExpand(todo.id)}>
                                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </button>
                                    <button className="todo-action-btn delete" onClick={() => handleDeleteTodo(todo.id)}>
                                        <Trash2 size={16} />
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
                                            <button onClick={() => deleteSubtask(todo.id, st.id)} className="todo-st-del"><X size={14} /></button>
                                        </div>
                                    ))}
                                    <div className="todo-add-subtask">
                                        <input type="text" placeholder="Add subtask..." value={subtaskInput[todo.id] || ''} onChange={e => setSubtaskInput(prev => ({ ...prev, [todo.id]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addSubtask(todo.id)} className="todo-st-input" />
                                        <button onClick={() => addSubtask(todo.id)} className="todo-st-add"><Plus size={14} /></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer actions */}
            {completedCount > 0 && (
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
                    <button onClick={handleClearCompleted} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: c.muted, fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = c.muted}>
                        <CheckCheck size={14} /> Clear {completedCount} completed
                    </button>
                </div>
            )}
        </div>
    );
}
