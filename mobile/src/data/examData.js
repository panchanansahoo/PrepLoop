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

/** 
 * Random sample that remembers seen questions via localStorage 
 * so users see all pool questions without repeating until exhausted. 
 */
const sampleQuestions = (pool, count, poolName = 'default') => {
  let seenIds = [];
  try {
    const stored = localStorage.getItem(`seen_questions_${poolName}`);
    if (stored) seenIds = JSON.parse(stored);
  } catch (e) {
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

  // Update seen
  selected.forEach(q => seenIds.push(q.id));
  try {
    localStorage.setItem(`seen_questions_${poolName}`, JSON.stringify(seenIds));
  } catch (e) {
    // Ignore
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
        pool: 'verbal', // reuse verbal as proxy
        description: 'Workplace behavior, communication, ethics, team dynamics (simulated with verbal questions)'
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
};

/**
 * Build the questions for an exam section
 * (returns an array of aptitude-style question objects)
 */
export const getExamSectionQuestions = (examId, sectionId) => {
  const exam = EXAM_CATALOG.find(e => e.id === examId);
  if (!exam) return [];
  const section = exam.sections.find(s => s.id === sectionId);
  if (!section) return [];
  const pool = POOL_MAP[section.pool] || QUANT_POOL;
  return sampleQuestions(pool, section.questionCount, section.pool);
};

/**
 * Build ALL questions for an exam (all sections concatenated in order)
 */
export const getFullExamQuestions = (examId) => {
  const exam = EXAM_CATALOG.find(e => e.id === examId);
  if (!exam) return { sections: [], questions: [] };
  const sections = exam.sections.map(s => {
    const pool = POOL_MAP[s.pool] || QUANT_POOL;
    const qs = sampleQuestions(pool, s.questionCount, s.pool);
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
