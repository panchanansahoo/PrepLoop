// In-memory cache for job listings
const jobCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export function getCachedJobs(key) {
  const cached = jobCache.get(key);
  if (!cached) return null;
  
  const isExpired = Date.now() - cached.timestamp > CACHE_TTL;
  if (isExpired) {
    jobCache.delete(key);
    return null;
  }
  
  return cached.data;
}

export function setCachedJobs(key, data) {
  jobCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

export function clearJobCache() {
  jobCache.clear();
}

// Rate limiting
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

export function checkRateLimit(identifier) {
  const now = Date.now();
  const userLimits = rateLimits.get(identifier) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
  
  if (now > userLimits.resetTime) {
    rateLimits.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }
  
  if (userLimits.count >= MAX_REQUESTS_PER_WINDOW) {
    return { 
      allowed: false, 
      remaining: 0,
      resetIn: Math.ceil((userLimits.resetTime - now) / 1000)
    };
  }
  
  userLimits.count++;
  rateLimits.set(identifier, userLimits);
  
  return { 
    allowed: true, 
    remaining: MAX_REQUESTS_PER_WINDOW - userLimits.count 
  };
}

// Clean up old rate limit entries every 5 minutes
const RATE_LIMIT_MAX_ENTRIES = 20000;
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimits.entries()) {
    if (now > value.resetTime) {
      rateLimits.delete(key);
    }
  }
  // Safety cap: if still over limit after cleanup, evict oldest entries
  if (rateLimits.size > RATE_LIMIT_MAX_ENTRIES) {
    const excess = rateLimits.size - RATE_LIMIT_MAX_ENTRIES;
    let evicted = 0;
    for (const key of rateLimits.keys()) {
      if (evicted >= excess) break;
      rateLimits.delete(key);
      evicted++;
    }
  }
}, 5 * 60 * 1000);
