const DEFAULT_TIMEOUT_MS = Number.parseInt(process.env.AI_TIMEOUT_MS || '12000', 10);
const DEFAULT_MAX_RETRIES = Number.parseInt(process.env.AI_MAX_RETRIES || '2', 10);
const DEFAULT_BASE_DELAY_MS = Number.parseInt(process.env.AI_RETRY_BASE_DELAY_MS || '250', 10);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withTimeout = async (operation, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const err = new Error(`AI call timed out after ${timeoutMs}ms`);
      err.code = 'AI_TIMEOUT';
      reject(err);
    }, timeoutMs);
  });

  try {
    return await Promise.race([operation(), timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
};

export const isTransientAiError = (error) => {
  const code = String(error?.code || '').toUpperCase();
  const status = Number(error?.status || error?.statusCode || 0);
  const message = String(error?.message || '').toLowerCase();

  if (code === 'AI_TIMEOUT') return true;
  if (status === 408 || status === 409 || status === 429) return true;
  if (status >= 500 && status < 600) return true;

  return (
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('temporar') ||
    message.includes('econnreset') ||
    message.includes('enotfound') ||
    message.includes('socket hang up')
  );
};

export const aiCallWithRetry = async ({
  operation,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  maxRetries = DEFAULT_MAX_RETRIES,
  baseDelayMs = DEFAULT_BASE_DELAY_MS,
}) => {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await withTimeout(operation, timeoutMs);
    } catch (error) {
      lastError = error;
      const canRetry = attempt < maxRetries && isTransientAiError(error);
      if (!canRetry) {
        throw error;
      }

      const jitter = Math.floor(Math.random() * baseDelayMs);
      const backoffMs = baseDelayMs * (2 ** attempt) + jitter;
      await sleep(backoffMs);
    }
  }

  throw lastError;
};
