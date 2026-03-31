import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { dailyChallenges } from '../data/dailyChallenges';
import { ExternalLink, Code2, Database, ArrowRight } from 'lucide-react';

const DailyChallenge = () => {
    const [challenge, setChallenge] = useState(null);
    const { theme } = useTheme();
    const isLight = theme === 'light';

    useEffect(() => {
        // Seed random based on date to keep it consistent for the day
        const date = new Date();
        const seed = date.getDate() + date.getMonth() * 31 + date.getFullYear() * 366;

        const difficultyClass = (difficulty) => {
            if (difficulty === 'Easy') {
                return isLight
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
            }
            if (difficulty === 'Medium') {
                return isLight
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30';
            }
            return isLight
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/30';
        };

        const renderQuestionRow = (q, idx, isSql = false) => {
            const route = q.internalId ? `${isSql ? '/sql-editor' : '/code-editor'}/${q.internalId}` : null;
            const Wrapper = route ? Link : 'a';
            const wrapperProps = route
                ? { to: route }
                : { href: q.url, target: '_blank', rel: 'noopener noreferrer' };

            return (
                <Wrapper
                    key={`${q.title}-${idx}`}
                    {...wrapperProps}
                    className={`group/item flex items-center justify-between rounded-2xl border px-3 py-2.5 transition-all duration-200 ${
                        isLight
                            ? 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30'
                            : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.05]'
                    }`}
                    style={{ textDecoration: 'none' }}
                >
                    <div className="min-w-0 flex items-center gap-3">
                        <span className={`w-3 text-[12px] font-mono ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                            {idx + 1}
                        </span>
                        <span className={`h-3.5 w-px ${isLight ? 'bg-slate-300' : 'bg-white/15'}`} />
                        <span className={`truncate text-[15px] font-semibold ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>
                            {q.title}
                        </span>
                    </div>

                    <div className="ml-3 flex shrink-0 items-center gap-2">
                        <span className={`rounded-lg border px-2.5 py-0.5 text-[11px] font-bold ${difficultyClass(q.difficulty)}`}>
                            {q.difficulty}
                        </span>
                        {route ? (
                            <ArrowRight
                                size={13}
                                className={`${
                                    isLight ? 'text-indigo-600/80' : 'text-violet-300/80'
                                } opacity-70 transition-all group-hover/item:translate-x-0.5 group-hover/item:opacity-100`}
                            />
                        ) : (
                            <ExternalLink
                                size={13}
                                className={`${
                                    isLight ? 'text-slate-500' : 'text-zinc-400'
                                } opacity-70 transition-opacity group-hover/item:opacity-100`}
                            />
                        )}
                    </div>
                </Wrapper>
            );
        };
        const index = seed % dailyChallenges.length;
        setChallenge(dailyChallenges[index]);
            <div className={`overflow-hidden rounded-[28px] border ${
                isLight
                    ? 'bg-white border-slate-200 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)]'
                    : 'bg-[#07090f] border-white/10 shadow-[0_24px_64px_-36px_rgba(0,0,0,0.9)]'
    const Icon = challenge.icon;
                <div className={`border-b px-5 py-6 md:px-8 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`grid h-12 w-12 place-items-center rounded-2xl border ${
                            isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/5'
                        }`}>
                            <Icon className={challenge.color} size={20} />
                        <span className={`text-xs font-semibold font-mono px-2 py-1 rounded-md border ${

                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className={`text-[34px] leading-none font-extrabold tracking-tight md:text-[38px] ${
                                    isLight ? 'text-slate-900' : 'text-white'
                                }`}>
                                    {challenge.name}
                                </h3>
                                <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                                    challenge.type === 'Product'
                                        ? (isLight ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300')
                                        : (isLight ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-blue-500/30 bg-blue-500/10 text-blue-300')
                                }`}>
                                    {challenge.type}
                                </span>
                    <div className="flex items-center justify-center gap-3">
                            <p className={`mt-1 text-[20px] font-semibold ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                                {challenge.dsa.length} DSA + {challenge.sql.length} SQL questions
                            </p>
                        </div>
                    </div>
                </div>

                <div className={`grid grid-cols-1 lg:grid-cols-2 ${isLight ? 'divide-slate-200' : 'divide-white/10'} lg:divide-x`}>
                    <div className="px-5 py-6 md:px-8 md:py-7">
                        <div className={`mb-5 flex items-center gap-2 text-[30px] font-bold ${
                            isLight ? 'text-indigo-700' : 'text-indigo-300'
                        }`}>
                            <span className={`grid h-7 w-7 place-items-center rounded-xl ${isLight ? 'bg-indigo-100' : 'bg-indigo-500/15'}`}>
                                <Code2 size={14} />
                            </span>
                            Data Structures &amp; Algorithms
                        </div>
                        <div className="space-y-2.5">
                            {challenge.dsa.map((q, idx) => renderQuestionRow(q, idx, false))}
                        </div>
                    </div>

                    <div className="px-5 py-6 md:px-8 md:py-7">
                        <div className={`mb-5 flex items-center gap-2 text-[30px] font-bold ${
                            isLight ? 'text-fuchsia-700' : 'text-fuchsia-300'
                        }`}>
                            <span className={`grid h-7 w-7 place-items-center rounded-xl ${isLight ? 'bg-fuchsia-100' : 'bg-fuchsia-500/15'}`}>
                                <Database size={14} />
                            </span>
                            SQL &amp; Database
                        </div>
                        <div className="space-y-2.5">
                            {challenge.sql.map((q, idx) => renderQuestionRow(q, idx, true))}
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                                challenge.type === 'Product' 
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
