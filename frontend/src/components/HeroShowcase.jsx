import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Play, Check, Volume2, Mic, ArrowRight, Loader2, Sparkles, RotateCcw } from 'lucide-react';
import './HeroShowcase.css';

/* ── Full Python code to type out in Coding Round ── */
const CODE_LINES = [
  'def merge_intervals(intervals):',
  '    intervals.sort(key=lambda x: x[0])',
  '    merged = [intervals[0]]',
  '    for start, end in intervals[1:]:',
  '        if start <= merged[-1][1]:',
  '            merged[-1][1] = max(merged[-1][1], end)',
  '        else:',
  '            merged.append([start, end])',
  '    return merged',
];

const CODE_FULL_TEXT = CODE_LINES.join('\n');

/* ── Dialogue lines for Behavioural typing ── */
const BEHAVIOURAL_DIALOGUE = {
  q1: 'Tell me about a project that slipped. What did you decide to cut?',
  a1: 'We dropped offline sync from the first release. It affected 4% of users, and shipping on time unblocked two other teams.',
  q2: 'Who disagreed with that decision, and how did you handle it?',
};

/* ── Step Definitions Matching the Interview Loop ── */
const LOOP_ROUNDS = [
  {
    id: 'oa',
    number: '01',
    badge: 'Online assessment',
    badgeTag: 'Timed · no interviewer',
    title: 'Online assessment',
    description:
      'Timed problems with hidden test cases and no interviewer, the way most companies screen. You see which cases failed and why.',
    linkText: 'Take a timed OA',
    linkUrl: '/code-practice',
  },
  {
    id: 'coding',
    number: '02',
    badge: 'Coding round',
    badgeTag: 'Mid-level · 45 min',
    title: 'Coding round',
    description:
      'Solve a problem out loud in a real code editor and run it against test cases. The interviewer asks about edge cases, complexity and testing while you write.',
    linkText: 'Practise a coding round',
    linkUrl: '/company-interview',
  },
  {
    id: 'system-design',
    number: '03',
    badge: 'System design',
    badgeTag: 'Senior · 45 min',
    title: 'System design',
    description:
      'Design a system on a shared design canvas while you talk through trade-offs, bottlenecks and scaling calculations.',
    linkText: 'Practise system design',
    linkUrl: '/system-design-simulator',
  },
  {
    id: 'behavioural',
    number: '04',
    badge: 'Behavioural and hiring manager',
    badgeTag: 'Senior · 30 min',
    title: 'Behavioural and hiring manager',
    description:
      'Talk through your own projects and decisions. Follow-up questions test ownership, judgement and how you handle disagreement.',
    linkText: 'Practise a behavioural round',
    linkUrl: '/company-interview',
  },
  {
    id: 'report',
    number: '05',
    badge: 'Report',
    badgeTag: 'Target: Senior',
    title: 'Your report',
    description:
      'After each round you get scores against the level you are targeting, with the exact moment each score is based on.',
    linkText: 'Take a round and get your report',
    linkUrl: '/analytics',
  },
];

export default function HeroShowcase() {
  const [activeRound, setActiveRound] = useState(0);
  const [activeSubTab, setActiveSubTab] = useState('code');
  const [demoKey, setDemoKey] = useState(0);

  /* ── Automated Demo States ── */
  // Round 01: OA states
  const [oaCasesVisible, setOaCasesVisible] = useState(0);

  // Round 02: Coding states
  const [typedCodeLength, setTypedCodeLength] = useState(0);
  const [isCodeRunning, setIsCodeRunning] = useState(false);
  const [codeRunPassed, setCodeRunPassed] = useState(false);
  const [typedInterviewerQ, setTypedInterviewerQ] = useState('');

  // Round 03: System design flow states
  const [sysStep, setSysStep] = useState(0);
  const [qpsCounter, setQpsCounter] = useState(120000);

  // Round 04: Behavioural states
  const [typedQ1, setTypedQ1] = useState('');
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [typedA1, setTypedA1] = useState('');
  const [typedQ2, setTypedQ2] = useState('');

  // Round 05: Report states
  const [reportStep, setReportStep] = useState(0);

  // Countdown timer for OA
  const [secondsRemaining, setSecondsRemaining] = useState(3227);
  const stepRefs = useRef([]);
  const isClickScrolling = useRef(false);

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 3600));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  /* ── Reset and trigger demo on round change or manual replay ── */
  const restartDemo = useCallback(() => {
    setDemoKey((k) => k + 1);
  }, []);

  /* ── Automated Demo Controllers ── */
  useEffect(() => {
    let timeouts = [];

    // Helper to safely schedule
    const schedule = (fn, delay) => {
      const id = setTimeout(fn, delay);
      timeouts.push(id);
      return id;
    };

    // ── ROUND 01: OA DEMO ──
    if (activeRound === 0) {
      setOaCasesVisible(0);

      schedule(() => setOaCasesVisible(1), 350);
      schedule(() => setOaCasesVisible(2), 700);
      schedule(() => setOaCasesVisible(3), 1050);
      schedule(() => setOaCasesVisible(4), 1450);
    }

    // ── ROUND 02: CODING DEMO (Auto Code Writing + Run) ──
    else if (activeRound === 1) {
      setTypedCodeLength(0);
      setIsCodeRunning(false);
      setCodeRunPassed(false);
      setTypedInterviewerQ('');

      // Fast, smooth typing animation
      const totalLen = CODE_FULL_TEXT.length;
      let currentLen = 0;
      const stepSize = 4; // characters per tick
      const typingInterval = setInterval(() => {
        currentLen += stepSize;
        if (currentLen >= totalLen) {
          setTypedCodeLength(totalLen);
          clearInterval(typingInterval);

          // Once typing completes, trigger auto run
          schedule(() => {
            setIsCodeRunning(true);
            schedule(() => {
              setIsCodeRunning(false);
              setCodeRunPassed(true);

              // Then type the interviewer question
              const fullQ = 'What happens if the input list is empty?';
              let qLen = 0;
              const qInterval = setInterval(() => {
                qLen += 2;
                if (qLen >= fullQ.length) {
                  setTypedInterviewerQ(fullQ);
                  clearInterval(qInterval);
                } else {
                  setTypedInterviewerQ(fullQ.slice(0, qLen));
                }
              }, 30);
              timeouts.push(qInterval);
            }, 600);
          }, 400);
        } else {
          setTypedCodeLength(currentLen);
        }
      }, 16);
      timeouts.push(typingInterval);
    }

    // ── ROUND 03: SYSTEM DESIGN (Flow Packet Animation) ──
    else if (activeRound === 2) {
      setSysStep(0);
      setQpsCounter(25000);

      // Packet flows through nodes: 0: Clients, 1: LB, 2: Gateway, 3: DB/Cache
      schedule(() => {
        setSysStep(1);
        setQpsCounter(60000);
      }, 500);

      schedule(() => {
        setSysStep(2);
        setQpsCounter(95000);
      }, 1100);

      schedule(() => {
        setSysStep(3);
        setQpsCounter(120000);
      }, 1700);

      // Loop flow subtly
      const loopInterval = setInterval(() => {
        setSysStep(0);
        schedule(() => setSysStep(1), 500);
        schedule(() => setSysStep(2), 1100);
        schedule(() => setSysStep(3), 1700);
      }, 3600);
      timeouts.push(loopInterval);
    }

    // ── ROUND 04: BEHAVIOURAL Q&A TYPING ──
    else if (activeRound === 3) {
      setTypedQ1('');
      setIsUserTyping(false);
      setTypedA1('');
      setTypedQ2('');

      // Type interviewer Q1
      const q1 = BEHAVIOURAL_DIALOGUE.q1;
      let len1 = 0;
      const int1 = setInterval(() => {
        len1 += 3;
        if (len1 >= q1.length) {
          setTypedQ1(q1);
          clearInterval(int1);

          // User thinking indicator then answer
          schedule(() => {
            setIsUserTyping(true);
            schedule(() => {
              setIsUserTyping(false);
              const a1 = BEHAVIOURAL_DIALOGUE.a1;
              let lenA = 0;
              const intA = setInterval(() => {
                lenA += 4;
                if (lenA >= a1.length) {
                  setTypedA1(a1);
                  clearInterval(intA);

                  // Interviewer follow-up Q2
                  schedule(() => {
                    const q2 = BEHAVIOURAL_DIALOGUE.q2;
                    let len2 = 0;
                    const int2 = setInterval(() => {
                      len2 += 3;
                      if (len2 >= q2.length) {
                        setTypedQ2(q2);
                        clearInterval(int2);
                      } else {
                        setTypedQ2(q2.slice(0, len2));
                      }
                    }, 25);
                    timeouts.push(int2);
                  }, 400);
                } else {
                  setTypedA1(a1.slice(0, lenA));
                }
              }, 20);
              timeouts.push(intA);
            }, 600);
          }, 350);
        } else {
          setTypedQ1(q1.slice(0, len1));
        }
      }, 25);
      timeouts.push(int1);
    }

    // ── ROUND 05: REPORT ──
    else if (activeRound === 4) {
      setReportStep(0);
      schedule(() => setReportStep(1), 300);
      schedule(() => setReportStep(2), 650);
      schedule(() => setReportStep(3), 1000);
      schedule(() => setReportStep(4), 1400);
    }

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [activeRound, demoKey]);

  // Synchronize scroll position with active round smoothly
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (isClickScrolling.current) return;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (!stepRefs.current.length) return;
          const viewportCenter = window.innerHeight * 0.48;

          let bestIndex = 0;
          let minDistance = Infinity;

          stepRefs.current.forEach((el, index) => {
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const elementCenter = rect.top + rect.height / 2;
            const distance = Math.abs(elementCenter - viewportCenter);

            if (distance < minDistance) {
              minDistance = distance;
              bestIndex = index;
            }
          });

          setActiveRound(bestIndex);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Jump to step with smooth centering on click
  const scrollToStep = (index) => {
    setActiveRound(index);
    isClickScrolling.current = true;
    const target = stepRefs.current[index];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        isClickScrolling.current = false;
      }, 700);
    }
  };

  const handleManualRunCode = () => {
    setIsCodeRunning(true);
    setTimeout(() => {
      setIsCodeRunning(false);
      setCodeRunPassed(true);
    }, 450);
  };

  const currentRound = LOOP_ROUNDS[activeRound];

  return (
    <section className="mi-loop-section" id="mock-interview-loop">
      {/* Background ambient lighting & grid */}
      <div className="mi-bg-grid" />
      <div className="mi-ambient-glow mi-glow-1" />
      <div className="mi-ambient-glow mi-glow-2" />

      {/* ── Top Header ── */}
      <div className="mi-header-row">
        <div className="mi-header-left">
          <div className="mi-header-badge">
            <Sparkles size={13} className="mi-badge-sparkle" />
            <span>Interactive Interview Simulator · Automated Live Demo</span>
          </div>
          <h2 className="mi-main-title">
            MOCK<br />
            INTERVIEWS
          </h2>
          <p className="mi-main-subtitle">for each round of the loop.</p>
        </div>
        <div className="mi-header-right">
          <p className="mi-header-desc">
            The interviewer speaks with you, asks follow-up questions based on your answers,
            and raises the bar when you answer well. Scroll through a loop.
          </p>
        </div>
      </div>

      {/* ── Mobile Stepper Tabs (Visible on mobile & tablet) ── */}
      <div className="mi-mobile-stepper" role="tablist" aria-label="Interview Loop Rounds">
        {LOOP_ROUNDS.map((r, i) => (
          <button
            key={r.id}
            type="button"
            role="tab"
            aria-selected={activeRound === i}
            className={`mi-mobile-step-btn ${activeRound === i ? 'active' : ''}`}
            onClick={() => scrollToStep(i)}
          >
            <span className="mi-mobile-step-num">{r.number}</span>
            <span className="mi-mobile-step-label">{r.title}</span>
          </button>
        ))}
      </div>

      {/* ── Main Layout: Sticky Left Card + Scrolling Right Steps ── */}
      <div className="mi-loop-layout">
        {/* Left Sticky Column */}
        <div className="mi-sticky-col">
          <div className="mi-card-wrap">
            {/* Ambient Card Backlight */}
            <div className="mi-card-backlight" />

            {/* Stable Card Frame */}
            <div className="mi-card">
              {/* Card Header */}
              <div className="mi-card-header">
                <div className="mi-card-title-group">
                  <span className="mi-card-hand-title">{currentRound.badge}</span>
                  {/* Hand-drawn Ink Underline SVG */}
                  <svg className="mi-ink-underline" viewBox="0 0 140 10" fill="none" preserveAspectRatio="none">
                    <path
                      d="M2 6 C 30 2, 60 9, 90 5 C 110 3, 130 8, 138 4"
                      stroke="#3b49df"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="mi-card-header-right">
                  {/* Live Demo Replay Button */}
                  <button
                    type="button"
                    className="mi-replay-btn"
                    onClick={restartDemo}
                    title="Replay automated demo"
                  >
                    <RotateCcw size={11} />
                    <span>Auto Demo</span>
                  </button>

                  {/* Stepper Dots */}
                  <div className="mi-card-stepper-dots">
                    {LOOP_ROUNDS.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        aria-label={`Go to round ${idx + 1}`}
                        className={`mi-card-dot ${activeRound === idx ? 'active' : ''}`}
                        onClick={() => scrollToStep(idx)}
                      />
                    ))}
                  </div>
                  <div className="mi-card-tag-pill">{currentRound.badgeTag}</div>
                </div>
              </div>

              {/* Dotted Divider */}
              <div className="mi-card-divider" />

              {/* Card Dynamic Body (Smooth Cross-fade) */}
              <div className="mi-card-body" key={`${activeRound}-${demoKey}`}>
                {/* ── ROUND 01: ONLINE ASSESSMENT (Auto Evaluation Demo) ── */}
                {activeRound === 0 && (
                  <div className="mi-oa-content mi-fade-in">
                    <div className="mi-oa-subhead">
                      <span className="mi-oa-problem">Q2 of 3 · Top k frequent elements</span>
                      <span className="mi-oa-timer">{formatTime(secondsRemaining)}</span>
                    </div>

                    {/* Compact Code Preview */}
                    <div className="mi-oa-code-panel">
                      <div className="mi-oa-code-header">
                        <span className="mi-oa-file-label">solution.py</span>
                        <span className="mi-oa-lang-badge">Python 3.11</span>
                      </div>
                      <pre className="mi-oa-code-block">
                        <code>{`def topKFrequent(nums, k):
    # Sorting full map: O(N log N) -> fails large stress test
    counts = Counter(nums)
    return sorted(counts.keys(), key=counts.get, reverse=True)[:k]`}</code>
                      </pre>
                    </div>

                    {/* Test Suite Evaluation */}
                    <div className="mi-oa-cases-card">
                      <div className="mi-oa-cases-header">
                        <span className="mi-oa-cases-title">TEST SUITE EVALUATION</span>
                        <span className="mi-oa-pass-badge">{oaCasesVisible >= 4 ? '14 / 15 Passed' : 'Running suite...'}</span>
                      </div>

                      <div className="mi-oa-cases">
                        <div className={`mi-oa-row ${oaCasesVisible >= 1 ? 'revealed' : 'pending'}`}>
                          <span className="mi-oa-case-name">Case 1 · sample (k=2)</span>
                          {oaCasesVisible >= 1 ? (
                            <span className="mi-oa-status mi-status-pass">PASS</span>
                          ) : (
                            <span className="mi-eval-evaluating">evaluating...</span>
                          )}
                        </div>

                        <div className={`mi-oa-row ${oaCasesVisible >= 2 ? 'revealed' : 'pending'}`}>
                          <span className="mi-oa-case-name">Cases 2–8 · hidden edge cases</span>
                          {oaCasesVisible >= 2 ? (
                            <span className="mi-oa-status mi-status-pass">PASS</span>
                          ) : (
                            <span className="mi-eval-evaluating">{oaCasesVisible === 1 ? 'evaluating...' : 'queued'}</span>
                          )}
                        </div>

                        <div className={`mi-oa-row ${oaCasesVisible >= 3 ? 'revealed' : 'pending'}`}>
                          <span className="mi-oa-case-name">Cases 9–14 · large datasets (N=50,000)</span>
                          {oaCasesVisible >= 3 ? (
                            <span className="mi-oa-status mi-status-pass">PASS</span>
                          ) : (
                            <span className="mi-eval-evaluating">{oaCasesVisible === 2 ? 'evaluating...' : 'queued'}</span>
                          )}
                        </div>

                        <div className={`mi-oa-fail-box ${oaCasesVisible >= 4 ? 'revealed' : 'pending'}`}>
                          <div className="mi-oa-fail-header">
                            <span className="mi-oa-case-name">Case 15 · hidden stress test (N=10⁶)</span>
                            {oaCasesVisible >= 4 ? (
                              <span className="mi-status-tle">TIME LIMIT EXCEEDED</span>
                            ) : (
                              <span className="mi-eval-evaluating">queued</span>
                            )}
                          </div>
                          <div className="mi-oa-fail-detail">
                            {oaCasesVisible >= 4 ? 'Execution time: 2.42 s (Limit: 2.00 s) · Hint: Use O(N log k) Min-Heap' : 'Stress test benchmark...'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── ROUND 02: CODING ROUND (Auto Code Writing & Run Demo) ── */}
                {activeRound === 1 && (
                  <div className="mi-coding-content mi-fade-in">
                    {/* Live Video Feeds */}
                    <div className="mi-video-row">
                      <div className="mi-video-box">
                        <video
                          src="/HannahChenListening.mp4"
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="mi-video-element"
                          poster="/interviewer-avatar.png"
                        />
                        <div className="mi-video-badge">
                          <div className="mi-audio-bars">
                            <span />
                            <span />
                            <span />
                          </div>
                          <span>Senior Interviewer</span>
                        </div>
                      </div>
                      <div className="mi-video-box">
                        <video
                          src="/malelistening.mp4"
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="mi-video-element"
                          poster="/candidate-avatar.png"
                        />
                        <div className="mi-video-badge">
                          <Mic size={10} className="mi-mic-icon" />
                          <span>You (Live coding)</span>
                        </div>
                      </div>
                    </div>

                    {/* Sub-tabs */}
                    <div className="mi-subtabs">
                      <button
                        type="button"
                        className={`mi-subtab ${activeSubTab === 'code' ? 'active' : ''}`}
                        onClick={() => setActiveSubTab('code')}
                      >
                        Code
                      </button>
                      <button
                        type="button"
                        className={`mi-subtab ${activeSubTab === 'canvas' ? 'active' : ''}`}
                        onClick={() => setActiveSubTab('canvas')}
                      >
                        Design canvas
                      </button>
                      <button
                        type="button"
                        className={`mi-subtab ${activeSubTab === 'transcript' ? 'active' : ''}`}
                        onClick={() => setActiveSubTab('transcript')}
                      >
                        Transcript
                      </button>
                    </div>

                    {/* Sub-tab view: Code Editor with Typewriter */}
                    {activeSubTab === 'code' && (
                      <div className="mi-editor-panel">
                        <div className="mi-editor-topbar">
                          <span className="mi-editor-filename">solution.py · Python</span>
                          <button
                            type="button"
                            className={`mi-editor-run-btn ${isCodeRunning ? 'running' : ''}`}
                            onClick={handleManualRunCode}
                          >
                            {isCodeRunning ? (
                              <Loader2 size={11} className="mi-spin" />
                            ) : (
                              <Play size={10} fill="currentColor" />
                            )}
                            <span>{isCodeRunning ? 'Running...' : 'Run'}</span>
                          </button>
                        </div>

                        <div className="mi-code-with-lines">
                          <div className="mi-line-numbers">
                            {Array.from({ length: 9 }).map((_, i) => (
                              <span key={i}>{i + 1}</span>
                            ))}
                          </div>
                          <pre className="mi-editor-code">
                            <code>
                              {CODE_FULL_TEXT.slice(0, typedCodeLength)}
                              {typedCodeLength < CODE_FULL_TEXT.length && (
                                <span className="mi-typing-cursor">|</span>
                              )}
                            </code>
                          </pre>
                        </div>

                        <div className="mi-editor-status">
                          <span className="mi-status-pass-text">
                            {isCodeRunning ? (
                              <span className="mi-status-eval">Running 3 test suites...</span>
                            ) : codeRunPassed || typedCodeLength >= CODE_FULL_TEXT.length ? (
                              <>
                                <Check size={12} strokeWidth={3} /> ✓ 3 / 3 sample cases passed
                              </>
                            ) : (
                              <span className="mi-status-eval">Authoring solution...</span>
                            )}
                          </span>
                          <span className="mi-editor-time">38 ms</span>
                        </div>
                      </div>
                    )}

                    {/* Sub-tab view: Design canvas */}
                    {activeSubTab === 'canvas' && (
                      <div className="mi-editor-panel mi-canvas-mini">
                        <div className="mi-canvas-intervals">
                          <div className="mi-interval-row">
                            <span className="mi-int-label">Input</span>
                            <div className="mi-int-bars">
                              <span className="mi-int-bar" style={{ width: '40%', left: '10%' }}>[1, 3]</span>
                              <span className="mi-int-bar" style={{ width: '50%', left: '30%' }}>[2, 6]</span>
                              <span className="mi-int-bar" style={{ width: '30%', left: '70%' }}>[8, 10]</span>
                            </div>
                          </div>
                          <div className="mi-interval-row">
                            <span className="mi-int-label">Merged</span>
                            <div className="mi-int-bars">
                              <span className="mi-int-bar merged" style={{ width: '60%', left: '10%' }}>[1, 6]</span>
                              <span className="mi-int-bar merged" style={{ width: '30%', left: '70%' }}>[8, 10]</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sub-tab view: Transcript */}
                    {activeSubTab === 'transcript' && (
                      <div className="mi-transcript-mini">
                        <div className="mi-mini-t-row">
                          <span className="mi-mini-speaker">INTERVIEWER</span>
                          <p>Let&apos;s start by discussing the edge cases for empty or single-element inputs.</p>
                        </div>
                        <div className="mi-mini-t-row">
                          <span className="mi-mini-speaker you">YOU</span>
                          <p>If the array has length &le; 1, we can return it immediately with O(1) time complexity.</p>
                        </div>
                      </div>
                    )}

                    {/* Interviewer Question Prompt with Typewriter */}
                    <div className="mi-interviewer-box">
                      <div className="mi-interviewer-label">INTERVIEWER</div>
                      <p className="mi-interviewer-text">
                        {typedInterviewerQ || (codeRunPassed ? 'What happens if the input list is empty?' : 'Observing implementation approach...')}
                        {typedInterviewerQ && typedInterviewerQ.length < 38 && (
                          <span className="mi-typing-cursor">|</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* ── ROUND 03: SYSTEM DESIGN (Auto Flow & Packet Demo) ── */}
                {activeRound === 2 && (
                  <div className="mi-sysdesign-content mi-fade-in">
                    {/* Top Webcam/Participant Bar */}
                    <div className="mi-video-row">
                      <div className="mi-video-box">
                        <video
                          src="/HannahChenListening.mp4"
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="mi-video-element"
                          poster="/interviewer-avatar.png"
                        />
                        <div className="mi-video-badge">
                          <Volume2 size={10} />
                          <span>Staff Architect</span>
                        </div>
                      </div>
                      <div className="mi-video-box">
                        <video
                          src="/malelistening.mp4"
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="mi-video-element"
                          poster="/candidate-avatar.png"
                        />
                        <div className="mi-video-badge">
                          <Mic size={10} />
                          <span>You (Explaining flow)</span>
                        </div>
                      </div>
                    </div>

                    {/* Sub-tabs */}
                    <div className="mi-subtabs">
                      <button type="button" className="mi-subtab">Code</button>
                      <button type="button" className="mi-subtab active">Design canvas</button>
                      <button type="button" className="mi-subtab">Transcript</button>
                    </div>

                    {/* Design Canvas Visual with Animated Flow Packets */}
                    <div className="mi-canvas-preview">
                      <div className="mi-canvas-nodes">
                        <div className={`mi-node mi-node-client ${sysStep >= 0 ? 'node-active' : ''}`}>
                          <span className="mi-node-icon">📱</span>
                          <span>Clients</span>
                          {sysStep === 0 && <span className="mi-node-pulse" />}
                        </div>
                        <span className={`mi-node-arrow ${sysStep >= 1 ? 'arrow-active' : ''}`}>→</span>
                        <div className={`mi-node mi-node-lb ${sysStep >= 1 ? 'node-active' : ''}`}>
                          <span className="mi-node-icon">⚖️</span>
                          <span>Load Balancer</span>
                          {sysStep === 1 && <span className="mi-node-pulse" />}
                        </div>
                        <span className={`mi-node-arrow ${sysStep >= 2 ? 'arrow-active' : ''}`}>→</span>
                        <div className={`mi-node mi-node-api ${sysStep >= 2 ? 'node-active' : ''}`}>
                          <span className="mi-node-icon">⚡</span>
                          <span>API Gateway</span>
                          {sysStep === 2 && <span className="mi-node-pulse" />}
                        </div>
                      </div>

                      <div className="mi-canvas-branches">
                        <div className={`mi-branch-box ${sysStep >= 3 ? 'branch-active cache' : ''}`}>
                          <div className="mi-branch-header">
                            <span className="mi-branch-title">Redis Cluster</span>
                            {sysStep >= 3 && <span className="mi-hit-badge">CACHE HIT 99.4%</span>}
                          </div>
                          <div className="mi-branch-detail">In-Memory Cache · Hot Key Ring Buffer</div>
                        </div>
                        <div className={`mi-branch-box ${sysStep >= 3 ? 'branch-active db' : ''}`}>
                          <div className="mi-branch-header">
                            <span className="mi-branch-title">PostgreSQL Primary</span>
                            {sysStep >= 3 && <span className="mi-sync-badge">3 REPLICAS SYNCED</span>}
                          </div>
                          <div className="mi-branch-detail">Sharded by user_id with WAL replication</div>
                        </div>
                      </div>

                      <div className="mi-canvas-metrics">
                        <span className="mi-metric-counter">{qpsCounter.toLocaleString()} QPS</span>
                        <span>·</span>
                        <span>P99: 18ms</span>
                        <span>·</span>
                        <span className="mi-metric-uptime">99.99% Availability</span>
                      </div>
                    </div>

                    {/* Interviewer Question Prompt */}
                    <div className="mi-interviewer-box">
                      <div className="mi-interviewer-label">INTERVIEWER</div>
                      <p className="mi-interviewer-text">
                        How do you handle cache invalidation when a write fails halfway?
                      </p>
                    </div>
                  </div>
                )}

                {/* ── ROUND 04: BEHAVIOURAL (Auto Q&A Typing Dialogue) ── */}
                {activeRound === 3 && (
                  <div className="mi-behavioural-content mi-fade-in">
                    {/* Live Video Row */}
                    <div className="mi-video-row">
                      <div className="mi-video-box">
                        <video
                          src="/HannahChenListening.mp4"
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="mi-video-element"
                          poster="/interviewer-avatar.png"
                        />
                        <div className="mi-video-badge">
                          <div className="mi-audio-bars">
                            <span />
                            <span />
                            <span />
                          </div>
                          <span>Jasmine · Engineering Manager</span>
                        </div>
                      </div>
                      <div className="mi-video-box">
                        <video
                          src="/malelistening.mp4"
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="mi-video-element"
                          poster="/candidate-avatar.png"
                        />
                        <div className="mi-video-badge">
                          <Mic size={10} />
                          <span>You (Speaking)</span>
                        </div>
                      </div>
                    </div>

                    {/* Sub-tabs */}
                    <div className="mi-subtabs">
                      <button type="button" className="mi-subtab">Code</button>
                      <button type="button" className="mi-subtab">Design canvas</button>
                      <button type="button" className="mi-subtab active">Transcript</button>
                    </div>

                    {/* Auto-Typing Dialogue Transcript */}
                    <div className="mi-transcript-panel">
                      {typedQ1 && (
                        <div className="mi-transcript-row mi-dialogue-fade">
                          <span className="mi-t-time">03:12</span>
                          <div className="mi-t-body">
                            <div className="mi-t-speaker mi-speaker-interviewer">INTERVIEWER</div>
                            <p className="mi-t-msg">
                              {typedQ1}
                              {typedQ1.length < BEHAVIOURAL_DIALOGUE.q1.length && (
                                <span className="mi-typing-cursor">|</span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}

                      {isUserTyping && (
                        <div className="mi-typing-indicator-row">
                          <span className="mi-t-time">03:38</span>
                          <div className="mi-typing-bubble">
                            <span />
                            <span />
                            <span />
                          </div>
                        </div>
                      )}

                      {typedA1 && (
                        <div className="mi-transcript-row mi-dialogue-fade">
                          <span className="mi-t-time">03:40</span>
                          <div className="mi-t-body">
                            <div className="mi-t-speaker mi-speaker-you">YOU</div>
                            <p className="mi-t-msg">
                              {typedA1}
                              {typedA1.length < BEHAVIOURAL_DIALOGUE.a1.length && (
                                <span className="mi-typing-cursor">|</span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}

                      {typedQ2 && (
                        <div className="mi-transcript-row mi-dialogue-fade">
                          <span className="mi-t-time">04:31</span>
                          <div className="mi-t-body">
                            <div className="mi-t-speaker mi-speaker-interviewer">INTERVIEWER</div>
                            <p className="mi-t-msg">
                              {typedQ2}
                              {typedQ2.length < BEHAVIOURAL_DIALOGUE.q2.length && (
                                <span className="mi-typing-cursor">|</span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── ROUND 05: YOUR REPORT (Auto Score Reveal Demo) ── */}
                {activeRound === 4 && (
                  <div className="mi-report-content mi-fade-in">
                    <div className="mi-report-rows">
                      <div className={`mi-report-row ${reportStep >= 1 ? 'revealed' : 'pending'}`}>
                        <span className="mi-report-name">Requirements and scope</span>
                        {reportStep >= 1 ? (
                          <span className="mi-report-pill mi-pill-blue">AT BAR</span>
                        ) : (
                          <span className="mi-eval-evaluating">assessing...</span>
                        )}
                      </div>

                      <div className={`mi-report-row ${reportStep >= 2 ? 'revealed' : 'pending'}`}>
                        <span className="mi-report-name">Trade-offs</span>
                        {reportStep >= 2 ? (
                          <span className="mi-report-pill mi-pill-green">ABOVE BAR</span>
                        ) : (
                          <span className="mi-eval-evaluating">assessing...</span>
                        )}
                      </div>

                      <div className={`mi-report-row ${reportStep >= 3 ? 'revealed' : 'pending'}`}>
                        <span className="mi-report-name">Capacity estimates</span>
                        {reportStep >= 3 ? (
                          <span className="mi-report-pill mi-pill-orange">BELOW BAR</span>
                        ) : (
                          <span className="mi-eval-evaluating">assessing...</span>
                        )}
                      </div>

                      <div className={`mi-report-row ${reportStep >= 4 ? 'revealed' : 'pending'}`}>
                        <span className="mi-report-name">Communication</span>
                        {reportStep >= 4 ? (
                          <span className="mi-report-pill mi-pill-blue">AT BAR</span>
                        ) : (
                          <span className="mi-eval-evaluating">assessing...</span>
                        )}
                      </div>
                    </div>

                    {/* Next Action Box */}
                    <div className={`mi-next-action-box ${reportStep >= 4 ? 'revealed' : 'pending'}`}>
                      <div className="mi-next-label">next, practise this →</div>
                      <p className="mi-next-text">
                        Practise back-of-envelope estimates, then retake the system design round.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Scrollable Column with Continuous Timeline */}
        <div className="mi-steps-col">
          <div className="mi-timeline-rail">
            <div
              className="mi-timeline-glow-pill"
              style={{
                top: `${(activeRound / (LOOP_ROUNDS.length - 1)) * 88}%`,
              }}
            />
          </div>

          {LOOP_ROUNDS.map((step, index) => {
            const isActive = activeRound === index;
            return (
              <div
                key={step.id}
                ref={(el) => (stepRefs.current[index] = el)}
                className={`mi-step-item ${isActive ? 'active' : ''}`}
                onClick={() => scrollToStep(index)}
              >
                <div className="mi-step-num-col">
                  <div className="mi-step-num-pill">{step.number}</div>
                </div>
                <div className="mi-step-content">
                  <h3 className="mi-step-title">{step.title}</h3>
                  <p className="mi-step-desc">{step.description}</p>
                  <Link
                    to={step.linkUrl}
                    className="mi-step-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>{step.linkText}</span>
                    <ArrowRight size={14} className="mi-link-arrow" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
