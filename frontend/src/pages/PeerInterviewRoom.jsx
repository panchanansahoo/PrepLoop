import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Copy,
  Check,
  Users,
  Code2,
  Award,
  Send,
  MessageSquare,
  Clock,
  Sparkles,
  ArrowLeft,
  Settings,
  CheckCircle2,
} from 'lucide-react';
import { usePeerInterview } from '../hooks/usePeerInterview';
import { useAuth } from '../context/AuthContext';

export default function PeerInterviewRoom() {
  const { roomCode: paramRoomCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [copied, setCopied] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState('problem'); // 'problem' | 'rubric' | 'chat'
  
  // Evaluation state (interviewer)
  const [commScore, setCommScore] = useState(8);
  const [decompScore, setDecompScore] = useState(8);
  const [techScore, setTechScore] = useState(8);
  const [rubricNotes, setRubricNotes] = useState('');
  const [evalSubmitted, setEvalSubmitted] = useState(false);

  // Timer
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const {
    connected,
    session,
    role,
    setRole,
    code,
    updateCode,
    language,
    setLanguage,
    chatMessages,
    sendChatMessage,
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoMuted,
    toggleAudio,
    toggleVideo,
    evaluation,
    submitEvaluation,
    statusMessage,
  } = usePeerInterview({ roomCode: paramRoomCode });

  // Bind video streams to elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Elapsed timer
  useEffect(() => {
    const timer = setInterval(() => setSecondsElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const copyRoomLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput);
    setChatInput('');
  };

  const handleFinalizeRubric = () => {
    submitEvaluation(
      { communication: commScore, decomposition: decompScore, technical: techScore },
      rubricNotes
    );
    setEvalSubmitted(true);
  };

  const activeRoomId = session?.id || paramRoomCode || 'LOBBY';

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 font-sans">
      {/* Top Navbar */}
      <header className="flex items-center justify-between px-6 py-3 bg-slate-900/90 border-b border-slate-800 backdrop-blur z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/interview-suite')}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" /> Exit
          </button>
          <div className="h-5 w-px bg-slate-700" />
          <div>
            <h1 className="text-base font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" /> Peer Mock Interview
            </h1>
            <p className="text-xs text-slate-400">{statusMessage}</p>
          </div>
        </div>

        {/* Room Code & Copy */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
            <span className="text-slate-400">Room:</span>
            <span className="font-mono font-semibold text-emerald-300">{activeRoomId}</span>
            <button
              onClick={copyRoomLink}
              title="Copy Room Link"
              className="ml-1 text-slate-400 hover:text-white transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-mono">{formatTimer(secondsElapsed)}</span>
          </div>

          {/* Role Pill */}
          <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
            <button
              onClick={() => setRole('candidate')}
              className={`px-2.5 py-1 rounded-md transition ${
                role === 'candidate' ? 'bg-sky-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Candidate
            </button>
            <button
              onClick={() => setRole('interviewer')}
              className={`px-2.5 py-1 rounded-md transition ${
                role === 'interviewer' ? 'bg-purple-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Interviewer
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Grid */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* Left Panel: Problem & Interviewer Rubric */}
        <div className="col-span-3 border-r border-slate-800 flex flex-col bg-slate-900/40">
          <div className="flex border-b border-slate-800 text-xs font-medium">
            <button
              onClick={() => setActiveTab('problem')}
              className={`flex-1 py-2.5 text-center border-b-2 transition ${
                activeTab === 'problem'
                  ? 'border-emerald-500 text-emerald-400 bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Problem
            </button>
            <button
              onClick={() => setActiveTab('rubric')}
              className={`flex-1 py-2.5 text-center border-b-2 transition ${
                activeTab === 'rubric'
                  ? 'border-purple-500 text-purple-400 bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Evaluation
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
            {activeTab === 'problem' && (
              <div className="space-y-4">
                <div>
                  <span className="text-[11px] font-semibold tracking-wider text-emerald-400 uppercase bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    DSA Practice
                  </span>
                  <h2 className="text-lg font-bold text-slate-100 mt-2">Two Sum with Target Window</h2>
                </div>
                <div className="text-slate-300 space-y-2 text-xs leading-relaxed">
                  <p>
                    Given an array of integers <code className="text-emerald-300 bg-slate-800 px-1 py-0.5 rounded">nums</code> and an integer <code className="text-emerald-300 bg-slate-800 px-1 py-0.5 rounded">target</code>, return the indices of two numbers that add up to target.
                  </p>
                  <p>
                    You may assume that each input would have exactly one solution, and you may not use the same element twice.
                  </p>
                </div>

                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 text-xs">
                  <div className="font-semibold text-slate-200 mb-1">Example 1:</div>
                  <pre className="text-slate-400 font-mono text-[11px]">
                    Input: nums = [2,7,11,15], target = 9{'\n'}
                    Output: [0,1]
                  </pre>
                </div>

                {role === 'interviewer' && (
                  <div className="bg-purple-950/40 border border-purple-800/60 p-3 rounded-lg text-xs space-y-2">
                    <div className="font-semibold text-purple-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Interviewer Notes & Hints:
                    </div>
                    <ul className="list-disc list-inside text-purple-200/80 space-y-1 text-[11px]">
                      <li>Ask candidate to explain naive $O(N^2)$ solution first.</li>
                      <li>Prompt for hash map space/time trade-off $O(N)$ time.</li>
                      <li>Check edge cases: negative numbers, duplicates.</li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'rubric' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-100 text-sm">Rubric Evaluation</h3>
                  <Award className="w-4 h-4 text-purple-400" />
                </div>

                {role === 'interviewer' ? (
                  <div className="space-y-4 text-xs">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-300">Communication & Clarity:</span>
                        <span className="font-mono text-purple-300 font-bold">{commScore}/10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={commScore}
                        onChange={(e) => setCommScore(Number(e.target.value))}
                        className="w-full accent-purple-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-300">Problem Decomposition:</span>
                        <span className="font-mono text-purple-300 font-bold">{decompScore}/10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={decompScore}
                        onChange={(e) => setDecompScore(Number(e.target.value))}
                        className="w-full accent-purple-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-300">Technical Depth:</span>
                        <span className="font-mono text-purple-300 font-bold">{techScore}/10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={techScore}
                        onChange={(e) => setTechScore(Number(e.target.value))}
                        className="w-full accent-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1">Feedback Notes:</label>
                      <textarea
                        rows={3}
                        value={rubricNotes}
                        onChange={(e) => setRubricNotes(e.target.value)}
                        placeholder="Provide concrete strengths and areas for candidate growth..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <button
                      onClick={handleFinalizeRubric}
                      disabled={evalSubmitted}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium rounded-lg transition flex items-center justify-center gap-1.5"
                    >
                      {evalSubmitted ? <CheckCircle2 className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                      {evalSubmitted ? 'Evaluation Sent' : 'Finalize & Share Rubric'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    {evaluation ? (
                      <div className="bg-emerald-950/40 border border-emerald-800/80 p-3 rounded-lg space-y-2">
                        <div className="font-semibold text-emerald-300">Interviewer Rubric Received:</div>
                        <div className="grid grid-cols-3 gap-2 py-1 text-center font-mono">
                          <div className="bg-slate-800/80 p-2 rounded">
                            <div className="text-[10px] text-slate-400">Communication</div>
                            <div className="text-emerald-400 font-bold text-sm">{evaluation.scores?.communication}/10</div>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded">
                            <div className="text-[10px] text-slate-400">Decomposition</div>
                            <div className="text-emerald-400 font-bold text-sm">{evaluation.scores?.decomposition}/10</div>
                          </div>
                          <div className="bg-slate-800/80 p-2 rounded">
                            <div className="text-[10px] text-slate-400">Technical</div>
                            <div className="text-emerald-400 font-bold text-sm">{evaluation.scores?.technical}/10</div>
                          </div>
                        </div>
                        {evaluation.feedback && (
                          <div className="text-slate-300 bg-slate-900/60 p-2 rounded text-[11px] border border-slate-800">
                            "{evaluation.feedback}"
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-slate-500 py-8">
                        The interviewer has not finalized your evaluation yet. Focus on solving and communicating your solution!
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center Panel: Collaborative Code Editor */}
        <div className="col-span-6 flex flex-col bg-slate-950 border-r border-slate-800">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-sky-400" />
              <span className="font-medium text-slate-200">Collaborative Workspace</span>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
          </div>

          <div className="flex-1 relative">
            <textarea
              value={code}
              onChange={(e) => updateCode(e.target.value)}
              placeholder="Start coding here..."
              spellCheck="false"
              className="w-full h-full bg-slate-950 p-4 font-mono text-xs text-slate-200 resize-none focus:outline-none border-none leading-relaxed selection:bg-sky-900/50"
            />
          </div>
        </div>

        {/* Right Panel: Video Grid & Live Chat */}
        <div className="col-span-3 flex flex-col bg-slate-900/30">
          {/* Video Grid */}
          <div className="p-3 border-b border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
              <span>Participants</span>
              <span className="text-[11px] text-emerald-400">Live</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Local Video */}
              <div className="relative aspect-video bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-white">
                  You ({role})
                </div>
              </div>

              {/* Remote Video */}
              <div className="relative aspect-video bg-slate-800 rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center">
                {remoteStream ? (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-slate-500 text-[10px] text-center px-1">
                    Waiting for peer...
                  </div>
                )}
                <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-white">
                  Peer
                </div>
              </div>
            </div>

            {/* Media Controls */}
            <div className="flex justify-center gap-2 pt-1">
              <button
                onClick={toggleAudio}
                className={`p-2 rounded-lg text-xs transition ${
                  isAudioMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
                title={isAudioMuted ? 'Unmute Mic' : 'Mute Mic'}
              >
                {isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                onClick={toggleVideo}
                className={`p-2 rounded-lg text-xs transition ${
                  isVideoMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
                title={isVideoMuted ? 'Turn Camera On' : 'Turn Camera Off'}
              >
                {isVideoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-800 text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-sky-400" /> Room Chat
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
              {chatMessages.length === 0 ? (
                <div className="text-slate-500 text-center text-xs py-4">No messages yet.</div>
              ) : (
                chatMessages.map((msg, index) => (
                  <div key={index} className="bg-slate-800/60 p-2 rounded border border-slate-700/50">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mb-0.5">
                      <span className="font-semibold text-sky-300">{msg.senderName}</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <div className="text-slate-200 text-xs">{msg.message}</div>
                  </div>
                ))
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="p-2 border-t border-slate-800 flex gap-1.5 bg-slate-900">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Send message to peer..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                className="p-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

