import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Activity, Award, ArrowRight, Target, BookOpen } from 'lucide-react';

export default function InterviewComplete({ interview, onNewInterview }) {
  const [scoreDetails, setScoreDetails] = useState(null);

  useEffect(() => {
    // Simulate score calculation animation
    setTimeout(() => {
      setScoreDetails(interview.scores || {
        overall: 75,
        communication: 78,
        technical: 72,
        problemSolving: 75
      });
    }, 500);
  }, [interview]);

  const getScoreColor = (score) => {
    if (score >= 85) return 'from-green-500 to-green-400';
    if (score >= 70) return 'from-blue-500 to-blue-400';
    if (score >= 55) return 'from-yellow-500 to-yellow-400';
    return 'from-red-500 to-red-400';
  };

  const getScoreLabel = (score) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 55) return 'Average';
    return 'Needs Improvement';
  };

  // ── Extract backend intelligence data ─────────────────────────────
  const backendStrengths = interview.strengths || interview.completion?.strengths;
  const backendImprovements = interview.areasForImprovement || interview.completion?.areas_for_improvement;
  const backendRecommendations = interview.recommendations || interview.completion?.recommendations;
  const backendFollowUps = interview.followUpProblems || interview.completion?.follow_up_practice_problems;
  const trendNarrative = interview.trendNarrative || interview.completion?.trend_narrative;
  const scoreTrend = interview.scoreTrendSummary || interview.completion?.score_trend_summary;

  // ── Trend icon helper ─────────────────────────────────────────────
  const getTrendIcon = () => {
    if (!scoreTrend?.trend) return <Activity className="w-5 h-5 text-slate-400" />;
    if (scoreTrend.trend === 'improving') return <TrendingUp className="w-5 h-5 text-green-400" />;
    if (scoreTrend.trend === 'declining') return <TrendingDown className="w-5 h-5 text-red-400" />;
    return <Activity className="w-5 h-5 text-blue-400" />;
  };

  const ScoreCard = ({ label, score }) => (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-3">
      <p className="text-slate-300 font-medium">{label}</p>
      {scoreDetails ? (
        <>
          <div className="relative w-28 h-28 mx-auto">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="16"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="text-slate-600"
              />
              <circle
                cx="18"
                cy="18"
                r="16"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeDasharray={`${(score / 100) * 100.5} 100.5`}
                className={`text-transparent bg-gradient-to-r ${getScoreColor(score)} transition-all duration-1000`}
                style={{
                  backgroundImage: `linear-gradient(to right, rgb(59, 130, 246), rgb(96, 165, 250))`
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">{Math.round(score)}</span>
              <span className="text-xs text-slate-400">/100</span>
            </div>
          </div>
          <p className="text-center text-blue-400 font-bold">{getScoreLabel(score)}</p>
        </>
      ) : (
        <div className="h-28 bg-slate-700 rounded-lg animate-pulse" />
      )}
    </div>
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Success Header */}
      <div className="text-center py-8 space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-green-400 flex items-center justify-center animate-pulse">
            <Award className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-white">Interview Complete!</h1>
        <p className="text-slate-300 text-lg">Great effort! Here&apos;s how you performed:</p>
      </div>

      {/* Score Grid */}
      {scoreDetails ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="md:col-span-1">
            <ScoreCard label="Overall" score={scoreDetails.overall} />
          </div>
          <div className="md:col-span-1">
            <ScoreCard label="Communication" score={scoreDetails.communication} />
          </div>
          <div className="md:col-span-1">
            <ScoreCard label="Technical" score={scoreDetails.technical} />
          </div>
          <div className="md:col-span-1">
            <ScoreCard label="Problem Solving" score={scoreDetails.problemSolving} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-800 rounded-lg p-6 h-40 animate-pulse" />
          ))}
        </div>
      )}

      {/* Performance Journey — Trend Narrative */}
      {trendNarrative && (
        <div className="bg-gradient-to-br from-indigo-900/20 to-slate-800/50 border border-indigo-500/30 rounded-lg p-6 space-y-3">
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <h2 className="text-xl font-bold text-white">Performance Journey</h2>
            {scoreTrend?.trend && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                scoreTrend.trend === 'improving' ? 'bg-green-500/20 text-green-400' :
                scoreTrend.trend === 'declining' ? 'bg-red-500/20 text-red-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>
                {scoreTrend.trend}
              </span>
            )}
          </div>
          <p className="text-slate-300 leading-relaxed">{trendNarrative}</p>
        </div>
      )}

      {/* Dynamic Strengths & Improvements from Backend */}
      {(backendStrengths || backendImprovements) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strengths */}
          {backendStrengths && backendStrengths.length > 0 && (
            <div className="bg-slate-800 border border-green-500/20 rounded-lg p-6 space-y-3">
              <h3 className="font-bold text-green-400 flex items-center gap-2">
                <span>✓</span> Strengths
              </h3>
              <ul className="space-y-2">
                {backendStrengths.map((s, i) => (
                  <li key={i} className="text-slate-300 text-sm flex gap-2">
                    <span className="text-green-400 mt-0.5">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas for Improvement */}
          {backendImprovements && backendImprovements.length > 0 && (
            <div className="bg-slate-800 border border-amber-500/20 rounded-lg p-6 space-y-3">
              <h3 className="font-bold text-amber-400 flex items-center gap-2">
                <Target className="w-4 h-4" /> Areas to Improve
              </h3>
              <ul className="space-y-2">
                {backendImprovements.map((a, i) => (
                  <li key={i} className="text-slate-300 text-sm flex gap-2">
                    <span className="text-amber-400 mt-0.5">→</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Dynamic Recommendations */}
      {backendRecommendations && (
        <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Personalized Recommendations</h2>
          </div>

          <p className="text-slate-300 leading-relaxed">{backendRecommendations}</p>

          {/* Fallback static recommendations when no backend data */}
          {!backendRecommendations && (
            <div className="space-y-3">
              {scoreDetails?.communication < 75 && (
                <div className="flex gap-3 text-slate-300">
                  <span className="text-blue-400">→</span>
                  <span>Work on articulation and clarity. Practice speaking slowly and structuring thoughts better.</span>
                </div>
              )}
              {scoreDetails?.technical < 75 && (
                <div className="flex gap-3 text-slate-300">
                  <span className="text-blue-400">→</span>
                  <span>Review fundamental concepts. Solve 5-10 LeetCode problems daily to improve technical depth.</span>
                </div>
              )}
              {scoreDetails?.problemSolving < 75 && (
                <div className="flex gap-3 text-slate-300">
                  <span className="text-blue-400">→</span>
                  <span>Think through problems step by step. Clarify requirements before diving into solutions.</span>
                </div>
              )}
              {scoreDetails?.overall >= 80 && (
                <div className="flex gap-3 text-green-300">
                  <span className="text-green-400">✓</span>
                  <span>Excellent performance! Try a harder difficulty level to challenge yourself further.</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recommended Practice Problems */}
      {backendFollowUps && backendFollowUps.length > 0 && (
        <div className="bg-slate-800 border border-purple-500/20 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Recommended Practice</h2>
          </div>
          <div className="space-y-3">
            {backendFollowUps.map((fp, i) => (
              <div key={i} className="border border-slate-700 rounded-lg p-4 space-y-1">
                <p className="text-purple-400 font-medium">{fp.title}</p>
                <p className="text-slate-400 text-sm">{fp.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interview Details */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Interview Summary
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-slate-400 text-sm">Interview Type</p>
            <p className="text-white font-bold capitalize">{interview.config?.type || 'Technical'}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Difficulty</p>
            <p className="text-white font-bold capitalize">{interview.config?.difficulty || 'Medium'}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Questions Answered</p>
            <p className="text-white font-bold">{interview.responses?.length || 0}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Duration</p>
            <p className="text-white font-bold">~{interview.config?.duration || 30} minutes</p>
          </div>
        </div>
      </div>

      {/* Answer Review */}
      {interview.responses && interview.responses.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-6">
          <h2 className="text-xl font-bold text-white">Question Review</h2>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {interview.responses.map((response, idx) => (
              <div key={idx} className="border border-slate-700 rounded-lg p-4 space-y-2">
                <p className="text-blue-400 font-bold">Q{idx + 1}: {response.question?.question || 'Question'}</p>
                <p className="text-slate-300 text-sm">{response.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onNewInterview}
          className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all flex items-center justify-center gap-2"
        >
          <ArrowRight className="w-5 h-5" />
          Start New Interview
        </button>

        <button
          onClick={() => window.open('/analytics', '_blank')}
          className="flex-1 px-6 py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-all"
        >
          View Analytics
        </button>
      </div>

      {/* Tips for Next Interview */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-3">
        <h3 className="font-bold text-white">💡 Tips for Your Next Interview</h3>
        <ul className="space-y-2 text-slate-300 text-sm">
          <li>• Review your weak areas and practice targeted exercises</li>
          <li>• Record yourself and listen back to improve delivery</li>
          <li>• Practice the STAR method for behavioral questions</li>
          <li>• Study system design patterns and trade-offs</li>
          <li>• Try progressively harder difficulty levels</li>
        </ul>
      </div>
    </div>
  );
}
