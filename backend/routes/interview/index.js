import express from 'express';
import sessionRoutes from './session.js';
import feedbackRoutes from './feedback.js';
import analyticsRoutes, { getInterviewAnalytics, getInterviewRecommendations } from './analytics.js';
import transcribeRoutes from './transcribe.js';
import customSetsRoutes from './customSets.js';
import playbackRoutes from './playback.js';

const router = express.Router();

// Mount subroutes with exact path matching and precedence
router.use(sessionRoutes);
router.use(feedbackRoutes);
router.use(analyticsRoutes);
router.use(transcribeRoutes);
router.use(customSetsRoutes);
router.use(playbackRoutes);

export { getInterviewAnalytics, getInterviewRecommendations };
export default router;

