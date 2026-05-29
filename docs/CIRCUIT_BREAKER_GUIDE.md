# Circuit Breaker Implementation Guide

## Overview

The circuit breaker pattern is implemented in `backend/utils/circuitBreaker.js` to provide fault tolerance for external API calls. It prevents cascading failures and provides automatic recovery mechanisms.

## States

The circuit breaker operates in three states:

- **CLOSED**: Normal operation, all requests pass through
- **OPEN**: Failure threshold exceeded, requests are rejected immediately
- **HALF_OPEN**: Testing if the service has recovered, allowing a limited number of requests

```
CLOSED --[failures >= threshold]--> OPEN --[timeout]--> HALF_OPEN --[successes >= threshold]--> CLOSED
                                                       \
                                                        --[failure]--> OPEN
```

## Pre-configured Breakers

Pre-configured circuit breakers are available for known external services:

```javascript
import { breakers, CircuitBreakerOpenError } from './utils/circuitBreaker.js';

// Available pre-configured breakers:
// - breakers.gemini (failureThreshold: 5, resetTimeout: 60000ms)
// - breakers.groq (failureThreshold: 5, resetTimeout: 30000ms)
// - breakers.elevenLabs (failureThreshold: 3, resetTimeout: 60000ms)
// - breakers.razorpay (failureThreshold: 3, resetTimeout: 30000ms)
```

## Usage Examples

### 1. With AI Calls (Already Integrated)

The circuit breaker is already integrated with AI calls via `aiCallWithRetry`:

```javascript
import { aiCallWithRetry, CircuitBreakerOpenError } from './utils/aiClient.js';

try {
  const result = await aiCallWithRetry({
    operation: async () => {
      // Your AI API call here
      return groqClient.chat.completions.create({ /* ... */ });
    },
    timeoutMs: 12000,
    maxRetries: 2,
    serviceName: 'groq', // Circuit breaker name
  });
} catch (error) {
  if (error.isCircuitBreakerError) {
    console.log('Circuit breaker is OPEN, service temporarily unavailable');
  } else {
    console.log('Request failed:', error.message);
  }
}
```

### 2. With GitHub API Calls

```javascript
import { breakers, CircuitBreakerOpenError } from './utils/circuitBreaker.js';

export const fetchGithubUser = async (username) => {
  return breakers.github.execute(async () => {
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return response.json();
  });
};
```

### 3. With Job Search APIs

```javascript
import { breakers, CircuitBreakerOpenError } from './utils/circuitBreaker.js';

export const fetchIndeedJobs = async (query, location) => {
  return breakers.jobApis.execute(async () => {
    const url = `https://in.indeed.com/jobs?q=${query}&l=${location}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`Status ${response.status}`);
      return await response.text();
    } finally {
      clearTimeout(timeout);
    }
  });
};
```

### 4. Creating a Custom Circuit Breaker

```javascript
import { CircuitBreaker } from './utils/circuitBreaker.js';

const customBreaker = new CircuitBreaker('payment-gateway', {
  failureThreshold: 3,        // Open after 3 failures
  resetTimeout: 45000,        // Try recovery after 45 seconds
  halfOpenMaxAttempts: 2,     // Need 2 successes to close
});

// Usage
try {
  const result = await customBreaker.execute(async () => {
    return await processPayment(amount);
  });
} catch (error) {
  if (error.isCircuitBreakerError) {
    // Handle circuit breaker open state
    res.status(503).json({ error: 'Payment service temporarily unavailable' });
  } else {
    // Handle other errors
    res.status(500).json({ error: error.message });
  }
}
```

## Configuration Options

When creating a custom circuit breaker:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `failureThreshold` | number | 5 | Number of failures before opening circuit |
| `resetTimeout` | number | 30000 | Milliseconds to wait before attempting recovery |
| `halfOpenMaxAttempts` | number | 2 | Consecutive successes needed to close circuit |

## Monitoring & Metrics

### Get Breaker Status

```javascript
import { breakers, getAllBreakerStatuses } from './utils/circuitBreaker.js';

// Individual breaker status
const status = breakers.groq.getStatus();
console.log(status);
// {
//   name: 'groq',
//   state: 'CLOSED' | 'OPEN' | 'HALF_OPEN',
//   failureCount: 0,
//   successCount: 42,
//   lastFailureTime: 1234567890
// }

// All breaker statuses
const allStatuses = getAllBreakerStatuses();
```

### Health Check Endpoint

Circuit breaker status is included in the monitoring endpoint:

```
GET /api/health/metrics
```

Response includes breaker statuses for all pre-configured breakers.

### Reset Breaker Manually

```javascript
// Force breaker back to CLOSED state
breakers.groq.reset();
```

## Integration Points

### 1. AI Client (`backend/utils/aiClient.js`)

- **Status**: ✅ Integrated
- **Services**: Gemini, Groq, ElevenLabs, Razorpay
- **Pattern**: `aiCallWithRetry` with built-in circuit breaker

### 2. GitHub Service (`backend/services/portfolioGithubService.js`)

**Recommended Integration**:

```javascript
import { breakers } from '../utils/circuitBreaker.js';

const fetchJson = async (url) => {
  return breakers.github.execute(async () => {
    const response = await fetch(url, { headers: githubHeaders() });
    if (!response.ok) throw new Error(`Status ${response.status}`);
    return response.json();
  });
};
```

### 3. Job Search APIs (`backend/utils/indianJobApis.js`)

**Recommended Integration**:

```javascript
import { breakers } from '../utils/circuitBreaker.js';

export const fetchIndeedIndiaJobs = async (query, location) => {
  return breakers.jobApis.execute(async () => {
    // ... existing fetch logic
  });
};
```

### 4. Voice Service (`backend/services/voiceService.js`)

**Recommended Integration**:

- Groq (TTS/STT): Already using `aiCallWithRetry`
- ElevenLabs: Can use `breakers.elevenLabs`

## Error Handling

### Detecting Circuit Breaker Errors

```javascript
import { CircuitBreakerOpenError } from './utils/circuitBreaker.js';

try {
  const result = await breaker.execute(operation);
} catch (error) {
  if (error.isCircuitBreakerError) {
    // Circuit is open
    console.log('Circuit breaker:', error.message);
  } else {
    // Other error
    console.log('Operation failed:', error.message);
  }
}
```

### Graceful Degradation

```javascript
try {
  return await breakers.github.execute(async () => {
    return await fetchFullUserData(username);
  });
} catch (error) {
  if (error.isCircuitBreakerError) {
    // Return cached/degraded response
    return await getCachedUserData(username);
  }
  throw error;
}
```

## Best Practices

1. **Use appropriate thresholds**: Higher for critical services, lower for optional ones
2. **Monitor circuit state**: Log state transitions for debugging
3. **Implement fallbacks**: Have degraded responses ready for OPEN state
4. **Set realistic timeouts**: Account for network latency in your environment
5. **Test failures**: Verify circuit breaker behavior during testing
6. **Combine with retries**: Use circuit breaker + retry for resilience

## Testing

### Manual Testing

```bash
# Run backend tests (includes circuit breaker tests)
npm run test --prefix backend

# Or specific test file if available
npx node backend/tests/circuitBreaker.test.js
```

### Simulating Failures

```javascript
// For testing, temporarily modify the operation to fail
const breaker = new CircuitBreaker('test', { failureThreshold: 2 });

for (let i = 0; i < 3; i++) {
  try {
    await breaker.execute(async () => {
      throw new Error('Simulated failure');
    });
  } catch (error) {
    console.log(`Attempt ${i + 1}:`, error.message);
  }
}
// After 2 failures, circuit opens and subsequent calls fail immediately
```

## Troubleshooting

### Circuit Breaker Always Open

- **Check**: Last failure time and reset timeout
- **Fix**: Verify the underlying service is healthy
- **Debug**: Check logs for what caused the initial failures

### Circuit Stays in HALF_OPEN

- **Check**: Success threshold configuration
- **Fix**: May indicate intermittent failures; increase threshold or investigate service
- **Monitor**: Use metrics to track state transitions

### Performance Issues

- **Check**: Request timeout settings
- **Fix**: Increase timeout if service is genuinely slow
- **Monitor**: Track p95/p99 response times

## Related Documentation

- [AI Client Implementation](./AI_FEATURES_API.md#circuit-breaker-integration)
- [Monitoring Guide](./MONITORING_GUIDE.md)
- [Backend Standards](../.github/instructions/backend-standards.instructions.md)
