import { problemCache, companyCache, systemDesignCache } from '../utils/cache.js';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('cache-clear');

const caches = {
  problems: problemCache,
  companies: companyCache,
  systemDesign: systemDesignCache
};

const args = process.argv.slice(2);
const target = args[0] || 'all';

if (target === 'all') {
  for (const [name, cache] of Object.entries(caches)) {
    const size = cache.size();
    cache.clear();
    logger.info(`Cleared ${name} cache`, { entriesCleared: size });
  }
  console.log('✅ All caches cleared');
} else if (caches[target]) {
  const size = caches[target].size();
  caches[target].clear();
  logger.info(`Cleared ${target} cache`, { entriesCleared: size });
  console.log(`✅ ${target} cache cleared`);
} else {
  console.error(`❌ Unknown cache: ${target}`);
  console.log('Available caches: all, problems, companies, systemDesign');
  process.exit(1);
}
