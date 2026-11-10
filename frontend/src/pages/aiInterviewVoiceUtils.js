import { buildApiUrl } from '../utils/safeApiUrl';

const DEFAULT_TTS_MAX_CHUNK_LENGTH = 220;

function sanitizeTtsInput(value) {
  return String(value || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function splitTextForTTS(input, maxChunkLength = DEFAULT_TTS_MAX_CHUNK_LENGTH) {
  const normalized = sanitizeTtsInput(input);
  if (!normalized) return [];

  const limit = Number.isFinite(maxChunkLength) && maxChunkLength > 40
    ? Math.floor(maxChunkLength)
    : DEFAULT_TTS_MAX_CHUNK_LENGTH;

  if (normalized.length <= limit) {
    return [normalized];
  }

  const sentences = normalized.match(/[^.!?]+[.!?]?/g) || [normalized];
  const chunks = [];
  let buffer = '';

  for (const sentence of sentences) {
    const candidate = `${buffer} ${sentence}`.trim();

    if (candidate.length <= limit) {
      buffer = candidate;
      continue;
    }

    if (buffer) {
      chunks.push(buffer);
      buffer = '';
    }

    if (sentence.length <= limit) {
      buffer = sentence.trim();
      continue;
    }

    // Fallback for very long single sentence: split by words.
    const words = sentence.trim().split(/\s+/);
    let wordBuffer = '';

    for (const word of words) {
      const wordCandidate = `${wordBuffer} ${word}`.trim();
      if (wordCandidate.length <= limit) {
        wordBuffer = wordCandidate;
      } else {
        if (wordBuffer) {
          chunks.push(wordBuffer);
        }
        wordBuffer = word;
      }
    }

    if (wordBuffer) {
      buffer = wordBuffer;
    }
  }

  if (buffer) {
    chunks.push(buffer);
  }

  return chunks.filter(Boolean);
}

export function buildAiInterviewTtsPayload({ text, interviewerGender }) {
  const sanitizedText = sanitizeTtsInput(text);

  return {
    text: sanitizedText,
    persona: 'interviewer',
    language: 'en',
    gender: interviewerGender === 'male' ? 'male' : 'female',
  };
}

export function buildAiInterviewVoiceApiUrl(path, rawBaseUrl) {
  const normalizedPath = String(path || '').replace(/^\/+/, '');
  return buildApiUrl(normalizedPath, {
    rawBaseUrl,
    apiPrefix: '/api',
  });
}

export function buildInterviewEndCleanup(options) {
  return function endInterview() {
    options?.clearPendingEndTimeout?.();
    options?.clearElapsedTimer?.();
    options?.stopVoiceRecording?.();
    options?.pauseCurrentTts?.();
    options?.cancelSpeechSynthesis?.();
    options?.setAiSpeaking?.(false);
    options?.setMicOn?.(false);
    options?.setPhase?.('summary');
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STT TECHNICAL TERMINOLOGY CORRECTION INFRASTRUCTURE (Milestone 1)
// ─────────────────────────────────────────────────────────────────────────────

export const WHISPER_DOMAIN_VOCABULARY_PROMPT =
  "Technical interview discussing Kubernetes, K8s, Redis, Kafka, BigQuery, gRPC, PostgreSQL, Postgres, MySQL, NoSQL, DynamoDB, MongoDB, Elasticsearch, GraphQL, Docker, kubectl, Terraform, CI/CD, NGINX, WebSockets, REST API, OAuth2, JWT, PyTorch, PySpark, TensorFlow, microservices, AWS Lambda, Next.js, TypeScript, ACID, CAP theorem, B-tree, idempotency, consistent hashing, rate limiting, sharding, O(1), O(n), O(log n), N+1.";

/**
 * 4-tier dynamic feature flag evaluation:
 * Tier 1: window.__PREPLOOP_FEATURE_FLAGS__.STT_CORRECTION
 * Tier 2: localStorage['preploop_feature_stt_correction'] or ['FEATURE_STT_CORRECTION']
 * Tier 3: import.meta.env.VITE_FEATURE_STT_CORRECTION
 * Tier 4: default false
 */
export function isSttCorrectionEnabled() {
  try {
    if (typeof window !== 'undefined' && window.__PREPLOOP_FEATURE_FLAGS__) {
      const winVal = window.__PREPLOOP_FEATURE_FLAGS__.STT_CORRECTION;
      if (typeof winVal === 'boolean') return winVal;
      if (typeof winVal === 'string') {
        const lower = winVal.trim().toLowerCase();
        if (lower === 'true' || lower === '1' || lower === 'on') return true;
        if (lower === 'false' || lower === '0' || lower === 'off') return false;
      }
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      const storageVal =
        window.localStorage.getItem('preploop_feature_stt_correction') ??
        window.localStorage.getItem('FEATURE_STT_CORRECTION');

      if (storageVal !== null && storageVal !== undefined) {
        const lower = String(storageVal).trim().toLowerCase();
        if (lower === 'true' || lower === '1' || lower === 'on') return true;
        if (lower === 'false' || lower === '0' || lower === 'off') return false;
      }
    }

    if (typeof import.meta !== 'undefined' && import.meta?.env) {
      const envVal = import.meta.env.VITE_FEATURE_STT_CORRECTION;
      if (envVal === true || envVal === 'true' || envVal === '1') return true;
    }
  } catch {
    return false;
  }

  return false;
}

export function setSttCorrectionFeatureFlag(enabled, options = {}) {
  if (typeof window === 'undefined') return;

  if (enabled === null || enabled === undefined) {
    if (window.__PREPLOOP_FEATURE_FLAGS__) {
      delete window.__PREPLOOP_FEATURE_FLAGS__.STT_CORRECTION;
    }
    if (options.persist && window.localStorage) {
      try {
        window.localStorage.removeItem('preploop_feature_stt_correction');
        window.localStorage.removeItem('FEATURE_STT_CORRECTION');
      } catch {}
    }
    return;
  }

  const boolVal = Boolean(enabled);
  if (!window.__PREPLOOP_FEATURE_FLAGS__) {
    window.__PREPLOOP_FEATURE_FLAGS__ = {};
  }
  window.__PREPLOOP_FEATURE_FLAGS__.STT_CORRECTION = boolVal;

  if (options.persist && window.localStorage) {
    try {
      window.localStorage.setItem('preploop_feature_stt_correction', String(boolVal));
    } catch {}
  }
}

export function clearSttCorrectionFeatureFlags() {
  if (typeof window === 'undefined') return;
  if (window.__PREPLOOP_FEATURE_FLAGS__) {
    delete window.__PREPLOOP_FEATURE_FLAGS__.STT_CORRECTION;
  }
  if (window.localStorage) {
    try {
      window.localStorage.removeItem('preploop_feature_stt_correction');
      window.localStorage.removeItem('FEATURE_STT_CORRECTION');
    } catch {}
  }
}

function resolveFlagSource(options) {
  if (options?.enabled || options?.force || options?.forceEnabled) return 'forced';
  try {
    if (
      typeof window !== 'undefined' &&
      window.__PREPLOOP_FEATURE_FLAGS__ &&
      window.__PREPLOOP_FEATURE_FLAGS__.STT_CORRECTION !== undefined
    ) {
      return 'window';
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      if (
        window.localStorage.getItem('preploop_feature_stt_correction') !== null ||
        window.localStorage.getItem('FEATURE_STT_CORRECTION') !== null
      ) {
        return 'localStorage';
      }
    }
    if (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_FEATURE_STT_CORRECTION) {
      return 'env';
    }
  } catch {}
  return 'default';
}

// ─────────────────────────────────────────────────────────────────────────────
// TELEMETRY RING BUFFER (Max 500 items, No PII)
// ─────────────────────────────────────────────────────────────────────────────

export const sttTelemetryLog = [];

export function logSttCorrectionTelemetry(record) {
  try {
    sttTelemetryLog.push(record);
    if (sttTelemetryLog.length > 500) {
      sttTelemetryLog.shift();
    }

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('preploop:stt_correction', { detail: record }));
    }
  } catch {}
}

export const emitSttTelemetry = logSttCorrectionTelemetry;

export function getRecentSttTelemetry() {
  return [...sttTelemetryLog];
}

export const getSttTelemetryLog = getRecentSttTelemetry;

export function clearSttTelemetry() {
  sttTelemetryLog.length = 0;
}

export const clearSttTelemetryLog = clearSttTelemetry;

// ─────────────────────────────────────────────────────────────────────────────
// COMMON ENGLISH WORDS BLOCKLIST
// Prevents standard English conversational words from being fuzzy matched
// ─────────────────────────────────────────────────────────────────────────────

export const COMMON_ENGLISH_WORDS = new Set([
  // Stop words, pronouns, prepositions
  'about', 'above', 'after', 'again', 'against', 'almost', 'along', 'already', 'also', 'although',
  'always', 'among', 'another', 'around', 'because', 'before', 'behind', 'below', 'beneath',
  'beside', 'between', 'beyond', 'during', 'either', 'enough', 'except', 'further', 'however',
  'inside', 'instead', 'little', 'myself', 'neither', 'nobody', 'nothing', 'outside', 'rather',
  'seldom', 'several', 'should', 'someone', 'something', 'themselves', 'through', 'together',
  'toward', 'towards', 'under', 'unless', 'until', 'whether', 'without', 'within',

  // Ambiguous homophones & protected everyday words
  'radius', 'radii', 'sequel', 'sequels', 'darker', 'docker', 'dock', 'docks', 'docked', 'docking',
  'rest', 'rests', 'resting', 'rested', 'cough', 'coughs', 'coughed', 'coughing', 'spark', 'sparks',
  'torch', 'torches', 'apple', 'dinner', 'ready', 'rides', 'quiet', 'breeze', 'market', 'harbor',
  'mountain', 'mountains', 'train', 'trains', 'ticket', 'station', 'family', 'table',
  'bread', 'baker', 'bakery', 'kitchen', 'doctor', 'clinic', 'hospital', 'pulse', 'blood',
  'pressure', 'patient', 'patients', 'medicine', 'blanket', 'blankets', 'closet', 'wooden',
  'leather', 'cotton', 'metal', 'copper', 'silver', 'yellow', 'orange', 'purple', 'green',

  // High-frequency nouns, verbs & adjectives (>= 5 chars)
  'action', 'active', 'actual', 'address', 'advice', 'afford', 'agency', 'agenda', 'agreed',
  'animal', 'annual', 'answer', 'appeal', 'appear', 'arrival', 'artist', 'aspect', 'assess',
  'attack', 'attempt', 'attend', 'august', 'author', 'avenue', 'average', 'balance', 'banking',
  'battle', 'beauty', 'becoming', 'bedroom', 'belief', 'belong', 'benefit', 'better',
  'billion', 'bitter', 'borrow', 'bottle', 'bottom', 'branch', 'breathe', 'bridge', 'bright',
  'budget', 'buffer', 'burden', 'button', 'camera', 'campus', 'cancer', 'candle', 'canvas',
  'capital', 'captain', 'career', 'castle', 'casual', 'caught', 'caution', 'center', 'centre',
  'century', 'certain', 'chamber', 'chance', 'change', 'channel', 'chapter', 'charge', 'charity',
  'cheese', 'chemical', 'choice', 'choose', 'church', 'cinema', 'circle', 'circular', 'citizen',
  'classic', 'climate', 'closed', 'closely', 'clothes', 'clothing', 'coffee', 'collect', 'college',
  'colony', 'column', 'combat', 'comfort', 'command', 'comment', 'common', 'company', 'compare',
  'compete', 'complex', 'compose', 'concept', 'concern', 'concert', 'conduct', 'confirm', 'connect',
  'consent', 'consist', 'contact', 'contain', 'content', 'contest', 'context', 'control', 'convert',
  'corner', 'correct', 'corridor', 'costly', 'council', 'counsel', 'counter', 'country',
  'county', 'couple', 'courage', 'course', 'cousin', 'covered', 'creator', 'credit', 'cricket',
  'crisis', 'critic', 'crucial', 'crystal', 'culture', 'current', 'custom', 'damage', 'danger',
  'darkness', 'daughter', 'dealer', 'debate', 'decade', 'decide', 'decision', 'declare', 'decline',
  'defeat', 'defend', 'defense', 'deficit', 'deliver', 'demand', 'density', 'deposit', 'deputy',
  'derive', 'describe', 'desert', 'design', 'desire', 'detail', 'detect', 'develop', 'device',
  'devote', 'differ', 'direct', 'director', 'disaster', 'discuss', 'disease', 'display',
  'dispute', 'distant', 'distinct', 'district', 'diverse', 'divide', 'division', 'document',
  'dollar', 'domain', 'domestic', 'double', 'dragon', 'drawer', 'drawing', 'dream', 'driver',
  'driving', 'dynamic', 'earlier', 'eastern', 'economic', 'economy', 'edition', 'editor', 'educate',
  'effect', 'effort', 'eighty', 'elderly', 'election', 'element', 'elephant', 'eleven', 'eliminate',
  'emerge', 'emotion', 'emphasis', 'empire', 'employ', 'employee', 'employer', 'enact', 'endless',
  'energy', 'engage', 'engine', 'engineer', 'enhance', 'enjoy', 'enormous', 'ensure', 'enterprise',
  'entire', 'entity', 'entrance', 'envelope', 'episode', 'equality', 'equation', 'equipment',
  'escape', 'estate', 'estimate', 'evening', 'event', 'evident', 'exactly', 'examine', 'example',
  'exchange', 'excite', 'execute', 'exercise', 'exhibit', 'exist', 'expense', 'expert', 'explain',
  'explore', 'express', 'extend', 'extent', 'external', 'extreme', 'fabric', 'facility', 'factor',
  'factory', 'faculty', 'failure', 'fairly', 'famous', 'farmer', 'fashion', 'father', 'fault',
  'feature', 'federal', 'feeling', 'female', 'fiction', 'fifteen', 'fighter', 'figure', 'financial',
  'finding', 'finger', 'finish', 'fiscal', 'flavor', 'flight', 'flower', 'flying', 'folder',
  'follow', 'football', 'forecast', 'forest', 'forever', 'forget', 'formal', 'format', 'former',
  'formula', 'fortune', 'forward', 'founder', 'fourth', 'fraction', 'fragment', 'freedom', 'freeze',
  'frequency', 'frequent', 'friend', 'friendly', 'frontier', 'frozen', 'fulfill', 'function',
  'funeral', 'furniture', 'future', 'galaxy', 'gallery', 'garage', 'garden', 'gather',
  'gender', 'general', 'generate', 'generic', 'generous', 'genetic', 'genius', 'gentle', 'genuine',
  'gesture', 'global', 'golden', 'govern', 'governor', 'graduate', 'grain', 'grammar', 'grand',
  'grant', 'grass', 'grateful', 'gravity', 'greater', 'greatest', 'greatly', 'grocery', 'ground',
  'growth', 'guarantee', 'guidance', 'guitar', 'habitat', 'halfway', 'handle', 'handling',
  'hardly', 'harvest', 'hazard', 'heading', 'headline', 'healthy', 'hearing', 'heaven', 'height',
  'helpful', 'heritage', 'heroic', 'hidden', 'highway', 'historic', 'history', 'holiday', 'honest',
  'horizon', 'horror', 'hostile', 'housing', 'hundred', 'hungry', 'hunting',
  'husband', 'iceberg', 'identity', 'ignore', 'illegal', 'illness', 'illustrate', 'imagine',
  'immediate', 'immense', 'impact', 'implement', 'imply', 'import', 'impose', 'impress', 'improve',
  'incident', 'include', 'income', 'increase', 'indeed', 'index', 'indicate', 'indoor', 'industry',
  'infant', 'inform', 'inherit', 'initial', 'injure', 'injury', 'innocent', 'input', 'inquiry',
  'insight', 'insist', 'inspect', 'inspire', 'install', 'instance', 'instant', 'intact',
  'intake', 'intend', 'intense', 'intent', 'interact', 'interest', 'internal', 'internet', 'interval',
  'intimate', 'invade', 'invent', 'invest', 'invite', 'involve', 'island', 'isolate', 'issue',
  'jacket', 'journal', 'journey', 'judge', 'judgment', 'judicial', 'junior', 'justice', 'justify',
  'kingdom', 'ladder', 'landing', 'language', 'lantern', 'laptop', 'largely', 'lasting',
  'latter', 'launch', 'lawyer', 'leader', 'leadership', 'leading', 'league', 'lecture',
  'legacy', 'legend', 'legislate', 'length', 'lesson', 'letter', 'level', 'liability', 'liberal',
  'liberty', 'library', 'license', 'lifetime', 'lighting', 'likely', 'limit', 'limited', 'linear',
  'lineup', 'linguistic', 'liquid', 'listen', 'listener', 'literary', 'literature',
  'living', 'locate', 'location', 'logical', 'lonely', 'longer', 'lookup', 'lumber', 'luxury',
  'machine', 'magazine', 'magnetic', 'magnificent', 'magnitude', 'mailbox', 'maintain', 'major',
  'majority', 'manage', 'manager', 'mandate', 'manner', 'mansion', 'manual', 'margin', 'marine',
  'marker', 'marriage', 'marshal', 'massive', 'master', 'match', 'material', 'math',
  'matrix', 'matter', 'maximum', 'meaning', 'measure', 'mechanism', 'medical', 'medium',
  'melody', 'member', 'membrane', 'memorial', 'memory', 'mental', 'mention', 'mentor', 'mercantile',
  'merchant', 'merely', 'merger', 'merit', 'message', 'meteor', 'method', 'middle', 'midnight',
  'military', 'million', 'mineral', 'minimal', 'minimum', 'minister', 'ministry', 'minute',
  'miracle', 'mirror', 'missile', 'mission', 'mistake', 'mixture', 'mobile', 'mobility', 'model',
  'moderate', 'modern', 'modest', 'modify', 'module', 'molecule', 'moment', 'monarch', 'monastery',
  'monetary', 'monitor', 'monster', 'monthly', 'monument', 'morale', 'morality', 'morning', 'mortality',
  'mortgage', 'mosaic', 'mother', 'motion', 'motivate', 'motive', 'motor', 'mounted',
  'movement', 'multiple', 'multiply', 'municipal', 'murder', 'muscle', 'museum', 'musical', 'musician',
  'mutual', 'mystery', 'narrative', 'narrow', 'nation', 'national', 'native', 'natural', 'nature',
  'nausea', 'nearby', 'nearly', 'necklace', 'needle', 'negative', 'neglect', 'neighbor',
  'nervous', 'neutral', 'newly', 'nicely', 'night', 'nocturnal', 'nominal', 'nonprofit',
  'nonsense', 'normal', 'normally', 'northern', 'notable', 'notice', 'notion', 'novel', 'novelist',
  'nuclear', 'number', 'numeral', 'nurse', 'nursery', 'nutrient', 'object', 'oblige', 'observe',
  'obstacle', 'obtain', 'obvious', 'occasion', 'occupy', 'occur', 'ocean', 'offense', 'offensive',
  'offering', 'office', 'officer', 'official', 'offset', 'oldest', 'ongoing', 'online', 'opening',
  'operate', 'operator', 'opinion', 'opponent', 'oppose', 'opposite', 'optimism', 'option',
  'optical', 'orbit', 'orchestra', 'order', 'ordinary', 'organic', 'organism', 'origin',
  'original', 'orphan', 'outcome', 'outdoor', 'outer', 'outline', 'outlook', 'output', 'outrage',
  'overall', 'overcome', 'overlook', 'oversee', 'package', 'packet', 'painful', 'painter', 'painting',
  'palace', 'palette', 'pamphlet', 'panel', 'panic', 'parade', 'paradox', 'parallel', 'parent',
  'parish', 'parking', 'parliament', 'partly', 'partner', 'passage', 'passenger', 'passion',
  'passive', 'pastor', 'patent', 'pathway', 'patience', 'patrol', 'patron', 'pattern',
  'payable', 'payment', 'peasant', 'peculiar', 'penalty', 'pension', 'people', 'perceive', 'percent',
  'perfect', 'perform', 'perfume', 'period', 'perish', 'permanent', 'permit', 'persist', 'person',
  'personal', 'persuade', 'petition', 'pharmacy', 'phenomenon', 'philosophy', 'phoenix', 'phrase',
  'physical', 'physics', 'picture', 'piecemeal', 'pillar', 'pilot', 'pioneer', 'pipeline', 'pirate',
  'pitcher', 'placement', 'planet', 'planned', 'planner', 'plastic', 'plateau', 'platform', 'player',
  'pleasant', 'pleasure', 'pledge', 'plenty', 'pocket', 'poetry', 'pointer', 'poison', 'polar',
  'policy', 'polish', 'polite', 'political', 'politics', 'pollen', 'polygon', 'popular', 'populous',
  'portion', 'portrait', 'position', 'positive', 'possess', 'possible', 'postal', 'posture', 'pottery',
  'poultry', 'poverty', 'powder', 'powerful', 'practice', 'prairie', 'preach', 'precede', 'precious',
  'precise', 'predict', 'preface', 'prefer', 'premier', 'premise', 'premium', 'prepare', 'present',
  'preserve', 'preside', 'president', 'prestige', 'pretend', 'pretty', 'prevail',
  'prevent', 'previous', 'priest', 'primary', 'primate', 'primitive', 'prince', 'princess',
  'principal', 'principle', 'printer', 'priority', 'prison', 'prisoner', 'privacy', 'private',
  'privilege', 'probable', 'problem', 'procedure', 'proceed', 'process', 'produce', 'producer',
  'product', 'profession', 'professor', 'profile', 'profit', 'profound', 'program', 'progress',
  'project', 'prolong', 'prominent', 'promise', 'promote', 'prompt', 'pronounce', 'proper',
  'property', 'proposal', 'propose', 'prospect', 'protect', 'protein', 'protest', 'protocol',
  'proud', 'provide', 'province', 'provoke', 'prudent', 'public', 'publish', 'publisher',
  'pumpkin', 'purchase', 'purpose', 'pursuit', 'puzzle', 'pyramid', 'qualify', 'quality', 'quantity',
  'quarter', 'queen', 'quest', 'question', 'quickly', 'radar', 'radiant', 'radical',
  'rainbow', 'rally', 'random', 'ranking', 'rapid', 'rarely', 'rating', 'ratio', 'rational',
  'reaction', 'reader', 'readily', 'reading', 'realistic', 'reality', 'realize', 'really', 'reason',
  'receipt', 'receive', 'receiver', 'recent', 'reception', 'recipe', 'reckon', 'recognize', 'recommend',
  'record', 'recover', 'recovery', 'recruit', 'reduce', 'referee', 'reflect', 'reform', 'refuge',
  'refugee', 'refusal', 'refuse', 'regard', 'regime', 'region', 'register', 'regular', 'regulate',
  'reject', 'relate', 'relation', 'relative', 'relax', 'release', 'relevant', 'reliable', 'relief',
  'religion', 'remain', 'remark', 'remedy', 'remember', 'remind', 'remote', 'removal', 'remove',
  'render', 'renew', 'rental', 'repair', 'repeat', 'replace', 'replica', 'reply', 'report',
  'represent', 'republic', 'request', 'require', 'rescue', 'research', 'resemble', 'reserve',
  'resident', 'resign', 'resist', 'resolve', 'resort', 'resource', 'respect', 'respond', 'response',
  'restore', 'restrain', 'restrict', 'result', 'retail', 'retain', 'retire', 'retreat', 'return',
  'reveal', 'revenue', 'reverse', 'review', 'revise', 'revive', 'revolt', 'reward', 'rhythm',
  'ribbon', 'rider', 'ridge', 'rifle', 'righteous', 'rigorous', 'rival', 'river', 'roadway',
  'robbery', 'robust', 'rocket', 'romance', 'rooftop', 'rotate', 'rotation', 'roughly', 'routine',
  'royalty', 'rubber', 'ruined', 'rumor', 'runner', 'running', 'rural', 'sacred', 'sacrifice',
  'safety', 'sailor', 'salary', 'sample', 'sanction', 'sandstone', 'satellite', 'satisfy',
  'saving', 'scandal', 'scenic', 'schedule', 'scholar', 'school', 'science', 'scientist', 'scope',
  'screen', 'script', 'scrutiny', 'sculpture', 'search', 'season', 'second', 'secret', 'section',
  'sector', 'secular', 'secure', 'security', 'segment', 'select', 'seller', 'semantic',
  'seminar', 'senate', 'senator', 'senior', 'sensation', 'sense', 'sensor', 'sentence', 'separate',
  'sequence', 'sergeant', 'series', 'serious', 'servant', 'server', 'service', 'session', 'settle',
  'settlement', 'severe', 'shadow', 'shallow', 'shelter', 'sheriff', 'shield', 'shift', 'shipping',
  'shock', 'shortage', 'shortly', 'shoulder', 'shower', 'shrink', 'sickness', 'sidewalk', 'signal',
  'signature', 'silence', 'silent', 'similar', 'simple', 'simply', 'simulate', 'sincere',
  'single', 'sister', 'situation', 'sketch', 'skilled', 'sleeve', 'slight', 'slogan', 'smooth',
  'soccer', 'social', 'society', 'software', 'soldier', 'solitary', 'solution', 'somebody', 'someday',
  'somewhat', 'source', 'southern', 'sovereign', 'spacious', 'special', 'species', 'specific',
  'spectrum', 'speech', 'speed', 'spelling', 'sphere', 'spiral', 'spirit', 'splendid', 'sponsor',
  'spontaneous', 'sport', 'spread', 'spring', 'square', 'stability', 'stable', 'stadium', 'staff',
  'stage', 'stair', 'standard', 'standing', 'statement', 'statistic', 'status', 'statute',
  'steady', 'steam', 'stimulus', 'stomach', 'storage', 'strain', 'strange', 'stranger', 'strategy',
  'stream', 'street', 'strength', 'stress', 'stretch', 'strict', 'strike', 'string', 'strip',
  'stroke', 'strong', 'structure', 'struggle', 'student', 'studio', 'stumble', 'subject', 'submit',
  'substance', 'subtle', 'suburb', 'succeed', 'success', 'sudden', 'suffer', 'suggest', 'suicide',
  'suitable', 'summary', 'summer', 'summit', 'sunlight', 'sunrise', 'sunset', 'sunshine', 'superior',
  'supply', 'support', 'suppose', 'supreme', 'surface', 'surgeon', 'surgery', 'surprise', 'surrender',
  'surround', 'survey', 'survival', 'survive', 'suspect', 'suspend', 'sustain', 'swallow', 'sweater',
  'switch', 'symbol', 'symmetry', 'sympathy', 'symptom', 'syndrome', 'system', 'tactical', 'tailor',
  'talent', 'tangle', 'tariff', 'target', 'teacher', 'teaspoon', 'technique', 'telecom', 'telescope',
  'temper', 'temple', 'temporal', 'tenant', 'tendency', 'tender', 'tennis', 'tension', 'terminal',
  'terrace', 'terrain', 'terrible', 'territory', 'terror', 'testament', 'testimony', 'textbook',
  'texture', 'theater', 'theology', 'theorem', 'theory', 'therapist', 'therapy', 'thermal', 'thick',
  'thorough', 'threat', 'threshold', 'thrive', 'timber', 'timely', 'timing',
  'tissue', 'tobacco', 'toilet', 'tolerance', 'tolerate', 'tongue', 'tonight', 'topical',
  'tornado', 'total', 'touch', 'tourist', 'tournament', 'tower', 'toxic', 'trace',
  'tractor', 'tradition', 'traffic', 'tragedy', 'tragic', 'trail', 'trailer', 'trainer', 'training',
  'trait', 'traitor', 'trample', 'trance', 'transfer', 'transit', 'transmit', 'transport', 'trap',
  'trauma', 'travel', 'tread', 'treasure', 'treaty', 'tremble', 'trend', 'triangle', 'tribal',
  'tribute', 'trick', 'trigger', 'triumph', 'tropical', 'trouble', 'truck', 'truly', 'trust',
  'truth', 'tsunami', 'tunnel', 'turkey', 'turning', 'twelve', 'twenty', 'typical', 'tyranny',
  'ultimate', 'umbrella', 'unable', 'unclear', 'uncover', 'undergo', 'uniform', 'unique',
  'unity', 'universe', 'unjust', 'unknown', 'unlike', 'unlock', 'unusual', 'update',
  'upheld', 'uphold', 'uplift', 'upper', 'upright', 'uprising', 'upward', 'urban', 'urgent',
  'useful', 'useless', 'vacation', 'vacuum', 'valley', 'valuable', 'vanish', 'variable', 'variety',
  'various', 'vehicle', 'velocity', 'venture', 'venue', 'verdict', 'version', 'vertical', 'vessel',
  'veteran', 'viable', 'vibrant', 'victim', 'victory', 'viewer', 'vigorous', 'village', 'villain',
  'vintage', 'violate', 'violence', 'virtual', 'virtue', 'visible', 'vision', 'visitor', 'visual',
  'vital', 'vivid', 'vocal', 'volume', 'voluntary', 'volunteer', 'voter', 'voting', 'voyage',
  'vulnerable', 'waiter', 'waiting', 'walkway', 'wallet', 'warfare', 'warning', 'warrant', 'warrior',
  'water', 'wave', 'wealth', 'weapon', 'weather', 'website', 'wedding', 'weekend', 'welcome',
  'welfare', 'western', 'wetland', 'wheat', 'wheel', 'whisper', 'whistle', 'whoever', 'widely',
  'wildlife', 'willing', 'window', 'winner', 'winter', 'wisdom', 'withdraw', 'witness', 'wizard',
  'wonder', 'worker', 'working', 'workplace', 'workshop', 'worldwide', 'worship', 'worthy',
  'wrestle', 'writer', 'writing', 'written', 'yacht', 'yearly', 'yield', 'young', 'youth',
  'zealous', 'zenith', 'zigzag', 'zodiac', 'zone'
]);

// ─────────────────────────────────────────────────────────────────────────────
// LEVENSHTEIN DISTANCE & FUZZY MATCHING
// ─────────────────────────────────────────────────────────────────────────────

export function levenshteinDistance(a, b) {
  if (a === b) return 0;
  const aLen = a.length;
  const bLen = b.length;
  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  let prevRow = new Array(bLen + 1);
  let currRow = new Array(bLen + 1);

  for (let j = 0; j <= bLen; j++) prevRow[j] = j;

  for (let i = 1; i <= aLen; i++) {
    currRow[0] = i;
    const aChar = a.charCodeAt(i - 1);
    for (let j = 1; j <= bLen; j++) {
      const cost = aChar === b.charCodeAt(j - 1) ? 0 : 1;
      currRow[j] = Math.min(
        currRow[j - 1] + 1,       // insertion
        prevRow[j] + 1,           // deletion
        prevRow[j - 1] + cost     // substitution
      );
    }
    const temp = prevRow;
    prevRow = currRow;
    currRow = temp;
  }
  return prevRow[bLen];
}

export function normalizedLevenshteinSimilarity(s1, s2) {
  if (!s1 || !s2) return 0;
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(s1.toLowerCase(), s2.toLowerCase());
  return 1 - dist / maxLen;
}

export const FUZZY_TECHNICAL_TARGETS = [
  { term: 'Kubernetes', canonical: 'Kubernetes', minLen: 8 },
  { term: 'PostgreSQL', canonical: 'PostgreSQL', minLen: 8 },
  { term: 'Elasticsearch', canonical: 'Elasticsearch', minLen: 9 },
  { term: 'microservices', canonical: 'microservices', minLen: 9 },
  { term: 'idempotent', canonical: 'idempotent', minLen: 8 },
  { term: 'idempotency', canonical: 'idempotency', minLen: 8 },
  { term: 'DynamoDB', canonical: 'DynamoDB', minLen: 7 },
  { term: 'Terraform', canonical: 'Terraform', minLen: 7 },
  { term: 'Prometheus', canonical: 'Prometheus', minLen: 8 },
  { term: 'Wireshark', canonical: 'Wireshark', minLen: 7 },
  { term: 'RabbitMQ', canonical: 'RabbitMQ', minLen: 7 },
  { term: 'ZooKeeper', canonical: 'ZooKeeper', minLen: 7 },
  { term: 'WebSockets', canonical: 'WebSockets', minLen: 8 },
  { term: 'TypeScript', canonical: 'TypeScript', minLen: 8 },
];

// ─────────────────────────────────────────────────────────────────────────────
// TECHNICAL DICTIONARY & CONTEXTUAL PATTERNS
// ─────────────────────────────────────────────────────────────────────────────

const DISTANCE_OR_VICINITY_REGEX =
  /\b(?:mile|miles|kilometer|kilometers|km|meter|meters|m|cm|inch|inches|foot|feet|yard|yards|circle|sphere|cylinder|diameter|circumference|arc|curve|polygon|geometry|turning\s+radius|search\s+radius|outer\s+radius|inner\s+radius|blast\s+radius|spectral\s+radius|radius\s+of|within\s+(?:a|the|any)?\s*(?:[\w-]+\s+){0,3}radius|in\s+a\s+(?:[\w-]+\s+){0,2}radius)\b/i;

const NUMERIC_DISTANCE_PATTERN =
  /\b(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|twenty|fifty|several|few)\s*(?:-|\s)*(?:mile|miles|km|kilometer|kilometers|meter|meters|m|cm|inch|inches|foot|feet|block|blocks|yard|yards)\b/i;

const CACHE_OR_STORE_KEYWORDS =
  /\b(?:cache|caching|in-memory|pub\/sub|pubsub|key-value|ttl|sentinel|storage|store)\b/i;

const NARRATIVE_LITERATURE_KEYWORDS =
  /\b(?:movie|movies|film|films|book|books|novel|novels|story|stories|author|director|actor|actors|actress|cinema|theater|theatre|trilogy|franchise|original|part\s+two|episode|written|read|watched|screenplay|plot|character|characters)\b/i;

const DATABASE_QUERY_KEYWORDS =
  /\b(?:database|databases|query|queries|table|tables|schema|schemas|relational|rdbms|postgres|mysql|sqlite|nosql|join|joins|select|insert|update|index|sql)\b/i;

const MARITIME_KEYWORDS =
  /\b(?:boat|boats|ship|ships|harbor|harbour|pier|maritime|water|ocean|lake|fishing|cargo|loading\s+dock|wooden\s+dock|docked|docking|sailor|sailors|ferry)\b/i;

const RELAXATION_KEYWORDS =
  /\b(?:take\s+a\s+rest|get\s+(?:some|a\s+good\s+night\s+of)\s+rest|rest\s+of|the\s+rest\s+of|mind\s+at\s+rest|rested|resting|sleep|tired|break|relax|relaxation|vacation|peace|remainder|pause|holiday)\b/i;

const STREAMING_KEYWORDS =
  /\b(?:apache|event|events|stream|streams|streaming|broker|brokers|topic|topics|partition|partitions|consumer|producer|pubsub|pub-sub|queue|offset|zookeeper|throughput|distributed\s+log)\b/i;

const MEDICAL_KEYWORDS =
  /\b(?:patient|sick|illness|cold|flu|disease|medicine|hospital|clinic)\b/i;

const ML_KEYWORDS =
  /\b(?:machine\s*learning|deep\s*learning|neural|tensor|model|training|train|gpu|gpus|gradient|python|nlp|vision|loss)\b/i;

const CULINARY_KEYWORDS =
  /\b(?:baked|apple|warm|sweet|eat|eating|dinner|dessert|kitchen|cavern|cave|fire|torch\s+through)\b/i;

const BIG_DATA_KEYWORDS =
  /\b(?:spark|dataframe|rdd|big\s*data|hadoop|distributed|cluster|python)\b/i;

const CLOUD_ANALYTICS_KEYWORDS =
  /\b(?:google|gcp|warehouse|data|analytics|dataset|datasets|query|queries|sql|table|bytes|petabytes|terabytes|partition|cloud)\b/i;

/**
 * Main correction entrypoint.
 * Non-destructive: returns new string, preserves verbatim text in raw callers.
 */
export function correctSttTechnicalTerms(text, options = {}) {
  if (!text || typeof text !== 'string') {
    return text || '';
  }

  const isForced = Boolean(options?.enabled || options?.force || options?.forceEnabled);
  if (!isForced && !isSttCorrectionEnabled()) {
    return text;
  }

  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const replacements = [];

  const contextStr = [
    text,
    options?.context,
    options?.recentPrompts,
    options?.question,
  ]
    .filter(Boolean)
    .join(' ');

  let currentText = text;

  // Helper to record replacement
  const applyReplacement = (fromPattern, replaceFnOrStr, rule, confidence = 1.0) => {
    currentText = currentText.replace(fromPattern, (match, ...args) => {
      const offset = typeof args[args.length - 2] === 'number' ? args[args.length - 2] : 0;
      const replaced = typeof replaceFnOrStr === 'function' ? replaceFnOrStr(match, ...args) : replaceFnOrStr;
      if (replaced !== match) {
        replacements.push({
          originalToken: match,
          correctedToken: replaced,
          ruleTriggered: rule,
          confidence,
          position: offset,
        });
      }
      return replaced;
    });
  };

  // ── Contextual Guard: "radius" vs "Redis" ────────────────────────────────
  const hasGlobalDistanceOrGeometry =
    DISTANCE_OR_VICINITY_REGEX.test(contextStr) || NUMERIC_DISTANCE_PATTERN.test(contextStr);

  // Bigram check: "radius cache" / "radius server" / etc.
  if (!hasGlobalDistanceOrGeometry) {
    applyReplacement(
      /\b(?:radius)\s+(cache|caching|cluster|server|instance|store|database|db|node|sentinel|replica|key-value)\b/gi,
      (_m, p1) => `Redis ${p1}`,
      'contextual_homophone'
    );
    applyReplacement(
      /\b(in-memory|clustered|standalone|hosted|managed|local|remote)\s+(?:radius)\b/gi,
      (_m, p1) => `${p1} Redis`,
      'contextual_homophone'
    );
  }

  // Standalone "radius" with local window inspection (+/- 50 chars)
  currentText = currentText.replace(/\b(?:radius)\b/gi, (match, offset) => {
    const windowStart = Math.max(0, offset - 50);
    const windowEnd = Math.min(currentText.length, offset + match.length + 50);
    const localSlice = currentText.slice(windowStart, windowEnd);

    const localDistance =
      DISTANCE_OR_VICINITY_REGEX.test(localSlice) || NUMERIC_DISTANCE_PATTERN.test(localSlice);

    if (localDistance || hasGlobalDistanceOrGeometry) {
      return match; // Keep distance/geometry radius untouched!
    }

    if (CACHE_OR_STORE_KEYWORDS.test(contextStr)) {
      replacements.push({
        originalToken: match,
        correctedToken: 'Redis',
        ruleTriggered: 'contextual_homophone',
        confidence: 1.0,
        position: offset,
      });
      return 'Redis';
    }

    return match;
  });

  // ── Contextual Guard: "sequel" vs "SQL" ──────────────────────────────────
  const hasNarrative = NARRATIVE_LITERATURE_KEYWORDS.test(contextStr);
  const hasDatabase = DATABASE_QUERY_KEYWORDS.test(contextStr);

  // Unambiguous compounds
  applyReplacement(/\b(?:see\s*sequel|c\s*sequel|seek\s*well)\b/gi, 'SQL', 'dictionary_direct');
  applyReplacement(/\b(?:no\s*sequel|know\s*sequel|no-sequel)\b/gi, 'NoSQL', 'dictionary_direct');
  applyReplacement(/\b(?:my\s*sequel)\b/gi, 'MySQL', 'dictionary_direct');

  if (!hasNarrative) {
    applyReplacement(/\b(?:sequel\s+query)\b/gi, 'SQL query', 'contextual_homophone');
    applyReplacement(/\b(?:sequel\s+queries)\b/gi, 'SQL queries', 'contextual_homophone');
    applyReplacement(/\b(?:sequel\s+database)\b/gi, 'SQL database', 'contextual_homophone');

    if (hasDatabase) {
      applyReplacement(/\b(?:sequel)\b/gi, 'SQL', 'contextual_homophone');
    }
  }

  // ── Contextual Guard: "dock" vs "Docker" ─────────────────────────────────
  const hasMaritime = MARITIME_KEYWORDS.test(contextStr);
  if (!hasMaritime) {
    applyReplacement(/\b(?:darker\s+container|dock\s*er\s+container|dock\s+container)\b/gi, 'Docker container', 'contextual_homophone');
    applyReplacement(/\b(?:dock\s*er\s*file)\b/gi, 'Dockerfile', 'dictionary_direct');
    applyReplacement(/\b(?:dock\s*er\s*compose)\b/gi, 'docker-compose', 'dictionary_direct');
  }

  // ── Contextual Guard: "rest" vs "REST" ───────────────────────────────────
  const hasRelaxation = RELAXATION_KEYWORDS.test(contextStr);
  if (!hasRelaxation) {
    applyReplacement(/\b(?:rest\s*a\s*p\s*i)\b/gi, 'REST API', 'contextual_homophone');
    applyReplacement(/\b(?:rest\s*apis)\b/gi, 'REST APIs', 'contextual_homophone');
    applyReplacement(/\b(?:restful)\b/gi, 'RESTful', 'contextual_homophone');
    applyReplacement(/\b(?:rest\s+(?:endpoint|endpoints))\b/gi, (_m, p1) => `REST ${p1 || 'endpoint'}`, 'contextual_homophone');
  }

  // ── Contextual Guard: "cough car" vs "Kafka" ─────────────────────────────
  applyReplacement(/\b(?:apache\s+(?:cough\s*car|cafca|kafta|calf\s*ka))\b/gi, 'Apache Kafka', 'dictionary_direct');
  if (STREAMING_KEYWORDS.test(contextStr) && !MEDICAL_KEYWORDS.test(contextStr)) {
    applyReplacement(/\b(?:cough\s*car|cafca|kafta|calf\s*ka)\b/gi, 'Kafka', 'contextual_homophone');
  }

  // ── Contextual Guard: "pie torch" vs "PyTorch" ───────────────────────────
  if (ML_KEYWORDS.test(contextStr) && !CULINARY_KEYWORDS.test(contextStr)) {
    applyReplacement(/\b(?:pie\s*torch|py\s*torch)\b/gi, 'PyTorch', 'contextual_homophone');
  }

  // ── Contextual Guard: "pie spark" vs "PySpark" ───────────────────────────
  if (BIG_DATA_KEYWORDS.test(contextStr) && !CULINARY_KEYWORDS.test(contextStr)) {
    applyReplacement(/\b(?:pie\s*spark|py\s*spark)\b/gi, 'PySpark', 'contextual_homophone');
  }

  // ── Contextual Guard: "big query" vs "BigQuery" ──────────────────────────
  if (CLOUD_ANALYTICS_KEYWORDS.test(contextStr)) {
    applyReplacement(/\b(?:big\s*query|big\s*querey|pig\s*query|big-query)\b/gi, 'BigQuery', 'contextual_homophone');
  }

  // ── Direct Dictionary Misrecognitions ────────────────────────────────────
  applyReplacement(/\b(?:cuberneties|coobernetes|kuber\s*netics|cooper\s*net\s*is|kuber\s*netes)\b/gi, 'Kubernetes', 'dictionary_direct');
  applyReplacement(/\b(?:k\s*eights|k\s*8\s*s)\b/gi, 'K8s', 'dictionary_direct');
  applyReplacement(/\b(?:cube\s*control|cube\s*cuddle|cube\s*c\s*t\s*l|kuber\s*c\s*t\s*l)\b/gi, 'kubectl', 'dictionary_direct');
  applyReplacement(/\b(?:gee\s*rpc|g\s*rpc|g\s*r\s*p\s*c|jee\s*rpc)\b/gi, 'gRPC', 'dictionary_direct');
  applyReplacement(/\b(?:graph\s*ql|graph\s*q\s*l|graph\s*sequel)\b/gi, 'GraphQL', 'dictionary_direct');
  applyReplacement(/\b(?:engine\s*x|n\s*jinx|n-jinx)\b/gi, 'NGINX', 'dictionary_direct');
  applyReplacement(/\b(?:jay\s*son|jason\s+object|jason\s+payload|jason\s+data)\b/gi, 'JSON', 'dictionary_direct');
  applyReplacement(/\b(?:jay\s*dub\s*dub\s*tee|j\s*w\s*t|jwt\s*token)\b/gi, 'JWT', 'dictionary_direct');
  applyReplacement(/\b(?:dynamo\s*d\s*b|dynamo\s*db|dynamo\s*dee\s*bee)\b/gi, 'DynamoDB', 'dictionary_direct');
  applyReplacement(/\b(?:mongo\s*d\s*b|mongo\s*db|mongo\s*dee\s*bee)\b/gi, 'MongoDB', 'dictionary_direct');
  applyReplacement(/\b(?:post\s*grass\s*q\s*l|post\s*gres\s*q\s*l|post-gres\s*q\s*l)\b/gi, 'PostgreSQL', 'dictionary_direct');
  applyReplacement(/\b(?:post\s*grass|post\s*gres|post-gres)\b/gi, 'Postgres', 'dictionary_direct');
  applyReplacement(/\b(?:s\s*q\s*l\s*light|sequel\s*light|seek\s*well\s*light|sql\s*light)\b/gi, 'SQLite', 'dictionary_direct');
  applyReplacement(/\b(?:c\s*i\s*c\s*d|c\s*i\s*\/\s*c\s*d|sea\s*eye\s*sea\s*dee)\b/gi, 'CI/CD', 'dictionary_direct');
  applyReplacement(/\b(?:aws\s*lamb\s*da|lamb\s*da\s+function)\b/gi, 'AWS Lambda', 'dictionary_direct');
  applyReplacement(/\b(?:rabbit\s*m\s*q|rabbit\s*m\s*cue|rabbit\s*mq|rabbit\s*m\s*que)\b/gi, 'RabbitMQ', 'dictionary_direct');

  if (/\b(?:iac|infrastructure|deploy|hcl|cloud|aws|gcp|azure|state|plan|apply)\b/i.test(contextStr)) {
    applyReplacement(/\b(?:terra\s*form)\b/gi, 'Terraform', 'dictionary_direct');
  }

  if (/\b(?:search|index|kibana|cluster|log|shard|inverted|query)\b/i.test(contextStr)) {
    applyReplacement(/\b(?:elastic\s*search)\b/gi, 'Elasticsearch', 'dictionary_direct');
  }

  if (/\b(?:duplex|real-time|connection|socket|stream|server|client|protocol|bidirectional)\b/i.test(contextStr)) {
    applyReplacement(/\b(?:web\s*sockets?)\b/gi, 'WebSockets', 'dictionary_direct');
  }

  // Distributed systems & complexity
  applyReplacement(/\b(?:a\s*cid\s+properties|a\s+cid\s+transactions)\b/gi, 'ACID properties', 'dictionary_direct');
  applyReplacement(/\b(?:c\s*a\s*p\s+theorem)\b/gi, 'CAP theorem', 'dictionary_direct');
  applyReplacement(/\b(?:b\s*tree|b\s+tree)\b/gi, 'B-tree', 'dictionary_direct');
  applyReplacement(/\b(?:b\s*plus\s*tree|b\s*\+\s*tree)\b/gi, 'B+ tree', 'dictionary_direct');
  applyReplacement(/\b(?:n\s*plus\s*one|n\s*\+\s*1)\s+queries?\b/gi, 'N+1 queries', 'dictionary_direct');
  applyReplacement(/\b(?:n\s*plus\s*one|n\s*\+\s*1)\s+problem\b/gi, 'N+1 problem', 'dictionary_direct');
  applyReplacement(/\b(?:eye\s*dem\s*potent|idem\s*potent)\b/gi, 'idempotent', 'dictionary_direct');
  applyReplacement(/\b(?:eye\s*dem\s*potency|idem\s*potency)\b/gi, 'idempotency', 'dictionary_direct');

  // Big-O notation
  applyReplacement(/\b(?:big\s*o\s*of\s*(?:one|1)|o\s*of\s*(?:one|1))\b/gi, 'O(1)', 'dictionary_direct');
  applyReplacement(/\b(?:big\s*o\s*of\s*n|o\s*of\s*n)\b/gi, 'O(n)', 'dictionary_direct');
  applyReplacement(/\b(?:big\s*o\s*of\s*log\s*n|o\s*of\s*log\s*n)\b/gi, 'O(log n)', 'dictionary_direct');
  applyReplacement(/\b(?:big\s*o\s*of\s*n\s*log\s*n|o\s*of\s*n\s*log\s*n)\b/gi, 'O(n log n)', 'dictionary_direct');
  applyReplacement(/\b(?:big\s*o\s*of\s*n\s*squared|o\s*of\s*n\s*squared|big\s*o\s*of\s*n\^2|o\s*of\s*n\^2)\b/gi, 'O(n^2)', 'dictionary_direct');

  // ── Normalized Levenshtein Distance Fuzzy Matching Layer ──────────────────
  // Only tokens >= 6 chars, not in COMMON_ENGLISH_WORDS, similarity >= 0.82
  currentText = currentText.replace(/\b[a-zA-Z0-9_-]+\b/g, (token, offset) => {
    if (token.length < 6) return token;

    const lowerToken = token.toLowerCase();

    // All uppercase acronyms stay unchanged
    if (token === token.toUpperCase() && token.length <= 6) return token;

    // Common English words are protected
    if (COMMON_ENGLISH_WORDS.has(lowerToken)) return token;

    let bestTarget = null;
    let bestSim = 0;
    let bestDist = 999;

    for (const target of FUZZY_TECHNICAL_TARGETS) {
      if (token.length < (target.minLen || 6)) continue;

      // Exact case-insensitive match -> return canonical
      if (lowerToken === target.term.toLowerCase()) {
        if (token !== target.canonical) {
          replacements.push({
            originalToken: token,
            correctedToken: target.canonical,
            ruleTriggered: 'fuzzy_levenshtein',
            confidence: 1.0,
            editDistance: 0,
            position: offset,
          });
        }
        return target.canonical;
      }

      const sim = normalizedLevenshteinSimilarity(lowerToken, target.term.toLowerCase());
      if (sim >= 0.82 && sim > bestSim) {
        bestSim = sim;
        bestTarget = target;
        bestDist = levenshteinDistance(lowerToken, target.term.toLowerCase());
      }
    }

    if (bestTarget && bestSim >= 0.82) {
      replacements.push({
        originalToken: token,
        correctedToken: bestTarget.canonical,
        ruleTriggered: 'fuzzy_levenshtein',
        confidence: Math.round(bestSim * 100) / 100,
        editDistance: bestDist,
        position: offset,
      });
      return bestTarget.canonical;
    }

    return token;
  });

  // ── Emit Telemetry if Modified ───────────────────────────────────────────
  if (replacements.length > 0) {
    const elapsedMs =
      typeof performance !== 'undefined'
        ? Math.max(0, Math.round((performance.now() - startTime) * 100) / 100)
        : Math.max(0, Date.now() - startTime);

    const record = {
      event: 'stt_term_corrected',
      timestamp: new Date().toISOString(),
      sessionId: options?.sessionId || null,
      turnIndex: options?.turnIndex ?? null,
      inputLength: text.length,
      outputLength: currentText.length,
      replacementsCount: replacements.length,
      replacements,
      latencyMs: elapsedMs,
      flagSource: resolveFlagSource(options),
    };

    logSttCorrectionTelemetry(record);
  }

  return currentText;
}
