import { quantQuestions } from './quantQuestions';
import { reasoningQuestions } from './reasoningQuestions';
import { verbalQuestions } from './verbalQuestions';
import { companyQuestions } from './companyQuestions';
import { technicalQuestions } from './technicalQuestions';

// Top-level categories
export const APTITUDE_CATEGORIES = {
  quantitative: {
    id: 'quantitative',
    title: 'Quantitative Aptitude',
    icon: 'Calculator',
    color: '#818cf8',
    gradient: 'linear-gradient(135deg, #818cf8, #6366f1)',
    description: 'Number systems, percentages, algebra, geometry and data interpretation',
    subcategories: quantQuestions
  },
  reasoning: {
    id: 'reasoning',
    title: 'Logical Reasoning',
    icon: 'Brain',
    color: '#f472b6',
    gradient: 'linear-gradient(135deg, #f472b6, #ec4899)',
    description: 'Blood relations, coding-decoding, syllogisms, seating arrangements, puzzles',
    subcategories: reasoningQuestions
  },
  verbal: {
    id: 'verbal',
    title: 'Verbal Ability',
    icon: 'BookOpen',
    color: '#34d399',
    gradient: 'linear-gradient(135deg, #34d399, #10b981)',
    description: 'Grammar, vocabulary, reading comprehension and verbal logic',
    subcategories: verbalQuestions
  },
  technical: {
    id: 'technical',
    title: 'Technical Aptitude',
    icon: 'Database',
    color: '#38bdf8',
    gradient: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
    description: 'Core CS subjects like OS, DBMS, Computer Networks, OOPS, and DSA concepts',
    subcategories: technicalQuestions
  },
  company: {
    id: 'company',
    title: 'Company Specific',
    icon: 'Building',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    description: 'Previous year questions from top tech companies like TCS, Infosys, Amazon, etc.',
    subcategories: companyQuestions
  }
};

// Formula sheets by topic
export const FORMULA_SHEETS = {
  numberSystems: [
    'HCF × LCM = Product of two numbers',
    'Number of primes: use Sieve of Eratosthenes',
    'Unit digit cycles: powers of 2(4), 3(4), 7(4), 8(4)',
    "Fermat's Little Theorem: a^(p-1) ≡ 1 (mod p) if p is prime",
    'Divisibility rules: 2(even), 3(sum÷3), 4(last 2 digits÷4), 5(0/5), 6(2&3), 8(last 3÷8), 9(sum÷9), 11(alt sum diff÷11)'
  ],
  percentages: [
    'Profit% = (Profit/CP) × 100',
    'SP = CP × (1 + Profit%/100)',
    'Discount% = (Discount/MP) × 100',
    'SP = MP × (1 - Discount%/100)',
    'Successive discounts: Total = 1 - (1-d₁)(1-d₂)',
    'Population after n years = P(1 + r/100)ⁿ'
  ],
  ratioAndProportion: [
    'If a:b = m:n and b:c = p:q, then a:b:c = mp:np:nq',
    'Direct proportion: a₁/b₁ = a₂/b₂',
    'Inverse proportion: a₁ × b₁ = a₂ × b₂',
    'Compound ratio of a:b and c:d = ac:bd'
  ],
  averages: [
    'Average = Sum of observations / Number of observations',
    'Weighted avg = (Σwᵢxᵢ) / (Σwᵢ)',
    'If avg of n numbers is A, sum = nA',
    'New avg when one item added = (nA + x) / (n+1)'
  ],
  timeAndWork: [
    'If A does work in n days, rate = 1/n per day',
    'Combined rate = 1/a + 1/b',
    'Time together = ab/(a+b)',
    'Man-days: M₁D₁ = M₂D₂',
    'Pipes: Filling rate - Emptying rate = Net rate'
  ],
  timeSpeedDistance: [
    'Speed = Distance / Time',
    'km/hr to m/s: multiply by 5/18',
    'm/s to km/hr: multiply by 18/5',
    'Relative speed (same dir) = |S₁ - S₂|',
    'Relative speed (opposite) = S₁ + S₂',
    'Average speed = Total distance / Total time',
    'Avg speed for equal distances at s₁,s₂ = 2s₁s₂/(s₁+s₂)',
    'Stream: Upstream = Boat - Stream, Downstream = Boat + Stream'
  ],
  interestProblems: [
    'SI = P × R × T / 100',
    'CI = P(1 + R/100)ⁿ - P',
    'Diff CI-SI for 2 years = P(R/100)²',
    'Doubling time (SI) = 100/R years',
    'Rule of 72: Doubling time (CI) ≈ 72/R years'
  ],
  probabilityAndPC: [
    'P(event) = Favorable / Total outcomes',
    'nPr = n! / (n-r)!',
    'nCr = n! / (r!(n-r)!)',
    'Circular arrangement: (n-1)!',
    "P(A∪B) = P(A) + P(B) - P(A∩B)",
    "P(A') = 1 - P(A)"
  ],
  mixtures: [
    'Alligation: Ratio = (d₂-m):(m-d₁)',
    'Replacement: Final = Initial × (1 - removed/total)ⁿ'
  ],
  clockCalendar: [
    'Angle = |30H - 5.5M|°',
    'Hands overlap: (60H/11) minutes past H',
    'Hands at 180°: (60H + 360)/(11) minutes past H',
    '11 overlaps and 22 right angles in 12 hours',
    'Odd days: Mon=1, Tue=2...Sun=0',
    'Leap year = 2 odd days, Normal = 1 odd day'
  ]
};

// Get all questions from a specific subcategory
export const getSubcategoryQuestions = (categoryId, subcategoryKey) => {
  const category = APTITUDE_CATEGORIES[categoryId];
  if (!category) return [];
  const sub = category.subcategories[subcategoryKey];
  return sub ? sub.questions : [];
};

// Get all questions from a category
export const getCategoryQuestions = (categoryId) => {
  const category = APTITUDE_CATEGORIES[categoryId];
  if (!category) return [];
  const allQ = [];
  Object.values(category.subcategories).forEach(sub => {
    allQ.push(...sub.questions);
  });
  return allQ;
};

// Get ALL questions across all categories
export const getAllQuestions = () => {
  const allQ = [];
  Object.keys(APTITUDE_CATEGORIES).forEach(catId => {
    allQ.push(...getCategoryQuestions(catId));
  });
  return allQ;
};

// Get category stats
export const getCategoryStats = (categoryId) => {
  const questions = getCategoryQuestions(categoryId);
  const totalXP = questions.reduce((s, q) => s + q.xp, 0);
  const easy = questions.filter(q => q.difficulty === 'easy').length;
  const medium = questions.filter(q => q.difficulty === 'medium').length;
  const hard = questions.filter(q => q.difficulty === 'hard').length;
  return { total: questions.length, totalXP, easy, medium, hard };
};

// Get overall stats
export const getOverallStats = () => {
  let total = 0, totalXP = 0, easy = 0, medium = 0, hard = 0;
  Object.keys(APTITUDE_CATEGORIES).forEach(catId => {
    const s = getCategoryStats(catId);
    total += s.total;
    totalXP += s.totalXP;
    easy += s.easy;
    medium += s.medium;
    hard += s.hard;
  });
  return { total, totalXP, easy, medium, hard, categories: Object.keys(APTITUDE_CATEGORIES).length };
};

// Filter questions by difficulty
export const filterByDifficulty = (questions, difficulty) => {
  if (!difficulty || difficulty === 'all') return questions;
  return questions.filter(q => q.difficulty === difficulty);
};

// Get random N questions from a set
export const getRandomQuestions = (questions, n) => {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, shuffled.length));
};
