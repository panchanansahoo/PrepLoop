import React, { useEffect, useState } from 'react';
import { Lightbulb, Target, TrendingUp, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { buildAuthHeaders } from '../utils/authHeaders';
import { API_URL } from '../utils/safeApiUrl';

export default function InterviewRecommendations() {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedTips, setCompletedTips] = useState([]);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/recommendations`, {
        method: 'GET',
        headers: buildAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTipCompletion = (tipId) => {
    setCompletedTips(prev =>
      prev.includes(tipId) ? prev.filter(id => id !== tipId) : [...prev, tipId]
    );
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'border-red-500 bg-red-500/10 text-red-400',
      medium: 'border-yellow-500 bg-yellow-500/10 text-yellow-400',
      low: 'border-green-500 bg-green-500/10 text-green-400'
    };
    return colors[priority] || colors.medium;
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '•';
    }
  };

  const getAreaIcon = (area) => {
    const icons = {
      communication: '💬',
      technical: '⚙️',
      problemSolving: '🧠',
      behavioral: '🎯'
    };
    return icons[area] || '📌';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Lightbulb className="w-8 h-8" />
          Personalized Recommendations
        </h1>
        <p className="text-slate-400 mt-2">Get actionable insights to improve your interview skills</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-800 rounded-lg p-6 h-32 animate-pulse" />
          ))}
        </div>
      ) : recommendations ? (
        <>
          {/* Key Recommendations Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-red-900/20 to-red-900/5 border border-red-500/30 rounded-lg p-4">
              <p className="text-slate-400 text-sm font-bold">HIGH PRIORITY</p>
              <p className="text-3xl font-bold text-red-400 mt-2">
                {recommendations.recommendations?.filter(r => r.priority === 'high').length || 0}
              </p>
              <p className="text-xs text-slate-400 mt-1">Areas needing focus</p>
            </div>

            <div className="bg-gradient-to-br from-blue-900/20 to-blue-900/5 border border-blue-500/30 rounded-lg p-4">
              <p className="text-slate-400 text-sm font-bold">IMPROVEMENT TIPS</p>
              <p className="text-3xl font-bold text-blue-400 mt-2">
                {recommendations.tips?.length || 0}
              </p>
              <p className="text-xs text-slate-400 mt-1">Actionable insights</p>
            </div>

            <div className="bg-gradient-to-br from-purple-900/20 to-purple-900/5 border border-purple-500/30 rounded-lg p-4">
              <p className="text-slate-400 text-sm font-bold">SUGGESTED NEXT STEP</p>
              <p className="text-sm font-bold text-purple-400 mt-2 capitalize">
                {recommendations.nextSuggestedInterviewType || 'Technical'}
              </p>
              <p className="text-xs text-slate-400 mt-1">Practice type</p>
            </div>
          </div>

          {/* Main Recommendations */}
          {recommendations.recommendations && recommendations.recommendations.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Target className="w-6 h-6" />
                Areas for Improvement
              </h2>

              <div className="space-y-4">
                {recommendations.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className={`border rounded-lg p-6 space-y-3 transition-all ${getPriorityColor(rec.priority)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getAreaIcon(rec.area)}</span>
                          <h3 className="text-lg font-bold">{rec.title}</h3>
                          <span className="text-xs font-bold px-2 py-1 rounded-full bg-current/20">
                            {getPriorityIcon(rec.priority)} {rec.priority.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm opacity-90 mt-1">{rec.description}</p>
                      </div>
                    </div>

                    {rec.actionItems && (
                      <div className="space-y-2 mt-4 pt-3 border-t border-current/20">
                        <p className="text-sm font-bold">Action Items:</p>
                        <ul className="space-y-1">
                          {rec.actionItems.map((item, itemIdx) => (
                            <li key={itemIdx} className="text-sm flex items-start gap-2 opacity-90">
                              <span className="mt-1">→</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips & Strategies */}
          {recommendations.tips && recommendations.tips.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                Improvement Tips
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.tips.map((tip, idx) => (
                  <div
                    key={idx}
                    className={`bg-slate-800 border border-slate-700 rounded-lg p-5 cursor-pointer transition-all hover:border-blue-500/50 ${
                      completedTips.includes(idx) ? 'opacity-60' : ''
                    }`}
                    onClick={() => toggleTipCompletion(idx)}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          completedTips.includes(idx)
                            ? 'bg-green-500 border-green-500'
                            : 'border-slate-600 hover:border-blue-500'
                        }`}
                      >
                        {completedTips.includes(idx) && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <h3 className={`font-bold ${completedTips.includes(idx) ? 'line-through text-slate-500' : 'text-white'}`}>
                        {tip.title}
                      </h3>
                    </div>

                    <p className="text-sm text-slate-300 mb-3">{tip.description}</p>

                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <span>⏱️</span>
                      {tip.estimatedTime}
                    </p>
                  </div>
                ))}
              </div>

              <p className="text-sm text-slate-400">
                💡 Tip: Click on any tip to mark it as completed. Track your progress towards mastery!
              </p>
            </div>
          )}

          {/* Suggested Interview Type */}
          {recommendations.nextSuggestedInterviewType && (
            <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-bold text-white">📈 Suggested Next Interview</h2>
              
              <div className="space-y-3">
                <div>
                  <p className="text-slate-400 text-sm mb-2">Interview Type</p>
                  <p className="text-2xl font-bold text-blue-400 capitalize">
                    {recommendations.nextSuggestedInterviewType}
                  </p>
                </div>

                {recommendations.reason && (
                  <div className="pt-3 border-t border-blue-500/20">
                    <p className="text-slate-300">{recommendations.reason}</p>
                  </div>
                )}

                <button className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all flex items-center justify-center gap-2">
                  Start {recommendations.nextSuggestedInterviewType} Interview
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Difficulty Progression */}
          {recommendations.difficultyProgression && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-bold text-white">📊 Difficulty Progression</h2>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-300">Easy Interviews</span>
                    <span className="font-bold text-white">{recommendations.difficultyProgression.easy || 0}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-400 rounded-full h-2"
                      style={{ width: `${Math.min((recommendations.difficultyProgression.easy || 0) / 5 * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-300">Medium Interviews</span>
                    <span className="font-bold text-white">{recommendations.difficultyProgression.medium || 0}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-400 rounded-full h-2"
                      style={{ width: `${Math.min((recommendations.difficultyProgression.medium || 0) / 5 * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-300">Hard Interviews</span>
                    <span className="font-bold text-white">{recommendations.difficultyProgression.hard || 0}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-red-500 to-red-400 rounded-full h-2"
                      style={{ width: `${Math.min((recommendations.difficultyProgression.hard || 0) / 5 * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {recommendations.difficultyAdvice && (
                  <div className="mt-4 p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
                    <p className="text-sm text-slate-300">{recommendations.difficultyAdvice}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Resource Links */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">📚 Recommended Resources</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <a href="#" className="p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all flex items-center justify-between">
                <span className="text-white font-bold">LeetCode Problem Set</span>
                <ArrowRight className="w-5 h-5 text-slate-400" />
              </a>
              
              <a href="#" className="p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all flex items-center justify-between">
                <span className="text-white font-bold">System Design Patterns</span>
                <ArrowRight className="w-5 h-5 text-slate-400" />
              </a>

              <a href="#" className="p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all flex items-center justify-between">
                <span className="text-white font-bold">Communication Guide</span>
                <ArrowRight className="w-5 h-5 text-slate-400" />
              </a>

              <a href="#" className="p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all flex items-center justify-between">
                <span className="text-white font-bold">Behavioral Questions</span>
                <ArrowRight className="w-5 h-5 text-slate-400" />
              </a>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-slate-800 border border-slate-700 rounded-lg">
          <Lightbulb className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No recommendations yet</p>
          <p className="text-sm text-slate-500">Complete interviews to get personalized recommendations</p>
        </div>
      )}
    </div>
  );
}
