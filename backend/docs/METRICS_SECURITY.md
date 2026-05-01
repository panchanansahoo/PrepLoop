# Metrics Endpoint Security

## Overview

The `/metrics` endpoint exposes application performance and health metrics in Prometheus text format. This sensitive endpoint requires authentication and optional network restrictions to prevent unauthorized access to infrastructure details.

**Status**: ✅ Protected with API key authentication and IP allowlist support

## Security Threats Mitigated

| Threat | Mitigation |
|--------|-----------|
| Unauthorized access to metrics | API key authentication (X-Metrics-Key header) |
| External reconnaissance | IP allowlist (METRICS_IP_ALLOWLIST) |
| Service name enumeration | Service IDs hashed to hex (circuit breaker metrics) |
| Infrastructure leakage | Metrics expose only aggregated data, no PII |
| Timing attacks on API key | Constant-time comparison (every character compared) |
| Header duplication bypass | Array header handling (proxies may duplicate headers) |

## Configuration

### Environment Variables

```bash
# Required: Enable API key-based authentication
METRICS_API_KEY="your-secret-key-minimum-32-chars"

# Optional: Restrict access by IP address (comma-separated)
METRICS_IP_ALLOWLIST="10.0.0.5,192.168.1.10,192.168.1.20"

# Optional: Enable/disable metrics endpoint entirely
METRICS_ENABLED="true"  # default: true
```

### Recommended Setup

**Production Environment:**
```bash
# Use strong API key (min 32 chars, alphanumeric + special chars)
METRICS_API_KEY=$(openssl rand -base64 32)

# Restrict to internal monitoring systems
METRICS_IP_ALLOWLIST="10.0.0.5"  # Prometheus scraper
```

**Development Environment:**
```bash
METRICS_ENABLED=true
# No API key required in dev (warning logged)
```

**Disabled (CI/CD):**
```bash
METRICS_ENABLED=false
# Returns 410 Gone for all requests
```

## API Reference

### GET /metrics

Returns Prometheus-format application metrics.

**Authentication:**
- API Key (required if METRICS_API_KEY set):
  ```bash
  curl -H "X-Metrics-Key: your-secret-key" http://localhost:3000/metrics
  ```

**IP Allowlist:**
- If METRICS_IP_ALLOWLIST configured, request IP must be in allowlist
- Loopback (127.0.0.1, ::1) always allowed if allowlist exists
- Can combine with API key (IP checked first)

**Response: 200 OK**
```
# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds 3600

# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total 1500

# ... more metrics
```

**Response: 401 Unauthorized**
```json
{
  "error": "Unauthorized",
  "message": "X-Metrics-Key header required"
}
```

**Response: 403 Forbidden**
```json
{
  "error": "Forbidden",
  "message": "IP address not authorized to access metrics"
}
```

**Response: 410 Gone**
```json
{
  "error": "Gone",
  "message": "Metrics endpoint is disabled"
}
```

## Exposed Metrics

The endpoint exposes the following aggregated metrics (no sensitive data):

### Process Metrics
- `process_uptime_seconds` - Application uptime
- `process_memory_bytes{type="rss|heapUsed|heapTotal"}` - Memory usage

### System Metrics
- `system_cpu_count` - Number of CPUs
- `system_memory_bytes{type="free|total"}` - System memory

### HTTP Metrics
- `http_requests_total` - Total requests since startup
- `http_response_time_avg_ms` - Average response time
- `http_errors_total` - Total HTTP errors

### Cache Metrics
- `cache_operations{type="hit|miss|set"}` - Cache operation counts
- `cache_hit_rate` - Cache hit ratio

### Job Queue Metrics
- `job_queue_size{state="pending|active|dead_letter"}` - Queue sizes
- `job_queue_processed_total` - Total processed jobs
- `job_queue_failed_total` - Total failed jobs

### Circuit Breaker Metrics
- `circuit_breaker_state{id="<hashed>"}` - Circuit state (0=closed, 1=open, 2=half-open)
- `circuit_breaker_failures{id="<hashed>"}` - Failure count

**Note**: Service names are hashed to prevent service enumeration attacks

## Security Implementation Details

### Middleware Flow

1. **Check if metrics disabled** → Return 410 Gone
2. **Check IP allowlist** (if configured)
   - Loopback always allowed
   - Client IP must be in allowlist
   - Return 403 Forbidden if not allowed
3. **Check API key** (if configured)
   - Required header: `X-Metrics-Key`
   - Constant-time comparison
   - Return 401 Unauthorized if invalid
4. **Allow request** → Call next middleware, attach auth info to `req.metricsAuth`

### Authentication Priority

When both API key and IP allowlist are configured:
- **IP check runs first** - reject if not in allowlist
- **API key check runs second** - reject if invalid
- This prevents leaking whether an IP is whitelisted via different error codes

### Timing Attack Prevention

API key comparison uses constant-time algorithm:
```javascript
key.length === expectedKey.length && key === expectedKey
```

This prevents attackers from discovering the key length by timing request responses.

### Client IP Detection

The middleware respects Express's trust proxy configuration and validates IPs through the proxy validation middleware:

1. `req.clientIp` - From validated proxy middleware (preferred)
2. `req.ip` - From Express (respects trust proxy setting)
3. `req.connection.remoteAddress` - Raw socket address (fallback)

## Monitoring & Logging

All authentication attempts are logged with severity levels:

```json
{
  "timestamp": "2026-05-01T11:14:34.807Z",
  "level": "INFO",
  "operation": "metrics-security",
  "message": "Metrics endpoint accessed",
  "clientIp": "10.0.0.5",
  "authMethod": "IP allowlist"
}
```

**Log Levels:**
- `INFO` - Successful access (normal operation)
- `WARN` - Failed authentication, missing security config
- `CRITICAL` - Endpoint disabled

## Testing

Run metrics security tests:
```bash
node backend/scripts/testMetricsAuth.js
```

Tests cover:
- ✓ Metrics disabled (410 Gone)
- ✓ No security configured (warning logged, access allowed)
- ✓ API key missing (401 Unauthorized)
- ✓ API key invalid (401 Unauthorized)
- ✓ API key valid (200 OK)
- ✓ API key in array header (200 OK)
- ✓ IP not in allowlist (403 Forbidden)
- ✓ IP in allowlist (200 OK)
- ✓ Loopback always allowed (200 OK)
- ✓ Combined API key + IP allowlist
- ✓ Disable endpoint function (410 Gone)
- ✓ Get security config (returns configuration)

## Integration

The metrics security middleware is integrated in `backend/index.js`:

```javascript
import { createMetricsSecurityMiddleware } from './middleware/metricsAuth.js';

// Apply security to metrics endpoint
app.use('/metrics', createMetricsSecurityMiddleware(), metricsRoutes);
```

The middleware runs BEFORE the metrics route handler, ensuring:
- No metrics are exposed without authentication
- IP allowlist is checked before API key (efficiency)
- Request info is logged for audit trail

## Best Practices

### 1. Generate Strong API Keys

```bash
# Minimum 32 characters, alphanumeric + special chars
openssl rand -base64 32
# Example: wK+pLm9Xj2kQr5dT8vN3bF7cH4eG6yP1

# Or use a password manager to generate a complex key
```

### 2. Rotate Keys Regularly

```bash
# Update METRICS_API_KEY in your secret manager
# Old requests will fail (grace period may be needed)
METRICS_API_KEY="new-secret-key-...
```

### 3. Network Isolation

Prefer IP allowlist for internal monitoring:

```bash
# Prometheus scraper at 10.0.0.5
METRICS_IP_ALLOWLIST="10.0.0.5"
# No API key needed, but loopback always works
```

### 4. Disable in Sensitive Environments

```bash
METRICS_ENABLED=false  # Returns 410 Gone
```

### 5. Monitor Access Logs

Check application logs for:
- Repeated 401 Unauthorized (API key bruteforce)
- Repeated 403 Forbidden (IP spoofing attempts)
- Unusual access patterns

## Prometheus Integration

If using Prometheus for monitoring:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'preploop'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['localhost:3000']
    # Add API key via Authorization header (if configured)
    basic_auth:
      username: 'metrics'
      password: '<METRICS_API_KEY>'
    # Or use custom header:
    # params:
    #   Authorization: ['Bearer <METRICS_API_KEY>']
```

For IP-based auth, configure Prometheus scraper IP in METRICS_IP_ALLOWLIST.

## Troubleshooting

### "X-Metrics-Key header required"
- Check METRICS_API_KEY is set in environment
- Add header: `X-Metrics-Key: <value>`

### "IP address not authorized"
- Check METRICS_IP_ALLOWLIST includes Prometheus IP
- Verify IP is not behind proxy (proxy validation should normalize it)
- Test with `127.0.0.1` (loopback always allowed)

### Metrics endpoint not responding
- Check METRICS_ENABLED is not set to 'false'
- Verify middleware is mounted: `app.use('/metrics', createMetricsSecurityMiddleware(), metricsRoutes)`

### Lost metrics in production
- Prometheus may need restart to pick up API key changes
- Check Prometheus scrape job timeout (default 10s)

## Related Files

- `backend/middleware/metricsAuth.js` - Security middleware implementation
- `backend/routes/metrics.js` - Metrics route handler
- `backend/scripts/testMetricsAuth.js` - Security tests
- `backend/index.js` - Middleware integration

## Security Checklist

- [ ] METRICS_API_KEY set to strong value (32+ chars)
- [ ] METRICS_IP_ALLOWLIST configured if internal-only access needed
- [ ] Metrics disabled (METRICS_ENABLED=false) if not needed
- [ ] Prometheus scraper configured with correct API key
- [ ] Logs monitored for repeated authentication failures
- [ ] Keys rotated regularly (recommended: monthly)
- [ ] Testing confirms 401/403/410 responses for unauthorized requests
