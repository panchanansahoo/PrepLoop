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
    console.log('ℹ️ Application Insights already initialized, skipping');
    return true;
  }

  if (!connectionString) {
    console.log('ℹ️ Application Insights connection string not provided, skipping initialization');
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
    console.log('✅ Application Insights initialized successfully');
    return true;
  } catch (error) {
    // Log warning but don't fail - Application Insights is optional
    console.warn(
      '⚠️ Failed to initialize Application Insights:',
      error instanceof Error ? error.message : String(error)
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
