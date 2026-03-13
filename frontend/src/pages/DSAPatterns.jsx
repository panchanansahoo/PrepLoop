import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Check, Play, Code2, AlertCircle, Loader, Lock, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

import { dsaPatterns } from '../data/dsaPatternsData';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

const PatternCard = ({ pattern, index }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { theme } = useTheme();
    const isLight = theme === 'light';

    // Calculate progress
    const problems = pattern.problems || [];
    const totalProblems = problems.length;
    const solvedProblems = problems.filter(p => p.status === 'solved' || p.completed).length;
    const progress = totalProblems > 0 ? (solvedProblems / totalProblems) * 100 : 0;

    // Determine colors based on index or category
    const colors = [
        "from-purple-500/20 to-blue-500/20 border-purple-500/30 hover:border-purple-500/50",
        "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 hover:border-emerald-500/50",
        "from-orange-500/20 to-red-500/20 border-orange-500/30 hover:border-orange-500/50",
        "from-pink-500/20 to-rose-500/20 border-pink-500/30 hover:border-pink-500/50",
        "from-blue-500/20 to-cyan-500/20 border-blue-500/30 hover:border-blue-500/50"
    ];
    const colorClass = colors[index % colors.length];

    return (
        <div className={`rounded-xl border transition-all duration-300 backdrop-blur-md bg-gradient-to-br ${colorClass} mb-4 overflow-hidden group`}>
            {/* Header / Summary */}
            <div
                className="p-5 flex items-center justify-between cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold border ${isLight ? 'bg-white/60 text-slate-700 border-slate-200' : 'bg-white/10 text-white border-white/10'}`}>
                        {index + 1}
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold transition-colors ${isLight ? 'text-slate-800 group-hover:text-slate-900' : 'text-white group-hover:text-white/90'}`}>
                            {pattern.name || pattern.category}
                        </h3>
                        <div className={`flex items-center gap-2 text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                            <Code2 size={12} />
                            <span>{solvedProblems}/{totalProblems} Solved</span>
                            <span className="text-zinc-600">•</span>
                            <span className={`${progress === 100 ? 'text-emerald-400' : 'text-blue-400'}`}>
                                {Math.round(progress)}% Complete
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Progress Bar Mini */}
                    <div className={`hidden md:block w-32 h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-black/20'}`}>
                        <div
                            className={`h-full transition-all duration-500 ${isLight ? 'bg-indigo-500' : 'bg-white'}`}
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>

                    <button className={`p-2 rounded-full transition-transform duration-300 ${isLight ? 'bg-slate-100 hover:bg-slate-200' : 'bg-white/5 hover:bg-white/10'} ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={18} className={isLight ? 'text-slate-500' : 'text-white/70'} />
                    </button>
                </div>
            </div>

            {/* Expanded Content: Problem List */}
            <div className={`border-t transition-all duration-300 ${isLight ? 'border-slate-200 bg-white/40' : 'border-white/5 bg-black/20'} ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="p-4 space-y-2">
                    <div className="flex justify-end px-2 pt-2">
                        <Link to={`/patterns/${pattern.id}`} className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors">
                            <BookOpen size={14} /> Read Pattern Guide
                        </Link>
                    </div>
                    {problems.map((problem, i) => (
                        <div key={problem.id || i} className={`flex items-center justify-between p-3 rounded-lg transition-colors group/problem border border-transparent ${isLight ? 'hover:bg-slate-100 hover:border-slate-200' : 'hover:bg-white/5 hover:border-white/5'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${problem.status === 'solved' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'border-white/10 text-transparent'}`}>
                                    <Check size={12} />
                                </div>
                                <span className={`text-sm font-medium ${problem.status === 'solved' ? (isLight ? 'text-slate-400 line-through' : 'text-white/40 line-through') : (isLight ? 'text-slate-600 group-hover/problem:text-slate-900' : 'text-zinc-300 group-hover/problem:text-white')}`}>
                                    {problem.title}
                                </span>
                                {problem.difficulty && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${problem.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        problem.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                            'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                        }`}>
                                        {problem.difficulty}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2 opacity-0 group-hover/problem:opacity-100 transition-opacity">
                                <Link
                                    to={`/code-editor/${problem.id}`}
                                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                >
                                    <Play size={12} fill="currentColor" /> Solve
                                </Link>
                            </div>
                        </div>
                    ))}

                    {problems.length === 0 && (
                        <div className="p-4 text-center text-zinc-500 text-sm">
                            No problems available in this category yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function DSAPatterns() {
    const [patterns, setPatterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const { theme } = useTheme();
    const isLight = theme === 'light';

    useEffect(() => {
        // Simulate loading for effect
        const timer = setTimeout(() => {
            setPatterns(dsaPatterns);
            setLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={`min-h-screen font-sans pb-20 relative ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#020305] text-white'}`}>


            {/* Background Effects */}
            <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            <div className="fixed top-20 right-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
                <div className="mb-10 text-center">
                    <h1 className={`text-4xl font-bold bg-clip-text text-transparent mb-4 ${isLight ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600' : 'bg-gradient-to-r from-white via-blue-100 to-white'}`}>
                        Master the Patterns
                    </h1>
                    <p className="text-zinc-400 max-w-lg mx-auto">
                        A structured roadmap to ace your coding interviews. Master 15 key patterns to solve 95% of questions.
                    </p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader className="animate-spin text-purple-500" size={32} />
                        <p className="text-zinc-500">Loading your roadmap...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {patterns.map((pattern, index) => (
                            <PatternCard key={index} pattern={pattern} index={index} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
