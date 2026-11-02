const test = require('node:test');
const assert = require('node:assert/strict');

// Unit tests for mobile API client URL resolution and normalizers
function normalizeBaseUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim().replace(/\/+$/, '');
  if (!trimmed) return null;
  return trimmed.endsWith('/api') ? trimmed.slice(0, -4) : trimmed;
}

const KNOWN_BAD_API_URLS = new Set([
  'https://preploop.azurewebsites.net',
  'http://preploop.azurewebsites.net',
  'https://preploop.com',
  'http://preploop.com',
]);

function resolveBaseUrl(configuredUrl, isDev = false) {
  const configured = normalizeBaseUrl(configuredUrl);
  if (configured && !KNOWN_BAD_API_URLS.has(configured)) {
    return configured;
  }
  if (isDev) {
    return 'http://10.0.2.2:5000';
  }
  return 'https://preploop.me';
}

test('normalizeBaseUrl strips trailing slashes and /api suffix', () => {
  assert.equal(normalizeBaseUrl('https://api.preploop.me/'), 'https://api.preploop.me');
  assert.equal(normalizeBaseUrl('https://api.preploop.me/api'), 'https://api.preploop.me');
  assert.equal(normalizeBaseUrl('https://api.preploop.me/api/'), 'https://api.preploop.me');
  assert.equal(normalizeBaseUrl(null), null);
  assert.equal(normalizeBaseUrl('   '), null);
});

test('resolveBaseUrl filters out known decommissioned endpoints and provides safe fallback', () => {
  assert.equal(resolveBaseUrl('https://preploop.azurewebsites.net', false), 'https://preploop.me');
  assert.equal(resolveBaseUrl('https://preploop.azurewebsites.net', true), 'http://10.0.2.2:5000');
  assert.equal(resolveBaseUrl('https://staging.preploop.me', false), 'https://staging.preploop.me');
});

