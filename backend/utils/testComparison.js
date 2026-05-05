/**
 * Test Result Comparison Utility
 * Handles various output formats and comparison strategies
 */

const stableStringify = (value) => {
  if (value === null || value === undefined) return String(value);
  if (typeof value !== 'object') return String(value);

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
};

const normalizeTextOutput = (value) =>
  String(value ?? '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim();

const tryParseJsonValue = (value) => {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const toComparableValue = (value) => {
  if (typeof value !== 'string') return value;
  const parsed = tryParseJsonValue(value);
  return parsed !== null ? parsed : value;
};

const normalizeUnorderedFlatArray = (arr) =>
  arr
    .map((item) => stableStringify(item))
    .sort();

const normalizeUnorderedNestedOrderedArray = (arr) =>
  arr
    .map((item) => stableStringify(item))
    .sort();

const normalizeUnorderedNestedUnorderedArray = (arr) =>
  arr
    .map((item) => {
      if (!Array.isArray(item)) return stableStringify(item);
      const normalizedInner = item.map((inner) => stableStringify(inner)).sort();
      return `[${normalizedInner.join(',')}]`;
    })
    .sort();

const normalizeAnagramGroups = (arr) =>
  arr
    .map((group) => {
      if (!Array.isArray(group)) return stableStringify(group);
      const normalizedGroup = group.map((word) => String(word)).sort();
      return `[${normalizedGroup.join(',')}]`;
    })
    .sort();

/**
 * Compare expected and actual outputs with multiple strategies
 * Supports strict matching, numeric epsilon, JSON normalization, and custom judge profiles
 * @param {*} expected - Expected output
 * @param {*} actual - Actual output from code execution
 * @param {string} judgeProfile - Comparison strategy ('strict', 'unordered-flat-array', etc.)
 * @returns {boolean} True if outputs match according to judge profile
 */
export function compareExpectedActual(expected, actual, judgeProfile = 'strict') {
  const expectedStr = normalizeTextOutput(expected);
  const actualStr = normalizeTextOutput(actual);

  if (expectedStr === actualStr) return true;

  // Numeric comparison with epsilon
  const expectedNum = Number(expectedStr);
  const actualNum = Number(actualStr);
  if (!Number.isNaN(expectedNum) && !Number.isNaN(actualNum)) {
    return Math.abs(expectedNum - actualNum) <= 1e-6;
  }

  // JSON parsing and comparison
  const parsedExpectedFromActual = tryParseJsonValue(actualStr);
  const parsedActualFromExpected = tryParseJsonValue(expectedStr);

  if (parsedExpectedFromActual !== null) {
    const normalizedExpected =
      typeof expected === 'string' ? (tryParseJsonValue(expectedStr) ?? expectedStr) : expected;
    if (stableStringify(normalizedExpected) === stableStringify(parsedExpectedFromActual)) {
      return true;
    }
  }

  if (parsedActualFromExpected !== null) {
    const normalizedActual =
      typeof actual === 'string' ? (tryParseJsonValue(actualStr) ?? actualStr) : actual;
    if (stableStringify(parsedActualFromExpected) === stableStringify(normalizedActual)) {
      return true;
    }
  }

  // Custom judge profiles for order-insensitive outputs
  const expectedValue = toComparableValue(expected);
  const actualValue = toComparableValue(actual);

  if (judgeProfile === 'unordered-flat-array') {
    if (Array.isArray(expectedValue) && Array.isArray(actualValue)) {
      return (
        stableStringify(normalizeUnorderedFlatArray(expectedValue)) ===
        stableStringify(normalizeUnorderedFlatArray(actualValue))
      );
    }
  }

  if (judgeProfile === 'unordered-nested-ordered') {
    if (Array.isArray(expectedValue) && Array.isArray(actualValue)) {
      return (
        stableStringify(normalizeUnorderedNestedOrderedArray(expectedValue)) ===
        stableStringify(normalizeUnorderedNestedOrderedArray(actualValue))
      );
    }
  }

  if (judgeProfile === 'unordered-nested-unordered') {
    if (Array.isArray(expectedValue) && Array.isArray(actualValue)) {
      return (
        stableStringify(normalizeUnorderedNestedUnorderedArray(expectedValue)) ===
        stableStringify(normalizeUnorderedNestedUnorderedArray(actualValue))
      );
    }
  }

  if (judgeProfile === 'unordered-anagram-groups') {
    if (Array.isArray(expectedValue) && Array.isArray(actualValue)) {
      return (
        stableStringify(normalizeAnagramGroups(expectedValue)) ===
        stableStringify(normalizeAnagramGroups(actualValue))
      );
    }
  }

  return false;
}

export { stableStringify, normalizeTextOutput };
