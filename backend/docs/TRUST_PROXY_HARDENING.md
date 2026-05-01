# Trust Proxy Hardening for Rate Limiting Security

## Overview

This implementation hardens the Express trust proxy configuration to prevent IP spoofing attacks that could bypass rate limiting and other IP-based security measures.

## Security Problem

When Express's `trust proxy` is enabled, it reads the `X-Forwarded-For` header to identify the client's true IP address. This is necessary when running behind a reverse proxy (AWS ALB, Nginx, etc.).

However, without proper validation, attackers can:
1. **Bypass rate limiting** by forging X-Forwarded-For headers with different IPs
2. **Evade IP-based blocks** by spoofing legitimate proxy headers
3. **Attack distributed systems** by flooding with spoofed headers from multiple fake IPs

Example attack:
```
GET /api/auth/login HTTP/1.1
Host: example.com
X-Forwarded-For: 203.0.113.50  ← Attacker forges this header
X-Forwarded-For: 203.0.113.51  ← Different IP each request
X-Forwarded-For: 203.0.113.52  ← Bypasses per-IP rate limits
```

## Solution

### 1. Proxy Validation Middleware (`backend/middleware/proxyValidation.js`)

Validates all proxy headers before they reach rate limiting middleware:

**Security Checks:**
- ✓ Only trust proxies when explicitly configured
- ✓ Validate X-Forwarded-For format and IP addresses
- ✓ Limit proxy hops to prevent header inflation attacks
- ✓ Validate X-Forwarded-Proto (must be http or https)
- ✓ Reject headers from untrusted remote addresses
- ✓ Log all suspicious activity for security audit

**Configuration:**

```bash
# Disable trust proxy (default, safest)
TRUST_PROXY=0

# Trust immediate upstream proxy (e.g., AWS ALB on same network)
TRUST_PROXY=1

# Trust multiple specific proxies
TRUST_PROXY=127.0.0.1,10.0.0.0/8,192.168.0.0/16
```

### 2. Enhanced Index.js

Updated `backend/index.js` to:
1. Import proxy validation middleware
2. Configure Express trust proxy using `configureExpressTrustProxy()`
3. Apply validation middleware before rate limiting

```javascript
import { configureExpressTrustProxy, createProxyValidationMiddleware } from './middleware/proxyValidation.js';

// Configure Express
configureExpressTrustProxy(app);

// Validate proxy headers before rate limiting
app.use(createProxyValidationMiddleware());
```

## Security Guarantees

### 1. Direct Connection (No Proxy)
- ✓ Socket IP is used directly
- ✓ No X-Forwarded-For header needed
- ✓ Safe for all deployments

### 2. Proxy from Trusted Source
- ✓ X-Forwarded-For validated
- ✓ Each IP checked for validity (valid IPv4/IPv6)
- ✓ Hop count limited to MAX_HOPS=10
- ✓ Proxy must be on loopback/private network
- ✓ Client IP extracted and used for rate limiting

### 3. Proxy from Untrusted Source
- ✓ Request rejected with 403 Forbidden
- ✓ Incident logged with full context
- ✓ Rate limiter not bypassed
- ✓ Attack details captured for analysis

### 4. Invalid Proxy Headers
- ✓ Invalid IPs detected and rejected
- ✓ Invalid protocols detected and rejected
- ✓ Excessive hops detected (prevents amplification)
- ✓ Fall back to socket IP for rate limiting

## Attack Prevention

### Attack 1: X-Forwarded-For Spoofing
```
Attacker sends: X-Forwarded-For: 203.0.113.50, 203.0.113.51
Defense: Validates each IP, rejects if format invalid
```

### Attack 2: Proxy Header Inflation
```
Attacker sends: X-Forwarded-For with 100+ IPs
Defense: Rejects if > 10 hops (MAX_HOPS)
```

### Attack 3: Untrusted Proxy
```
Attacker from 203.0.113.100 sends: X-Forwarded-For: 203.0.113.50
Defense: Rejects - remote is not loopback/private
```

### Attack 4: Invalid Protocol
```
Attacker sends: X-Forwarded-Proto: telnet
Defense: Rejects - only http/https allowed
```

## Configuration Examples

### Example 1: Kubernetes Environment
```bash
# Pod running behind AWS ALB on same VPC
TRUST_PROXY=1  # Trust immediate upstream
# Validation ensures ALB is on loopback or private network
```

### Example 2: Direct Internet
```bash
# No proxy between client and app
TRUST_PROXY=0  # Don't trust proxy (default)
# Direct socket IP used for rate limiting
```

### Example 3: Multiple Load Balancers
```bash
# App behind ALB then internal proxy
TRUST_PROXY=10.0.0.0/8,192.168.0.0/16
# Trust only specific IP ranges
```

## API Reference

### `configureExpressTrustProxy(app)`
Configures Express's trust proxy setting based on TRUST_PROXY env var.

```javascript
configureExpressTrustProxy(app);
// app.set('trust proxy', false) if TRUST_PROXY=0
// app.set('trust proxy', 1) if TRUST_PROXY=1
// app.set('trust proxy', [...IPs]) if TRUST_PROXY=IP1,IP2,...
```

### `createProxyValidationMiddleware()`
Creates middleware that validates proxy headers on every request.

```javascript
app.use(createProxyValidationMiddleware());
// Validates X-Forwarded-For, X-Forwarded-Proto
// Stores result in req.proxyValidation
// Stores client IP in req.clientIp, req.clientIpSource
```

### `getClientIp(req)`
Safely retrieves the client IP after validation.

```javascript
const ip = getClientIp(req);
// Returns: validated proxy IP or socket IP or 'unknown'
```

## Logging and Audit

All suspicious activity is logged with full context:

```json
{
  "timestamp": "2026-05-01T11:08:01.947Z",
  "level": "CRITICAL",
  "operation": "proxy-validation",
  "message": "Trust proxy enabled in production",
  "trustProxy": "immediate-upstream",
  "environment": "production"
}
```

```json
{
  "timestamp": "2026-05-01T11:08:01.947Z",
  "level": "CRITICAL",
  "operation": "proxy-validation",
  "message": "Suspicious proxy header detected",
  "reason": "proxy-headers-from-untrusted-remote",
  "severity": "critical",
  "remoteAddress": "203.0.113.100",
  "xForwardedFor": "203.0.113.50",
  "method": "GET",
  "path": "/api/auth/login",
  "details": { "remoteAddress": "203.0.113.100" }
}
```

## Testing

Comprehensive test suite in `backend/scripts/testProxyValidation.js`:

```bash
node backend/scripts/testProxyValidation.js
```

Tests cover:
- ✓ Direct connections
- ✓ Valid proxy headers
- ✓ Invalid IPs
- ✓ Untrusted sources
- ✓ Excessive hops (amplification attacks)
- ✓ Invalid protocols
- ✓ Express configuration
- ✓ Client IP extraction

## Backward Compatibility

✓ Default is `TRUST_PROXY=0` (no trust proxy)
✓ Existing code using `req.ip` works unchanged
✓ Rate limiters continue to work with validated IPs
✓ Logging captures IP source for debugging

## Performance Impact

- Negligible: IP validation is O(n) where n = hop count (max 10)
- Regex matching cached for common patterns
- No blocking I/O
- No memory overhead

## Security Best Practices

1. **Default to TRUST_PROXY=0** (don't trust proxies by default)
2. **Only enable TRUST_PROXY if behind a reverse proxy** (ALB, Nginx, etc.)
3. **Validate that proxy is on trusted network** (loopback or private IP)
4. **Monitor logs for suspicious proxy headers** (CRITICAL level)
5. **Update X-Forwarded-* headers only at edge** (ALB, not application)

## Future Improvements

- [ ] Custom proxy IP allowlist per environment
- [ ] Metrics for blocked suspicious requests
- [ ] Integration with WAF/DDoS mitigation
- [ ] Support for RFC 7239 Forwarded header
- [ ] Custom proto validation per environment

## References

- [Express Trust Proxy Documentation](https://expressjs.com/en/guide/behind-proxies.html)
- [RFC 7239 - Forwarded HTTP Extension](https://tools.ietf.org/html/rfc7239)
- [OWASP - IP Spoofing](https://owasp.org/www-community/attacks/IP_Spoofing)
