# Structured Logging and Critical Log Preservation

## Overview

This implementation ensures that critical startup/runtime logs are preserved and visible in production environments, while non-critical verbose logs are filtered out to reduce noise.

## Problem Solved

Previously, calling `disableConsoleLogs()` in production mode would suppress **all** `console.log()` output, including critical startup messages like:
- "🚀 Server running on port 5000"
- "📦 Loading routes..."
- "✅ Initialization complete"
- Database connection status
- Service startup confirmation

This made troubleshooting production issues and verifying proper server startup more difficult.

## Solution

### 1. Enhanced `productionLogger.js`

**File:** `backend/utils/productionLogger.js`

The production logger now intelligently filters console output:

```javascript
// Critical patterns that are always logged to stderr:
- 🚀 (startup/running indicators)
- ✅ (success indicators)
- ❌ (error indicators)
- 🚨 (critical/fatal errors)
- ⚠️ (warnings)
- ℹ️ (important info)
- Keywords: listening, running, started, initialized, connected, ready, failed, error, fatal, critical

// Behavior in production:
- console.log() → filtered (non-critical) or redirected to stderr (critical patterns)
- console.error() → preserved (always logged to stderr)
- console.warn() → preserved (always logged to stderr)
- console.info() → preserved (redirected to stderr)
- console.debug() → disabled
```

**Key Feature:** Critical startup logs with emoji indicators are automatically preserved by detecting pattern matches and redirecting them to `stderr`, making them visible in container logs and log aggregation systems.

### 2. Enhanced `structuredLogger.js`

**File:** `backend/utils/structuredLogger.js`

The structured logger now provides a robust alternative to console.log for all logging needs:

```javascript
// New log level: critical
logger.critical(message, context, error)

// Output
- Uses process.stderr.write() directly to bypass console filtering
- Outputs JSON-formatted logs for log aggregation
- Includes timestamp, operation name, severity level
- Automatically scrubs sensitive data (passwords, tokens, emails)
- Includes error stacks for debugging
```

**Benefits:**
- JSON format is ideal for log aggregation (Splunk, ELK, CloudWatch, etc.)
- Always visible in production (bypasses console.log suppression)
- Structured fields make parsing and filtering easier
- Security: PII is automatically redacted

## Usage

### For Simple Startup Logs

Use emoji prefixes to ensure visibility in production:

```javascript
console.log('🚀 Server running on http://localhost:5000');
console.log('📦 Loading routes...');
console.log('✅ All services initialized');
console.log('❌ Failed to connect to database');
```

### For Structured Logging (Recommended)

Import and use the structured logger:

```javascript
import { createLogger } from './utils/structuredLogger.js';

const logger = createLogger('my-service');

// Info logs
logger.info('User logged in', { userId: 123, email: 'user@example.com' });

// Warnings
logger.warn('High memory usage detected', { percentUsed: 85 });

// Errors with stack traces
try {
  // ...
} catch (error) {
  logger.error('Database query failed', { query: 'SELECT * FROM users' }, error);
}

// Critical startup/shutdown events
logger.critical('Server starting', { port: 5000, nodeEnv: 'production' });
logger.critical('Graceful shutdown initiated', { uptime: 3600 });
```

### Output Examples

**Structured Logger Output (JSON):**
```json
{"timestamp":"2026-05-01T10:53:53.577Z","level":"INFO","operation":"my-service","message":"User logged in","userId":123,"email":"us***@example.com"}
{"timestamp":"2026-05-01T10:54:08.670Z","level":"WARN","operation":"my-service","message":"High memory usage","percentUsed":85}
{"timestamp":"2026-05-01T10:54:30.024Z","level":"CRITICAL","operation":"my-service","message":"Server starting","port":5000,"nodeEnv":"production"}
```

**Console Logs with Emoji (Production):**
```
🚀 Server running on http://localhost:5000
📦 Loading routes...
✅ Routes loaded successfully
❌ Failed to initialize service
```

## Configuration

### Environment Variables

- `NODE_ENV=production` - Enables console.log filtering
- `NODE_ENV=development` - Disables filtering (all logs visible)
- `DEBUG=true` - Enables debug-level logs in structured logger

### Log Levels

| Level | Visibility | Use Case |
|-------|-----------|----------|
| DEBUG | Dev only | Detailed diagnostic info |
| INFO | Always | General informational messages |
| WARN | Always | Warning conditions |
| ERROR | Always | Error conditions with details |
| CRITICAL | Always | Critical startup/shutdown events |

## Testing

Run the comprehensive test suite:

```bash
npm run test  # or
node backend/scripts/testStructuredLogging.js
```

Test Coverage:
- ✓ Structured logger instantiation
- ✓ Log format and fields (timestamp, level, operation, message, context)
- ✓ Production mode filtering (non-critical logs suppressed)
- ✓ Critical log preservation (redirected to stderr)
- ✓ Error logging with stack traces
- ✓ PII scrubbing and masking
- ✓ Critical log level functionality

## Implementation Details

### Critical Log Filtering Algorithm

When `disableConsoleLogs()` is called in production:

1. **console.log()** is wrapped with pattern detection:
   - Check message for critical patterns (emoji, keywords)
   - If critical: redirect to `originalConsole.error` (stderr)
   - If not critical: silently suppress (no output)

2. **console.error()**, **console.warn()** remain unchanged (already go to stderr)

3. **console.info()** is redirected to stderr (to preserve informational logs)

4. **console.debug()** is disabled (no output)

### Structured Logger Guarantees

- **Direct stderr output:** Uses `process.stderr.write()` to bypass console.log filtering
- **No packet loss:** JSON logs are written atomically
- **Security:** Sensitive fields are scrubbed before output
- **Performance:** Minimal overhead, suitable for high-throughput logging

## Migration Guide

### From Old Pattern
```javascript
console.log('Some debug info');
console.error('An error occurred:', error);
```

### To New Pattern
```javascript
// For simple messages, use emoji for critical logs
console.log('🚀 Server started');

// For detailed logging with context, use structured logger
const logger = createLogger('service-name');
logger.info('Server started', { port: 5000, env: 'production' });
logger.error('Connection failed', { attempt: 3, timeout: 5000 }, error);
```

## Log Aggregation Integration

The JSON output from structured logger integrates seamlessly with:

- **AWS CloudWatch:** Automatic parsing of JSON fields
- **ELK Stack:** Logstash can parse structured logs
- **Splunk:** JSON format provides indexed fields
- **GCP Cloud Logging:** Native JSON support
- **Azure Monitor:** Application Insights integration

Example CloudWatch query:
```
fields @timestamp, operation, level, message, errorMessage
| filter level = "CRITICAL" or level = "ERROR"
| stats count() by operation
```

## Backwards Compatibility

- Existing code using `console.log()` with emoji continues to work
- All existing structured logger methods unchanged
- New `critical()` method is optional (use for important events)
- Error handler still captures and logs `console.error()` calls

## Performance Impact

- **Negligible:** String pattern matching on first `console.log()` call
- **No blocking:** Async log writing via `process.stderr.write()`
- **Memory safe:** No log buffering, immediate flush

## Security Considerations

1. **PII Scrubbing:** Automatic detection and redaction of:
   - Passwords, tokens, API keys
   - Email addresses (masked: `us***@example.com`)
   - Credit card numbers, SSN, CVV

2. **Log Injection:** Safe handling of user input in logs

3. **Sensitive Data:** Use `context` fields carefully:
   ```javascript
   // ✗ Bad: includes password
   logger.info('Login attempt', { username, password });
   
   // ✓ Good: password is auto-scrubbed
   logger.info('Login attempt', { username, email });
   ```

## Troubleshooting

### Logs not appearing in production

1. Check `NODE_ENV=production` is set
2. Verify logger is using `process.stderr.write()`
3. Check container/host's stderr stream is captured
4. Review `disableConsoleLogs()` is called before startup logs

### Missing context in logs

1. Ensure structured logger is used: `logger.info(..., context)`
2. Check context object doesn't contain circular references
3. Verify PII scrubbing isn't removing needed fields

### Performance issues

1. Reduce logging volume in production (use WARN+ levels)
2. Avoid logging large objects in context
3. Use log aggregation to filter at source

## Future Improvements

- [ ] Structured logger configuration (log level per service)
- [ ] Remote log shipping (e.g., to Datadog)
- [ ] Performance metrics in log entries
- [ ] Distributed tracing correlation IDs
- [ ] Log sampling for high-volume scenarios
