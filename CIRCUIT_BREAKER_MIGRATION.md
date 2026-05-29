# Circuit Breaker Integration Migration Guide

This guide provides step-by-step instructions for integrating the circuit breaker pattern into existing external API calls.

## Quick Start

### 1. For GitHub API Calls

**File**: `backend/services/portfolioGithubService.js`

**Current Code**:
```javascript
const fetchJson = async (url) => {
  const response = await fetch(url, { headers: githubHeaders() });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API request failed (${response.status}): ${body}`);
  }
  return response.json();
};
```

**Updated Code**:
```javascript
import { CircuitBreaker } from '../utils/circuitBreaker.js';

// Create once at module load
const githubBreaker = new CircuitBreaker('github', {
  failureThreshold: 5,
  resetTimeout: 60000,
});

const fetchJson = async (url) => {
  return githubBreaker.execute(async () => {
    const response = await fetch(url, { headers: githubHeaders() });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`GitHub API request failed (${response.status}): ${body}`);
    }
    return response.json();
  });
};
```

### 2. For Job Search APIs

**File**: `backend/utils/indianJobApis.js`

**Current Code**:
```javascript
export async function fetchIndeedIndiaJobs(query, location) {
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return [];
    return await response.text();
  } catch {
    return '';
  }
}
```

**Updated Code**:
```javascript
import { CircuitBreaker } from './circuitBreaker.js';

const jobApiBreaker = new CircuitBreaker('jobSearch', {
  failureThreshold: 4,
  resetTimeout: 45000,
});

export async function fetchIndeedIndiaJobs(query, location) {
  try {
    return await jobApiBreaker.execute(async () => {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`Status ${response.status}`);
      return await response.text();
    });
  } catch (error) {
    if (error.isCircuitBreakerError) {
      console.error('Job API circuit breaker open:', error.message);
      // Return cached or empty response
      return '';
    }
    throw error;
  }
}
```

### 3. For Payment APIs

**File**: `backend/routes/payment.js` or payment service

**Current Code**:
```javascript
const order = await razorpayInstance.orders.create({
  amount: amount * 100,
  currency,
});
```

**Updated Code**:
```javascript
import { breakers } from '../utils/circuitBreaker.js';

// Use pre-configured breaker
const order = await breakers.razorpay.execute(async () => {
  return razorpayInstance.orders.create({
    amount: amount * 100,
    currency,
  });
});
```

## Pattern Templates

### Pattern 1: Simple Wrap

Use when you want to quickly add circuit breaker to an existing function:

```javascript
const myBreaker = new CircuitBreaker('my-service', {
  failureThreshold: 5,
  resetTimeout: 30000,
});

export const myApiCall = async (param) => {
  return myBreaker.execute(async () => {
    // Your existing API call code here
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  });
};
```

### Pattern 2: With Error Handling

Use when you need specific error handling and fallbacks:

```javascript
const myBreaker = new CircuitBreaker('my-service', config);

export const myApiCallWithFallback = async (param) => {
  try {
    return await myBreaker.execute(async () => {
      // Your API call
      return await externalApi.call(param);
    });
  } catch (error) {
    if (error.isCircuitBreakerError) {
      // Circuit is open - use fallback
      console.error('Service unavailable, using cached data');
      return getCachedData(param);
    }
    // Other errors
    throw error;
  }
};
```

### Pattern 3: With Retry Logic

Use when combining circuit breaker with retries:

```javascript
const myBreaker = new CircuitBreaker('my-service', config);

export const myApiCallWithRetry = async (param, maxRetries = 3) => {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await myBreaker.execute(async () => {
        return await externalApi.call(param);
      });
    } catch (error) {
      lastError = error;

      // Don't retry if circuit is open
      if (error.isCircuitBreakerError) throw error;

      // Wait before retry
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 100;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};
```

### Pattern 4: Module-Level Setup

Use for services that make multiple calls:

```javascript
import { CircuitBreaker } from '../utils/circuitBreaker.js';

class MyApiService {
  constructor() {
    this.breaker = new CircuitBreaker('my-api', {
      failureThreshold: 5,
      resetTimeout: 60000,
    });
  }

  async getUser(id) {
    return this.breaker.execute(async () => {
      return fetch(`/api/users/${id}`).then(r => r.json());
    });
  }

  async createUser(data) {
    return this.breaker.execute(async () => {
      return fetch('/api/users', { method: 'POST', body: JSON.stringify(data) })
        .then(r => r.json());
    });
  }

  getStatus() {
    return this.breaker.getStatus();
  }
}

export default new MyApiService();
```

## Configuration Guide

### For Critical Services (Payment, Auth)
```javascript
new CircuitBreaker('critical-service', {
  failureThreshold: 3,      // Open faster
  resetTimeout: 120000,     // Longer recovery window
  halfOpenMaxAttempts: 2,   // Test recovery carefully
});
```

### For High-Volume Services (Search, Analytics)
```javascript
new CircuitBreaker('high-volume-service', {
  failureThreshold: 8,      // More tolerant
  resetTimeout: 30000,      // Quick recovery
  halfOpenMaxAttempts: 2,
});
```

### For Optional Services (Cache, Analytics)
```javascript
new CircuitBreaker('optional-service', {
  failureThreshold: 10,     // Very tolerant
  resetTimeout: 15000,      // Very quick recovery
  halfOpenMaxAttempts: 1,   // Single success to recover
});
```

## Testing Your Integration

### Unit Test Template

```javascript
import { CircuitBreaker } from '../utils/circuitBreaker.js';

describe('MyApiService with Circuit Breaker', () => {
  let breaker;

  beforeEach(() => {
    breaker = new CircuitBreaker('test', { failureThreshold: 2 });
  });

  it('should fail after threshold and open circuit', async () => {
    // Simulate failures
    for (let i = 0; i < 2; i++) {
      try {
        await breaker.execute(() => Promise.reject(new Error('Failed')));
      } catch {
        // Expected
      }
    }

    // Circuit should be open
    expect(breaker.state).toBe('OPEN');

    // Should reject immediately
    try {
      await breaker.execute(() => Promise.resolve('success'));
      throw new Error('Should have thrown');
    } catch (error) {
      expect(error.isCircuitBreakerError).toBe(true);
    }
  });

  it('should recover after timeout', async () => {
    // Open circuit (trigger failures)
    // Wait for timeout
    await new Promise(resolve => setTimeout(resolve, 150));

    // Should transition to HALF_OPEN
    try {
      await breaker.execute(() => Promise.resolve('recovered'));
    } catch {
      // May fail, but state changes
    }

    expect(breaker.state).toBe('HALF_OPEN');
  });
});
```

## Monitoring Integration

### Add Breaker to Health Check

```javascript
// In your health check endpoint
import { getAllBreakerStatuses } from '../utils/circuitBreaker.js';

router.get('/health/breakers', (req, res) => {
  const breakerStatuses = getAllBreakerStatuses();
  const hasOpenBreakers = Object.values(breakerStatuses)
    .some(status => status.state === 'OPEN');

  res.status(hasOpenBreakers ? 503 : 200).json({
    healthy: !hasOpenBreakers,
    breakers: breakerStatuses,
  });
});
```

### Log State Transitions

```javascript
class LoggingCircuitBreaker extends CircuitBreaker {
  transitionState(newState) {
    if (this.state !== newState) {
      console.log(`[CircuitBreaker:${this.name}] ${this.state} → ${newState}`);
    }
    super.transitionState(newState);
  }
}
```

## Rollout Strategy

### Phase 1: Critical Services (Week 1)
1. Payment APIs (Razorpay) - Already integrated
2. Auth services
3. Database connections

### Phase 2: High-Volume Services (Week 2)
1. GitHub API (portfolio service)
2. Job search APIs
3. AI/ML service calls - Already integrated

### Phase 3: Optional Services (Week 3)
1. Analytics APIs
2. Third-party integrations
3. Caching layers

## Validation Checklist

- [ ] Circuit breaker wraps the API call
- [ ] Error handling distinguishes circuit breaker errors
- [ ] Fallback/degradation strategy defined
- [ ] Configuration thresholds appropriate for service
- [ ] Unit tests added
- [ ] Health check endpoint updated
- [ ] Monitoring/logging in place
- [ ] Runbook updated with troubleshooting steps

## Common Pitfalls

### ❌ Not Handling Circuit Breaker Errors
```javascript
// Wrong
try {
  await breaker.execute(() => externalApi());
} catch (error) {
  // All errors treated the same
}
```

### ✅ Proper Error Handling
```javascript
// Correct
try {
  await breaker.execute(() => externalApi());
} catch (error) {
  if (error.isCircuitBreakerError) {
    // Return cached/default response
  } else {
    // Handle actual API error
  }
}
```

### ❌ Creating Breaker Per Call
```javascript
// Wrong - creates new breaker each time
export const fetchData = async () => {
  const breaker = new CircuitBreaker('api');
  return breaker.execute(() => externalApi());
};
```

### ✅ Reuse Breaker Instance
```javascript
// Correct - single breaker per service
const breaker = new CircuitBreaker('api');

export const fetchData = async () => {
  return breaker.execute(() => externalApi());
};
```

## Getting Help

- Review: `docs/CIRCUIT_BREAKER_GUIDE.md`
- Examples: `backend/utils/circuitBreakerExamples.js`
- Tests: `backend/tests/circuitBreaker.test.js`
- Questions: Check monitoring-enhanced.js for integration patterns
