import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { dailyChallenges } from '../data/dailyChallenges';
import { ExternalLink, Code2, Database, ChevronRight, Sparkles, Building2, Trophy, ArrowRight } from 'lucide-react';

const DailyChallenge = () => {
    const [challenge, setChallenge] = useState(null);
    const { theme } = useTheme();
    const isLight = theme === 'light';

    useEffect(() => {
        // Seed random based on date to keep it consistent for the day
        const date = new Date();
        const seed = date.getDate() + date.getMonth() * 31 + date.getFullYear() * 366;
        const index = seed % dailyChallenges.length;
        setChallenge(dailyChallenges[index]);
    }, []);

    if (!challenge) return null;

    const Icon = challenge.icon;

    return (
        <div className={`relative group overflow-hidden rounded-3xl border shadow-2xl ${
            isLight 
                ? 'bg-white/70 border-indigo-100 backdrop-blur-xl' 
                : 'bg-[#0a0a0a] border-white/10'
        }`}>
            {/* Background Effects */}
            <div className={`absolute inset-0 ${isLight ? 'bg-grid-indigo-500/[0.03]' : 'bg-grid-white/[0.02]'} bg-[size:32px_32px]`}></div>
            <div className={`absolute -top-48 -right-48 w-96 h-96 ${challenge.color.replace('text-', 'bg-')}/20 rounded-full blur-[100px] pointer-events-none`}></div>
            <div className={`absolute bottom-0 left-0 right-0 h-1/2 ${
                isLight 
                    ? 'bg-gradient-to-t from-white/60 to-transparent' 
                    : 'bg-gradient-to-t from-black/80 to-transparent'
            } pointer-events-none`}></div>

            <div className="relative p-8 md:p-10">
                {/* Header */}
                <div className="relative flex flex-col items-center justify-center text-center mb-10">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-sm shadow-md mb-6 ${
                        isLight 
                            ? 'bg-indigo-50 border border-indigo-100' 
                            : 'bg-white/5 border border-white/5'
                    }`}>
                        <Sparkles size={12} className="text-yellow-500" />
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${
                            isLight ? 'text-indigo-600' : 'text-zinc-400'
                        }`}>Daily Challenge</span>
                    </div>

                    {/* Date */}
                    <div className="absolute top-6 right-6 hidden sm:flex flex-col items-end">
                        <span className={`text-[10px] font-bold tracking-widest uppercase mb-0.5 ${
                            isLight ? 'text-slate-400' : 'text-zinc-600'
                        }`}>Today</span>
                        <span className={`text-xs font-semibold font-mono px-2 py-1 rounded-md border ${
                            isLight 
                                ? 'text-slate-600 bg-indigo-50/50 border-indigo-100' 
                                : 'text-zinc-300 bg-white/5 border-white/5'
                        }`}>
                            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                    </div>

                    <div className="flex items-center justify-center gap-3">
                        <div className={`p-2 rounded-xl border shadow-lg ${challenge.color} ${
                            isLight 
                                ? 'bg-indigo-50 border-indigo-100' 
                                : 'bg-white/5 border-white/10'
                        }`}>
                            <Icon size={20} />
                        </div>
                        <div className="flex items-center gap-2">
                            <h3 className={`text-xl font-semibold tracking-tight ${
                                isLight ? 'text-slate-800' : 'text-white'
                            }`}>{challenge.name}</h3>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                                challenge.type === 'Product' 
                                    ? (isLight ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white/5 text-emerald-400 border-emerald-500/20')
                                    : (isLight ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white/5 text-blue-400 border-blue-500/20')
                            }`}>
                                {challenge.type}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
                    {/* DSA Section */}
                    <div className="space-y-4">
                        <div className={`flex items-center justify-center gap-2 font-semibold mb-2 ${
                            isLight ? 'text-slate-700' : 'text-white/90'
                        }`}>
                            <div className={`p-1.5 rounded-lg ${
                                isLight ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-500/20 text-indigo-400'
                            }`}>
                                <Code2 size={18} />
                            </div>
                            <h3>Data Structures & Algorithms</h3>
                        </div>
                        <div className="space-y-3">
                            {challenge.dsa.map((q, idx) => {
                                const route = q.internalId ? `/code-editor/${q.internalId}` : null;
                                const Wrapper = route ? Link : 'a';
                                const wrapperProps = route
                                    ? { to: route }
                                    : { href: q.url, target: '_blank', rel: 'noopener noreferrer' };
                                return (
                                <Wrapper
                                    key={idx}
                                    {...wrapperProps}
                                    className={`group/item flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                                        isLight 
                                            ? 'bg-white/80 border-slate-200/60 hover:bg-white hover:border-indigo-200 hover:shadow-md' 
                                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                                    }`}
                                    style={{ textDecoration: 'none' }}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs font-mono w-4 ${
                                            isLight ? 'text-slate-400' : 'text-zinc-500'
                                        }`}>{idx + 1}</span>
                                        <span className={`text-sm transition-colors ${
                                            isLight 
                                                ? 'text-slate-600 group-hover/item:text-slate-900' 
                                                : 'text-zinc-200 group-hover/item:text-white'
                                        }`}>{q.title}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                            q.difficulty === 'Easy' 
                                                ? (isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-500/10 text-emerald-400')
                                                : q.difficulty === 'Medium' 
                                                    ? (isLight ? 'bg-orange-50 text-orange-600' : 'bg-orange-500/10 text-orange-400')
                                                    : (isLight ? 'bg-rose-50 text-rose-600' : 'bg-rose-500/10 text-rose-400')
                                        }`}>
                                            {q.difficulty}
                                        </span>
                                        {route ? (
                                            <ArrowRight size={14} className={`opacity-0 group-hover/item:opacity-100 transition-all ${
                                                isLight ? 'text-indigo-400 group-hover/item:text-indigo-600' : 'text-violet-500 group-hover/item:text-violet-300'
                                            }`} />
                                        ) : (
                                            <ExternalLink size={14} className={`opacity-0 group-hover/item:opacity-100 transition-all ${
                                                isLight ? 'text-indigo-400 group-hover/item:text-indigo-600' : 'text-zinc-500 group-hover/item:text-white'
                                            }`} />
                                        )}
                                    </div>
                                </Wrapper>
                                );
                            })}
                        </div>
                    </div>

                    {/* SQL Section */}
                    <div className="space-y-4">
                        <div className={`flex items-center justify-center gap-2 font-semibold mb-2 ${
                            isLight ? 'text-slate-700' : 'text-white/90'
                        }`}>
                            <div className={`p-1.5 rounded-lg ${
                                isLight ? 'bg-pink-100 text-pink-600' : 'bg-pink-500/20 text-pink-400'
                            }`}>
                                <Database size={18} />
                            </div>
                            <h3>SQL & Database</h3>
                        </div>
                        <div className="space-y-3">
                            {challenge.sql.map((q, idx) => {
                                const route = q.internalId ? `/sql-editor/${q.internalId}` : null;
                                const Wrapper = route ? Link : 'a';
                                const wrapperProps = route
                                    ? { to: route }
                                    : { href: q.url, target: '_blank', rel: 'noopener noreferrer' };
                                return (
                                <Wrapper
                                    key={idx}
                                    {...wrapperProps}
                                    className={`group/item flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                                        isLight 
                                            ? 'bg-white/80 border-slate-200/60 hover:bg-white hover:border-indigo-200 hover:shadow-md' 
                                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                                    }`}
                                    style={{ textDecoration: 'none' }}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs font-mono w-4 ${
                                            isLight ? 'text-slate-400' : 'text-zinc-500'
                                        }`}>{idx + 1}</span>
                                        <span className={`text-sm transition-colors ${
                                            isLight 
                                                ? 'text-slate-600 group-hover/item:text-slate-900' 
                                                : 'text-zinc-200 group-hover/item:text-white'
                                        }`}>{q.title}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                            q.difficulty === 'Easy' 
                                                ? (isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-500/10 text-emerald-400')
                                                : q.difficulty === 'Medium' 
                                                    ? (isLight ? 'bg-orange-50 text-orange-600' : 'bg-orange-500/10 text-orange-400')
                                                    : (isLight ? 'bg-rose-50 text-rose-600' : 'bg-rose-500/10 text-rose-400')
                                        }`}>
                                            {q.difficulty}
                                        </span>
                                        {route ? (
                                            <ArrowRight size={14} className={`opacity-0 group-hover/item:opacity-100 transition-all ${
                                                isLight ? 'text-indigo-400 group-hover/item:text-indigo-600' : 'text-violet-500 group-hover/item:text-violet-300'
                                            }`} />
                                        ) : (
                                            <ExternalLink size={14} className={`opacity-0 group-hover/item:opacity-100 transition-all ${
                                                isLight ? 'text-indigo-400 group-hover/item:text-indigo-600' : 'text-zinc-500 group-hover/item:text-white'
                                            }`} />
                                        )}
                                    </div>
                                </Wrapper>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* View All Link */}
                <div className="mt-8 pt-6" style={{ borderTop: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)' }}>
                    <Link
                        to="/daily-challenges"
                        className={`flex items-center justify-center gap-2 w-full py-3 px-6 rounded-2xl font-bold text-sm transition-all duration-300 ${
                            isLight
                                ? 'bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-600 hover:from-indigo-100 hover:to-violet-100 border border-indigo-100'
                                : 'bg-gradient-to-r from-white/5 to-white/[0.02] text-white/70 hover:text-white hover:from-white/10 hover:to-white/5 border border-white/5'
                        }`}
                    >
                        <Trophy size={16} />
                        View All Company Challenges
                        <ChevronRight size={16} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default DailyChallenge;
