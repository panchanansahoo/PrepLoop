import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, BookOpen, CheckCircle2, Circle, Lightbulb, Briefcase } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

import { dsaPatterns } from '../data/dsaPatternsData';

export default function PatternDetail() {
  const { id } = useParams();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching
    const timer = setTimeout(() => {
      const found = dsaPatterns.find(p => p.id === id);
      // Transform to match expected structure if needed, or just set it
      // The existing code expects { pattern: ..., problems: ... }
      if (found) {
        setData({
          pattern: found,
          problems: found.problems
        });
      }
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container py-20 text-center">
        <h2 className={`text-2xl font-bold mb-4 ${isLight ? 'text-gray-900' : 'text-white'}`}>Pattern not found</h2>
        <Link to="/dsa-patterns" className="px-4 py-2 bg-primary rounded text-white">
          Back to Patterns
        </Link>
      </div>
    );
  }

  const { pattern, problems } = data;

  return (
    <div className="container py-10 px-6 max-w-6xl">
      <Link
        to="/dsa-patterns"
        className={`inline-flex items-center gap-2 text-secondary ${isLight ? 'hover:text-gray-900' : 'hover:text-white'} mb-8 transition-colors`}
      >
        <ArrowLeft size={20} />
        Back to Patterns
      </Link>

      {/* Hero Section */}
      <div className={`glass-panel p-8 rounded-3xl mb-10 border ${isLight ? 'border-gray-200' : 'border-white/5'} relative overflow-hidden`}>
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <BookOpen size={200} />
        </div>

        <div className="relative z-10">
          <div className="flex flex-wrap gap-3 mb-6">
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${pattern.difficulty === 'Easy' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
              pattern.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                'bg-red-500/10 text-red-400 border-red-500/20'
              }`}>
              {pattern.difficulty}
            </span>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {pattern.category}
            </span>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
              {problems?.length || 0} problems
            </span>
          </div>

          <h1 className={`text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r ${isLight ? 'from-gray-900 to-gray-500' : 'from-white to-gray-400'}`}>
            {pattern.name}
          </h1>

          <p className="text-lg text-secondary leading-relaxed max-w-3xl">
            {pattern.description}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Theory & Use Cases */}
        <div className="lg:col-span-2 space-y-8">
          {/* Theory */}
          {pattern.theory && (
            <div className="glass-panel p-8 rounded-2xl">
              <div className={`flex items-center gap-3 mb-6 pb-4 border-b ${isLight ? 'border-gray-200' : 'border-white/5'}`}>
                <BookOpen className="text-accent" size={24} />
                <h2 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Concept & Theory</h2>
              </div>
              <div className="prose prose-invert max-w-none text-secondary">
                <p className="whitespace-pre-line leading-7 text-lg">
                  {pattern.theory}
                </p>
              </div>
            </div>
          )}

          {/* Use Cases */}
          {pattern.examples && Array.isArray(pattern.examples) && pattern.examples.length > 0 && (
            <div className="glass-panel p-8 rounded-2xl">
              <div className={`flex items-center gap-3 mb-6 pb-4 border-b ${isLight ? 'border-gray-200' : 'border-white/5'}`}>
                <Lightbulb className="text-yellow-400" size={24} />
                <h2 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>When to use</h2>
              </div>
              <ul className="space-y-4">
                {pattern.examples.map((example, index) => (
                  <li key={index} className={`flex gap-4 items-start p-4 rounded-xl ${isLight ? 'bg-gray-50 border border-gray-200' : 'bg-white/5 border border-white/5'}`}>
                    <CheckCircle2 size={24} className="text-green-500 shrink-0 mt-0.5" />
                    <span className={`text-lg ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>{example}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: Problems List */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-6 rounded-2xl sticky top-24 max-h-[calc(100vh-120px)] flex flex-col">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h2 className={`text-xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Curated Problems</h2>
              <span className={`text-xs font-mono text-muted ${isLight ? 'bg-gray-100 border-gray-200' : 'bg-white/5 border-white/5'} px-2 py-1 rounded border`}>
                {problems?.filter(p => p.user_status === 'solved').length}/{problems?.length} Solved
              </span>
            </div>

            <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2 -mr-2">
              {problems && problems.length > 0 ? (
                problems.map(problem => (
                  <Link
                    key={problem.id}
                    to={`/problems/${problem.id}`}
                    className="block group"
                  >
                    <div className={`p-4 rounded-xl ${isLight ? 'bg-gray-50 border border-gray-200 hover:bg-gray-100' : 'bg-white/5 border border-white/5 hover:bg-white/10'} hover:border-accent/30 transition-all duration-200`}>
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-medium ${isLight ? 'text-gray-700 group-hover:text-gray-900' : 'text-gray-200 group-hover:text-white'} transition-colors text-sm mb-2 truncate`}>
                            {problem.title}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${problem.difficulty === 'Easy' ? 'bg-green-500/10 text-green-400' :
                              problem.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' :
                                'bg-red-500/10 text-red-400'
                              }`}>
                              {problem.difficulty}
                            </span>
                          </div>
                        </div>
                        {problem.user_status === 'solved' ? (
                          <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                        ) : (
                          <Circle size={18} className={`${isLight ? 'text-gray-300 group-hover:text-gray-500' : 'text-white/20 group-hover:text-white/40'} shrink-0 transition-colors`} />
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 text-muted">
                  <p>No problems available yet.</p>
                </div>
              )}
            </div>

            <div className={`mt-6 pt-6 border-t ${isLight ? 'border-gray-200' : 'border-white/10'} shrink-0`}>
              <Link to="/dsa-patterns" className="btn btn-outline w-full justify-center text-sm py-3">
                View All Patterns
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
