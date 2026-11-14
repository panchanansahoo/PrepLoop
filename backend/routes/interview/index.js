import express from 'express';
import sessionRoutes from './session.js';
import feedbackRoutes from './feedback.js';
import analyticsRoutes, { getInterviewAnalytics, getInterviewRecommendations } from './analytics.js';
import transcribeRoutes from './transcribe.js';
import customSetsRoutes from './customSets.js';
import playbackRoutes from './playback.js';
import feedbackPortalRoutes from './feedbackPortal.js';

const router = express.Router();

// Mount static/specific subroutes before parameterized /:id routes in sessionRoutes
router.use(analyticsRoutes);
router.use(customSetsRoutes);
router.use(playbackRoutes);
router.use(feedbackPortalRoutes);
router.use(feedbackRoutes);
router.use(transcribeRoutes);
router.use(sessionRoutes);

export { getInterviewAnalytics, getInterviewRecommendations };
export default router;

