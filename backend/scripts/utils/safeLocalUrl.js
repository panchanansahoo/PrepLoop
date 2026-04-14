const LOCAL_HOST_WHITELIST = new Set(['localhost', '127.0.0.1', '::1']);

function isAllowedProtocol(protocol) {
  return protocol === 'http:' || protocol === 'https:';
}

function isAllowedLocalHost(hostname) {
  return LOCAL_HOST_WHITELIST.has(hostname);
}

export function ensureLocalBaseUrl(candidate, fallback = 'http://localhost:5000') {
  try {
    const parsed = new URL(candidate || fallback);
    if (!isAllowedProtocol(parsed.protocol) || !isAllowedLocalHost(parsed.hostname)) {
      throw new Error('Disallowed base URL host/protocol');
    }

    parsed.pathname = '/';
    parsed.search = '';
    parsed.hash = '';
    const normalized = parsed.toString();
    return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
  } catch {
    return ensureLocalBaseUrl(fallback, 'http://localhost:5000');
  }
}

export function buildLocalEndpoint(baseUrl, path) {
  const safeBase = ensureLocalBaseUrl(baseUrl);
  const safePath = typeof path === 'string' && path.startsWith('/') ? path : `/${String(path || '')}`;
  return new URL(safePath, `${safeBase}/`).toString();
}
