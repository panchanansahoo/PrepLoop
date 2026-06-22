// Utilities shared by interview-related services
import NodeCache from 'node-cache';

// Cached index of the working DB schema shape (avoids re-probing on every initializeInterview call)
export const _knownPayloadIndex = null;

// Virtual interview sessions stored in-memory as a fallback when DB schema is incompatible
export const virtualInterviewSessions = new Map();

export const isMissingColumnError = (error, columnName) => {
  const message = String(error?.message || '').toLowerCase();
  const code = String(error?.code || '').toUpperCase();
  return (
    code === 'PGRST204' ||
    code === '42703' ||
    (message.includes('could not find') && message.includes(String(columnName || '').toLowerCase())) ||
    (message.includes('column') && message.includes(String(columnName || '').toLowerCase()))
  );
};

export const isInterviewSchemaCompatibilityError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  const code = String(error?.code || '').toUpperCase();
  return (
    code === 'PGRST204' ||
    code === 'PGRST205' ||
    code === '42703' ||
    message.includes('schema cache') ||
    message.includes('could not find the') ||
    message.includes('column') ||
    message.includes('interview_sessions')
  );
};

// Export a small in-memory cache for interview probes if needed elsewhere
export const interviewProbeCache = new NodeCache({ stdTTL: 300, checkperiod: 310 });

export default {
  isMissingColumnError,
  isInterviewSchemaCompatibilityError,
  _knownPayloadIndex,
  virtualInterviewSessions,
  interviewProbeCache,
};
