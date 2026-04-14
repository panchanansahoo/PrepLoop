const DEFAULT_API_ORIGIN = 'http://localhost:5000';

export function resolveApiOrigin(rawBaseUrl) {
  try {
    const candidate = String(rawBaseUrl || DEFAULT_API_ORIGIN).trim() || DEFAULT_API_ORIGIN;
    const parsed = new URL(candidate);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Unsupported protocol');
    }

    return parsed.origin;
  } catch {
    return DEFAULT_API_ORIGIN;
  }
}

export function normalizeRelativePath(value) {
  const path = String(value || '').trim();

  if (/^(https?:)?\/\//i.test(path)) {
    throw new Error('Absolute URLs are not allowed for API paths');
  }

  if (!path) return '/';
  return path.startsWith('/') ? path : `/${path}`;
}

export function buildApiUrl(path, { rawBaseUrl, apiPrefix = '/api' } = {}) {
  const origin = resolveApiOrigin(rawBaseUrl);
  const prefix = String(apiPrefix || '/api').replace(/\/$/, '');
  const relativePath = normalizeRelativePath(path);

  return new URL(`${prefix}${relativePath}`, origin).toString();
}
