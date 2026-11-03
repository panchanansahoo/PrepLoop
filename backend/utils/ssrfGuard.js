import { URL } from 'url';
import net from 'net';

/**
 * Server-Side Request Forgery (SSRF) Guard
 *
 * Validates outgoing URLs to prevent the backend from requesting:
 * - Internal localhost / loopback addresses (127.0.0.0/8, ::1)
 * - Cloud provider metadata endpoints (169.254.169.254, metadata.google.internal)
 * - Private RFC1918 subnets (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
 * - Link-local / multicast addresses
 * - Insecure or non-HTTP(S) URI schemes (file://, gopher://, ftp://, dict://)
 */

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata',
  'instance-data',
]);

/**
 * Checks if an IPv4 address belongs to a private, loopback, or metadata range.
 */
function isPrivateIPv4(ip) {
  const parts = ip.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed IP treated as unsafe
  }

  const [a, b] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 10.0.0.0/8 (Private RFC1918)
  if (a === 10) return true;

  // 172.16.0.0/12 (Private RFC1918: 172.16.0.0 - 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.168.0.0/16 (Private RFC1918)
  if (a === 192 && b === 168) return true;

  // 169.254.0.0/16 (Link-local & AWS/GCP/Azure instance metadata)
  if (a === 169 && b === 254) return true;

  // 100.64.0.0/10 (Shared address space)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // 224.0.0.0/4 (Multicast) and 240.0.0.0/4 (Reserved)
  if (a >= 224) return true;

  return false;
}

/**
 * Checks if an IPv6 address is loopback, unique local, or link-local.
 */
function isPrivateIPv6(ip) {
  const normalized = ip.toLowerCase();
  if (normalized === '::1' || normalized === '::') return true;
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // Unique local (fc00::/7)
  if (normalized.startsWith('fe80')) return true; // Link-local
  if (normalized.startsWith('ff')) return true; // Multicast
  return false;
}

/**
 * Validates whether a target URL is safe for server-side outbound HTTP requests.
 *
 * @param {string} targetUrl - URL to inspect
 * @param {object} options
 * @param {boolean} options.requireHttps - Require HTTPS protocol (default: true)
 * @returns {{ safe: boolean, error?: string, parsedUrl?: URL }}
 */
export function validateOutboundUrl(targetUrl, { requireHttps = true } = {}) {
  if (!targetUrl || typeof targetUrl !== 'string') {
    return { safe: false, error: 'URL must be a non-empty string' };
  }

  let parsed;
  try {
    parsed = new URL(targetUrl.trim());
  } catch {
    return { safe: false, error: 'Malformed URL format' };
  }

  const protocol = parsed.protocol.toLowerCase();
  if (requireHttps && protocol !== 'https:') {
    return { safe: false, error: 'Only secure HTTPS URLs are permitted' };
  }
  if (!['http:', 'https:'].includes(protocol)) {
    return { safe: false, error: `Disallowed protocol scheme: ${protocol}` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Strip brackets from IPv6 literal hostnames
  const cleanHost = hostname.startsWith('[') && hostname.endsWith(']')
    ? hostname.slice(1, -1)
    : hostname;

  // Check known blocked hostnames
  if (BLOCKED_HOSTNAMES.has(cleanHost) || cleanHost.endsWith('.local') || cleanHost.endsWith('.internal')) {
    return { safe: false, error: 'Host resolves to a restricted local or internal network domain' };
  }

  // Check if hostname is an IP address
  const ipFamily = net.isIP(cleanHost);
  if (ipFamily === 4) {
    if (isPrivateIPv4(cleanHost)) {
      return { safe: false, error: 'Outbound requests to private or loopback IP ranges are prohibited' };
    }
  } else if (ipFamily === 6) {
    if (isPrivateIPv6(cleanHost)) {
      return { safe: false, error: 'Outbound requests to private or loopback IPv6 ranges are prohibited' };
    }
  }

  // Check for credentials embedded in URL
  if (parsed.username || parsed.password) {
    return { safe: false, error: 'Embedded userinfo/credentials in URLs are not allowed' };
  }

  return { safe: true, parsedUrl: parsed };
}

/**
 * Boolean convenience helper for guard clauses.
 */
export function isSafeOutboundUrl(targetUrl, options) {
  return validateOutboundUrl(targetUrl, options).safe;
}

export default {
  validateOutboundUrl,
  isSafeOutboundUrl,
};

