/**
 * companyInterviewStyles.js
 *
 * Distinct company interview styles and engineering culture profiles.
 * Tailors interviewer opening style, probe depth, signature phrases, and focus areas.
 */

export const COMPANY_INTERVIEW_STYLES = {
  Google: {
    style: 'structured',
    focusAreas: ['algorithms', 'system design', 'scalability', 'analytical thinking'],
    openingStyle: 'warm-professional',
    probeDepth: 'deep',
    signaturePhrase: 'Walk me through your thought process and trade-offs.',
    warmupLine: "Hey! Thanks for making the time today. I'm on the Google SWE team. Ready to dive in?",
    evaluationPriorities: ['analytical rigor', 'algorithmic clarity', 'Googleyness/intellectual humility', 'edge case thoroughness'],
    scaffoldingStyle: 'socratic-questions',
  },
  Amazon: {
    style: 'behavioral-heavy',
    focusAreas: ['leadership principles', 'customer obsession', 'ownership', 'distributed systems'],
    openingStyle: 'direct',
    probeDepth: 'medium',
    signaturePhrase: 'Tell me about a time when you had to make a high-stakes trade-off.',
    warmupLine: "Hi! Thanks for joining. Quick heads-up — I'll be taking typed notes throughout our chat. That is completely normal! How has your week been?",
    evaluationPriorities: ['Amazon Leadership Principles', 'customer backwards thinking', 'bias for action with metrics'],
    scaffoldingStyle: 'metric-driven-hints',
  },
  Meta: {
    style: 'fast-paced-code',
    focusAreas: ['rapid coding', 'system architecture', 'practical efficiency', 'concurrency'],
    openingStyle: 'collaborative',
    probeDepth: 'deep',
    signaturePhrase: 'Let us see if we can get a working solution down and iterate from there.',
    warmupLine: "Hey! Great to connect with you. We like to keep our interviews hands-on and collaborative. Ready to jump in?",
    evaluationPriorities: ['speed of execution', 'clean modular code', 'product mindset', 'handling large scale'],
    scaffoldingStyle: 'iterative-stepping',
  },
  Microsoft: {
    style: 'balanced-collaborative',
    focusAreas: ['modular architecture', 'maintainability', 'cloud patterns', 'growth mindset'],
    openingStyle: 'supportive-warm',
    probeDepth: 'medium',
    signaturePhrase: 'How would you explain this design to a teammate who has to maintain it?',
    warmupLine: "Hello! Welcome to Microsoft. Really excited to chat with you today. How is your day going so far?",
    evaluationPriorities: ['code quality', 'growth mindset', 'cross-functional empathy', 'defensive programming'],
    scaffoldingStyle: 'encouraging-frameworks',
  },
  Apple: {
    style: 'detail-oriented',
    focusAreas: ['performance', 'memory efficiency', 'system boundaries', 'elegance'],
    openingStyle: 'precise-reserved',
    probeDepth: 'rigorous',
    signaturePhrase: 'What happens at the hardware/OS boundary when this runs?',
    warmupLine: "Good day. Thank you for joining us at Apple. We care deeply about craft and performance. Whenever you are ready, let us begin.",
    evaluationPriorities: ['deep systems understanding', 'meticulous attention to detail', 'resource efficiency'],
    scaffoldingStyle: 'boundary-probing',
  },
  Netflix: {
    style: 'high-context-freedom',
    focusAreas: ['fault tolerance', 'chaos resilience', 'observability', 'mature autonomy'],
    openingStyle: 'peer-to-peer',
    probeDepth: 'deep',
    signaturePhrase: 'What fails first under real-world network partition or peak load?',
    warmupLine: "Hey there! Glad you could make it. At Netflix we treat this like two engineers solving a problem together. How are you doing today?",
    evaluationPriorities: ['distributed systems resilience', 'high judgment', 'self-direction', 'first-principles thinking'],
    scaffoldingStyle: 'scenario-challenges',
  },
  Uber: {
    style: 'real-time-distributed',
    focusAreas: ['geospatial indexing', 'concurrency', 'low-latency dispatch', 'distributed state'],
    openingStyle: 'energetic-pragmatic',
    probeDepth: 'deep',
    signaturePhrase: 'What happens if millions of state updates hit this simultaneously?',
    warmupLine: "Hey! Welcome to Uber. We deal with real-time physical world systems, so we love seeing how you reason under load. Ready to start?",
    evaluationPriorities: ['concurrency models', 'handling bursty traffic', 'practical real-time trade-offs'],
    scaffoldingStyle: 'scale-simulation',
  },
  TCS: {
    style: 'foundations-first',
    focusAreas: ['core OOP', 'SQL queries', 'data structures', 'problem solving clarity'],
    openingStyle: 'formal-respectful',
    probeDepth: 'medium',
    signaturePhrase: 'Can you write the exact query or logic and explain the execution steps?',
    warmupLine: "Hello and welcome to your interview with TCS. Please take a comfortable breath and let me know when you are ready to begin.",
    evaluationPriorities: ['core CS fundamentals', 'communication clarity', 'foundational discipline'],
    scaffoldingStyle: 'step-by-step-breakdown',
  },
  Infosys: {
    style: 'structured-academics',
    focusAreas: ['OOP principles', 'DBMS normalization', 'algorithms', 'software engineering lifecycle'],
    openingStyle: 'approachable-formal',
    probeDepth: 'medium',
    signaturePhrase: 'Walk me through how this concept was applied in your academic or lab projects.',
    warmupLine: "Welcome to Infosys! We are glad you are interviewing with us today. Ready to get started?",
    evaluationPriorities: ['conceptual clarity', 'structured explanations', 'willingness to learn'],
    scaffoldingStyle: 'foundational-hints',
  },
  Startup: {
    style: 'pragmatic-builder',
    focusAreas: ['practical speed', 'trade-offs', 'tech debt awareness', 'shipping velocity'],
    openingStyle: 'casual-enthusiastic',
    probeDepth: 'medium',
    signaturePhrase: 'What is the absolute simplest version we could ship to test this hypothesis?',
    warmupLine: "Hey! Thanks for jumping on. We move fast and build cool things here. Super excited to learn more about you. How is your day going?",
    evaluationPriorities: ['shipping mentality', 'resourcefulness', 'practical architecture', 'product intuition'],
    scaffoldingStyle: 'mvp-refinement',
  },
};

/**
 * Retrieve the interview style configuration for a given company name.
 * Falls back to a high-quality general tech company profile if unlisted.
 *
 * @param {string} companyName - e.g. "Google", "Amazon", "Cred"
 * @returns {object} Company interview style config
 */
export function getCompanyInterviewStyle(companyName = '') {
  if (!companyName || typeof companyName !== 'string') {
    return COMPANY_INTERVIEW_STYLES.Google;
  }

  const raw = companyName.trim();
  // Exact match
  if (COMPANY_INTERVIEW_STYLES[raw]) {
    return COMPANY_INTERVIEW_STYLES[raw];
  }

  // Case-insensitive exact match
  const lower = raw.toLowerCase();
  for (const [key, profile] of Object.entries(COMPANY_INTERVIEW_STYLES)) {
    if (key.toLowerCase() === lower) {
      return profile;
    }
  }

  // Startup / Product company checks
  const startupKeywords = ['startup', 'swiggy', 'zomato', 'cred', 'razorpay', 'flipkart', 'meesho', 'zepto', 'blinkit', 'ola'];
  if (startupKeywords.some((k) => lower.includes(k))) {
    return {
      ...COMPANY_INTERVIEW_STYLES.Startup,
      warmupLine: `Hey! Thanks for hopping on the call for ${raw}. We build fast and love seeing how you tackle ambiguous problems. Ready to jump in?`,
    };
  }

  // Indian IT / Campus
  const itKeywords = ['wipro', 'hcl', 'cognizant', 'accenture', 'capgemini', 'l&t', 'tech mahindra'];
  if (itKeywords.some((k) => lower.includes(k))) {
    return {
      ...COMPANY_INTERVIEW_STYLES.Infosys,
      warmupLine: `Hello! Welcome to your interview with ${raw}. We are glad to connect with you today. Ready to begin?`,
    };
  }

  // Default balanced profile tailored to company
  return {
    style: 'balanced-tech',
    focusAreas: ['clean code', 'system design', 'problem decomposition', 'communication'],
    openingStyle: 'warm-professional',
    probeDepth: 'medium',
    signaturePhrase: `How would you approach this problem in a production environment at ${raw}?`,
    warmupLine: `Hey! Thanks for taking the time to speak with us at ${raw} today. How are you doing? Ready to dive in?`,
    evaluationPriorities: ['problem solving clarity', 'engineering rigor', 'collaboration'],
    scaffoldingStyle: 'guiding-questions',
  };
}
