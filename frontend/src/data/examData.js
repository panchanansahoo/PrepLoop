/**
 * Exam Practice Data — TCS NQT, Cognizant GenC / Superset, Infosys, Wipro style
 *
 * Each exam object defines:
 *   - sections with their own time limits, question counts, marking scheme
 *   - overall metadata (company, tier, difficulty)
 *   - questions drawn from existing aptitude, reasoning, verbal, and technical banks
 */

import { quantQuestions } from './quantQuestions';
import { reasoningQuestions } from './reasoningQuestions';
import { verbalQuestions } from './verbalQuestions';
import { technicalQuestions } from './technicalQuestions';
import { companyQuestions } from './companyQuestions';

// ── helpers ──────────────────────────────────────────────────────────────────

/** Flatten all questions from an aptitude subcategory map */
const flattenBank = (bank) => Object.values(bank).flatMap(sub => sub.questions || []);

const QUANT_POOL   = flattenBank(quantQuestions);
const REASON_POOL  = flattenBank(reasoningQuestions);
const VERBAL_POOL  = flattenBank(verbalQuestions);
const TECH_POOL    = flattenBank(technicalQuestions);
const COMPANY_POOL = flattenBank(companyQuestions);

const BEHAVIOURAL_POOL = [
  {
    id: 'beh_1',
    question: 'A teammate misses a critical deadline that delays your part of a client deliverable. What is the most constructive first step?',
    difficulty: 'easy',
    xp: 10,
    timeLimit: 60,
    options: [
      { label: 'A', value: 'Escalate directly to senior management in a group email.' },
      { label: 'B', value: 'Speak privately with the teammate to understand the blocker and plan recovery.' },
      { label: 'C', value: 'Wait until the client complains so management notices the delay.' },
      { label: 'D', value: 'Redo their work silently without informing anyone.' }
    ],
    correctAnswer: 'B',
    explanation: 'Addressing blockers privately first builds trust, surfaces root causes early, and supports collaborative recovery.'
  },
  {
    id: 'beh_2',
    question: 'During a code review, a senior engineer points out a major flaw in an implementation you spent two days building. How should you respond?',
    difficulty: 'easy',
    xp: 10,
    timeLimit: 60,
    options: [
      { label: 'A', value: 'Defend your approach regardless of the evidence because it already passes basic tests.' },
      { label: 'B', value: 'Thank them, verify the flaw objectively, and collaborate on fixing it.' },
      { label: 'C', value: 'Ignore the comment and merge the code anyway.' },
      { label: 'D', value: 'Ask another teammate to approve it instead.' }
    ],
    correctAnswer: 'B',
    explanation: 'Separating ego from work and welcoming constructive feedback improves quality and team velocity.'
  },
  {
    id: 'beh_3',
    question: 'You notice an error in a report you already submitted to your manager an hour ago. Nobody has spotted it yet. What should you do?',
    difficulty: 'easy',
    xp: 10,
    timeLimit: 60,
    options: [
      { label: 'A', value: 'Wait to see if anyone notices before saying anything.' },
      { label: 'B', value: 'Blame the raw data source if asked later.' },
      { label: 'C', value: 'Proactively inform your manager, explain the error, and share the corrected report.' },
      { label: 'D', value: 'Quietly overwrite the file without telling anyone.' }
    ],
    correctAnswer: 'C',
    explanation: 'Proactive ownership prevents downstream decisions from being made on faulty data and demonstrates integrity.'
  },
  {
    id: 'beh_4',
    question: 'Two team members disagree strongly on the architecture for a new feature, stalling sprint progress. As a peer, what is the best way to help?',
    difficulty: 'medium',
    xp: 15,
    timeLimit: 60,
    options: [
      { label: 'A', value: 'Side with whoever has been at the company longer.' },
      { label: 'B', value: 'Facilitate a structured comparison of trade-offs against project requirements.' },
      { label: 'C', value: 'Avoid the discussion completely and work on unrelated tasks.' },
      { label: 'D', value: 'Tell both of them their ideas are wrong and propose a third without discussion.' }
    ],
    correctAnswer: 'B',
    explanation: 'Grounding technical disagreements in objective requirements and trade-offs resolves conflict constructively.'
  },
  {
    id: 'beh_5',
    question: 'Your manager assigns you an urgent task with unclear acceptance criteria while they are traveling and hard to reach. What should you do first?',
    difficulty: 'medium',
    xp: 15,
    timeLimit: 60,
    options: [
      { label: 'A', value: 'Do nothing until they return so you do not risk making an assumption.' },
      { label: 'B', value: 'Send a concise message listing your assumptions and start on the unambiguous parts while seeking confirmation.' },
      { label: 'C', value: 'Guess every detail and submit the final deliverable without noting any assumptions.' },
      { label: 'D', value: 'Reassign the task to a junior colleague.' }
    ],
    correctAnswer: 'B',
    explanation: 'Making reasonable progress while transparently documenting and confirming assumptions balances initiative with alignment.'
  },
  {
    id: 'beh_6',
    question: 'A stakeholder asks you to skip mandatory security testing so a feature can launch before a marketing event. What is the right response?',
    difficulty: 'medium',
    xp: 15,
    timeLimit: 60,
    options: [
      { label: 'A', value: 'Skip the checks quietly to keep the stakeholder happy.' },
      { label: 'B', value: 'Explain the risk clearly, keep mandatory checks, and look for scope reductions to meet the timeline safely.' },
      { label: 'C', value: 'Refuse rudely without offering any alternative.' },
      { label: 'D', value: 'Approve the release and fix security issues next quarter.' }
    ],
    correctAnswer: 'B',
    explanation: 'Upholding compliance/security standards while offering pragmatic scope trade-offs protects both the business and timeline.'
  },
  {
    id: 'beh_7',
    question: 'You have three high-priority tasks due on the same day and realize you cannot finish all three at full quality alone. What should you do?',
    difficulty: 'easy',
    xp: 10,
    timeLimit: 60,
    options: [
      { label: 'A', value: 'Rush all three and submit incomplete or untested work.' },
      { label: 'B', value: 'Communicate early with your lead to reprioritize deadlines or redistribute workload.' },
      { label: 'C', value: 'Work in silence and miss two deadlines unexpectedly.' },
      { label: 'D', value: 'Pick whichever task is easiest and ignore the rest.' }
    ],
    correctAnswer: 'B',
    explanation: 'Early communication enables smart prioritization and prevents last-minute surprises for stakeholders.'
  },
  {
    id: 'beh_8',
    question: 'A new joiner on your team repeatedly asks basic questions about the team workflow, slowing down your morning. How should you handle this?',
    difficulty: 'easy',
    xp: 10,
    timeLimit: 60,
    options: [
      { label: 'A', value: 'Tell them to figure it out on their own so they learn faster.' },
      { label: 'B', value: 'Answer kindly, point them to documentation, and schedule a short onboarding walkthrough.' },
      { label: 'C', value: 'Ignore their messages until end of week.' },
      { label: 'D', value: 'Complain to your manager that they are unqualified.' }
    ],
    correctAnswer: 'B',
    explanation: 'Supporting newcomers with documentation and structured check-ins builds team capability and saves time long-term.'
  },
  {
    id: 'beh_9',
    question: 'In a client meeting, the client asks a technical question about a feature limitation you are not 100% sure about. What should you say?',
    difficulty: 'easy',
    xp: 10,
    timeLimit: 60,
    options: [
      { label: 'A', value: 'Give a confident guess so you do not look unprepared.' },
      { label: 'B', value: 'Promise the feature works as they hope and verify afterward.' },
      { label: 'C', value: 'Acknowledge that you want to give an accurate answer and commit to following up by a specific time.' },
      { label: 'D', value: 'Change the subject to an unrelated feature.' }
    ],
    correctAnswer: 'C',
    explanation: 'Honesty paired with a concrete follow-up commitment maintains client credibility and avoids false promises.'
  },
  {
    id: 'beh_10',
    question: 'You discover that a colleague has been sharing confidential client data in a public messaging channel to debug an issue faster. What is the best action?',
    difficulty: 'medium',
    xp: 15,
    timeLimit: 60,
    options: [
      { label: 'A', value: 'Ignore it since they were trying to solve a bug quickly.' },
      { label: 'B', value: 'Immediately alert them to remove the data and follow company security/incident reporting guidelines.' },
      { label: 'C', value: 'Screenshot it and share it with friends outside work.' },
      { label: 'D', value: 'Wait for an annual audit to flag it.' }
    ],
    correctAnswer: 'B',
    explanation: 'Protecting confidential data requires immediate remediation and adherence to security reporting procedures.'
  },
  {
    id: 'beh_11',
    question: 'After a project succeeds, your manager publicly praises you for an idea that was originally suggested by a quieter teammate. What should you do?',
    difficulty: 'easy',
    xp: 10,
    timeLimit: 60,
    options: [
      { label: 'A', value: 'Accept all the credit because you implemented most of it.' },
      { label: 'B', value: 'Thank the manager and explicitly credit your teammate for originating the idea.' },
      { label: 'C', value: 'Say nothing in public and apologize privately later.' },
      { label: 'D', value: 'Ask the manager to drop the topic.' }
    ],
    correctAnswer: 'B',
    explanation: 'Sharing credit publicly fosters psychological safety, fairness, and stronger team morale.'
  },
  {
    id: 'beh_12',
    question: 'Your team adopts a new tool that replaces a workflow you are already very fast at. You find the new tool clunky at first. What is the best mindset?',
    difficulty: 'easy',
    xp: 10,
    timeLimit: 60,
    options: [
      { label: 'A', value: 'Continue using the old workflow privately without telling anyone.' },
      { label: 'B', value: 'Give the new tool a fair trial, learn its shortcuts, and share constructive feedback on real gaps.' },
      { label: 'C', value: 'Refuse to adopt it until forced.' },
      { label: 'D', value: 'Discourage teammates from learning it.' }
    ],
    correctAnswer: 'B',
    explanation: 'Adaptability and constructive feedback help teams transition smoothly while surfacing genuine process improvements.'
  },
  {
    id: 'beh_13',
    question: 'During a sprint retrospective, a teammate vents frustration about repeated last-minute requirement changes. How can you respond effectively?',
    difficulty: 'medium',
    xp: 15,
    timeLimit: 60,
    options: [
      { label: 'A', value: 'Dismiss their concern and say change is just part of software.' },
      { label: 'B', value: 'Validate the impact, analyze why changes arrived late, and propose an intake cutoff or buffer process.' },
      { label: 'C', value: 'Blame the product team without proposing solutions.' },
      { label: 'D', value: 'End the retrospective early to avoid tension.' }
    ],
    correctAnswer: 'B',
    explanation: 'Empathetic listening combined with root-cause analysis turns frustration into actionable process improvement.'
  },
  {
    id: 'beh_14',
    question: 'You realize a task you estimated would take 2 days will actually take 5 days due to unexpected legacy dependencies. When should you flag this?',
    difficulty: 'easy',
    xp: 10,
    timeLimit: 60,
    options: [
      { label: 'A', value: 'On day 5, once you are sure how long it actually took.' },
      { label: 'B', value: 'As soon as you uncover the dependency and revised estimate.' },
      { label: 'C', value: 'Only if someone explicitly asks for a status update.' },
      { label: 'D', value: 'Never; work overtime silently to hide the estimation gap.' }
    ],
    correctAnswer: 'B',
    explanation: 'Raising schedule risks immediately gives the team maximum flexibility to adjust dependencies and expectations.'
  },
  {
    id: 'beh_15',
    question: 'A cross-functional partner sends an angry email blaming your team for a production outage that was actually triggered by their configuration change. How should you reply?',
    difficulty: 'hard',
    xp: 20,
    timeLimit: 60,
    options: [
      { label: 'A', value: 'Reply with an equally sharp email proving it was their fault.' },
      { label: 'B', value: 'Respond calmly with factual timeline logs, focus on restoring service together, and suggest a blameless postmortem.' },
      { label: 'C', value: 'Forward their email to leadership to embarrass them.' },
      { label: 'D', value: 'Ignore the email and let the outage continue.' }
    ],
    correctAnswer: 'B',
    explanation: 'Calm, fact-based communication and blameless postmortems resolve incidents faster and preserve cross-team partnerships.'
  },
  {
    id: 'beh_16',
    question: 'You finish your assigned sprint tasks two days early while another teammate is overloaded with complex bug fixes. What is the best action?',
    difficulty: 'easy',
    xp: 10,
    timeLimit: 60,
    options: [
      { label: 'A', value: 'Take the two days off informally without telling anyone.' },
      { label: 'B', value: 'Offer to take over some bugs, write tests, or help review their fixes.' },
      { label: 'C', value: 'Start an unrequested rewrite of an unrelated module.' },
      { label: 'D', value: 'Keep quiet so you are not given extra work.' }
    ],
    correctAnswer: 'B',
    explanation: 'Proactively supporting overloaded teammates reflects strong ownership of shared team goals.'
  }
];

/** 
 * Random sample that remembers seen questions via localStorage 
 * so users see all pool questions without repeating until exhausted. 
 */
const sampleQuestions = (pool, count, poolName = 'default', options = {}) => {
  const { recordSeen = true } = options;
  let seenIds = [];
  try {
    const stored = localStorage.getItem(`seen_questions_${poolName}`);
    if (stored) seenIds = JSON.parse(stored);
  } catch {
    // Ignore localStorage errors
  }

  const seenSet = new Set(seenIds);
  let unseenPool = pool.filter(q => !seenSet.has(q.id));

  // If we don't have enough unseen questions, reset the seen list
  if (unseenPool.length < count) {
    seenIds = [];
    unseenPool = [...pool];
  }

  // Fisher-Yates shuffle unseenPool
  for (let i = unseenPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unseenPool[i], unseenPool[j]] = [unseenPool[j], unseenPool[i]];
  }

  const selected = unseenPool.slice(0, Math.min(count, unseenPool.length));

  if (recordSeen) {
    // Update seen only when questions are actually started/presented
    selected.forEach(q => seenIds.push(q.id));
    try {
      localStorage.setItem(`seen_questions_${poolName}`, JSON.stringify(seenIds));
    } catch {
      // Ignore
    }
  }

  return selected;
};

// ── Exam Definitions ─────────────────────────────────────────────────────────

export const EXAM_CATALOG = [
  // ━━━━━━━━━━ TCS NQT ━━━━━━━━━━━
  {
    id: 'tcs-nqt-foundation',
    company: 'TCS',
    title: 'TCS NQT — Foundation',
    subtitle: 'National Qualifier Test (Ninja Hiring)',
    badge: 'Popular',
    badgeColor: '#818cf8',
    icon: '🏢',
    color: '#818cf8',
    gradient: 'linear-gradient(135deg, #818cf8, #6366f1)',
    tier: 'Foundation',
    totalTime: 90, // minutes
    totalQuestions: 72,
    negativeMarking: false,
    passingPercent: 50,
    description: 'The TCS NQT Foundation test evaluates Numerical Ability, Verbal Ability, Reasoning, and Traits. Mimics the real exam pattern.',
    sections: [
      {
        id: 'num-ability',
        title: 'Numerical Ability',
        icon: '🔢',
        color: '#818cf8',
        questionCount: 20,
        timeLimit: 25,
        marksPerQuestion: 1,
        negativePerWrong: 0,
        pool: 'quant',
        description: 'Number systems, percentages, profit & loss, averages, time & work, algebra'
      },
      {
        id: 'verbal-ability',
        title: 'Verbal Ability',
        icon: '📝',
        color: '#34d399',
        questionCount: 20,
        timeLimit: 20,
        marksPerQuestion: 1,
        negativePerWrong: 0,
        pool: 'verbal',
        description: 'Grammar, reading comprehension, vocabulary, sentence correction'
      },
      {
        id: 'reasoning-ability',
        title: 'Reasoning Ability',
        icon: '🧩',
        color: '#f472b6',
        questionCount: 20,
        timeLimit: 30,
        marksPerQuestion: 1,
        negativePerWrong: 0,
        pool: 'reasoning',
        description: 'Blood relations, coding-decoding, puzzles, seating arrangements, syllogisms'
      },
      {
        id: 'traits',
        title: 'Traits (Behavioural)',
        icon: '🎭',
        color: '#facc15',
        questionCount: 12,
        timeLimit: 15,
        marksPerQuestion: 1,
        negativePerWrong: 0,
        pool: 'behavioural',
        description: 'Workplace behaviour, communication, ethics, accountability, and team dynamics'
      }
    ]
  },

  {
    id: 'tcs-nqt-prime',
    company: 'TCS',
    title: 'TCS NQT — Prime / Digital',
    subtitle: 'Advanced track for Digital / Prime hiring',
    badge: 'Advanced',
    badgeColor: '#f59e0b',
    icon: '💎',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    tier: 'Prime',
    totalTime: 110,
    totalQuestions: 60,
    negativeMarking: false,
    passingPercent: 55,
    description: 'TCS NQT Prime / Digital adds advanced sections on Programming Logic and Coding along with standard aptitude.',
    sections: [
      {
        id: 'num-ability-adv',
        title: 'Numerical Ability (Advanced)',
        icon: '🔢',
        color: '#818cf8',
        questionCount: 15,
        timeLimit: 20,
        marksPerQuestion: 1,
        negativePerWrong: 0,
        pool: 'quant',
        description: 'Advanced quantitative with emphasis on DI, probability, permutations'
      },
      {
        id: 'verbal-ability-adv',
        title: 'Verbal Ability',
        icon: '📝',
        color: '#34d399',
        questionCount: 10,
        timeLimit: 10,
        marksPerQuestion: 1,
        negativePerWrong: 0,
        pool: 'verbal',
        description: 'Reading comprehension, para jumbles, grammar'
      },
      {
        id: 'reasoning-adv',
        title: 'Reasoning Ability',
        icon: '🧩',
        color: '#f472b6',
        questionCount: 10,
        timeLimit: 15,
        marksPerQuestion: 1,
        negativePerWrong: 0,
        pool: 'reasoning',
        description: 'Advanced puzzles, data sufficiency, logical deductions'
      },
      {
        id: 'programming-logic',
        title: 'Programming Logic',
        icon: '💻',
        color: '#38bdf8',
        questionCount: 15,
        timeLimit: 35,
        marksPerQuestion: 1,
        negativePerWrong: 0,
        pool: 'technical',
        description: 'Output prediction, pseudo-code, flowcharts, DSA concepts, OOPS basics'
      },
      {
        id: 'coding-mcq',
        title: 'Coding / Advanced Programming',
        icon: '⚡',
        color: '#a855f7',
        questionCount: 10,
        timeLimit: 30,
        marksPerQuestion: 2,
        negativePerWrong: 0,
        pool: 'technical',
        description: 'Data structures, algorithms, code analysis, complexity (MCQ style)'
      }
    ]
  },

  // ━━━━━━━━━━ Cognizant ━━━━━━━━━━━
  {
    id: 'cognizant-genc',
    company: 'Cognizant',
    title: 'Cognizant GenC',
    subtitle: 'Entry-Level Graduate Hiring',
    badge: 'Entry',
    badgeColor: '#34d399',
    icon: '🅲',
    color: '#34d399',
    gradient: 'linear-gradient(135deg, #34d399, #10b981)',
    tier: 'GenC',
    totalTime: 75,
    totalQuestions: 58,
    negativeMarking: false,
    passingPercent: 50,
    description: 'Cognizant GenC assesses Quantitative Aptitude, Logical Reasoning, Verbal Ability, and Automata (basic coding). Matches the actual exam pattern.',
    sections: [
      {
        id: 'quant-cog',
        title: 'Quantitative Aptitude',
        icon: '🔢',
        color: '#818cf8',
        questionCount: 16,
        timeLimit: 16,
        marksPerQuestion: 1,
        negativePerWrong: 0,
        pool: 'quant',
        description: 'Speed / time / distance, percentages, ratio, averages, mensuration'
      },
      {
        id: 'reasoning-cog',
        title: 'Logical Reasoning',
        icon: '🧩',
        color: '#f472b6',
        questionCount: 14,
        timeLimit: 14,
        marksPerQuestion: 1,
        negativePerWrong: 0,
        pool: 'reasoning',
        description: 'Series, analogies, statement-conclusion, arrangements'
      },
      {
        id: 'verbal-cog',
        title: 'Verbal Ability',
        icon: '📝',
        color: '#34d399',
        questionCount: 18,
        timeLimit: 18,
        marksPerQuestion: 1,
        negativePerWrong: 0,
        pool: 'verbal',
        description: 'Error spotting, sentence improvement, RC, fill in the blanks'
      },
      {
        id: 'automata-cog',
        title: 'Automata Fix (Coding)',
        icon: '💻',
        color: '#38bdf8',
        questionCount: 10,
        timeLimit: 27,
        marksPerQuestion: 2,
        negativePerWrong: 0,
        pool: 'technical',
        description: 'Fix buggy pseudo-code, basic programming logic, output tracing'
      }
    ]
  },

  {
    id: 'cognizant-genc-next',
    company: 'Cognizant',
    title: 'Cognizant GenC Next',
    subtitle: 'Mid-tier hiring (higher CTC)',
    badge: 'Mid-Tier',
    badgeColor: '#818cf8',
    icon: '🅲+',
    color: '#818cf8',
    gradient: 'linear-gradient(135deg, #818cf8, #6366f1)',
    tier: 'GenC Next',
    totalTime: 90,
    totalQuestions: 65,
    negativeMarking: false,
    passingPercent: 55,
    description: 'GenC Next includes an additional advanced coding section on top of the standard GenC pattern.',
    sections: [
      {
        id: 'quant-cogn',
        title: 'Quantitative Aptitude',
        icon: '🔢',
        color: '#818cf8',
        questionCount: 16,
        timeLimit: 16,
        marksPerQuestion: 1,
        negativePerWrong: 0,
        pool: 'quant',
        description: 'Same as GenC with slightly harder difficulty distribution'
      },
      {
        id: 'reasoning-cogn',
        title: 'Logical Reasoning',
        icon: '🧩',
        color: '#f472b6',
        questionCount: 14,
        timeLimit: 14,
        marksPerQuestion: 1,
        negativePerWrong: 0,
        pool: 'reasoning',
        description: 'Coding-decoding, blood relations, puzzles (medium-hard)'
      },
      {
        id: 'verbal-cogn',
        title: 'Verbal Ability',
        icon: '📝',
        color: '#34d399',
        questionCount: 15,
        timeLimit: 15,
        marksPerQuestion: 1,
        negativePerWrong: 0,
        pool: 'verbal',
        description: 'RC passages, cloze tests, sentence rearrangement'
      },
      {
        id: 'automata-cogn',
        title: 'Automata Fix (Advanced)',
        icon: '💻',
        color: '#38bdf8',
        questionCount: 10,
        timeLimit: 20,
        marksPerQuestion: 2,
        negativePerWrong: 0,
        pool: 'technical',
        description: 'Fix bugs in pseudo-code, multi-step logic'
      },
      {
        id: 'coding-cogn',
        title: 'Advanced Coding',
        icon: '⚡',
        color: '#a855f7',
        questionCount: 10,
        timeLimit: 25,
        marksPerQuestion: 3,
        negativePerWrong: 0,
        pool: 'technical',
        description: 'DSA, algorithm analysis, OOP, DBMS & SQL concepts'
      }
    ]
  },

  {
    id: 'cognizant-superset',
    company: 'Cognizant',
    title: 'Cognizant GenC Elevate (Superset)',
    subtitle: 'Top-tier hiring — highest CTC',
    badge: 'Elite',
    badgeColor: '#f59e0b',
    icon: '🏆',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    tier: 'Superset / Elevate',
    totalTime: 120,
    totalQuestions: 75,
    negativeMarking: true,
    passingPercent: 60,
    description: 'The Superset / Elevate exam is the hardest Cognizant track. Advanced technical, coding, and aptitude sections with negative marking.',
    sections: [
      {
        id: 'quant-super',
        title: 'Quantitative Aptitude',
        icon: '🔢',
        color: '#818cf8',
        questionCount: 16,
        timeLimit: 16,
        marksPerQuestion: 1,
        negativePerWrong: 0.25,
        pool: 'quant',
        description: 'Hard quantitative — data interpretation, probability, advanced algebra'
      },
      {
        id: 'reasoning-super',
        title: 'Logical Reasoning',
        icon: '🧩',
        color: '#f472b6',
        questionCount: 14,
        timeLimit: 14,
        marksPerQuestion: 1,
        negativePerWrong: 0.25,
        pool: 'reasoning',
        description: 'Complex puzzles, data sufficiency, inference-based'
      },
      {
        id: 'verbal-super',
        title: 'Verbal Ability',
        icon: '📝',
        color: '#34d399',
        questionCount: 15,
        timeLimit: 15,
        marksPerQuestion: 1,
        negativePerWrong: 0.25,
        pool: 'verbal',
        description: 'Advanced RC, critical reasoning, idioms and phrasal verbs'
      },
      {
        id: 'tech-super',
        title: 'Technical MCQ',
        icon: '🖥️',
        color: '#38bdf8',
        questionCount: 15,
        timeLimit: 25,
        marksPerQuestion: 2,
        negativePerWrong: 0.5,
        pool: 'technical',
        description: 'OS, CN, DBMS, OOPS, DSA — multi-topic technical MCQs'
      },
      {
        id: 'coding-super',
        title: 'Advanced Coding & Problem Solving',
        icon: '⚡',
        color: '#a855f7',
        questionCount: 15,
        timeLimit: 50,
        marksPerQuestion: 3,
        negativePerWrong: 0.75,
        pool: 'technical',
        description: 'Complex algorithms, system design reasoning, advanced code analysis'
      }
    ]
  },

  // ━━━━━━━━━━ Infosys ━━━━━━━━━━━
  {
    id: 'infosys-sp',
    company: 'Infosys',
    title: 'Infosys SP (System Engineer)',
    subtitle: 'InfyTQ / Off-campus hiring',
    badge: 'Standard',
    badgeColor: '#38bdf8',
    icon: '🔵',
    color: '#38bdf8',
    gradient: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
    tier: 'System Engineer',
    totalTime: 80,
    totalQuestions: 55,
    negativeMarking: false,
    passingPercent: 50,
    description: 'Infosys System Engineer exam tests Quantitative Aptitude, Logical Reasoning, Verbal, and Pseudo-code.',
    sections: [
      {
        id: 'quant-infy',
        title: 'Quantitative Aptitude',
        icon: '🔢',
        color: '#818cf8',
        questionCount: 15,
        timeLimit: 20,
        marksPerQuestion: 1,
        negativePerWrong: 0,
        pool: 'quant',
        description: 'Averages, percentages, time & work, probability'
      },
      {
        id: 'reasoning-infy',
        title: 'Logical Reasoning',
        icon: '🧩',
        color: '#f472b6',
        questionCount: 15,
        timeLimit: 20,
        marksPerQuestion: 1,
        negativePerWrong: 0,
        pool: 'reasoning',
        description: 'Arrangements, data structure logic, pattern recognition'
      },
      {
        id: 'verbal-infy',
        title: 'Verbal Ability',
        icon: '📝',
        color: '#34d399',
        questionCount: 15,
        timeLimit: 15,
        marksPerQuestion: 1,
        negativePerWrong: 0,
        pool: 'verbal',
        description: 'Reading comprehension, grammar, sentence correction'
      },
      {
        id: 'pseudo-infy',
        title: 'Pseudo Code',
        icon: '💻',
        color: '#38bdf8',
        questionCount: 10,
        timeLimit: 25,
        marksPerQuestion: 2,
        negativePerWrong: 0,
        pool: 'technical',
        description: 'Trace outputs, loops, recursion, data types, pseudo-code MCQs'
      }
    ]
  },

  // ━━━━━━━━━━ Wipro ━━━━━━━━━━━
  {
    id: 'wipro-nlth',
    company: 'Wipro',
    title: 'Wipro NLTH',
    subtitle: 'National Level Talent Hunt',
    badge: 'Standard',
    badgeColor: '#a855f7',
    icon: '🟣',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #a855f7, #9333ea)',
    tier: 'NLTH',
    totalTime: 60,
    totalQuestions: 60,
    negativeMarking: true,
    passingPercent: 50,
    description: 'Wipro NLTH has aptitude, verbal, and logical reasoning with negative marking.',
    sections: [
      {
        id: 'quant-wipro',
        title: 'Quantitative Aptitude',
        icon: '🔢',
        color: '#818cf8',
        questionCount: 20,
        timeLimit: 20,
        marksPerQuestion: 1,
        negativePerWrong: 0.25,
        pool: 'quant',
        description: 'Number systems, ratio, SI/CI, profit & loss'
      },
      {
        id: 'reasoning-wipro',
        title: 'Logical Reasoning',
        icon: '🧩',
        color: '#f472b6',
        questionCount: 20,
        timeLimit: 20,
        marksPerQuestion: 1,
        negativePerWrong: 0.25,
        pool: 'reasoning',
        description: 'Series, analogies, arrangements, coding-decoding'
      },
      {
        id: 'verbal-wipro',
        title: 'Verbal Ability',
        icon: '📝',
        color: '#34d399',
        questionCount: 20,
        timeLimit: 20,
        marksPerQuestion: 1,
        negativePerWrong: 0.25,
        pool: 'verbal',
        description: 'Grammar, RC, synonyms/antonyms, fill in the blanks'
      }
    ]
  },

  // ━━━━━━━━━━ Accenture ━━━━━━━━━━━
  {
    id: 'accenture-ase',
    company: 'Accenture',
    title: 'Accenture ASE / Analyst',
    subtitle: 'Associate Software Engineer hiring',
    badge: 'Standard',
    badgeColor: '#34d399',
    icon: '🔶',
    color: '#34d399',
    gradient: 'linear-gradient(135deg, #34d399, #059669)',
    tier: 'ASE',
    totalTime: 90,
    totalQuestions: 75,
    negativeMarking: false,
    passingPercent: 50,
    description: 'Accenture online test covers Cognitive, Technical, and Coding abilities.',
    sections: [
      {
        id: 'cognitive-acc',
        title: 'Cognitive (Aptitude + Reasoning)',
        icon: '🧠',
        color: '#818cf8',
        questionCount: 25,
        timeLimit: 25,
        marksPerQuestion: 1,
        negativePerWrong: 0,
        pool: 'quant',
        description: 'Mixed quantitative & logical reasoning'
      },
      {
        id: 'verbal-acc',
        title: 'English Ability',
        icon: '📝',
        color: '#34d399',
        questionCount: 20,
        timeLimit: 20,
        marksPerQuestion: 1,
        negativePerWrong: 0,
        pool: 'verbal',
        description: 'Vocabulary, grammar, RC, error identification'
      },
      {
        id: 'tech-acc',
        title: 'Technical Ability',
        icon: '💻',
        color: '#38bdf8',
        questionCount: 20,
        timeLimit: 25,
        marksPerQuestion: 1,
        negativePerWrong: 0,
        pool: 'technical',
        description: 'DBMS, Networking, OOP, C/C++/Java, pseudo-code'
      },
      {
        id: 'coding-acc',
        title: 'Coding',
        icon: '⚡',
        color: '#a855f7',
        questionCount: 10,
        timeLimit: 20,
        marksPerQuestion: 2,
        negativePerWrong: 0,
        pool: 'technical',
        description: 'Algorithm-based coding MCQs, output tracing'
      }
    ]
  },

  // ━━━━━━━━━━ Capgemini ━━━━━━━━━━━
  {
    id: 'capgemini-exceller',
    company: 'Capgemini',
    title: 'Capgemini Exceller',
    subtitle: 'Analyst / Engineer campus hiring',
    badge: 'Standard',
    badgeColor: '#0ea5e9',
    icon: '🧭',
    color: '#0ea5e9',
    gradient: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
    tier: 'Exceller',
    totalTime: 90,
    totalQuestions: 70,
    negativeMarking: false,
    passingPercent: 50,
    description: 'Capgemini Exceller pattern with aptitude, reasoning, verbal, technical and coding MCQ simulation.',
    sections: [
      {
        id: 'quant-cap',
        title: 'Quantitative Aptitude',
        icon: '🔢',
        color: '#818cf8',
        questionCount: 18,
        timeLimit: 20,
        marksPerQuestion: 1,
        negativePerWrong: 0,
        pool: 'quant',
        description: 'Percentages, profit and loss, averages, SI/CI, time-work'
      },
      {
        id: 'reasoning-cap',
        title: 'Logical Reasoning',
        icon: '🧩',
        color: '#f472b6',
        questionCount: 16,
        timeLimit: 18,
        marksPerQuestion: 1,
        negativePerWrong: 0,
        pool: 'reasoning',
        description: 'Series, coding-decoding, blood relations, syllogisms'
      },
      {
        id: 'verbal-cap',
        title: 'Verbal Ability',
        icon: '📝',
        color: '#34d399',
        questionCount: 16,
        timeLimit: 18,
        marksPerQuestion: 1,
        negativePerWrong: 0,
        pool: 'verbal',
        description: 'Grammar, RC, vocabulary, sentence improvement'
      },
      {
        id: 'tech-cap',
        title: 'Technical MCQ',
        icon: '💻',
        color: '#38bdf8',
        questionCount: 10,
        timeLimit: 14,
        marksPerQuestion: 2,
        negativePerWrong: 0,
        pool: 'technical',
        description: 'OOPS, DBMS, OS, CN and core CS fundamentals'
      },
      {
        id: 'coding-cap',
        title: 'Coding Logic',
        icon: '⚡',
        color: '#a855f7',
        questionCount: 10,
        timeLimit: 20,
        marksPerQuestion: 2,
        negativePerWrong: 0,
        pool: 'technical',
        description: 'Programming logic and algorithmic MCQ practice'
      }
    ]
  },

  // ━━━━━━━━━━ HCLTech ━━━━━━━━━━━
  {
    id: 'hcltech-freshers',
    company: 'HCLTech',
    title: 'HCLTech Fresher Assessment',
    subtitle: 'Graduate Engineer Trainee screening',
    badge: 'Entry',
    badgeColor: '#22c55e',
    icon: '🟢',
    color: '#22c55e',
    gradient: 'linear-gradient(135deg, #22c55e, #16a34a)',
    tier: 'GET',
    totalTime: 75,
    totalQuestions: 60,
    negativeMarking: false,
    passingPercent: 50,
    description: 'HCLTech-style fresher test focusing on aptitude, verbal, reasoning, and basic technical proficiency.',
    sections: [
      {
        id: 'quant-hcl',
        title: 'Quantitative Aptitude',
        icon: '🔢',
        color: '#818cf8',
        questionCount: 18,
        timeLimit: 20,
        marksPerQuestion: 1,
        negativePerWrong: 0,
        pool: 'quant',
        description: 'Ratio, percentages, time-distance, simplification'
      },
      {
        id: 'reasoning-hcl',
        title: 'Logical Reasoning',
        icon: '🧩',
        color: '#f472b6',
        questionCount: 16,
        timeLimit: 18,
        marksPerQuestion: 1,
        negativePerWrong: 0,
        pool: 'reasoning',
        description: 'Puzzles, coding-decoding, statement-assumption, analogies'
      },
      {
        id: 'verbal-hcl',
        title: 'Verbal Ability',
        icon: '📝',
        color: '#34d399',
        questionCount: 16,
        timeLimit: 17,
        marksPerQuestion: 1,
        negativePerWrong: 0,
        pool: 'verbal',
        description: 'Reading comprehension, grammar, error spotting'
      },
      {
        id: 'tech-hcl',
        title: 'Technical Fundamentals',
        icon: '💻',
        color: '#38bdf8',
        questionCount: 10,
        timeLimit: 20,
        marksPerQuestion: 2,
        negativePerWrong: 0,
        pool: 'technical',
        description: 'Programming basics, OOPS, DBMS, and CS fundamentals'
      }
    ]
  },

  // ━━━━━━━━━━ Tech Mahindra ━━━━━━━━━━━
  {
    id: 'techmahindra-campus',
    company: 'Tech Mahindra',
    title: 'Tech Mahindra Campus Test',
    subtitle: 'Graduate campus recruitment assessment',
    badge: 'Standard',
    badgeColor: '#f97316',
    icon: '🟠',
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #f97316, #ea580c)',
    tier: 'Campus',
    totalTime: 70,
    totalQuestions: 56,
    negativeMarking: false,
    passingPercent: 50,
    description: 'Tech Mahindra pattern with aptitude, logical reasoning, verbal and technical rounds.',
    sections: [
      {
        id: 'quant-techm',
        title: 'Quantitative Aptitude',
        icon: '🔢',
        color: '#818cf8',
        questionCount: 16,
        timeLimit: 18,
        marksPerQuestion: 1,
        negativePerWrong: 0,
        pool: 'quant',
        description: 'Arithmetic, averages, percentages, time-work'
      },
      {
        id: 'reasoning-techm',
        title: 'Logical Reasoning',
        icon: '🧩',
        color: '#f472b6',
        questionCount: 14,
        timeLimit: 16,
        marksPerQuestion: 1,
        negativePerWrong: 0,
        pool: 'reasoning',
        description: 'Analytical reasoning, series, patterns, arrangements'
      },
      {
        id: 'verbal-techm',
        title: 'English Ability',
        icon: '📝',
        color: '#34d399',
        questionCount: 16,
        timeLimit: 16,
        marksPerQuestion: 1,
        negativePerWrong: 0,
        pool: 'verbal',
        description: 'Grammar, comprehension, vocabulary and communication skills'
      },
      {
        id: 'tech-techm',
        title: 'Technical Aptitude',
        icon: '💻',
        color: '#38bdf8',
        questionCount: 10,
        timeLimit: 20,
        marksPerQuestion: 2,
        negativePerWrong: 0,
        pool: 'technical',
        description: 'Programming and computer science aptitude'
      }
    ]
  }
];

// ── Pool Mapping ─────────────────────────────────────────────────────────
const POOL_MAP = {
  quant: QUANT_POOL,
  verbal: VERBAL_POOL,
  reasoning: REASON_POOL,
  technical: TECH_POOL,
  company: COMPANY_POOL,
  behavioural: BEHAVIOURAL_POOL,
};

/**
 * Build the questions for an exam section
 * (returns an array of aptitude-style question objects)
 */
export const getExamSectionQuestions = (examId, sectionId, options = {}) => {
  const exam = EXAM_CATALOG.find(e => e.id === examId);
  if (!exam) return [];
  const section = exam.sections.find(s => s.id === sectionId);
  if (!section) return [];
  const pool = POOL_MAP[section.pool] || QUANT_POOL;
  return sampleQuestions(pool, section.questionCount, section.pool, options);
};

/**
 * Build ALL questions for an exam (all sections concatenated in order)
 */
export const getFullExamQuestions = (examId, options = {}) => {
  const exam = EXAM_CATALOG.find(e => e.id === examId);
  if (!exam) return { sections: [], questions: [] };
  const sections = exam.sections.map(s => {
    const pool = POOL_MAP[s.pool] || QUANT_POOL;
    const qs = sampleQuestions(pool, s.questionCount, s.pool, options);
    return { ...s, questions: qs };
  });
  return { exam, sections };
};

/** Get exam by id */
export const getExamById = (id) => EXAM_CATALOG.find(e => e.id === id);

/** Group catalog by company */
export const getExamsByCompany = () => {
  const map = {};
  EXAM_CATALOG.forEach(e => {
    if (!map[e.company]) map[e.company] = [];
    map[e.company].push(e);
  });
  return map;
};
