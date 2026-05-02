/**
 * Type Normalization Utility
 * Centralizes interview type and experience level normalization logic
 * Eliminates code duplication across services
 */

/**
 * Normalize interview type to lowercase standard format
 * @param {string} type - Interview type (technical, behavioral, system-design, etc.)
 * @returns {string} Normalized type or empty string if invalid
 */
export function normalizeInterviewType(type) {
  if (!type || typeof type !== 'string') return '';
  return String(type).toLowerCase().trim();
}

/**
 * Normalize experience level to lowercase standard format
 * @param {string} level - Experience level (fresher, experienced, etc.)
 * @returns {string} Normalized level or empty string if invalid
 */
export function normalizeExperienceLevel(level) {
  if (!level || typeof level !== 'string') return '';
  return String(level).toLowerCase().trim();
}

/**
 * Check if experience level indicates a fresher/junior candidate
 * @param {string} level - Experience level
 * @returns {boolean} True if fresher/junior candidate
 */
export function isFresher(level) {
  const normalized = normalizeExperienceLevel(level);
  return normalized === 'fresher' || normalized === 'junior' || normalized === 'student';
}

/**
 * Check if experience level indicates an experienced candidate
 * @param {string} level - Experience level
 * @returns {boolean} True if experienced candidate
 */
export function isExperienced(level) {
  const normalized = normalizeExperienceLevel(level);
  return normalized === 'experienced' || normalized === 'senior' || normalized === 'lead';
}

/**
 * Validate interview type against known types
 * @param {string} type - Interview type to validate
 * @returns {boolean} True if valid interview type
 */
export function isValidInterviewType(type) {
  const validTypes = ['technical', 'behavioral', 'system-design', 'coding', 'dsa', 'mixed', 'systems'];
  const normalized = normalizeInterviewType(type);
  return validTypes.includes(normalized);
}

/**
 * Get human-readable label for interview type
 * @param {string} type - Interview type
 * @returns {string} Human-readable label
 */
export function getInterviewTypeLabel(type) {
  const typeLabels = {
    'technical': 'Technical Interview',
    'behavioral': 'Behavioral Interview',
    'system-design': 'System Design Interview',
    'coding': 'Coding Interview',
    'dsa': 'Data Structures & Algorithms',
    'mixed': 'Mixed Interview',
    'systems': 'Systems Design'
  };
  
  const normalized = normalizeInterviewType(type);
  return typeLabels[normalized] || 'Interview';
}

/**
 * Get human-readable label for experience level
 * @param {string} level - Experience level
 * @returns {string} Human-readable label
 */
export function getExperienceLevelLabel(level) {
  const levelLabels = {
    'fresher': 'Fresher / Student',
    'junior': 'Junior Developer',
    'student': 'Student',
    'experienced': 'Experienced Developer',
    'senior': 'Senior Developer',
    'lead': 'Tech Lead'
  };
  
  const normalized = normalizeExperienceLevel(level);
  return levelLabels[normalized] || 'Unknown';
}

export default {
  normalizeInterviewType,
  normalizeExperienceLevel,
  isFresher,
  isExperienced,
  isValidInterviewType,
  getInterviewTypeLabel,
  getExperienceLevelLabel
};
