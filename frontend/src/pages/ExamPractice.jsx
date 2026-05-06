import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Clock, Zap,
  BookOpen, Target, Hash, Check, X, Send, Grid3X3,
  Bookmark, BookmarkCheck, AlertTriangle, Shield, Play,
  Star, BarChart3, Trophy, RotateCcw, Home, Eye,
  ChevronDown, Timer, Calculator, Lightbulb, FileText
} from 'lucide-react';
import { getExamById, getFullExamQuestions, getExamSectionQuestions } from '../data/examData';
import { useTheme } from '../context/ThemeContext';

/* ─── Mini Calculator ──────────────────────────────────────────────────── */
function CalcWidget({ onClose, isLight }) {
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState(null);
  const [op, setOp] = useState(null);
  const [fresh, setFresh] = useState(true);

  const press = (val) => {
    if (val === 'C') { setDisplay('0'); setPrev(null); setOp(null); setFresh(true); return; }
    if (val === '±') { setDisplay(d => String(-parseFloat(d))); return; }
    if (val === '%') { setDisplay(d => String(parseFloat(d) / 100)); return; }
    if (['+', '-', '×', '÷'].includes(val)) {
      setPrev(parseFloat(display)); setOp(val); setFresh(true); return;
    }
    if (val === '=') {
      if (prev !== null && op) {
        const cur = parseFloat(display);
        let res = 0;
        if (op === '+') res = prev + cur;
        else if (op === '-') res = prev - cur;
        else if (op === '×') res = prev * cur;
        else if (op === '÷') res = cur !== 0 ? prev / cur : 'Error';
        setDisplay(String(res)); setPrev(null); setOp(null); setFresh(true);
      }
      return;
    }
    if (fresh) { setDisplay(val === '.' ? '0.' : val); setFresh(false); }
    else { setDisplay(d => d === '0' && val !== '.' ? val : d + val); }
  };
  const btns = ['C', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '=', '='];
  return (
    <div style={{
      position: 'absolute', top: 50, right: 0, width: 260, background: isLight ? '#fff' : '#111',
      border: isLight ? '1px solid rgba(0,0,0,0.12)' : '1px solid #333',
      borderRadius: 12, padding: 12, zIndex: 100,
      boxShadow: 'var(--shadow-md)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: isLight ? '#6b7280' : '#71717a' }}>Calculator</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: isLight ? '#6b7280' : '#71717a', cursor: 'pointer' }}><X size={14} /></button>
      </div>
      <div style={{
        background: isLight ? '#f3f4f6' : '#1a1a1a', borderRadius: 8, padding: '12px 16px', marginBottom: 8,
        fontSize: 24, fontWeight: 700, textAlign: 'right', color: isLight ? '#1a1a2e' : '#fff', fontFamily: 'monospace',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
      }}>{display}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {btns.map((b, i) => (
          <button key={`${b}-${i}`} onClick={() => press(b)} style={{
            padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
            background: b === '=' ? '#818cf8' : ['÷', '×', '-', '+'].includes(b) ? (isLight ? '#e5e7eb' : '#333') : (isLight ? '#fff' : '#1a1a1a'),
            color: b === '=' ? '#fff' : ['÷', '×', '-', '+'].includes(b) ? '#818cf8' : (isLight ? '#1a1a2e' : '#fff'),
          }}>{b}</button>
        ))}
      </div>
    </div>
  );
}

/* ─── Results View ─────────────────────────────────────────────────────── */
function ExamResults({ exam, sectionResults, totalTime, navigate, isLight }) {
  const handleRetryExam = () => {
    window.location.reload();
  };

  const totalMarks = sectionResults.reduce((s, r) => s + r.scored, 0);
  const maxMarks = sectionResults.reduce((s, r) => s + r.maxMarks, 0);
  const totalCorrect = sectionResults.reduce((s, r) => s + r.correct, 0);
  const totalWrong = sectionResults.reduce((s, r) => s + r.wrong, 0);
  const totalSkipped = sectionResults.reduce((s, r) => s + r.skipped, 0);
  const totalQs = sectionResults.reduce((s, r) => s + r.total, 0);
  const percentage = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;
  const passed = percentage >= exam.passingPercent;

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div style={{ minHeight: '100vh', background: isLight ? '#f8f9fa' : '#030303', color: isLight ? '#1a1a2e' : '#fff', padding: '40px 24px 80px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', margin: '0 auto 20px',
            background: passed ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {passed ? <Trophy size={36} style={{ color: '#34d399' }} /> : <AlertTriangle size={36} style={{ color: '#f87171' }} />}
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
            {passed ? 'Congratulations! 🎉' : 'Keep Practicing! 💪'}
          </h1>
          <p style={{ fontSize: 16, color: isLight ? '#6b7280' : '#71717a' }}>
            {exam.title} — {passed ? 'You passed!' : `Need ${exam.passingPercent}% to pass`}
          </p>
        </div>

        {/* Score Card */}
        <div style={{
          background: isLight ? '#fff' : 'rgba(255,255,255,0.03)',
          border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16, padding: 32, marginBottom: 32
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 20, textAlign: 'center' }}>
            {[
              { label: 'Score', value: `${totalMarks}/${maxMarks}`, color: passed ? '#34d399' : '#f87171', icon: <Star size={18} /> },
              { label: 'Percentage', value: `${percentage}%`, color: passed ? '#34d399' : '#f87171', icon: <Target size={18} /> },
              { label: 'Correct', value: totalCorrect, color: '#34d399', icon: <Check size={18} /> },
              { label: 'Wrong', value: totalWrong, color: '#f87171', icon: <X size={18} /> },
              { label: 'Skipped', value: totalSkipped, color: '#facc15', icon: <AlertTriangle size={18} /> },
              { label: 'Time Taken', value: formatTime(totalTime), color: '#818cf8', icon: <Clock size={18} /> },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ color: s.color, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: isLight ? '#6b7280' : '#71717a', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Section Breakdown */}
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Section‑wise Breakdown</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
          {sectionResults.map((r, i) => {
            const secPct = r.maxMarks > 0 ? Math.round((r.scored / r.maxMarks) * 100) : 0;
            return (
              <div key={i} style={{
                padding: '20px 24px', borderRadius: 14,
                background: isLight ? '#fff' : 'rgba(255,255,255,0.03)',
                border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{r.icon}</span>
                    <span style={{ fontWeight: 600 }}>{r.title}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: secPct >= 60 ? '#34d399' : secPct >= 40 ? '#facc15' : '#f87171' }}>
                    {r.scored}/{r.maxMarks} ({secPct}%)
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: isLight ? '#e5e7eb' : '#1a1a1a', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3, transition: 'width 0.8s ease',
                    width: `${secPct}%`,
                    background: secPct >= 60 ? '#34d399' : secPct >= 40 ? '#facc15' : '#f87171'
                  }} />
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12, color: isLight ? '#6b7280' : '#71717a' }}>
                  <span>✅ {r.correct} correct</span>
                  <span>❌ {r.wrong} wrong</span>
                  <span>⏭️ {r.skipped} skipped</span>
                  {r.negativePenalty > 0 && <span style={{ color: '#f87171' }}>−{r.negativePenalty.toFixed(2)} penalty</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/exam-hub')} style={{
            padding: '14px 28px', borderRadius: 12, fontSize: 14, fontWeight: 600,
            background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
            border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.08)',
            color: isLight ? '#374151' : '#d4d4d8', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <Home size={16} /> Back to Exam Hub
          </button>
          <button onClick={handleRetryExam} style={{
            padding: '14px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700,
            background: exam.gradient, color: '#fff', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: `0 4px 15px ${exam.color}30`
          }}>
            <RotateCcw size={16} /> Retry Exam
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ Main ExamPractice Component ═══════════════════════════ */
export default function ExamPractice() {
  const { examId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const mode = searchParams.get('mode') || 'full';          // 'full' | 'section'
  const sectionParam = searchParams.get('section') || null;   // specific section id

  // ── Load exam & questions ──────────────────────────────────────────
  const exam = useMemo(() => getExamById(examId), [examId]);
  const { sections: loadedSections } = useMemo(() => {
    if (!exam) return { sections: [] };
    if (mode === 'section' && sectionParam) {
      const sec = exam.sections.find(s => s.id === sectionParam);
      if (sec) {
        const qs = getExamSectionQuestions(examId, sectionParam);
        return { sections: [{ ...sec, questions: qs }] };
      }
    }
    return getFullExamQuestions(examId);
  }, [exam, examId, mode, sectionParam]);

  // ── State ──────────────────────────────────────────────────────────
  const [started, setStarted] = useState(false);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [answers, setAnswers] = useState({});      // { questionId: 'A'|'B'|'C'|'D' }
  const [bookmarks, setBookmarks] = useState(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [showSectionNav, setShowSectionNav] = useState(false);
  const [sectionTimers, setSectionTimers] = useState({});    // { sectionIdx: secondsRemaining }
  const [totalElapsed, setTotalElapsed] = useState(0);
  const timerRef = useRef(null);

  const sections = loadedSections || [];
  const currentSection = sections[currentSectionIdx];
  const currentQuestions = currentSection?.questions || [];
  const currentQ = currentQuestions[currentQIdx];

  // ── Initialise section timers ──────────────────────────────────────
  useEffect(() => {
    if (sections.length > 0 && Object.keys(sectionTimers).length === 0) {
      const timers = {};
      sections.forEach((s, i) => { timers[i] = s.timeLimit * 60; });
      setSectionTimers(timers);
    }
  }, [sections]);

  // ── Timer tick ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!started || submitted) return;
    timerRef.current = setInterval(() => {
      setTotalElapsed(t => t + 1);
      setSectionTimers(prev => {
        const next = { ...prev };
        const remaining = next[currentSectionIdx];
        if (remaining !== undefined && remaining > 0) {
          next[currentSectionIdx] = remaining - 1;
        } else if (remaining === 0) {
          // Auto-advance to next section if time runs out
          if (currentSectionIdx < sections.length - 1) {
            setTimeout(() => {
              setCurrentSectionIdx(i => i + 1);
              setCurrentQIdx(0);
            }, 0);
          } else {
            // Last section timed out — auto-submit
            setTimeout(() => handleSubmit(), 0);
          }
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [started, submitted, currentSectionIdx, sections.length]);

  // ── Handlers ───────────────────────────────────────────────────────
  const selectAnswer = useCallback((qId, ans) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qId]: ans }));
  }, [submitted]);

  const toggleBookmark = (qId) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      next.has(qId) ? next.delete(qId) : next.add(qId);
      return next;
    });
  };

  const goNext = () => {
    if (currentQIdx < currentQuestions.length - 1) {
      setCurrentQIdx(i => i + 1);
    } else if (currentSectionIdx < sections.length - 1) {
      setCurrentSectionIdx(i => i + 1);
      setCurrentQIdx(0);
    }
  };
  const goPrev = () => {
    if (currentQIdx > 0) {
      setCurrentQIdx(i => i - 1);
    } else if (currentSectionIdx > 0) {
      setCurrentSectionIdx(i => i - 1);
      setCurrentQIdx((sections[currentSectionIdx - 1]?.questions?.length || 1) - 1);
    }
  };

  const handleSubmit = useCallback(() => {
    setSubmitted(true);
    clearInterval(timerRef.current);
  }, []);

  const formatTime = (s) => {
    if (s < 0) s = 0;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  // ── Compute results ────────────────────────────────────────────────
  const sectionResults = useMemo(() => {
    if (!submitted) return [];
    return sections.map(sec => {
      const qs = sec.questions || [];
      let correct = 0, wrong = 0, skipped = 0, negativePenalty = 0;
      qs.forEach(q => {
        if (answers[q.id] === undefined) { skipped++; return; }
        if (answers[q.id] === q.correctAnswer) { correct++; }
        else { wrong++; negativePenalty += (sec.negativePerWrong || 0); }
      });
      const positiveMarks = correct * sec.marksPerQuestion;
      const scored = Math.max(0, positiveMarks - negativePenalty);
      const maxMarks = qs.length * sec.marksPerQuestion;
      return { ...sec, correct, wrong, skipped, negativePenalty, scored, maxMarks, total: qs.length };
    });
  }, [submitted, sections, answers]);

  // ── Guards ─────────────────────────────────────────────────────────
  if (!exam) {
    return (
      <div style={{ minHeight: '100vh', background: isLight ? '#f8f9fa' : '#030303', color: isLight ? '#1a1a2e' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <h2>Exam not found</h2>
        <p style={{ color: isLight ? '#6b7280' : '#71717a' }}>The exam "{examId}" doesn't exist.</p>
        <button onClick={() => navigate('/exam-hub')} className="btn btn-primary">Go to Exam Hub</button>
      </div>
    );
  }

  if (submitted) {
    return <ExamResults exam={exam} sectionResults={sectionResults} totalTime={totalElapsed} navigate={navigate} isLight={isLight} />;
  }

  // ── Start Screen ───────────────────────────────────────────────────
  if (!started) {
    const totalMarks = sections.reduce((s, sec) => s + (sec.questions?.length || sec.questionCount) * sec.marksPerQuestion, 0);
    const totalQs = sections.reduce((s, sec) => s + (sec.questions?.length || sec.questionCount), 0);
    const totalTime = sections.reduce((s, sec) => s + sec.timeLimit, 0);

    return (
      <div style={{ minHeight: '100vh', background: isLight ? '#f8f9fa' : '#030303', color: isLight ? '#1a1a2e' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 600, width: '90%', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{exam.icon}</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{exam.title}</h1>
          <p style={{ color: isLight ? '#6b7280' : '#71717a', marginBottom: 32, fontSize: 15, lineHeight: 1.6 }}>
            {mode === 'section' && sectionParam
              ? `Section-wise practice: ${currentSection?.title}`
              : exam.description
            }
          </p>

          {/* Exam Info */}
          <div style={{
            background: isLight ? '#fff' : 'rgba(255,255,255,0.03)',
            border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16, padding: 24, marginBottom: 32, textAlign: 'left'
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: isLight ? '#6b7280' : '#71717a', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
              Exam Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Total Time', value: `${totalTime} mins`, color: '#818cf8' },
                { label: 'Questions', value: totalQs, color: '#34d399' },
                { label: 'Total Marks', value: totalMarks, color: '#facc15' },
                { label: 'Sections', value: sections.length, color: '#f472b6' },
                { label: 'Negative Marking', value: exam.negativeMarking ? 'Yes' : 'No', color: exam.negativeMarking ? '#f87171' : '#34d399' },
                { label: 'Passing', value: `${exam.passingPercent}%`, color: '#a855f7' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)' }}>
                  <span style={{ fontSize: 13, color: isLight ? '#6b7280' : '#71717a' }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* Section Breakdown */}
            <h3 style={{ fontSize: 14, fontWeight: 700, color: isLight ? '#6b7280' : '#71717a', margin: '24px 0 12px', textTransform: 'uppercase', letterSpacing: 1 }}>
              Sections
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sections.map((sec, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: 8,
                  background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{sec.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{sec.title}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: isLight ? '#6b7280' : '#71717a' }}>
                    <span style={{ color: sec.color }}>{sec.questions?.length || sec.questionCount} Qs</span>
                    <span>{sec.timeLimit} min</span>
                    {sec.negativePerWrong > 0 && <span style={{ color: '#f87171' }}>-{sec.negativePerWrong}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rules */}
          <div style={{
            background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 12, padding: 16, marginBottom: 32, textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#f59e0b', fontWeight: 600, fontSize: 13 }}>
              <AlertTriangle size={14} /> Rules
            </div>
            <ul style={{ fontSize: 13, color: isLight ? '#6b7280' : '#a1a1aa', lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
              <li>Each section has its own timer — once it runs out, you auto-advance.</li>
              <li>You can navigate between questions within a section freely.</li>
              {exam.negativeMarking && <li style={{ color: '#f87171' }}>Wrong answers attract negative marking!</li>}
              <li>Bookmark questions you want to revisit.</li>
              <li>Click "Submit" once you've finished all sections.</li>
            </ul>
          </div>

          {/* Start Button */}
          <button
            onClick={() => setStarted(true)}
            style={{
              padding: '16px 48px', borderRadius: 14, fontSize: 18, fontWeight: 700,
              background: exam.gradient, color: '#fff', border: 'none', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 10,
              boxShadow: `0 6px 25px ${exam.color}40`,
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 30px ${exam.color}50`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 6px 25px ${exam.color}40`; }}
          >
            <Play size={20} /> Start Exam
          </button>

          <button
            onClick={() => navigate('/exam-hub')}
            style={{
              display: 'block', margin: '16px auto 0', background: 'none', border: 'none',
              color: isLight ? '#6b7280' : '#71717a', cursor: 'pointer', fontSize: 13,
              textDecoration: 'underline'
            }}
          >
            ← Back to Exam Hub
          </button>
        </div>
      </div>
    );
  }

  // ── Active Exam View ───────────────────────────────────────────────
  const sectionTimeRemaining = sectionTimers[currentSectionIdx] ?? 0;
  const isTimeWarning = sectionTimeRemaining < 60;
  const isTimeDanger = sectionTimeRemaining < 30;
  const answeredInSection = currentQuestions.filter(q => answers[q.id] !== undefined).length;
  const allAnsweredCount = Object.keys(answers).length;
  const totalQsAll = sections.reduce((s, sec) => s + (sec.questions?.length || 0), 0);

  // Compute global question index for grid
  let globalQIdx = 0;
  for (let i = 0; i < currentSectionIdx; i++) {
    globalQIdx += sections[i]?.questions?.length || 0;
  }
  globalQIdx += currentQIdx;

  return (
    <div style={{ minHeight: '100vh', background: isLight ? '#f8f9fa' : '#030303', color: isLight ? '#1a1a2e' : '#fff' }}>

      {/* ── Top Bar ────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 20px',
        borderBottom: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)',
        background: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50
      }}>
        {/* Left: title & section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => navigate('/exam-hub')} style={{
            background: 'none', border: 'none', color: isLight ? '#6b7280' : '#71717a',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12
          }}>
            <ArrowLeft size={14} /> Exit
          </button>
          <div style={{ height: 20, width: 1, background: isLight ? '#e5e7eb' : '#333' }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{exam.title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: currentSection?.color || exam.color }}>
                {currentSection?.icon} {currentSection?.title}
              </span>
              <span style={{ fontSize: 11, color: isLight ? '#9ca3af' : '#52525b' }}>
                ({currentSectionIdx + 1}/{sections.length})
              </span>
            </div>
          </div>
        </div>

        {/* Right: timer + tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Section timer */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 8,
            background: isTimeDanger ? 'rgba(248,113,113,0.15)' : isTimeWarning ? 'rgba(250,204,21,0.15)' : (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)'),
            fontSize: 15, fontFamily: 'monospace', fontWeight: 700,
            color: isTimeDanger ? '#f87171' : isTimeWarning ? '#facc15' : (isLight ? '#1a1a2e' : '#fff'),
            animation: isTimeDanger ? 'pulse 1s ease-in-out infinite' : 'none'
          }}>
            <Timer size={14} />
            {formatTime(sectionTimeRemaining)}
          </div>

          {/* Progress */}
          <div style={{ fontSize: 12, color: isLight ? '#6b7280' : '#a1a1aa' }}>
            Q{currentQIdx + 1}/{currentQuestions.length}
          </div>

          {/* Tools */}
          <div style={{ display: 'flex', gap: 6, position: 'relative' }}>
            <button onClick={() => setShowCalc(!showCalc)} title="Calculator" style={{
              width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer',
              background: showCalc ? 'rgba(129,140,248,0.2)' : (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)'),
              color: showCalc ? '#818cf8' : (isLight ? '#6b7280' : '#a1a1aa'),
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}><Calculator size={15} /></button>

            <button onClick={() => setShowGrid(!showGrid)} title="Question Grid" style={{
              width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer',
              background: showGrid ? 'rgba(250,204,21,0.2)' : (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)'),
              color: showGrid ? '#facc15' : (isLight ? '#6b7280' : '#a1a1aa'),
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}><Grid3X3 size={15} /></button>

            {showCalc && <CalcWidget onClose={() => setShowCalc(false)} isLight={isLight} />}
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700,
            background: exam.gradient, color: '#fff', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: `0 2px 10px ${exam.color}25`
          }}>
            <Send size={14} /> Submit
          </button>
        </div>
      </div>

      {/* ── Section Progress Bar ───────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 3, padding: '0 20px', marginTop: 2
      }}>
        {sections.map((sec, i) => {
          const secQs = sec.questions || [];
          const secAnswered = secQs.filter(q => answers[q.id] !== undefined).length;
          const pct = secQs.length > 0 ? (secAnswered / secQs.length) * 100 : 0;
          return (
            <div key={i} style={{ flex: 1, cursor: 'pointer' }} onClick={() => { setCurrentSectionIdx(i); setCurrentQIdx(0); }} title={sec.title}>
              <div style={{
                height: 4, borderRadius: 2,
                background: isLight ? '#e5e7eb' : '#1a1a1a', overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%', borderRadius: 2, transition: 'width 0.3s',
                  width: `${pct}%`,
                  background: i === currentSectionIdx ? sec.color : `${sec.color}60`
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Question Grid Overlay ──────────────────────────────────── */}
      {showGrid && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.8)',
          zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setShowGrid(false)}>
          <div style={{
            background: isLight ? '#fff' : '#111', borderRadius: 16, padding: 28,
            maxWidth: 600, width: '90%', maxHeight: '80vh', overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 20, fontSize: 16, fontWeight: 700 }}>Question Navigator</h3>
            {sections.map((sec, sIdx) => (
              <div key={sIdx} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, color: sec.color }}>
                  <span>{sec.icon}</span> {sec.title}
                  <span style={{ fontSize: 11, color: isLight ? '#9ca3af' : '#52525b' }}>
                    ({(sec.questions || []).filter(q => answers[q.id] !== undefined).length}/{(sec.questions || []).length} answered)
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 5 }}>
                  {(sec.questions || []).map((q, qIdx) => {
                    const isAns = answers[q.id] !== undefined;
                    const isBm = bookmarks.has(q.id);
                    const isCur = sIdx === currentSectionIdx && qIdx === currentQIdx;
                    return (
                      <button key={qIdx} onClick={() => { setCurrentSectionIdx(sIdx); setCurrentQIdx(qIdx); setShowGrid(false); }} style={{
                        width: 34, height: 34, borderRadius: 8,
                        border: isCur ? `2px solid ${sec.color}` : (isLight ? '1px solid #d1d5db' : '1px solid #333'),
                        background: isAns ? `${sec.color}20` : 'transparent',
                        color: isCur ? sec.color : isAns ? (isLight ? '#1a1a2e' : '#fff') : (isLight ? '#9ca3af' : '#52525b'),
                        cursor: 'pointer', fontSize: 11, fontWeight: 600, position: 'relative'
                      }}>
                        {qIdx + 1}
                        {isBm && <div style={{ position: 'absolute', top: -2, right: -2, width: 6, height: 6, borderRadius: '50%', background: '#facc15' }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, color: isLight ? '#6b7280' : '#71717a' }}>
              <span>⬜ Unanswered</span> <span>🟪 Answered</span> <span>🟡 Bookmarked</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Question Area ─────────────────────────────────────── */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px 120px' }}>
        {currentQ && (
          <>
            {/* Question Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                  background: `${currentSection?.color || '#818cf8'}15`,
                  color: currentSection?.color || '#818cf8'
                }}>
                  Q{currentQIdx + 1}
                </span>
                {currentQ.difficulty && (
                  <span style={{
                    padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                    background: currentQ.difficulty === 'easy' ? 'rgba(52,211,153,0.15)' : currentQ.difficulty === 'medium' ? 'rgba(250,204,21,0.15)' : 'rgba(248,113,113,0.15)',
                    color: currentQ.difficulty === 'easy' ? '#34d399' : currentQ.difficulty === 'medium' ? '#facc15' : '#f87171'
                  }}>
                    {currentQ.difficulty}
                  </span>
                )}
                <span style={{ fontSize: 12, color: '#facc15' }}>
                  +{currentSection?.marksPerQuestion || 1} mark{(currentSection?.marksPerQuestion || 1) > 1 ? 's' : ''}
                </span>
                {(currentSection?.negativePerWrong || 0) > 0 && (
                  <span style={{ fontSize: 12, color: '#f87171' }}>
                    −{currentSection.negativePerWrong} wrong
                  </span>
                )}
              </div>
              <button
                onClick={() => toggleBookmark(currentQ.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: bookmarks.has(currentQ.id) ? '#facc15' : '#525252' }}
              >
                {bookmarks.has(currentQ.id) ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
              </button>
            </div>

            {/* Question Text */}
            <div style={{
              fontSize: 17, fontWeight: 500, lineHeight: 1.7, marginBottom: 28,
              padding: 24, background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
              borderRadius: 12, border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)'
            }}>
              {currentQ.question}
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
              {(currentQ.options || []).map(opt => {
                const isSelected = answers[currentQ.id] === opt.label;
                let bg = isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)';
                let borderCol = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
                if (isSelected) {
                  bg = `${currentSection?.color || '#818cf8'}15`;
                  borderCol = currentSection?.color || '#818cf8';
                }

                return (
                  <button
                    key={opt.label}
                    onClick={() => selectAnswer(currentQ.id, opt.label)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      padding: '16px 20px', borderRadius: 12,
                      border: `1.5px solid ${borderCol}`, background: bg,
                      cursor: 'pointer', transition: 'all 0.2s',
                      textAlign: 'left', color: isLight ? '#1a1a2e' : '#fff', fontSize: 15
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = `${currentSection?.color || '#818cf8'}50`;
                        e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
                        e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)';
                      }
                    }}
                  >
                    <span style={{
                      width: 34, height: 34, borderRadius: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isSelected ? (currentSection?.color || '#818cf8') : (isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)'),
                      color: isSelected ? '#fff' : (isLight ? '#6b7280' : '#a1a1aa'),
                      fontSize: 13, fontWeight: 700, flexShrink: 0,
                      transition: 'all 0.2s'
                    }}>
                      {opt.label}
                    </span>
                    <span style={{ flex: 1 }}>{opt.value}</span>
                    {isSelected && <Check size={18} style={{ color: currentSection?.color || '#818cf8', flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>

            {/* Clear Answer */}
            {answers[currentQ.id] !== undefined && (
              <button
                onClick={() => setAnswers(prev => { const n = { ...prev }; delete n[currentQ.id]; return n; })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto 32px',
                  background: 'none', border: 'none', color: isLight ? '#9ca3af' : '#52525b',
                  cursor: 'pointer', fontSize: 12, textDecoration: 'underline'
                }}
              >
                <RotateCcw size={12} /> Clear Answer
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Bottom Navigation ──────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '12px 24px',
        background: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(3,3,3,0.95)',
        backdropFilter: 'blur(12px)',
        borderTop: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)',
        zIndex: 40
      }}>
        <button onClick={goPrev} disabled={currentQIdx === 0 && currentSectionIdx === 0} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8,
          background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)', border: 'none',
          color: (currentQIdx === 0 && currentSectionIdx === 0) ? (isLight ? '#d1d5db' : '#333') : (isLight ? '#6b7280' : '#a1a1aa'),
          cursor: (currentQIdx === 0 && currentSectionIdx === 0) ? 'default' : 'pointer', fontSize: 13, fontWeight: 500
        }}>
          <ChevronLeft size={16} /> Previous
        </button>

        {/* Section Jump */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {sections.map((sec, i) => (
            <button key={i} onClick={() => { setCurrentSectionIdx(i); setCurrentQIdx(0); }}
              title={sec.title}
              style={{
                width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 700,
                background: i === currentSectionIdx ? `${sec.color}25` : 'transparent',
                color: i === currentSectionIdx ? sec.color : (isLight ? '#9ca3af' : '#52525b'),
                transition: 'all 0.2s'
              }}
            >
              {sec.icon}
            </button>
          ))}
        </div>

        <button
          onClick={goNext}
          disabled={currentQIdx === currentQuestions.length - 1 && currentSectionIdx === sections.length - 1}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8,
            background: (currentQIdx === currentQuestions.length - 1 && currentSectionIdx === sections.length - 1)
              ? (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)')
              : (currentSection?.color || '#818cf8'),
            border: 'none',
            color: (currentQIdx === currentQuestions.length - 1 && currentSectionIdx === sections.length - 1)
              ? (isLight ? '#d1d5db' : '#333') : '#fff',
            cursor: (currentQIdx === currentQuestions.length - 1 && currentSectionIdx === sections.length - 1) ? 'default' : 'pointer',
            fontSize: 13, fontWeight: 500
          }}
        >
          {currentQIdx === currentQuestions.length - 1 && currentSectionIdx < sections.length - 1
            ? 'Next Section' : 'Next'
          } <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
