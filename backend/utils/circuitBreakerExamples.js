/**
 * Circuit Breaker Integration Examples
 * 
 * This file shows recommended patterns for integrating circuit breakers
 * into key services in the PrepLoop backend.
 */

// ─────────────────────────────────────────────────────────────
// 1. GITHUB API SERVICE (Recommended Integration)
// ─────────────────────────────────────────────────────────────

import { breakers, CircuitBreakerOpenError } from '../utils/circuitBreaker.js';

const GITHUB_API_BASE = 'https://api.github.com';

const githubHeaders = () => {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'Preploop-Portfolio-Generator',
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
};

// Add circuit breaker to GitHub API calls
const fetchJsonWithCircuitBreaker = async (url) => {
  // Create a GitHub breaker if not already configured
  if (!breakers.github) {
    breakers.github = new CircuitBreaker('github', { 
      failureThreshold: 5, 
      resetTimeout: 60000 
    });
  }

  try {
    return await breakers.github.execute(async () => {
      const response = await fetch(url, { headers: githubHeaders() });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`GitHub API request failed (${response.status}): ${body}`);
      }
      return response.json();
    });
  } catch (error) {
    if (error.isCircuitBreakerError) {
      console.error('[GitHub Circuit Breaker]', error.message);
      // Fallback: return empty/cached data
      return null;
    }
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────
// 2. JOB SEARCH APIS (Recommended Integration)
// ─────────────────────────────────────────────────────────────

// Add circuit breaker to job search APIs
const fetchWithJobApiBreaker = async (url, options = {}) => {
  // Create a job API breaker if not already configured
  if (!breakers.jobSearch) {
    breakers.jobSearch = new CircuitBreaker('jobSearch', { 
      failureThreshold: 4,
      resetTimeout: 45000 
    });
  }

  try {
    return await breakers.jobSearch.execute(async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      try {
        const response = await fetch(url, {
          signal: controller.signal,
          ...options,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return await response.text();
      } finally {
        clearTimeout(timeout);
      }
    });
  } catch (error) {
    if (error.isCircuitBreakerError) {
      console.error('[Job Search Circuit Breaker]', error.message);
      // Fallback: return cached jobs from database
      return null;
    }
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────
// 3. EXTERNAL VERIFICATION SERVICES
// ─────────────────────────────────────────────────────────────

// Email/SMS verification services
export const verifyEmailWithCircuitBreaker = async (email, token) => {
  if (!breakers.emailVerification) {
    breakers.emailVerification = new CircuitBreaker('emailVerification', {
      failureThreshold: 3,
      resetTimeout: 120000, // 2 minutes
    });
  }

  try {
    return await breakers.emailVerification.execute(async () => {
      const response = await fetch('https://api.verification-service.com/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    });
  } catch (error) {
    if (error.isCircuitBreakerError) {
      // For verification, you might want to queue for later retry
      console.error('[Email Verification Circuit Breaker]', error.message);
      throw new Error('Verification service temporarily unavailable');
    }
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────
// 4. PAYMENT PROCESSING
// ─────────────────────────────────────────────────────────────

import Razorpay from 'razorpay';

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createPaymentWithCircuitBreaker = async (amount, currency = 'INR') => {
  try {
    return await breakers.razorpay.execute(async () => {
      const order = await razorpayInstance.orders.create({
        amount: amount * 100, // Convert to paise
        currency,
        receipt: `order_${Date.now()}`,
      });

      return order;
    });
  } catch (error) {
    if (error.isCircuitBreakerError) {
      console.error('[Razorpay Circuit Breaker]', error.message);
      throw new Error('Payment service temporarily unavailable. Please try again later.');
    }
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────
// 5. HEALTH CHECK WITH CIRCUIT BREAKER STATUS
// ─────────────────────────────────────────────────────────────

export function getCircuitBreakerHealthStatus() {
  const breakerStatuses = {
    groq: breakers.groq?.getStatus(),
    gemini: breakers.gemini?.getStatus(),
    elevenLabs: breakers.elevenLabs?.getStatus(),
    razorpay: breakers.razorpay?.getStatus(),
    github: breakers.github?.getStatus(),
    jobSearch: breakers.jobSearch?.getStatus(),
    emailVerification: breakers.emailVerification?.getStatus(),
  };

  // Filter out undefined breakers
  return Object.fromEntries(
    Object.entries(breakerStatuses).filter(([_, status]) => status !== undefined)
  );
}

// ─────────────────────────────────────────────────────────────
// 6. MONITORING ENDPOINT INTEGRATION
// ─────────────────────────────────────────────────────────────

export function getAllCircuitBreakerMetrics() {
  const statuses = getCircuitBreakerHealthStatus();
  
  return {
    timestamp: new Date().toISOString(),
    breakers: statuses,
    summary: {
      totalBreakers: Object.keys(statuses).length,
      openBreakers: Object.values(statuses).filter(s => s.state === 'OPEN').length,
      halfOpenBreakers: Object.values(statuses).filter(s => s.state === 'HALF_OPEN').length,
      closedBreakers: Object.values(statuses).filter(s => s.state === 'CLOSED').length,
    },
  };
}

// ─────────────────────────────────────────────────────────────
// 7. GRACEFUL DEGRADATION PATTERNS
// ─────────────────────────────────────────────────────────────

export const fetchPortfolioDataWithFallback = async (username) => {
  try {
    // Try to fetch full data with circuit breaker protection
    return await fetchJsonWithCircuitBreaker(
      `${GITHUB_API_BASE}/users/${username}`
    );
  } catch (error) {
    if (error.isCircuitBreakerError) {
      console.log('[Portfolio] Circuit breaker open, using cached data');
      // Return cached portfolio data
      return {
        username,
        cached: true,
        profile: {},
        repositories: [],
        // ... other cached fields
      };
    }
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────
// 8. RETRY WITH CIRCUIT BREAKER COMBO
// ─────────────────────────────────────────────────────────────

export const fetchWithRetryAndCircuitBreaker = async (
  url,
  breaker,
  maxRetries = 3,
  retryDelayMs = 100
) => {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await breaker.execute(async () => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      });
    } catch (error) {
      lastError = error;

      // Don't retry if circuit breaker is open
      if (error.isCircuitBreakerError) {
        throw error;
      }

      // Retry on transient errors
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelayMs * (2 ** attempt)));
      }
    }
  }

  throw lastError;
};

// ─────────────────────────────────────────────────────────────
// 9. BULK OPERATIONS WITH CIRCUIT BREAKER
// ─────────────────────────────────────────────────────────────

export const fetchMultipleWithCircuitBreaker = async (urls, breaker) => {
  const results = {
    successful: [],
    failed: [],
    circuitBreakerOpen: false,
  };

  for (const url of urls) {
    try {
      const data = await breaker.execute(async () => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      });

      results.successful.push({ url, data });
    } catch (error) {
      if (error.isCircuitBreakerError) {
        results.circuitBreakerOpen = true;
        break; // Stop trying if circuit is open
      }

      results.failed.push({ url, error: error.message });
    }
  }

  return results;
};

export { CircuitBreakerOpenError };
