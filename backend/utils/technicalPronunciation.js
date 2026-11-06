/**
 * Technical Pronunciation & STT Correction Dictionary
 *
 * Provides:
 *  1. correctSttTechnicalTerms(text, options): Corrects common STT misrecognitions of tech terms
 *     without misfiring on normal English words or non-technical domains (e.g. geometry).
 *  2. stripFillersForLlm(text): Strips filler words ("um", "uh") for the LLM while keeping raw transcript.
 *     Preserves legitimate uses of "like" ("I'd like to use a queue", "like a hash map").
 *  3. verifyEvidenceQuote(evidenceQuote, rawTranscript): Content-word grounded quote verification (no stopword false positives).
 *  4. stripAttributionPhrase(text, seed): Strips ungrounded "As you said, X..." attribution clauses.
 *  5. GENERIC_FOLLOW_UP_VARIANTS & getGenericFollowUp(seed): 5 varied rotating generic follow-up prompts.
 *  6. respellForTts(text, options): Phonetically respells technical acronyms & complexity notation per provider.
 */

const GEOMETRY_KEYWORDS = /\b(?:circle|sphere|cylinder|diameter|circumference|angle|geometry|perimeter|arc|curve|polygon|math)\b/i;
const CACHE_OR_STORE_KEYWORDS = /\b(?:cache|caching|in-memory|database|store|storage|key-value|pubsub|ttl|eviction|cluster|sentinel|persistence|nosql|server|queue)\b/i;

// ── 1. STT Correction Dictionary (Audio -> Accurate Text) ──────────────
const STT_TECHNICAL_CORRECTIONS = [
  // Apache Kafka misheard as cough car, cafca, kafta
  { pattern: /\b(?:apache\s+(?:cough\s*car|cafca|kafta))\b/gi, replacement: 'Apache Kafka' },
  { pattern: /\b(?:cough\s*car|cafca|kafta|calf\s*ka)\b/gi, replacement: 'Kafka' },

  // Redis misheard as radius / red is in caching/storage context
  { pattern: /\b(?:radius|red\s+is)\b(?=[\s\w]*(?:cache|in-memory|database|store|key-value|pubsub|ttl|eviction|cluster|sentinel|persistence))/gi, replacement: 'Redis' },
  { pattern: /\b(?:radius\s+cache|radius\s+server|radius\s+cluster)\b/gi, replacement: 'Redis cache' },

  // Kubernetes misheard as cuberneties, coobernetes, cooper net is
  { pattern: /\b(?:cuberneties|coobernetes|kuber\s*netics|cooper\s*net\s*is|kuber\s*netes)\b/gi, replacement: 'Kubernetes' },
  { pattern: /\b(?:k\s*eights|k\s*8\s*s)\b/gi, replacement: 'K8s' },

  // SQL / NoSQL misheard as see sequel, no sequel, know sequel
  { pattern: /\b(?:see\s*sequel|c\s*sequel|seek\s*well)\b/gi, replacement: 'SQL' },
  { pattern: /\b(?:no\s*sequel|know\s*sequel|no-sequel)\b/gi, replacement: 'NoSQL' },
  { pattern: /\b(?:my\s*sequel)\b/gi, replacement: 'MySQL' },
  { pattern: /\b(?:post\s*grass\s*q\s*l|post\s*gres\s*q\s*l)\b/gi, replacement: 'PostgreSQL' },
  { pattern: /\b(?:post\s*grass|post\s*gres|post-gres)\b/gi, replacement: 'Postgres' },

  // Docker
  { pattern: /\b(?:dock\s*er|darker\s+container)\b/gi, replacement: 'Docker' },

  // PyTorch & PySpark
  { pattern: /\b(?:pie\s*torch)\b/gi, replacement: 'PyTorch' },
  { pattern: /\b(?:pie\s*spark)\b/gi, replacement: 'PySpark' },

  // gRPC & GraphQL
  { pattern: /\b(?:gee\s*rpc|g\s*rpc|g\s*r\s*p\s*c)\b/gi, replacement: 'gRPC' },
  { pattern: /\b(?:graph\s*ql|graph\s*q\s*l)\b/gi, replacement: 'GraphQL' },

  // REST API & JSON & JWT
  { pattern: /\b(?:rest\s*a\s*p\s*i)\b/gi, replacement: 'REST API' },
  { pattern: /\b(?:jay\s*son|jason\s+object|jason\s+payload)\b/gi, replacement: 'JSON' },
  { pattern: /\b(?:jay\s*dub\s*dub\s*tee|j\s*w\s*t|jwt\s*token)\b/gi, replacement: 'JWT' },

  // Complexity & Algorithmic Patterns
  { pattern: /\b(?:n\s*plus\s*one|n\s*\+\s*1)\b/gi, replacement: 'N+1' },
  { pattern: /\b(?:big\s*o\s*of\s*n|o\s*of\s*n)\b/gi, replacement: 'O(n)' },
  { pattern: /\b(?:big\s*o\s*of\s*one|o\s*of\s*one|o\s*of\s*1)\b/gi, replacement: 'O(1)' },
  { pattern: /\b(?:o\s*of\s*n\s*squared|big\s*o\s*of\s*n\s*squared)\b/gi, replacement: 'O(n^2)' },
  { pattern: /\b(?:o\s*of\s*log\s*n|big\s*o\s*of\s*log\s*n)\b/gi, replacement: 'O(log n)' },

  // Distributed Systems
  { pattern: /\b(?:a\s*cid\s+properties|a\s+cid\s+transactions)\b/gi, replacement: 'ACID properties' },
  { pattern: /\b(?:c\s*a\s*p\s+theorem)\b/gi, replacement: 'CAP theorem' },
  { pattern: /\b(?:b\s*tree|b\s+tree)\b/gi, replacement: 'B-tree' },
  { pattern: /\b(?:b\s*plus\s*tree|b\s*\+\s*tree)\b/gi, replacement: 'B+ tree' },
  { pattern: /\b(?:eye\s*dem\s*potent|idem\s*potent)\b/gi, replacement: 'idempotent' },
  { pattern: /\b(?:eye\s*dem\s*potency|idem\s*potency)\b/gi, replacement: 'idempotency' },

  // Infra / Cloud
  { pattern: /\b(?:c\s*i\s*c\s*d|c\s*i\s*\/\s*c\s*d)\b/gi, replacement: 'CI/CD' },
  { pattern: /\b(?:engine\s*x|n\s*jinx)\b/gi, replacement: 'nginx' },
  { pattern: /\b(?:aws\s*lamb\s*da|lamb\s*da\s+function)\b/gi, replacement: 'AWS Lambda' },
];

/**
 * Correct STT misrecognitions for technical terms.
 * Safe against math/geometry context (e.g. radius of a circle).
 */
export function correctSttTechnicalTerms(text, _options = {}) {
  if (!text || typeof text !== 'string') return '';
  const isGeometry = GEOMETRY_KEYWORDS.test(text);

  let corrected = text;
  for (const { pattern, replacement } of STT_TECHNICAL_CORRECTIONS) {
    corrected = corrected.replace(pattern, replacement);
  }

  // Standalone radius -> Redis: ONLY apply when explicitly in caching context and NOT geometry
  if (!isGeometry && CACHE_OR_STORE_KEYWORDS.test(corrected)) {
    corrected = corrected.replace(/\b(?:radius)\b/gi, 'Redis');
  }

  return corrected;
}

// ── 2. Strip Filler Words for LLM (Clean Input) ───────────────────────
// Removes true speech disfluencies (um, uh, repeated words) but preserves
// legitimate semantic uses of "like" ("I'd like to use...", "like a hash map").
const PURE_FILLER_REGEX = /\b(?:um|uh|uhh|umm|ah|er|erm)\b[,.]?\s*/gi;
const REPEATED_LIKE_REGEX = /\b(?:like\s+like)\b/gi;
const FILLER_COMMA_LIKE_REGEX = /(?:^|[,\s])like,\s*/gi;
const LEADING_CONVERSATIONAL_FILLERS = /^(?:um,\s*|uh,\s*|basically,\s*|you know,\s*)+/i;

export function stripFillersForLlm(text) {
  if (!text || typeof text !== 'string') return '';
  let clean = text.replace(PURE_FILLER_REGEX, ' ');
  clean = clean.replace(REPEATED_LIKE_REGEX, 'like ');
  clean = clean.replace(FILLER_COMMA_LIKE_REGEX, ' ');
  clean = clean.replace(LEADING_CONVERSATIONAL_FILLERS, '');
  return clean.replace(/\s{2,}/g, ' ').trim();
}

// ── 3. Stopwords & Content Word Extraction ────────────────────────────
export const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself',
  'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more',
  'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or',
  'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some',
  'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these',
  'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'use', 'used', 'using',
  'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why',
  'will', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves'
]);

export function extractContentWords(text) {
  if (!text) return [];
  return String(text)
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOPWORDS.has(word));
}

// ── 4. Evidence Quote Verification (Guard Against Hallucinated Attribution) ──
/**
 * Verifies that the LLM's evidenceQuote is genuinely grounded in the candidate's transcript.
 * Drops stopwords so "the", "use", "and" cannot pass the check.
 * Requires at least 2 matching content words for multi-word phrases.
 * Returns { verified: boolean, quote: string }.
 */
export function verifyEvidenceQuote(evidenceQuote, rawTranscript) {
  if (!evidenceQuote || !rawTranscript) {
    return { verified: false, quote: '' };
  }
  const cleanQuote = String(evidenceQuote).trim();
  const cleanTranscript = String(rawTranscript).trim();
  if (cleanQuote.length < 2 || cleanTranscript.length < 2) {
    return { verified: false, quote: '' };
  }

  const normQuote = cleanQuote.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  const normTranscript = cleanTranscript.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();

  const quoteContent = extractContentWords(cleanQuote);
  const transcriptContent = new Set(extractContentWords(cleanTranscript));

  // 1. Direct normalized substring match
  if (normTranscript.includes(normQuote)) {
    // If the quote contains at least 1 content word (e.g. "Redis", "Kafka", "hash map"), verified
    if (quoteContent.length >= 1) {
      return { verified: true, quote: cleanQuote };
    }
  }

  // 2. Token overlap on content words ONLY (drop stopwords):
  // Must have at least 2 matching content words and >=60% overlap
  if (quoteContent.length >= 2) {
    const matchedContentWords = quoteContent.filter(w => transcriptContent.has(w));
    if (matchedContentWords.length >= 2 && (matchedContentWords.length / quoteContent.length) >= 0.60) {
      return { verified: true, quote: cleanQuote };
    }
  }

  return { verified: false, quote: '' };
}

// ── 5. Generic Follow-Up Rotations & Attribution Phrase Removal ────────
export const GENERIC_FOLLOW_UP_VARIANTS = [
  'How would you evaluate the performance trade-offs on that approach?',
  'What edge cases or failure modes would you watch out for here?',
  'How would that design hold up under high concurrent scale?',
  'Could you walk through how you would test and monitor that in production?',
  'What alternative data structures or approaches did you weigh against that?',
];

export function getGenericFollowUp(seed = 0) {
  const idx = Math.abs(Number(seed) || 0) % GENERIC_FOLLOW_UP_VARIANTS.length;
  return GENERIC_FOLLOW_UP_VARIANTS[idx];
}

/**
 * Strips unverified attribution phrases like:
 * "As you said, X...", "You mentioned X...", "Based on what you said, X..."
 */
const ATTRIBUTION_PHRASE_REGEX = /^(?:(?:as\s+(?:you|we)\s+(?:said|mentioned|noted|pointed\s+out|described))|(?:you\s+(?:mentioned|said|noted|brought\s+up|talked\s+about|suggested|described))|(?:based\s+on\s+what\s+you\s+(?:said|mentioned)))\s*[^,.:;?!]*[,.:;?!]\s*/i;

export function stripAttributionPhrase(text, fallbackSeed = 0) {
  if (!text || typeof text !== 'string') return getGenericFollowUp(fallbackSeed);
  let cleaned = text.trim().replace(ATTRIBUTION_PHRASE_REGEX, '');
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  if (cleaned.length < 10) {
    return getGenericFollowUp(fallbackSeed);
  }
  return cleaned;
}

// ── 6. Phonetic Respellings for TTS (Text -> Human Sounding Audio) ─────
const COMMON_TTS_SYMBOL_RESPELLINGS = [
  // Algorithmic complexity
  { pattern: /\bO\(1\)/gi, replacement: 'O of 1' },
  { pattern: /\bO\(n\)/gi, replacement: 'O of n' },
  { pattern: /\bO\(n\^2\)/gi, replacement: 'O of n squared' },
  { pattern: /\bO\(n\s*log\s*n\)/gi, replacement: 'O of n log n' },
  { pattern: /\bO\(log\s*n\)/gi, replacement: 'O of log n' },
  { pattern: /\bO\(([^)]+)\)/gi, replacement: 'O of $1' },

  // Programming symbols
  { pattern: /===?/g, replacement: ' equals ' },
  { pattern: /!==?/g, replacement: ' does not equal ' },
  { pattern: /&&/g, replacement: ' and ' },
  { pattern: /\|\|/g, replacement: ' or ' },
  { pattern: /=>/g, replacement: ' yields ' },
  { pattern: /<=/g, replacement: ' is less than or equal to ' },
  { pattern: />=/g, replacement: ' is greater than or equal to ' },
];

const EDGE_NEURAL_RESPELLINGS = [
  { pattern: /\bgRPC\b/gi, replacement: 'gee-RPC' },
  { pattern: /\bPostgreSQL\b/gi, replacement: 'Post-gres-Q-L' },
  { pattern: /\bPostgres\b/gi, replacement: 'Post-gres' },
  { pattern: /\bKubernetes\b/gi, replacement: 'Koo-ber-net-ees' },
  { pattern: /\bK8s\b/gi, replacement: 'K-eights' },
  { pattern: /\bKafka\b/gi, replacement: 'Kaff-ka' },
  { pattern: /\bRedis\b/gi, replacement: 'Red-iss' },
  { pattern: /\bOAuth2\b/gi, replacement: 'O-Auth two' },
  { pattern: /\bOAuth\b/gi, replacement: 'O-Auth' },
  { pattern: /\bCI\/CD\b/gi, replacement: 'C-I C-D' },
  { pattern: /\bnginx\b/gi, replacement: 'Engine-X' },
  { pattern: /\bGraphQL\b/gi, replacement: 'Graph-Q-L' },
  { pattern: /\bJWT\b/gi, replacement: 'J-W-T' },
  { pattern: /\bUUID\b/gi, replacement: 'U-U-I-D' },
  { pattern: /\bSQL\b/gi, replacement: 'sequel' },
  { pattern: /\bNoSQL\b/gi, replacement: 'no-sequel' },
  { pattern: /\bidempotent\b/gi, replacement: 'eye-dem-potent' },
  { pattern: /\bidempotency\b/gi, replacement: 'eye-dem-potency' },
  { pattern: /\btuple\b/gi, replacement: 'toople' },
  { pattern: /\bregex\b/gi, replacement: 'reg-ex' },
  { pattern: /\bSLA\b/gi, replacement: 'S-L-A' },
  { pattern: /\bSLO\b/gi, replacement: 'S-L-O' },
  { pattern: /\bCRUD\b/gi, replacement: 'crud' },
  { pattern: /\bFIFO\b/gi, replacement: 'fye-fo' },
  { pattern: /\bLIFO\b/gi, replacement: 'lye-fo' },
  { pattern: /\bPyTorch\b/gi, replacement: 'pie-torch' },
  { pattern: /\bPySpark\b/gi, replacement: 'pie-spark' },
];

export function respellForTts(text, options = {}) {
  if (!text || typeof text !== 'string') return '';
  const provider = (options?.provider || 'edge').toLowerCase();

  let respelled = text;
  // Common symbol expansions apply to all TTS engines
  for (const { pattern, replacement } of COMMON_TTS_SYMBOL_RESPELLINGS) {
    respelled = respelled.replace(pattern, replacement);
  }

  // Orpheus handles standard acronyms like gRPC & Kafka naturally without hyphenation
  if (provider === 'orpheus') {
    respelled = respelled.replace(/\bK8s\b/gi, 'K eight s');
    respelled = respelled.replace(/\bnginx\b/gi, 'Engine X');
    return respelled;
  }

  // Edge neural benefits from phonetic hyphens
  for (const { pattern, replacement } of EDGE_NEURAL_RESPELLINGS) {
    respelled = respelled.replace(pattern, replacement);
  }
  return respelled;
}
