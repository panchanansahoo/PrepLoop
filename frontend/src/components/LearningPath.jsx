import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Lock, Zap, BookOpen, Code, Users, Target, Award } from 'lucide-react';

/**
 * Personalized Learning Path Component
 * Shows recommended learning sequence based on interview performance
 */
export default function LearningPath() {
  const [learningPath, setLearningPath] = useState(null);
  const [selectedPath, setSelectedPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedTopic, setExpandedTopic] = useState(null);

  useEffect(() => {
    fetchLearningPath();
  }, []);

  const fetchLearningPath = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/learning-path/personalized');
      const data = await response.json();
      setLearningPath(data);
      if (data.paths && data.paths.length > 0) {
        setSelectedPath(data.paths[0]);
      }
    } catch (error) {
      console.error('Error fetching learning path:', error);
    } finally {
      setLoading(false);
    }
  };

  const startTopic = (topicId) => {
    // Navigate to learning module
    window.location.href = `/learn/${topicId}`;
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 50) return 'text-blue-600';
    return 'text-gray-600';
  };

  const getProgressBg = (progress) => {
    if (progress >= 80) return 'bg-green-100';
    if (progress >= 50) return 'bg-blue-100';
    return 'bg-gray-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📚 Personalized Learning Paths</h1>
          <p className="text-gray-600">Customize your journey based on your interview performance</p>
        </div>

        {/* Path Selection */}
        {learningPath && learningPath.paths && learningPath.paths.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {learningPath.paths.map((path, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedPath(path)}
                className={`p-6 rounded-lg border-2 transition-all text-left ${
                  selectedPath?.id === path.id
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-indigo-300'
                }`}
              >
                <div className="text-3xl mb-2">{path.icon}</div>
                <h3 className="font-bold text-gray-900">{path.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{path.duration}</p>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all"
                    style={{ width: `${path.progress}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Overview Section */}
        {selectedPath && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {/* Total Duration */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={20} className="text-blue-600" />
                  <span className="font-semibold text-gray-900">Total Duration</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{selectedPath.total_hours} hours</p>
              </div>

              {/* Difficulty Level */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target size={20} className="text-purple-600" />
                  <span className="font-semibold text-gray-900">Difficulty</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {selectedPath.difficulty.charAt(0).toUpperCase() + selectedPath.difficulty.slice(1)}
                </p>
              </div>

              {/* Modules */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen size={20} className="text-green-600" />
                  <span className="font-semibold text-gray-900">Modules</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{selectedPath.modules?.length || 0}</p>
              </div>

              {/* Overall Progress */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award size={20} className="text-orange-600" />
                  <span className="font-semibold text-gray-900">Progress</span>
                </div>
                <p className="text-2xl font-bold text-orange-600">{selectedPath.progress}%</p>
              </div>
            </div>

            {/* Description */}
            {selectedPath.description && (
              <div className="bg-indigo-50 border-l-4 border-indigo-600 p-4">
                <p className="text-gray-800">{selectedPath.description}</p>
              </div>
            )}
          </div>
        )}

        {/* Learning Modules */}
        {selectedPath && selectedPath.modules && (
          <div className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📖 Learning Modules</h2>

            {selectedPath.modules.map((module, moduleIdx) => (
              <div
                key={moduleIdx}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                {/* Module Header */}
                <button
                  onClick={() => setExpandedTopic(expandedTopic === moduleIdx ? null : moduleIdx)}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-all"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Module Status */}
                    <div className="flex-shrink-0">
                      {module.completed ? (
                        <CheckCircle size={32} className="text-green-600" />
                      ) : module.in_progress ? (
                        <div className="relative">
                          <Circle size={32} className="text-blue-600" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Zap size={16} className="text-blue-600" />
                          </div>
                        </div>
                      ) : (
                        <Circle size={32} className="text-gray-400" />
                      )}
                    </div>

                    {/* Module Info */}
                    <div className="text-left flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{module.title}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span>📚 {module.lessons} lessons</span>
                        <span>⏱️ {module.duration} mins</span>
                        {!module.completed && (
                          <span>🎯 {module.progress}% complete</span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="hidden md:block w-32">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            module.completed
                              ? 'bg-green-600'
                              : module.in_progress
                              ? 'bg-blue-600'
                              : 'bg-gray-400'
                          }`}
                          style={{ width: `${module.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Chevron */}
                  <div className="ml-4">
                    <svg
                      className={`w-6 h-6 text-gray-400 transition-transform ${
                        expandedTopic === moduleIdx ? 'transform rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                </button>

                {/* Module Details */}
                {expandedTopic === moduleIdx && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    {module.lessons_list && (
                      <div className="space-y-3 mb-6">
                        {module.lessons_list.map((lesson, lessonIdx) => (
                          <div
                            key={lessonIdx}
                            className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-200"
                          >
                            <div className="flex-shrink-0 mt-1">
                              {lesson.completed ? (
                                <CheckCircle size={20} className="text-green-600" />
                              ) : (
                                <Circle size={20} className="text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{lesson.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{lesson.description}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                <span>⏱️ {lesson.duration} min</span>
                                {lesson.resource_type && <span>📖 {lesson.resource_type}</span>}
                              </div>
                            </div>
                            {!lesson.completed && (
                              <button className="flex-shrink-0 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-semibold transition-all whitespace-nowrap">
                                Start
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Module Recommendation */}
                    {module.recommendation && (
                      <div className="bg-indigo-50 border-l-4 border-indigo-600 p-4">
                        <p className="text-sm text-indigo-900">
                          <span className="font-semibold">💡 Recommendation:</span> {module.recommendation}
                        </p>
                      </div>
                    )}

                    {/* Action Button */}
                    {!module.completed && (
                      <button
                        onClick={() => startTopic(module.id)}
                        className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                      >
                        <BookOpen size={18} />
                        {module.in_progress ? 'Continue Learning' : 'Start Module'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {learningPath && learningPath.recommendations && learningPath.recommendations.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-300 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target size={24} className="text-indigo-600" />
              Next Steps
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {learningPath.recommendations.map((rec, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 border-l-4 border-indigo-600">
                  <p className="font-semibold text-gray-900 mb-1">{rec.title}</p>
                  <p className="text-gray-700 text-sm mb-3">{rec.description}</p>
                  <button className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold">
                    Learn More →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Footer */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Your Learning Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-indigo-600">{learningPath?.total_modules_completed || 0}</p>
              <p className="text-sm text-gray-600">Modules Completed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{learningPath?.total_hours_learned || 0}</p>
              <p className="text-sm text-gray-600">Hours Learned</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{learningPath?.current_streak || 0}</p>
              <p className="text-sm text-gray-600">Day Streak</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{learningPath?.average_score || 0}</p>
              <p className="text-sm text-gray-600">Avg Score</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
