import React, { useState, useEffect, useRef } from 'react';
import { Loader, Send, Mic, MicOff, Lightbulb } from 'lucide-react';

export default function InterviewSession({ interview, config, onComplete }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);

  const questions = config.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Initialize recording
  useEffect(() => {
    const initRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          // Could send this to transcription API
          const reader = new FileReader();
          reader.onloadend = () => {
            const audioBase64 = reader.result.split(',')[1];
            // Store for potential transcription
            setAnswers(prev => ({
              ...prev,
              [`audio_${currentQuestionIndex}`]: audioBase64
            }));
          };
          reader.readAsDataURL(audioBlob);
          audioChunksRef.current = [];
        };
        
        mediaRecorderRef.current = mediaRecorder;
      } catch (err) {
        console.error('Recording not available:', err);
      }
    };

    initRecording();

    return () => {
      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Cleanup recording interval on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!mediaRecorderRef.current) return;

    if (isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      setRecordingTime(0);
    } else {
      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim()) {
      alert('Please provide an answer before submitting');
      return;
    }

    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: currentAnswer
    }));

    // Get feedback
    setLoadingFeedback(true);
    setFeedback(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5003/api/interview/0/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          questionIndex: currentQuestionIndex,
          answerText: currentAnswer
        })
      });

      if (response.ok) {
        const data = await response.json();
        setFeedback(data.feedback);
      }
    } catch (err) {
      console.error('Failed to get feedback:', err);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer(answers[currentQuestionIndex + 1] || '');
      setFeedback(null);
    } else {
      // Complete interview
      const responses = questions.map((q, idx) => ({
        question: q,
        answer: answers[idx] || ''
      }));
      onComplete(responses, { overall: 75, communication: 80, technical: 70, problemSolving: 75 });
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  if (!currentQuestion) {
    return <div className="text-white">Loading questions...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="bg-slate-800 rounded-lg p-4">
        <div className="flex justify-between mb-2">
          <span className="text-white font-bold">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span className="text-slate-400">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-600 to-blue-400 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Question Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Question Card */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
            <h2 className="text-2xl font-bold text-white">{currentQuestion.question}</h2>
            
            {currentQuestion.context && (
              <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4 flex gap-3">
                <Lightbulb className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-blue-200 text-sm">{currentQuestion.context}</p>
              </div>
            )}
          </div>

          {/* Answer Input Area */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Your Answer</h3>
            
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Type your answer here... or use voice recording below."
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-4 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none h-32"
            />

            <div className="flex gap-3">
              <button
                onClick={toggleRecording}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    Stop Recording ({recordingTime}s)
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    Record Answer
                  </>
                )}
              </button>

              <button
                onClick={handleSubmitAnswer}
                disabled={loadingFeedback}
                className="flex-1 flex items-center gap-2 justify-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-600 transition-all disabled:opacity-50"
              >
                {loadingFeedback ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Getting Feedback...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Get Feedback
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Feedback Section */}
          {feedback && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-bold text-white">AI Feedback</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-blue-400 font-bold mb-2">Assessment</h4>
                  <p className="text-slate-300">{feedback.assessment}</p>
                </div>

                {feedback.strengths && (
                  <div>
                    <h4 className="text-green-400 font-bold mb-2">✓ Strengths</h4>
                    <ul className="space-y-1">
                      {feedback.strengths.map((strength, idx) => (
                        <li key={idx} className="text-green-300 text-sm">• {strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {feedback.improvements && (
                  <div>
                    <h4 className="text-yellow-400 font-bold mb-2">⚡ Areas to Improve</h4>
                    <ul className="space-y-1">
                      {feedback.improvements.map((imp, idx) => (
                        <li key={idx} className="text-yellow-300 text-sm">• {imp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {feedback.tips && (
                  <div>
                    <h4 className="text-purple-400 font-bold mb-2">💡 Tips</h4>
                    <p className="text-purple-300 text-sm">{feedback.tips}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all"
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg font-medium transition-all"
            >
              {currentQuestionIndex === questions.length - 1 ? 'Complete Interview' : 'Next Question'}
            </button>
          </div>
        </div>

        {/* Side Panel - Tips & Timer */}
        <div className="space-y-6">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Interview Tips</h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex gap-2">
                <span className="text-blue-400">•</span>
                <span>Think out loud - explain your reasoning</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400">•</span>
                <span>Ask clarifying questions if needed</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400">•</span>
                <span>Provide examples and edge cases</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400">•</span>
                <span>Don't rush - take your time</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg p-6 space-y-3">
            <h3 className="text-lg font-bold text-white">STAR Method</h3>
            <div className="space-y-2 text-sm text-slate-300">
              <p><span className="text-purple-400 font-bold">S</span>ituation - Set the context</p>
              <p><span className="text-purple-400 font-bold">T</span>ask - What was your role</p>
              <p><span className="text-purple-400 font-bold">A</span>ction - What you did</p>
              <p><span className="text-purple-400 font-bold">R</span>esult - What happened</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
