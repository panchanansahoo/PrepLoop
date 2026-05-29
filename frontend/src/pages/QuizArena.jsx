import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  PlayCircle,
  Zap,
  Target,
  Timer,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { buildAuthHeaders } from '../utils/authHeaders';
import { authFetch } from '../utils/authFetch';
import { buildApiUrl } from '../utils/safeApiUrl';
import { API_URL } from '../config/api.js';
import './QuizArena.css';

const rawApiUrl = API_URL.trim();
let API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl.slice(0, -4) : rawApiUrl.replace(/\/$/, '');

// Fix for mobile testing: if API is localhost but we are accessing via local IP
if (API_BASE_URL.includes('localhost') && typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
  API_BASE_URL = API_BASE_URL.replace('localhost', window.location.hostname);
}

function buildQuizApiUrl(path) {
  return buildApiUrl(path, { rawBaseUrl: API_BASE_URL, apiPrefix: '/api' });
}

const QUIZ_BANK = {
  dsa: {
    label: 'DSA',
    icon: '🧮',
    questions: [
      { question: 'Which data structure is best for BFS traversal?', options: ['Stack', 'Queue', 'Priority Queue', 'Hash Map'], answer: 'Queue' },
      { question: 'Average time complexity of hash table lookup is:', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], answer: 'O(1)' },
      { question: 'A min-heap guarantees:', options: ['Parent <= children', 'Parent >= children', 'Array is sorted', 'Balanced BST structure'], answer: 'Parent <= children' },
      { question: 'Two pointers are most commonly used in:', options: ['Graph coloring', 'Array/string scanning', 'Heapify', 'Topological sort'], answer: 'Array/string scanning' },
      { question: 'Which traversal of BST gives sorted order?', options: ['Preorder', 'Postorder', 'Inorder', 'Level order'], answer: 'Inorder' },
    ],
  },
  db: {
    label: 'DBMS',
    icon: '🗄️',
    questions: [
      { question: 'Which normal form removes transitive dependency?', options: ['1NF', '2NF', '3NF', 'BCNF'], answer: '3NF' },
      { question: 'A clustered index determines:', options: ['Logical order only', 'Physical row order', 'Foreign key constraints', 'Transaction log order'], answer: 'Physical row order' },
      { question: 'ACID property for consistency means:', options: ['No locks needed', 'Transactions preserve valid state', 'Reads are always non-blocking', 'Data is always compressed'], answer: 'Transactions preserve valid state' },
      { question: 'Which join returns only matching rows?', options: ['LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN', 'INNER JOIN'], answer: 'INNER JOIN' },
      { question: 'A deadlock happens when:', options: ['Two txns wait forever on each other', 'Query uses full scan', 'Index is missing', 'DB restarts'], answer: 'Two txns wait forever on each other' },
    ],
  },
  'system-design': {
    label: 'System Design',
    icon: '🏗️',
    questions: [
      { question: 'A load balancer primarily helps with:', options: ['Data encryption', 'Traffic distribution', 'Schema migration', 'Code compilation'], answer: 'Traffic distribution' },
      { question: 'Eventual consistency is common in:', options: ['Strong single-node systems', 'Distributed systems', 'CPU cache lines', 'Static websites only'], answer: 'Distributed systems' },
      { question: 'Redis is most commonly used as a:', options: ['Long-term archive', 'In-memory cache', 'Compiler', 'Container runtime'], answer: 'In-memory cache' },
      { question: 'CDN mainly improves:', options: ['Latency for static assets', 'SQL joins', 'Thread scheduling', 'Version control'], answer: 'Latency for static assets' },
      { question: 'Horizontal scaling means:', options: ['Bigger single machine', 'More machines', 'More database tables', 'Longer timeouts'], answer: 'More machines' },
    ],
  },
  language: {
    label: 'Languages',
    icon: '💻',
    questions: [
      { question: 'In most languages, recursion needs:', options: ['A base case', 'A SQL query', 'A class only', 'A global variable'], answer: 'A base case' },
      { question: 'Strong typing means:', options: ['No runtime errors', 'Strict enforcement of type rules', 'Only integers allowed', 'No compiler needed'], answer: 'Strict enforcement of type rules' },
      { question: 'Garbage collection handles:', options: ['Network retries', 'Automatic memory reclamation', 'Thread locks', 'File compression'], answer: 'Automatic memory reclamation' },
      { question: 'Immutable objects are useful for:', options: ['Safer shared state', 'Faster disk I/O by default', 'Removing all bugs', 'Avoiding APIs'], answer: 'Safer shared state' },
      { question: 'A compiler generally translates:', options: ['Source code to machine-level output', 'SQL to JSON', 'Binary to comments', 'HTML to DNS'], answer: 'Source code to machine-level output' },
    ],
  },
  os: {
    label: 'Operating Systems',
    icon: '⚙️',
    questions: [
      { question: 'Context switch occurs when OS:', options: ['Changes monitor brightness', 'Switches CPU from one process/thread to another', 'Drops DB indexes', 'Compiles kernel modules'], answer: 'Switches CPU from one process/thread to another' },
      { question: 'Virtual memory allows:', options: ['Unlimited real RAM', 'Using disk as logical memory extension', 'Faster internet', 'No page faults'], answer: 'Using disk as logical memory extension' },
      { question: 'A semaphore is used for:', options: ['Syntax parsing', 'Process synchronization', 'Image rendering', 'DNS caching'], answer: 'Process synchronization' },
      { question: 'Round-robin scheduling is known for:', options: ['Fair time slicing', 'Always minimal waiting time', 'No context switching', 'Only batch jobs'], answer: 'Fair time slicing' },
      { question: 'Deadlock prevention can be done by:', options: ['Breaking at least one Coffman condition', 'Adding more threads only', 'Removing logging', 'Increasing file size'], answer: 'Breaking at least one Coffman condition' },
    ],
  },
  cn: {
    label: 'Networks',
    icon: '🌐',
    questions: [
      { question: 'TCP provides:', options: ['Best-effort unreliable delivery', 'Reliable connection-oriented delivery', 'No flow control', 'Broadcast-only transport'], answer: 'Reliable connection-oriented delivery' },
      { question: 'DNS resolves:', options: ['Ports to protocols', 'Domain names to IP addresses', 'Packets to frames', 'Keys to certificates'], answer: 'Domain names to IP addresses' },
      { question: 'HTTP is typically an application-layer protocol over:', options: ['UDP only', 'TCP', 'ICMP', 'ARP'], answer: 'TCP' },
      { question: 'In the OSI model, routing is mainly at:', options: ['Data Link layer', 'Network layer', 'Transport layer', 'Presentation layer'], answer: 'Network layer' },
      { question: 'Latency is primarily:', options: ['Amount of data transferred', 'Time delay in communication', 'Packet encryption level', 'Number of users'], answer: 'Time delay in communication' },
    ],
  },
  oop: {
    label: 'OOP',
    icon: '🔷',
    questions: [
      { question: 'Encapsulation means:', options: ['Combining data and methods in one unit', 'Using only inheritance', 'Avoiding classes', 'Making everything public'], answer: 'Combining data and methods in one unit' },
      { question: 'Polymorphism allows:', options: ['One interface, multiple implementations', 'One class only', 'No methods', 'No constructors'], answer: 'One interface, multiple implementations' },
      { question: 'Inheritance helps with:', options: ['Code reuse and hierarchy', 'Database replication', 'Network congestion control', 'Disk partitioning'], answer: 'Code reuse and hierarchy' },
      { question: 'Abstraction focuses on:', options: ['Exposing essential behavior, hiding details', 'Showing all internals', 'Removing methods', 'Only using static variables'], answer: 'Exposing essential behavior, hiding details' },
      { question: 'Method overloading is:', options: ['Same method name with different signatures', 'Replacing superclass method only', 'Calling private methods from everywhere', 'Creating infinite recursion'], answer: 'Same method name with different signatures' },
    ],
  },
};

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
const DAILY_QUESTION_COUNT = 10;

function formatDuration(totalSeconds) {
  const safe = Math.max(0, Number(totalSeconds || 0));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function calculateScore(questions, answers) {
  return questions.reduce((total, q, i) => {
    return answers[i] === q.answer ? total + 1 : total;
  }, 0);
}

function hashSeed(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickUniqueDeterministic(pool, count, seedText) {
  if (!Array.isArray(pool) || pool.length === 0 || count <= 0) return [];

  const usedIndexes = new Set();
  const usedQuestions = new Set();
  const picked = [];
  let seed = hashSeed(seedText) % pool.length;
  let step = (hashSeed(`${seedText}-step`) % pool.length) + 1;

  if (pool.length > 1) {
    while (step % pool.length === 0) {
      step = (step + 1) % pool.length || 1;
    }
  }

  while (picked.length < count && usedIndexes.size < pool.length) {
    const candidate = pool[seed];
    if (!usedIndexes.has(seed) && candidate && !usedQuestions.has(candidate.question)) {
      usedIndexes.add(seed);
      usedQuestions.add(candidate.question);
      picked.push(candidate);
    } else {
      usedIndexes.add(seed);
    }
    seed = (seed + step) % pool.length;
  }

  return picked;
}

function buildDailyQuestions(topicKey, dayKey) {
  const selectedTopicQuestions = QUIZ_BANK[topicKey]?.questions || [];
  const otherQuestions = Object.entries(QUIZ_BANK)
    .filter(([key]) => key !== topicKey)
    .flatMap(([, value]) => value.questions || []);

  const topicTarget = Math.min(6, selectedTopicQuestions.length, DAILY_QUESTION_COUNT);
  const fromTopic = pickUniqueDeterministic(
    selectedTopicQuestions,
    topicTarget,
    `${dayKey}:${topicKey}:topic`
  );

  const neededFromOther = DAILY_QUESTION_COUNT - fromTopic.length;
  const fromOthers = neededFromOther > 0
    ? pickUniqueDeterministic(otherQuestions, neededFromOther, `${dayKey}:${topicKey}:mixed`)
    : [];

  const combined = [...fromTopic, ...fromOthers];

  const deduped = [];
  const seen = new Set();
  combined.forEach((q) => {
    if (q && !seen.has(q.question)) {
      seen.add(q.question);
      deduped.push(q);
    }
  });

  if (deduped.length < DAILY_QUESTION_COUNT) {
    const fullPool = Object.values(QUIZ_BANK).flatMap((entry) => entry.questions || []);
    const fallback = pickUniqueDeterministic(
      fullPool,
      DAILY_QUESTION_COUNT - deduped.length,
      `${dayKey}:${topicKey}:fallback`
    );
    fallback.forEach((q) => {
      if (q && !seen.has(q.question)) {
        seen.add(q.question);
        deduped.push(q);
      }
    });
  }

  return deduped.slice(0, DAILY_QUESTION_COUNT);
}

function MedalForRank({ rank }) {
  if (rank === 1) return <span className="qa-lb-medal">🥇</span>;
  if (rank === 2) return <span className="qa-lb-medal">🥈</span>;
  if (rank === 3) return <span className="qa-lb-medal">🥉</span>;
  return <span className="qa-lb-rank-cell">#{rank}</span>;
}

export default function QuizArena() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const m = isLight ? 'light' : 'dark';
  const advanceTimeoutRef = useRef(null);

  const [topic, setTopic] = useState('dsa');
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [elapsed, setElapsed] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [answerFeedback, setAnswerFeedback] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const selectedQuiz = QUIZ_BANK[topic];
  const todayKey = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const mth = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${mth}-${d}`;
  }, []);

  const questions = useMemo(() => buildDailyQuestions(topic, todayKey), [topic, todayKey]);

  useEffect(() => {
    if (!started || submitted) return undefined;
    const timer = setInterval(() => {
      setElapsed((value) => value + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [started, submitted]);

  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current);
      }
    };
  }, []);

  const score = useMemo(() => calculateScore(questions, answers), [answers, questions]);
  const attemptedCount = useMemo(() => Object.keys(answers).length, [answers]);

  const accuracy = useMemo(() => {
    if (!attemptedCount) return 0;
    return Number(((score / attemptedCount) * 100).toFixed(1));
  }, [score, attemptedCount]);

  const completionStatus = useMemo(() => {
    return accuracy >= 70 ? 'Pass' : 'Review';
  }, [accuracy]);

  const currentQuestion = questions[index] || null;
  const progressPercent = questions.length ? ((index + (submitted ? 1 : 0)) / questions.length) * 100 : 0;

  const loadLeaderboard = async (topicId = topic) => {
    setLoadingLeaderboard(true);
    try {
      const response = await authFetch(buildQuizApiUrl(`/user/quiz-leaderboard?topic=${encodeURIComponent(topicId)}&limit=8`));

      if (!response.ok) {
        setLeaderboard([]);
        setCurrentUserRank(null);
        return;
      }

      const data = await response.json();
      setLeaderboard(Array.isArray(data?.leaderboard) ? data.leaderboard : []);
      setCurrentUserRank(Number.isFinite(data?.currentUserRank) ? data.currentUserRank : null);
    } catch (error) {
      setLeaderboard([]);
      setCurrentUserRank(null);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    loadLeaderboard(topic);
  }, [topic]);

  const handleStart = () => {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
    }
    setStarted(true);
    setSubmitted(false);
    setAnswers({});
    setIndex(0);
    setElapsed(0);
    setIsTransitioning(false);
    setAnswerFeedback(null);
    setSaveMessage('');
  };

  const handleTopicChange = (nextTopic) => {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
    }
    setTopic(nextTopic);
    setStarted(false);
    setSubmitted(false);
    setAnswers({});
    setIndex(0);
    setElapsed(0);
    setIsTransitioning(false);
    setAnswerFeedback(null);
    setSaveMessage('');
  };

  const finalizeAttempt = async (finalAnswers) => {
    const finalAttemptedCount = Object.keys(finalAnswers).length;
    const finalScore = calculateScore(questions, finalAnswers);

    setSubmitted(true);

    const headers = buildAuthHeaders();

    if (!headers.Authorization) {
      setSaveMessage('Login to save your quiz score to leaderboard.');
      await loadLeaderboard(topic);
      return;
    }

    setSaving(true);
    setSaveMessage('');

    try {
      const response = await authFetch(`${API_BASE_URL}/api/user/quiz/attempt`, {
        method: 'POST',
        body: JSON.stringify({
          topic,
          score: finalScore,
          totalQuestions: finalAttemptedCount,
          durationSeconds: elapsed,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSaveMessage(data?.error || 'Could not save quiz score.');
      } else {
        setSaveMessage('Quiz completed. Score saved!');
      }

      await loadLeaderboard(topic);
    } catch (error) {
      setSaveMessage('Could not save quiz score.');
    } finally {
      setSaving(false);
    }
  };

  const handleAnswerSelect = async (option) => {
    if (submitted || !currentQuestion || isTransitioning) return;

    const nextAnswers = { ...answers, [index]: option };
    const isCorrect = option === currentQuestion.answer;
    setAnswers(nextAnswers);
    setAnswerFeedback({
      questionIndex: index,
      isCorrect,
      selected: option,
      correctAnswer: currentQuestion.answer,
      note:
        currentQuestion.note ||
        `Focus on why "${currentQuestion.answer}" is correct before moving ahead.`,
    });

    if (!isCorrect) {
      setIsTransitioning(true);
      advanceTimeoutRef.current = setTimeout(() => {
        if (index >= questions.length - 1) {
          finalizeAttempt(nextAnswers);
          return;
        }
        setIndex((value) => value + 1);
        setAnswerFeedback(null);
        setIsTransitioning(false);
      }, 900);
      return;
    }

    if (index >= questions.length - 1) {
      await finalizeAttempt(nextAnswers);
      return;
    }

    setIsTransitioning(true);
    advanceTimeoutRef.current = setTimeout(() => {
      setIndex((value) => value + 1);
      setAnswerFeedback(null);
      setIsTransitioning(false);
    }, 850);
  };

  /* ───────── Render ───────── */
  return (
    <div className={`qa-page qa-page--${m}`}>
      <div className="qa-container">

        {/* ═══ Hero Header ═══ */}
        <section className={`qa-hero qa-hero--${m}`}>
          <div className="qa-hero__top">
            <div>
              <h1 className="qa-hero__title">⚡ Quiz Arena</h1>
              <p className="qa-hero__subtitle">
                Daily quiz mode — 10 different questions each day with instant right/wrong feedback.
              </p>
            </div>
            <div className={`qa-timer qa-timer--${m} ${started && !submitted ? 'qa-timer--active' : ''}`}>
              <Clock size={18} className="qa-timer__icon" />
              {formatDuration(elapsed)}
            </div>
          </div>

          {/* Topic pills */}
          <div className="qa-topics">
            {Object.entries(QUIZ_BANK).map(([id, item]) => (
              <button
                key={id}
                type="button"
                onClick={() => handleTopicChange(id)}
                className={`qa-topic-btn qa-topic-btn--${m} ${topic === id ? 'qa-topic-btn--active' : ''}`}
              >
                <span style={{ marginRight: 6 }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="qa-actions">
            <button type="button" onClick={handleStart} className="qa-btn-start">
              <PlayCircle size={18} />
              Start {selectedQuiz.label} Quiz
            </button>
            <button
              type="button"
              onClick={() => loadLeaderboard(topic)}
              className={`qa-btn-refresh qa-btn-refresh--${m}`}
            >
              <RefreshCw size={15} />
              Refresh Board
            </button>
          </div>
        </section>

        {/* ═══ Main 2-column grid ═══ */}
        <div className="qa-main-grid">

          {/* ─── Left: Question Card ─── */}
          <section className={`qa-card qa-card--${m} qa-question-card`}>

            {/* Idle state */}
            {!started && (
              <div className="qa-idle-msg">
                <div className={`qa-idle-icon qa-idle-icon--${m}`}>
                  <Zap size={32} />
                </div>
                <div className={`qa-idle-text qa-idle-text--${m}`}>
                  Press <strong>Start</strong> to begin today's <strong>{selectedQuiz.label}</strong> quiz.
                  Today's set has <strong>{questions.length}</strong> questions.
                </div>
              </div>
            )}

            {/* Active question */}
            {started && currentQuestion && (
              <>
                {/* Progress bar */}
                <div className="qa-progress">
                  <span className={`qa-progress__label qa-progress__label--${m}`}>Progress</span>
                  <div className={`qa-progress__bar qa-progress__bar--${m}`}>
                    <div
                      className="qa-progress__fill"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className={`qa-progress__count qa-progress__count--${m}`}>
                    {index + 1}/{questions.length}
                  </span>
                </div>

                {/* Question text */}
                <div className="qa-question-text" key={index}>
                  {currentQuestion.question}
                </div>

                {/* Options */}
                <div className="qa-options" key={`opts-${index}`}>
                  {currentQuestion.options.map((option, oi) => {
                    const selected = answers[index] === option;
                    const isFeedbackActive = answerFeedback && answerFeedback.questionIndex === index;
                    const isCorrectOption = isFeedbackActive && option === answerFeedback.correctAnswer;
                    const isWrongSelected = isFeedbackActive && option === answerFeedback.selected && !answerFeedback.isCorrect;

                    let stateClass = '';
                    if (isCorrectOption) stateClass = 'qa-option--correct';
                    else if (isWrongSelected) stateClass = 'qa-option--wrong';
                    else if (selected) stateClass = 'qa-option--selected';

                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={submitted || isTransitioning}
                        onClick={() => handleAnswerSelect(option)}
                        className={`qa-option qa-option--${m} ${stateClass}`}
                      >
                        <span className={`qa-option__letter qa-option__letter--${m}`}>
                          {OPTION_LETTERS[oi]}
                        </span>
                        {option}
                      </button>
                    );
                  })}
                </div>

                {/* Feedback banner */}
                {answerFeedback && answerFeedback.questionIndex === index && (
                  <div className={`qa-feedback qa-feedback--${answerFeedback.isCorrect ? 'correct' : 'wrong'}`}>
                    <div className={`qa-feedback__header qa-feedback__header--${answerFeedback.isCorrect ? 'correct' : 'wrong'}`}>
                      {answerFeedback.isCorrect
                        ? <><CheckCircle2 size={16} /> Correct!</>
                        : <><XCircle size={16} /> Wrong Answer</>
                      }
                    </div>
                    <div className={`qa-feedback__body qa-feedback__body--${m}`}>
                      {!answerFeedback.isCorrect && (
                        <div className="qa-feedback__correct-answer">
                          Correct answer: <strong>{answerFeedback.correctAnswer}</strong>
                        </div>
                      )}
                      <div>{answerFeedback.note}</div>
                    </div>
                  </div>
                )}

                {/* Hint */}
                <div className={`qa-hint qa-hint--${m}`}>
                  <Sparkles size={12} />
                  Questions auto-advance after instant feedback.
                </div>
              </>
            )}

            {/* ─── Results section ─── */}
            {submitted && (
              <div className={`qa-results qa-results--${m}`}>
                {/* Stats cards */}
                <div className="qa-stats-row">
                  <div className={`qa-stat qa-stat--score qa-stat--${m}`}>
                    <div className="qa-stat__icon">
                      <CheckCircle2 size={18} />
                    </div>
                    <div className="qa-stat__value">{score}/{attemptedCount}</div>
                    <div className="qa-stat__label">Score</div>
                  </div>

                  <div className={`qa-stat qa-stat--accuracy qa-stat--${m}`}>
                    <div className="qa-stat__icon">
                      <Target size={18} />
                    </div>
                    <div className="qa-stat__value">{accuracy}%</div>
                    <div className="qa-stat__label">Accuracy</div>
                  </div>

                  <div className={`qa-stat qa-stat--time qa-stat--${m}`}>
                    <div className="qa-stat__icon">
                      <Timer size={18} />
                    </div>
                    <div className="qa-stat__value">{formatDuration(elapsed)}</div>
                    <div className="qa-stat__label">Time</div>
                  </div>

                  <div className={`qa-stat qa-stat--status qa-stat--${m}`}>
                    <div className={`qa-stat__icon qa-stat__icon--${completionStatus === 'Pass' ? 'perfect' : 'wrong'}`}>
                      {completionStatus === 'Pass' ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
                    </div>
                    <div className={`qa-stat__value qa-stat__value--${completionStatus === 'Pass' ? 'perfect' : 'wrong'}`}>
                      {completionStatus}
                    </div>
                    <div className="qa-stat__label">Status</div>
                  </div>
                </div>

                {/* Save message */}
                {saveMessage && (
                  <div className={`qa-save-msg qa-save-msg--${m}`}>{saveMessage}</div>
                )}

                {/* Review list */}
                <div className="qa-review-list">
                  {questions.slice(0, attemptedCount).map((q, i) => {
                    const correct = answers[i] === q.answer;
                    return (
                      <div
                        key={`${q.question}-${i}`}
                        className={`qa-review-item qa-review-item--${correct ? 'correct' : 'wrong'}--${m}`}
                      >
                        <div className="qa-review-q">
                          {correct
                            ? <CheckCircle2 size={15} color="#22c55e" style={{ flexShrink: 0, marginTop: 1 }} />
                            : <XCircle size={15} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                          }
                          <span>Q{i + 1}. {q.question}</span>
                        </div>
                        <div className="qa-review-answer">
                          Your answer: {answers[i] || 'Not answered'}
                          {!correct && <> · Correct: <strong>{q.answer}</strong></>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* ─── Right: Leaderboard ─── */}
          <section className={`qa-card qa-card--${m} qa-leaderboard`}>
            <div className="qa-lb-header">
              <div className="qa-lb-title">
                <div className="qa-lb-title__icon">
                  <Trophy size={17} />
                </div>
                {selectedQuiz.label} Leaderboard
              </div>
              {currentUserRank ? (
                <div className={`qa-lb-rank qa-lb-rank--${m}`}>
                  Your rank: #{currentUserRank}
                </div>
              ) : (
                <div className={`qa-lb-rank qa-lb-rank--${m}`} style={{ opacity: 0.6 }}>
                  Play to rank
                </div>
              )}
            </div>

            {/* Loading */}
            {loadingLeaderboard && (
              <div className={`qa-lb-loading qa-lb-loading--${m}`}>Loading leaderboard…</div>
            )}

            {/* Empty */}
            {!loadingLeaderboard && leaderboard.length === 0 && (
              <div className={`qa-lb-empty qa-lb-empty--${m}`}>
                No entries yet. Be the first to set a score!
              </div>
            )}

            {/* Table */}
            {!loadingLeaderboard && leaderboard.length > 0 && (
              <>
                <div className={`qa-lb-thead qa-lb-thead--${m}`}>
                  <div>#</div>
                  <div>Player</div>
                  <div style={{ textAlign: 'right' }}>Score</div>
                  <div style={{ textAlign: 'right' }}>Acc.</div>
                  <div style={{ textAlign: 'right' }}>Time</div>
                </div>

                <div className="qa-lb-list">
                  {leaderboard.map((entry) => (
                    <div
                      key={`${entry.userId}-${entry.rank}`}
                      className={`qa-lb-row qa-lb-row--${m} ${entry.rank <= 3 ? 'qa-lb-row--top' : ''}`}
                    >
                      <div>
                        <MedalForRank rank={entry.rank} />
                      </div>
                      <div className="qa-lb-name">{entry.name}</div>
                      <div className={`qa-lb-val qa-lb-val--${m}`}>
                        {entry.bestScore}/{entry.totalQuestions}
                      </div>
                      <div className={`qa-lb-val qa-lb-val--${m}`}>
                        {entry.accuracy}%
                      </div>
                      <div className={`qa-lb-val qa-lb-val--${m}`}>
                        {entry.quickestDuration != null ? formatDuration(entry.quickestDuration) : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
