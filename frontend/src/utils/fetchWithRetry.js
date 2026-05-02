/**
 * Safe Fetch Utility with Retry & Timeout
 *
 * Provides resilient fetch with:
 * - Request timeout (AbortController)
 * - Exponential backoff retries
 * - Network error handling
 * - Detailed error reporting
 *
 * Usage:
 *   const data = await fetchWithRetry('/api/endpoint', options);
 *   // Auto-retries 3 times with 1s, 2s, 4s delays
 *   // Throws after 30s timeout per attempt
 */

const DEFAULT_TIMEOUT_MS = 30_000; // 30 seconds
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAYS_MS = [1000, 2000, 4000]; // 1s, 2s, 4s

/**
 * Fetch with built-in timeout and retry support
 * @param {string} url - API endpoint
 * @param {object} options - Fetch options
 * @param {object} config - Retry/timeout config
 * @returns {Promise<Response>} - Fetch response
 * @throws {Error} - Network or timeout error after retries exhausted
 */
export async function fetchWithRetry(
  url,
  options = {},
  config = {}
) {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxRetries = DEFAULT_MAX_RETRIES,
    retryDelays = DEFAULT_RETRY_DELAYS_MS,
    onRetry = null,
  } = config;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Check for HTTP errors (4xx, 5xx)
        if (!response.ok) {
          const errorBody = await response.text().catch(() => 'Unknown error');
          const error = new Error(
            `HTTP ${response.status}: ${response.statusText}`
          );
          error.status = response.status;
          error.body = errorBody;
          throw error;
        }

        return response;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      lastError = error;

      // Don't retry if it's a client error (4xx)
      if (error.status && error.status >= 400 && error.status < 500) {
        throw error;
      }

      // If out of retries, throw
      if (attempt === maxRetries) {
        const finalError = new Error(
          `Failed after ${maxRetries + 1} attempts: ${error.message}`
        );
        finalError.originalError = error;
        throw finalError;
      }

      // Calculate delay for next retry
      const delayMs = retryDelays[attempt] || retryDelays[retryDelays.length - 1];

      // Notify caller of retry
      if (onRetry) {
        onRetry({
          attempt: attempt + 1,
          maxRetries,
          delayMs,
          error: error.message,
        });
      }

      console.warn(
        `[Fetch] Retrying ${url} (attempt ${attempt + 1}/${maxRetries}) ` +
        `after ${delayMs}ms. Error: ${error.message}`
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // Should not reach here, but as fallback
  throw lastError || new Error('Fetch failed');
}

/**
 * Fetch JSON with retry support
 * @param {string} url - API endpoint
 * @param {object} options - Fetch options
 * @param {object} config - Retry config
 * @returns {Promise<object>} - Parsed JSON response
 */
export async function fetchJsonWithRetry(url, options = {}, config = {}) {
  const response = await fetchWithRetry(url, options, config);
  
  try {
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${error.message}`);
  }
}

/**
 * Create fetch options with auth headers
 * @param {object} baseOptions - Base fetch options
 * @param {Function} getHeaders - Function to get auth headers
 * @returns {object} - Combined options with auth headers
 */
export function createFetchOptions(baseOptions = {}, getHeaders = null) {
  const options = {
    ...baseOptions,
    headers: {
      'Content-Type': 'application/json',
      ...baseOptions.headers,
    },
  };

  if (getHeaders) {
    const authHeaders = getHeaders();
    options.headers = {
      ...options.headers,
      ...authHeaders,
    };
  }

  return options;
}

/**
 * Shorthand for common POST with JSON body
 * @param {string} url - API endpoint
 * @param {object} body - Request body
 * @param {object} config - Auth and retry config
 * @returns {Promise<object>} - Response data
 */
export async function postJson(
  url,
  body,
  config = {}
) {
  const { getHeaders, ...retryConfig } = config;
  
  const options = createFetchOptions(
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
    getHeaders
  );

  return fetchJsonWithRetry(url, options, retryConfig);
}

/**
 * Test/demo function for validation
 * Usage: testFetchRetry()
 */
export async function testFetchRetry() {
  console.log('[Test] Testing fetch with retry...');

  // Test 1: Successful fetch
  try {
    const response = await fetchWithRetry(
      'https://jsonplaceholder.typicode.com/posts/1',
      {},
      { maxRetries: 1, timeoutMs: 10000 }
    );
    const data = await response.json();
    console.log('[Test] Success:', data.title);
  } catch (error) {
    console.error('[Test] Failed:', error.message);
  }

  // Test 2: 404 error (should not retry)
  try {
    await fetchWithRetry(
      'https://jsonplaceholder.typicode.com/posts/999999',
      {},
      { maxRetries: 3 }
    );
  } catch (error) {
    console.log('[Test] Expected 404:', error.message);
  }

  // Test 3: Invalid URL (will retry)
  try {
    await fetchWithRetry(
      'http://invalid-domain-that-does-not-exist.local',
      {},
      { maxRetries: 1, retryDelays: [100, 200] }
    );
  } catch (error) {
    console.log('[Test] Expected network error after retries:', error.message);
  }

  console.log('[Test] Complete');
}
