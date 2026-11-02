/**
 * Interview Router - Modularized
 * Re-exports subroutes and analytics helpers from ./interview/
 */
import router, { getInterviewAnalytics, getInterviewRecommendations } from './interview/index.js';

export * from './interview/helpers.js';
export { getInterviewAnalytics, getInterviewRecommendations };
export default router;
