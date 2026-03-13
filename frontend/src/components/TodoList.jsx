import React, { useState, useEffect, useRef } from 'react';
import {
    Plus, Calendar, Trash2, Check, Sparkles,
    Circle, AlertCircle, GripVertical, CheckCircle2
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function TodoList() {
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const [tasks, setTasks] = useState(() => {
        const saved = localStorage.getItem('todo_list_v4');
        return saved ? JSON.parse(saved) : [
            { id: 1, text: 'Review system design patterns', subject: 'System Design', priority: 'High', dueDate: '2026-02-14', completed: false },
            { id: 2, text: 'Solve Daily LeetCode Challenge', subject: 'DSA', priority: 'Medium', dueDate: '2026-02-13', completed: true },
        ];
    });

    const [newTaskText, setNewTaskText] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState('Low');
    const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);
    const listRef = useRef(null);

    useEffect(() => {
        localStorage.setItem('todo_list_v4', JSON.stringify(tasks));
    }, [tasks]);

    const addTask = () => {
        if (!newTaskText.trim()) return;
        const newTask = {
            id: Date.now(), text: newTaskText, subject: 'General',
            priority: newTaskPriority, dueDate: newTaskDate,
            createdAt: new Date().toISOString(), completed: false
        };
        setTasks([newTask, ...tasks]);
        setNewTaskText('');
    };

    const updateTask = (id, field, value) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const deleteTask = (id) => setTasks(tasks.filter(t => t.id !== id));
    const toggleComplete = (id) => setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));

    const getPriorityColor = (p) => {
        switch (p) {
            case 'High': return isLight ? 'text-rose-500 decoration-rose-500/30' : 'text-rose-400 decoration-rose-400/30';
            case 'Medium': return isLight ? 'text-orange-500 decoration-orange-500/30' : 'text-orange-400 decoration-orange-400/30';
            case 'Low': return isLight ? 'text-emerald-600 decoration-emerald-600/30' : 'text-emerald-400 decoration-emerald-400/30';
            default: return isLight ? 'text-slate-500' : 'text-zinc-400';
        }
    };

    // Theme-aware classes
    const containerBg = isLight
        ? 'bg-white/60 backdrop-blur-xl border-indigo-200/30 ring-indigo-100/50'
        : 'bg-[#050505]/80 backdrop-blur-3xl border-white/5 ring-white/5';
    const glowClass = isLight ? 'bg-indigo-500/5' : 'bg-indigo-500/10';
    const titleClass = isLight ? 'text-slate-800' : 'text-white';
    const dividerClass = isLight ? 'bg-indigo-200/30' : 'bg-white/20';
    const subtitleClass = isLight ? 'text-slate-500' : 'text-zinc-400';
    const inputBg = isLight
        ? 'bg-white/80 border-indigo-200/30 ring-indigo-100/30'
        : 'bg-[#0F0F10] border-white/10 ring-white/5';
    const inputText = isLight ? 'text-slate-800 placeholder-slate-400' : 'text-white placeholder-zinc-500';
    const taskCardBg = isLight
        ? 'bg-white/50 border-indigo-100/30 hover:bg-white/70 hover:shadow-md'
        : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:shadow-lg';
    const taskText = isLight ? 'text-slate-700 group-hover:text-slate-900' : 'text-zinc-200 group-hover:text-white';
    const taskCompletedText = isLight ? 'text-slate-500 line-through decoration-slate-400' : 'text-zinc-500 line-through decoration-zinc-800';
    const metaText = isLight ? 'text-slate-400' : 'text-zinc-500';
    const checkBtnUnchecked = isLight ? 'border-slate-300 hover:border-indigo-400' : 'border-zinc-600 hover:border-white/50';
    const circleTrack = isLight ? 'text-indigo-200' : 'text-zinc-800';

    return (
        <div className="relative h-full flex flex-col group/container m-4">
            <div className={`absolute inset-0 ${containerBg} border rounded-[32px] shadow-2xl overflow-hidden ring-1`}>
                <div className={`absolute -top-32 -right-32 w-64 h-64 ${glowClass} rounded-full blur-[80px] pointer-events-none animate-pulse-slow`}></div>
                <div className={`absolute -bottom-32 -left-32 w-64 h-64 ${isLight ? 'bg-rose-500/3' : 'bg-rose-500/5'} rounded-full blur-[80px] pointer-events-none animate-pulse-slow delay-700`}></div>
                {!isLight && <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>}
            </div>

            <div className="relative z-10 flex flex-col h-full p-8">
                {/* Header */}
                <div className="relative flex items-center justify-center mb-12 mt-2">
                    <div className="flex flex-col items-center justify-center z-10">
                        <h2 className={`text-xl font-black ${titleClass} tracking-[0.2em] uppercase drop-shadow-md mb-2`}>
                            MY DAY
                        </h2>
                        <div className={`h-px w-16 ${dividerClass} mb-2`}></div>
                        <span className={`text-[10px] font-bold ${subtitleClass} uppercase tracking-[0.3em]`}>
                            {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                        </span>
                    </div>

                    <div className="absolute right-0 top-1/2 -translate-y-1/2 group/ring">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full opacity-0 group-hover/ring:opacity-100 transition-opacity"></div>
                        <svg className="w-12 h-12 -rotate-90 text-indigo-500">
                            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className={circleTrack} />
                            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent"
                                strokeDasharray={2 * Math.PI * 20}
                                strokeDashoffset={2 * Math.PI * 20 - (tasks.length ? (tasks.filter(t => t.completed).length / tasks.length) : 0) * 2 * Math.PI * 20}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                            />
                        </svg>
                    </div>
                </div>

                {/* Input Area */}
                <div className="relative mb-8 z-20 mx-2 md:mx-4 group/input">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-rose-500/20 rounded-2xl opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500 blur-md"></div>
                    <div className={`relative flex items-center ${inputBg} border rounded-2xl shadow-xl p-1.5 ring-1 transition-all duration-300 hover:border-opacity-40`}>
                        <div className={`pl-1 pr-2 border-r ${isLight ? 'border-indigo-100/50' : 'border-white/5'} flex-shrink-0`}>
                            <button
                                onClick={() => {
                                    const p = ['High', 'Medium', 'Low'];
                                    setNewTaskPriority(p[(p.indexOf(newTaskPriority) + 1) % 3]);
                                }}
                                className={`h-9 px-4 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 border ${isLight ? 'border-indigo-100/50 bg-indigo-50/50 hover:bg-indigo-50' : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10'} group ${newTaskPriority === 'High' ? 'text-rose-400' :
                                    newTaskPriority === 'Medium' ? 'text-orange-400' : 'text-emerald-400'
                                    }`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor] transition-transform duration-300 group-hover:scale-125 ${newTaskPriority === 'High' ? 'bg-rose-500' :
                                    newTaskPriority === 'Medium' ? 'bg-orange-500' : 'bg-emerald-500'
                                    }`}></div>
                                <span className={`${isLight ? 'text-slate-500 group-hover:text-slate-700' : 'text-zinc-400 group-hover:text-white'} transition-colors`}>{newTaskPriority}</span>
                            </button>
                        </div>

                        <input
                            type="text"
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addTask()}
                            placeholder="Add a new task..."
                            className={`flex-1 bg-transparent border-none py-2 px-4 text-sm ${inputText} focus:ring-0 focus:outline-none h-10 font-medium tracking-wide min-w-[100px]`}
                        />

                        <div className="flex items-center gap-2 flex-shrink-0 pr-1">
                            <div className="relative group/date hidden sm:block">
                                <input type="date" value={newTaskDate} onChange={(e) => setNewTaskDate(e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
                                <div className={`p-2 rounded-xl ${isLight ? 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50' : 'text-zinc-500 hover:text-white hover:bg-white/10'} transition-all border border-transparent hover:border-white/5`}>
                                    <Calendar size={18} />
                                </div>
                            </div>

                            <button onClick={addTask}
                                className={`relative h-9 px-6 rounded-2xl ${isLight ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-md hover:shadow-lg' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 shadow-[0_8px_16px_-6px_rgba(0,0,0,0.5)]'} text-[10px] font-black uppercase tracking-widest transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 group overflow-hidden`}
                            >
                                <span className="relative z-10 drop-shadow-sm">ADD</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Task List */}
                <div ref={listRef} className="flex-1 overflow-y-auto px-2 pb-6 pt-2 mask-image-gradient-b custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {tasks.sort((a, b) => {
                            if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
                            const priorityOrder = { High: 3, Medium: 2, Low: 1 };
                            return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
                        }).map((task) => (
                            <div key={task.id}
                                className={`group flex items-start gap-3 p-3 rounded-xl border ${taskCardBg} transition-all duration-300 hover:-translate-y-0.5 ${task.completed ? (isLight ? 'opacity-70' : 'opacity-60') : ''}`}
                            >
                                <button onClick={() => toggleComplete(task.id)}
                                    className={`mt-1.5 flex-shrink-0 relative w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 ${task.completed
                                        ? `${isLight ? 'bg-indigo-400 border-indigo-400' : 'bg-zinc-500 border-zinc-500'} text-white`
                                        : `bg-transparent ${checkBtnUnchecked} text-transparent`
                                        }`}
                                >
                                    <Check size={12} strokeWidth={3} className={`transition-transform ${task.completed ? 'scale-100' : 'scale-0'}`} />
                                </button>

                                <div className="flex-1 min-w-0">
                                    <input type="text" value={task.text}
                                        onChange={(e) => updateTask(task.id, 'text', e.target.value)}
                                        className={`w-full bg-transparent border-none p-0 text-sm font-medium focus:ring-0 transition-colors ${task.completed ? taskCompletedText : taskText}`}
                                    />
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <div className={`flex items-center gap-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md ${isLight ? 'bg-indigo-50/50' : 'bg-white/5'} ${getPriorityColor(task.priority)}`}>
                                            <Circle size={6} fill="currentColor" />
                                            {task.priority}
                                        </div>
                                        {task.createdAt && (
                                            <span className={`${metaText} text-[10px] font-mono ml-2 border-l ${isLight ? 'border-indigo-100/50' : 'border-white/10'} pl-2 flex items-center gap-1`}>
                                                {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                        <span className={`${metaText} text-[10px] font-mono ml-auto`}>
                                            {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                </div>

                                <button onClick={() => deleteTask(task.id)}
                                    className={`opacity-0 group-hover:opacity-100 ${isLight ? 'text-slate-400 hover:text-rose-500' : 'text-zinc-500 hover:text-rose-400'} transition-all p-1`}
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {tasks.length === 0 && (
                        <div className={`flex flex-col items-center justify-center h-full ${isLight ? 'text-slate-400' : 'text-zinc-600'} gap-2 opacity-50 py-12`}>
                            <Sparkles size={24} />
                            <p className="text-sm">No active tasks</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
