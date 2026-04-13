import React, { useState, useEffect, useRef } from 'react';
import { Mic, Volume2, Clock, SkipForward, CheckCircle, AlertCircle } from 'lucide-react';
import RealtimeFeedback from './RealtimeFeedback';
import { buildAuthHeaders } from '../utils/authHeaders';

/**
 * Modern Interactive Interview Component
 * Features: Video/Audio support, Real-time feedback, Progress tracking
 */
export default function ModernInterviewContainer() {
  const [interviewState, setInterviewState] = useState('intro'); // intro, recording, answered, completed
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [realtimeFeedback, setRealtimeFeedback] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(0);
  const [selectedType, setSelectedType] = useState('technical');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const INTERVIEW_TYPES = [
    { value: 'technical', label: '💻 Technical', icon: '💻' },
    { value: 'behavioral', label: '🤝 Behavioral', icon: '🤝' },
    { value: 'system-design', label: '🏗️ System Design', icon: '🏗️' },
    { value: 'coding', label: '🔧 Coding', icon: '🔧' }
  ];

  const DIFFICULTIES = [
    { value: 'easy', label: 'Easy', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'hard', label: 'Hard', color: 'bg-red-100 text-red-800' }
  ];

  // Start interview
  const startInterview = async () => {
    try {
      const response = await fetch('/api/ai/interview/v2/start', {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          type: selectedType,
          difficulty: selectedDifficulty,
          duration: 30
        })
      });
      const data = await response.json();
      if (data.questions && data.questions.length > 0) {
        setCurrentQuestion(data.questions[0]);
        setInterviewState('recording');
        setTimer(0);
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      alert('Failed to start interview');
    }
  };

  // Timer effect
  useEffect(() => {
    let interval;
    if (interviewState === 'recording') {
      interval = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [interviewState]);

  // Record answer
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        // Process recorded audio
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // In real implementation, send to backend for transcription
        setCurrentAnswer('Audio recorded: ' + Math.round(timer) + 's');
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Please allow microphone access');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  // Get real-time feedback
  const getRealtimeFeedback = async () => {
    try {
      const response = await fetch('/api/ai/interview/v2/feedback/realtime', {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          question: currentQuestion.question,
          answer: currentAnswer,
          type: selectedType,
          difficulty: selectedDifficulty
        })
      });
      const feedback = await response.json();
      setRealtimeFeedback(feedback);
    } catch (error) {
      console.error('Error getting feedback:', error);
    }
  };

  // Submit answer and move to next
  const submitAnswer = async () => {
    if (!currentAnswer.trim()) {
      alert('Please provide an answer');
      return;
    }

    await getRealtimeFeedback();
    
    setAnswers([...answers, {
      question: currentQuestion,
      answer: currentAnswer,
      feedback: realtimeFeedback
    }]);

    // Get next question
    try {
      const response = await fetch('/api/ai/interview/v2/next-question', {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          previousResponses: answers,
          type: selectedType,
          difficulty: selectedDifficulty
        })
      });
      const data = await response.json();
      setCurrentQuestion(data.question);
      setCurrentAnswer('');
      setRealtimeFeedback(null);
      setTimer(0);
    } catch (error) {
      console.error('Error getting next question:', error);
      completeInterview();
    }
  };

  // Complete interview
  const completeInterview = async () => {
    try {
      const response = await fetch('/api/ai/interview/v2/analysis/detailed', {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          responses: answers.map(a => ({ question: a.question.question, answer: a.answer })),
          type: selectedType,
          difficulty: selectedDifficulty,
          duration: timer
        })
      });
      const analysis = await response.json();
      setScore(analysis.overall_score);
      setInterviewState('completed');
    } catch (error) {
      console.error('Error completing interview:', error);
    }
  };

  // === RENDER INTRO SCREEN ===
  if (interviewState === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-4xl font-bold text-center mb-2 text-gray-900">
              🎯 Modern AI Interview
            </h1>
            <p className="text-center text-gray-600 mb-8">
              Practice with real-time feedback and personalized insights
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Interview Type Selection */}
              <div>
                <h2 className="text-lg font-bold mb-4 text-gray-900">Interview Type</h2>
                <div className="space-y-3">
                  {INTERVIEW_TYPES.map(type => (
                    <button
                      key={type.value}
                      onClick={() => setSelectedType(type.value)}
                      className={`w-full p-4 rounded-lg border-2 transition-all ${
                        selectedType === type.value
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <span className="text-lg mr-2">{type.icon}</span>
                      <span className="font-semibold">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Selection */}
              <div>
                <h2 className="text-lg font-bold mb-4 text-gray-900">Difficulty</h2>
                <div className="space-y-3">
                  {DIFFICULTIES.map(diff => (
                    <button
                      key={diff.value}
                      onClick={() => setSelectedDifficulty(diff.value)}
                      className={`w-full p-4 rounded-lg border-2 transition-all ${
                        selectedDifficulty === diff.value
                          ? `${diff.color} border-gray-400`
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <span className="font-semibold">{diff.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="bg-indigo-50 rounded-lg p-6 mb-8">
              <h3 className="font-bold text-gray-900 mb-4">✨ Features</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center">
                  <span className="text-xl mr-2">⚡</span>
                  <span>Real-time Feedback</span>
                </div>
                <div className="flex items-center">
                  <span className="text-xl mr-2">📊</span>
                  <span>Analytics</span>
                </div>
                <div className="flex items-center">
                  <span className="text-xl mr-2">🎙️</span>
                  <span>Voice Recording</span>
                </div>
                <div className="flex items-center">
                  <span className="text-xl mr-2">📈</span>
                  <span>Progress Tracking</span>
                </div>
              </div>
            </div>

            <button
              onClick={startInterview}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-lg text-lg transition-all transform hover:scale-105"
            >
              ▶️ Start Interview
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === RENDER RECORDING SCREEN ===
  if (interviewState === 'recording') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Question Area */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span>Question {answers.length + 1}</span>
                    <span><Clock size={16} className="inline mr-1" />{Math.floor(timer / 60)}:{timer % 60 < 10 ? '0' : ''}{timer % 60}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${((answers.length + 1) / 5) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Question Display */}
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {currentQuestion?.question}
                </h2>

                {currentQuestion?.context && (
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                    <p className="text-gray-700">
                      <span className="font-semibold">💡 Tip:</span> {currentQuestion.context}
                    </p>
                  </div>
                )}

                {/* Text Input Area */}
                <div className="mb-6">
                  <label className="block font-semibold text-gray-900 mb-2">Your Answer</label>
                  <textarea
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Type your answer here or use the microphone button..."
                    className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none resize-none"
                    rows="6"
                  />
                </div>

                {/* Audio Recording Controls */}
                <div className="flex gap-4 mb-6">
                  {isRecording ? (
                    <button
                      onClick={stopRecording}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                    >
                      <span className="animate-pulse">●</span> Stop Recording
                    </button>
                  ) : (
                    <button
                      onClick={startRecording}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                    >
                      <Mic size={20} /> Record Answer
                    </button>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={submitAnswer}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                  >
                    <CheckCircle size={20} /> Submit Answer
                  </button>
                  <button
                    onClick={() => {
                      answers.length >= 4 ? completeInterview() : submitAnswer();
                    }}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                  >
                    <SkipForward size={20} /> {answers.length >= 4 ? 'Finish' : 'Skip'}
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar - Real-time Feedback */}
            <div>
              <RealtimeFeedback feedback={realtimeFeedback} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === RENDER COMPLETION SCREEN ===
  if (interviewState === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="text-7xl font-bold text-indigo-600 mb-4">{score}</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Complete!</h1>
              <p className="text-gray-600">Great effort! Check your detailed analysis below.</p>
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 mb-8">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-indigo-600">5</div>
                  <div className="text-sm text-gray-600">Questions Answered</div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">{Math.floor(timer / 60)}m</div>
                  <div className="text-sm text-gray-600">Total Time</div>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-all">
                📊 View Detailed Analysis
              </button>
              <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition-all">
                📈 View Learning Path
              </button>
              <button className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition-all">
                🔄 Try Another Interview
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
