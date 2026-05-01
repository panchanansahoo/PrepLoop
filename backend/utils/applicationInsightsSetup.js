/**
 * Application Insights Setup Utility
 *
 * Initializes Application Insights asynchronously without requiring
 * top-level await. This is imported dynamically when needed and handles
 * failures gracefully.
 *
 * Benefits:
 *   - No top-level await fragility
 *   - Module loads even if Application Insights initialization fails
 *   - Better error isolation and logging
 *   - Easier to test and mock
 */

import { createLogger } from './structuredLogger.js';

const logger = createLogger('applicationInsightsSetup');
let isInitialized = false;

/**
 * Initialize Application Insights from connection string
 * Safe to call multiple times (idempotent)
 *
 * @returns {Promise<boolean>} true if initialized (or already initialized), false if skipped
 */
export async function initializeApplicationInsights(connectionString) {
  // Prevent duplicate initialization
  if (isInitialized) {
    logger.info('Application Insights already initialized, skipping');
    return true;
  }

  if (!connectionString) {
    logger.info('Application Insights connection string not provided, skipping initialization');
    return false;
  }

  try {
    // Dynamically import only when needed
    const applicationInsights = await import('applicationinsights');

    applicationInsights
      .setup(connectionString)
      .setAutoCollectConsole(false, true)
      .setAutoCollectRequests(true)
      .setAutoCollectDependencies(true)
      .start();

    isInitialized = true;
    logger.info('Application Insights initialized successfully', {
      module: 'applicationinsights',
      status: 'initialized',
    });
    return true;
  } catch (error) {
    // Log warning but don't fail - Application Insights is optional
    logger.error(
      'Failed to initialize Application Insights',
      {
        module: 'applicationinsights',
        status: 'initialization_failed',
      },
      error instanceof Error ? error : new Error(String(error))
    );
    return false;
  }
}

/**
 * Get initialization status
 */
export function isAppInsightsInitialized() {
  return isInitialized;
}
