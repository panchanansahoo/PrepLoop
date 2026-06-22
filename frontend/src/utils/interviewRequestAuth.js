import { mergeAuthHeaders } from './authHeaders';

function getRequestUrl(input) {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  if (input && typeof input.url === 'string') return input.url;
  return '';
}

export function shouldInjectInterviewAuth(input) {
  const rawUrl = getRequestUrl(input);
  if (!rawUrl) return false;

  try {
    const url = new URL(rawUrl, globalThis.location?.origin || 'http://localhost');
    const path = url.pathname;

    return (
      path === '/api/company-interview' ||
      path.startsWith('/api/company-interview/') ||
      path === '/api/voice/deepgram-token'
    );
  } catch {
    return false;
  }
}

export function buildInterviewAuthInit(input, init = {}) {
  if (!shouldInjectInterviewAuth(input)) {
    return init;
  }

  const requestHeaders = (init && init.headers) || (input && input.headers) || {};

  return {
    ...init,
    headers: mergeAuthHeaders(requestHeaders),
  };
}
