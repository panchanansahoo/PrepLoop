/**
 * Question Hasher
 * Normalizes question text and generates semantic fingerprints
 * for deduplication and similarity detection
 */

import crypto from 'crypto';

/**
 * Normalize question text for comparison
 * - Convert to lowercase
 * - Remove extra whitespace
 * - Remove common punctuation variations
 * - Remove common question prefixes
 */
export function normalizeQuestion(question) {
  if (!question || typeof question !== 'string') return '';
  
  return question
    .toLowerCase()
    .trim()
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    // Remove common question prefixes
    .replace(/^(how|what|why|when|where|can|could|would|should|will|do|does|did|is|are|have|has|was|were|explain|describe|tell me about|discuss)\s+/g, '')
    // Remove trailing punctuation
    .replace(/[?!.;,]+$/, '')
    // Normalize contractions
    .replace(/don't/g, 'dont')
    .replace(/doesn't/g, 'doesnt')
    .replace(/didn't/g, 'didnt')
    .replace(/won't/g, 'wont')
    .replace(/wouldn't/g, 'wouldnt')
    .replace(/can't/g, 'cant')
    .replace(/couldn't/g, 'couldnt')
    .replace(/shouldn't/g, 'shouldnt')
    .replace(/isn't/g, 'isnt')
    .replace(/aren't/g, 'arent')
    .replace(/wasn't/g, 'wasnt')
    .replace(/weren't/g, 'werent')
    .replace(/haven't/g, 'havent')
    .replace(/hasn't/g, 'hasnt')
    .replace(/i'm/g, 'i am')
    .replace(/you're/g, 'you are')
    .replace(/he's/g, 'he is')
    .replace(/she's/g, 'she is')
    .replace(/it's/g, 'it is')
    .replace(/we're/g, 'we are')
    .replace(/they're/g, 'they are')
    // Normalize spelling variations
    .replace(/favourite/g, 'favorite')
    .replace(/colour/g, 'color')
    .replace(/centre/g, 'center')
    .replace(/analyse/g, 'analyze')
    // Remove special characters
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

/**
 * Extract key terms from question
 * Returns array of significant words (excluding stop words)
 */
export function extractKeyTerms(question, maxTerms = 5) {
  const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'or', 'that',
    'the', 'to', 'was', 'will', 'with', 'you', 'your', 'this', 'these',
    'those', 'there', 'their', 'about', 'all', 'also', 'any', 'some',
    'what', 'when', 'where', 'which', 'who', 'why', 'how', 'should'
  ]);
  
  const normalized = normalizeQuestion(question);
  const words = normalized.split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
  
  return words.slice(0, maxTerms);
}

/**
 * Generate semantic fingerprint
 * Lightweight hash for fast comparison
 * Returns: { fingerprint: string, keyTerms: array, category: string }
 */
export function generateFingerprint(question) {
  if (!question || typeof question !== 'string') {
    return {
      fingerprint: '',
      keyTerms: [],
      category: 'unknown',
      length: 0
    };
  }
  
  const normalized = normalizeQuestion(question);
  const keyTerms = extractKeyTerms(question);
  
  // Fingerprint: first 50 chars of normalized + key terms
  const prefixHash = normalized.substring(0, 50);
  const termsHash = keyTerms.join('-');
  const combined = `${prefixHash}|${termsHash}`;
  
  // Create lightweight fingerprint (SHA256 hex)
  const fingerprint = crypto
    .createHash('sha256')
    .update(combined)
    .digest('hex')
    .substring(0, 16); // Use only first 16 chars for speed
  
  // Detect question category from key terms
  const category = detectCategory(keyTerms);
  
  return {
    fingerprint,
    keyTerms,
    category,
    length: normalized.length,
    normalized: normalized.substring(0, 100)
  };
}

/**
 * Detect question category based on key terms
 */
export function detectCategory(keyTerms) {
  if (!Array.isArray(keyTerms) || keyTerms.length === 0) return 'general';
  
  const termStr = keyTerms.join(' ');
  
  // Technical keywords
  if (/code|algorithm|data structure|complexity|bug|debug|api|database|server|client/i.test(termStr)) {
    return 'technical';
  }
  
  // Behavioral keywords
  if (/team|conflict|leadership|managed|motivation|challenge|failure|achievement/i.test(termStr)) {
    return 'behavioral';
  }
  
  // System design keywords
  if (/system|design|architecture|scalable|performance|load|cache|database|distributed/i.test(termStr)) {
    return 'system-design';
  }
  
  // Product keywords
  if (/product|user|feature|market|customer|requirement|specification/i.test(termStr)) {
    return 'product';
  }
  
  // HR keywords
  if (/strength|weakness|salary|role|company|opportunity|experience|background/i.test(termStr)) {
    return 'hr';
  }
  
  return 'general';
}

/**
 * Calculate similarity between two questions (0-100)
 * Uses both normalized text and key terms
 */
export function calculateSimilarity(question1, question2) {
  if (!question1 || !question2) return 0;
  
  const norm1 = normalizeQuestion(question1);
  const norm2 = normalizeQuestion(question2);
  
  // Exact match
  if (norm1 === norm2) return 100;
  
  // Substring match (one contains the other)
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 85;
  
  // Key terms overlap
  const terms1 = new Set(extractKeyTerms(question1));
  const terms2 = new Set(extractKeyTerms(question2));
  
  const intersection = [...terms1].filter(t => terms2.has(t)).length;
  const union = new Set([...terms1, ...terms2]).size;
  
  const jacardSimilarity = union > 0 ? (intersection / union) * 100 : 0;
  
  // Length-based similarity
  const len1 = norm1.length;
  const len2 = norm2.length;
  const lenDiff = Math.abs(len1 - len2);
  const maxLen = Math.max(len1, len2);
  const lengthSimilarity = ((maxLen - lenDiff) / maxLen) * 100;
  
  // Combine: 60% terms, 40% length
  const combined = (jacardSimilarity * 0.6) + (lengthSimilarity * 0.4);
  
  return Math.round(combined);
}

/**
 * Find similar questions from a pool
 * Returns questions above similarity threshold
 */
export function findSimilar(question, questionPool = [], threshold = 70) {
  if (!Array.isArray(questionPool) || questionPool.length === 0) return [];
  
  const similar = questionPool
    .map(q => ({
      question: q,
      similarity: calculateSimilarity(question, q.text || q)
    }))
    .filter(item => item.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity);
  
  return similar;
}

/**
 * Hash question for quick lookup (not cryptographic)
 * Used for dedup pool storage
 */
export function quickHash(question) {
  if (!question) return '';
  
  const normalized = normalizeQuestion(question);
  
  // Quick hash: sum of character codes mod large prime
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) - hash) + normalized.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to positive hex string
  return Math.abs(hash).toString(16);
}

/**
 * Batch process questions for deduplication
 * Returns normalized data suitable for storage
 */
export function batchFingerprint(questions = []) {
  if (!Array.isArray(questions)) return [];
  
  return questions.map(q => {
    const fp = generateFingerprint(q.text || q);
    return {
      questionId: q.id || null,
      text: (q.text || q).substring(0, 500),
      fingerprint: fp.fingerprint,
      keyTerms: fp.keyTerms,
      category: fp.category,
      hash: quickHash(q.text || q),
      normalized: fp.normalized
    };
  });
}

/**
 * Check if question is duplicate based on fingerprints
 * Returns: { isDuplicate: boolean, similarity: number, matchedQuestions: array }
 */
export function checkDuplicate(question, storedFingerprints = [], similarityThreshold = 85) {
  if (!storedFingerprints || storedFingerprints.length === 0) {
    return {
      isDuplicate: false,
      similarity: 0,
      matchedQuestions: [],
      reason: 'No stored questions to compare'
    };
  }
  
  const newFp = generateFingerprint(question);
  const matches = [];
  
  for (const stored of storedFingerprints) {
    // Quick check: exact fingerprint match
    if (newFp.fingerprint === stored.fingerprint) {
      matches.push({
        question: stored.text,
        similarity: 100,
        reason: 'exact-fingerprint-match'
      });
      continue;
    }
    
    // Key term overlap
    const storedTerms = new Set(stored.keyTerms || []);
    const newTerms = new Set(newFp.keyTerms);
    const overlap = [...newTerms].filter(t => storedTerms.has(t)).length;
    
    if (overlap > 0) {
      const similarity = calculateSimilarity(question, stored.text);
      if (similarity >= similarityThreshold) {
        matches.push({
          question: stored.text,
          similarity,
          reason: overlap === newTerms.size ? 'all-terms-match' : 'terms-overlap'
        });
      }
    }
  }
  
  // Sort by similarity
  matches.sort((a, b) => b.similarity - a.similarity);
  
  return {
    isDuplicate: matches.length > 0 && matches[0].similarity >= similarityThreshold,
    similarity: matches.length > 0 ? matches[0].similarity : 0,
    matchedQuestions: matches.slice(0, 3), // Top 3 matches
    reason: matches.length > 0 ? matches[0].reason : 'no-match'
  };
}

export default {
  normalizeQuestion,
  extractKeyTerms,
  generateFingerprint,
  detectCategory,
  calculateSimilarity,
  findSimilar,
  quickHash,
  batchFingerprint,
  checkDuplicate
};
