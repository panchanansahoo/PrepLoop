const cache = new Map();
const CACHE_TTL = {
  short: 60 * 1000,      // 1 minute
  medium: 5 * 60 * 1000, // 5 minutes
  long: 30 * 60 * 1000,  // 30 minutes
};

export const smartCache = (ttl = CACHE_TTL.medium) => {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();
    
    const key = `${req.originalUrl || req.url}`;
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return res.json(cached.data);
    }
    
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      cache.set(key, { data, timestamp: Date.now() });
      return originalJson(data);
    };
    
    next();
  };
};

export const clearCache = () => cache.clear();

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL.long) {
      cache.delete(key);
    }
  }
}, CACHE_TTL.long);
