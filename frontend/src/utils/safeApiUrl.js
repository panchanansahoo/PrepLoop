const ALLOWED_HOST_SUFFIXES = ['.preploop.me'];
const ALLOWED_EXACT_HOSTS = new Set([
  'preploop.me',
  'www.preploop.me',
  'api.preploop.me',
  'localhost',
  '127.0.0.1',
  'preploop.vercel.app',
]);

function isAllowedHost(hostname) {
  if (!hostname) return false;
  const host = hostname.toLowerCase();
  if (ALLOWED_EXACT_HOSTS.has(host)) return true;
  if (ALLOWED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))) return true;
  // Restrict vercel.app only to official preploop deployments (e.g. preploop.vercel.app, preploop-frontend.vercel.app)
  if (host.startsWith('preploop') && host.endsWith('.vercel.app')) return true;
  return false;
}

function getDefaultApiOrigin() {
  if (typeof window !== 'undefined') {
    const hostname = (window.location.hostname || '').toLowerCase();
    if (isAllowedHost(hostname)) {
      return window.location.origin;
    }
  }
  const configured = import.meta.env.VITE_API_URL;
  if (configured) {
    try {
      const parsed = new URL(configured);
      if ((parsed.protocol === 'http:' || parsed.protocol === 'https:') && isAllowedHost(parsed.hostname)) {
        return parsed.origin;
      }
    } catch {
      // fallback
    }
  }
  return (
    import.meta.env.PROD && typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:5000'
  );
}

const DEFAULT_API_ORIGIN = getDefaultApiOrigin();

export function resolveApiOrigin(rawBaseUrl) {
  try {
    const candidate = String(rawBaseUrl || DEFAULT_API_ORIGIN).trim() || DEFAULT_API_ORIGIN;
    const parsed = new URL(candidate, DEFAULT_API_ORIGIN);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Unsupported protocol');
    }

    if (!isAllowedHost(parsed.hostname)) {
      return DEFAULT_API_ORIGIN;
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
