function getRequestUrl(input) {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  if (input && typeof input.url === 'string') return input.url;
  return '';
}

export function getConfiguredApiOrigin(rawApiUrl = import.meta.env.VITE_API_URL) {
  const value = String(rawApiUrl || '').trim();
  if (!value) return null;

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

export function shouldRouteToApiOrigin(input, apiOrigin, baseOrigin = globalThis.location?.origin) {
  if (!apiOrigin) return false;

  const rawUrl = getRequestUrl(input);
  if (!rawUrl) return false;

  try {
    const parsed = new URL(rawUrl, baseOrigin || 'http://localhost');
    const isApiPath = parsed.pathname === '/api' || parsed.pathname.startsWith('/api/');
    if (!isApiPath) return false;
    if (parsed.origin === apiOrigin) return false;
    return true;
  } catch {
    return false;
  }
}

export function routeApiRequestInput(input, apiOrigin, baseOrigin = globalThis.location?.origin) {
  if (!shouldRouteToApiOrigin(input, apiOrigin, baseOrigin)) {
    return input;
  }

  const rawUrl = getRequestUrl(input);
  const source = new URL(rawUrl, baseOrigin || 'http://localhost');
  const target = new URL(source.pathname + source.search + source.hash, apiOrigin);

  if (input instanceof Request) {
    return new Request(target.toString(), input);
  }

  if (input instanceof URL) {
    return new URL(target.toString());
  }

  return target.toString();
}
