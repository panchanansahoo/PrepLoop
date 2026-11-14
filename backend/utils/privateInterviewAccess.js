import crypto from 'crypto';

const PASSCODE_MIN_LENGTH = 4;
const PASSCODE_MAX_LENGTH = 64;

export function normalizeInterviewLimits({ passcode, expiresAt, maxAttempts, allowedEmails, scheduledAt, scheduledDurationMinutes } = {}, { isUpdate = false } = {}) {
  const result = {};
  if (passcode !== undefined) {
    const normalized = String(passcode || '').trim();
    if (normalized) {
      if (normalized.length < PASSCODE_MIN_LENGTH || normalized.length > PASSCODE_MAX_LENGTH) {
        throw new Error(`Passcode must be ${PASSCODE_MIN_LENGTH}-${PASSCODE_MAX_LENGTH} characters`);
      }
      const salt = crypto.randomBytes(16).toString('hex');
      const digest = crypto.scryptSync(normalized, salt, 64).toString('hex');
      result.passcode_hash = `${salt}:${digest}`;
    } else if (!isUpdate) {
      result.passcode_hash = null;
    }
  }

  if (expiresAt !== undefined) {
    if (!expiresAt) {
      result.expires_at = null;
    } else {
      const timestamp = new Date(expiresAt);
      if (Number.isNaN(timestamp.getTime()) || timestamp.getTime() <= Date.now()) {
        throw new Error('Expiry must be a valid date and time in the future');
      }
      result.expires_at = timestamp.toISOString();
    }
  }

  if (maxAttempts !== undefined) {
    if (maxAttempts === '' || maxAttempts === null) {
      result.max_attempts = null;
    } else {
      const limit = Number(maxAttempts);
      if (!Number.isInteger(limit) || limit < 1 || limit > 5000) {
        throw new Error('Maximum attempts must be between 1 and 5000, or blank for unlimited');
      }
      result.max_attempts = limit;
    }
  }

  if (allowedEmails !== undefined) {
    if (!allowedEmails || (Array.isArray(allowedEmails) && allowedEmails.length === 0)) {
      result.allowed_emails = [];
      result.allowedEmails = [];
    } else {
      const rawList = Array.isArray(allowedEmails)
        ? allowedEmails
        : String(allowedEmails).split(/[\n,;]+/);
      const emailList = rawList.map(s => String(s || '').trim()).filter(Boolean);

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalid = emailList.filter(e => !emailRegex.test(e));
      if (invalid.length > 0) {
        throw new Error(`Invalid email address in allowlist: ${invalid.slice(0, 2).join(', ')}`);
      }
      const cleanList = [...new Set(emailList.map(e => e.toLowerCase()))];
      result.allowed_emails = cleanList;
      result.allowedEmails = cleanList;
    }
  } else if (!isUpdate) {
    result.allowed_emails = [];
    result.allowedEmails = [];
  }

  if (scheduledAt !== undefined) {
    if (!scheduledAt) {
      result.scheduled_at = null;
      result.scheduledAt = null;
    } else {
      const timestamp = new Date(scheduledAt);
      if (Number.isNaN(timestamp.getTime())) {
        throw new Error('Scheduled time must be a valid date and time');
      }
      result.scheduled_at = timestamp.toISOString();
      result.scheduledAt = timestamp.toISOString();
    }
  }

  if (scheduledDurationMinutes !== undefined) {
    if (scheduledDurationMinutes === '' || scheduledDurationMinutes === null) {
      result.scheduled_duration_minutes = 45;
      result.scheduledDurationMinutes = 45;
    } else {
      const duration = Number(scheduledDurationMinutes);
      if (!Number.isInteger(duration) || duration < 5 || duration > 480) {
        throw new Error('Scheduled duration must be between 5 and 480 minutes');
      }
      result.scheduled_duration_minutes = duration;
      result.scheduledDurationMinutes = duration;
    }
  } else if (!isUpdate) {
    result.scheduled_duration_minutes = 45;
    result.scheduledDurationMinutes = 45;
  }

  return result;
}

/**
 * Strips non-column camelCase aliases from normalized limits,
 * returning only valid admin_question_sets database column keys.
 */
export function toDbQuestionSetLimits(limits = {}) {
  const dbLimits = {};
  if (limits.passcode_hash !== undefined) dbLimits.passcode_hash = limits.passcode_hash;
  if (limits.expires_at !== undefined) dbLimits.expires_at = limits.expires_at;
  if (limits.max_attempts !== undefined) dbLimits.max_attempts = limits.max_attempts;
  if (limits.allowed_emails !== undefined) dbLimits.allowed_emails = limits.allowed_emails;
  if (limits.scheduled_at !== undefined) dbLimits.scheduled_at = limits.scheduled_at;
  if (limits.scheduled_duration_minutes !== undefined) dbLimits.scheduled_duration_minutes = limits.scheduled_duration_minutes;
  return dbLimits;
}

export function verifyInterviewPasscode(passcode, storedHash) {
  if (!storedHash) return true;
  if (typeof passcode !== 'string' || passcode.length < PASSCODE_MIN_LENGTH || passcode.length > PASSCODE_MAX_LENGTH) {
    return false;
  }
  const [salt, expectedHex] = String(storedHash).split(':');
  if (!salt || !/^[a-f0-9]{128}$/i.test(expectedHex || '')) return false;
  const actual = crypto.scryptSync(passcode, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  return crypto.timingSafeEqual(actual, expected);
}

export function verifyInterviewInviteeEmail(email, allowedEmails) {
  if (!Array.isArray(allowedEmails) || allowedEmails.length === 0) return true;
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  return allowedEmails.some(item => String(item).trim().toLowerCase() === normalized);
}

export function isInterviewLinkExpired(expiresAt) {
  return Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());
}

export function generateInterviewToken() {
  return crypto.randomUUID();
}

export function isValidInterviewToken(token) {
  if (typeof token !== 'string') return false;
  const trimmed = token.trim();
  return trimmed.length >= 5 && trimmed.length <= 64;
}

/**
 * Evaluates the schedule status for a fixed-schedule interview session.
 * @param {string|Date|null} scheduledAt - Scheduled start time
 * @param {number} durationMinutes - Scheduled interview duration (e.g. 45 min)
 * @param {number} postBufferMinutes - Grace buffer after scheduled duration before link ends
 */
export function getInterviewScheduleStatus(scheduledAt, durationMinutes = 45, postBufferMinutes = 30) {
  if (!scheduledAt) {
    return {
      status: 'anytime',
      isScheduled: false,
      scheduledAt: null,
      scheduledDurationMinutes: durationMinutes,
      secondsUntilStart: 0,
      canStartNow: true,
    };
  }

  const startTime = new Date(scheduledAt).getTime();
  if (Number.isNaN(startTime)) {
    return {
      status: 'anytime',
      isScheduled: false,
      scheduledAt: null,
      scheduledDurationMinutes: durationMinutes,
      secondsUntilStart: 0,
      canStartNow: true,
    };
  }

  const now = Date.now();
  const earlyBufferMs = 10 * 60 * 1000; // 10 minutes early check-in allowed
  const endTime = startTime + (Number(durationMinutes) + Number(postBufferMinutes)) * 60 * 1000;

  const secondsUntilStart = Math.max(0, Math.round((startTime - now) / 1000));
  const secondsRemainingInWindow = Math.max(0, Math.round((endTime - now) / 1000));

  if (now < startTime - earlyBufferMs) {
    return {
      status: 'upcoming',
      isScheduled: true,
      scheduledAt: new Date(startTime).toISOString(),
      scheduledDurationMinutes: durationMinutes,
      secondsUntilStart,
      canStartNow: false,
    };
  }

  if (now > endTime) {
    return {
      status: 'ended',
      isScheduled: true,
      scheduledAt: new Date(startTime).toISOString(),
      scheduledDurationMinutes: durationMinutes,
      secondsUntilStart: 0,
      secondsRemainingInWindow: 0,
      canStartNow: false,
    };
  }

  return {
    status: 'open',
    isScheduled: true,
    scheduledAt: new Date(startTime).toISOString(),
    scheduledDurationMinutes: durationMinutes,
    secondsUntilStart,
    secondsRemainingInWindow,
    canStartNow: true,
  };
}

/**
 * Evaluates semantic and keyword topic coverage for a candidate's answer against expected topics.
 * @param {string} candidateAnswer - Candidate's spoken/transcribed answer text
 * @param {Array<string>} expectedTopics - Target topics or keywords expected in the answer
 * @returns {{ coveredTopics: string[], missedTopics: string[], coverageRatio: number }}
 */
export function matchExpectedTopics(candidateAnswer = '', expectedTopics = []) {
  if (!Array.isArray(expectedTopics) || expectedTopics.length === 0) {
    return { coveredTopics: [], missedTopics: [], coverageRatio: 1 };
  }
  const answerLower = String(candidateAnswer || '').toLowerCase();
  const coveredTopics = [];
  const missedTopics = [];

  for (const rawTopic of expectedTopics) {
    const topic = typeof rawTopic === 'string' ? rawTopic.trim() : '';
    if (!topic) continue;
    const topicLower = topic.toLowerCase();
    // Match exact topic substring or significant words (len >= 4)
    const topicWords = topicLower.split(/[\s,/-]+/).filter(w => w.length >= 4);
    const hasWordMatch = topicWords.length > 0 && topicWords.some(w => answerLower.includes(w));
    if (answerLower.includes(topicLower) || hasWordMatch) {
      coveredTopics.push(topic);
    } else {
      missedTopics.push(topic);
    }
  }

  const coverageRatio = expectedTopics.length > 0
    ? Math.round((coveredTopics.length / expectedTopics.length) * 100) / 100
    : 1;

  return { coveredTopics, missedTopics, coverageRatio };
}

export { evaluateAssessmentIntegrity } from '../services/interviewAnswerEvaluator.js';


