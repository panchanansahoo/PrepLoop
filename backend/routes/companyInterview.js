import express from 'express';
import sessionRoutes from './company-interview/session.js';
import interactionRoutes from './company-interview/interaction.js';
import evaluationRoutes from './company-interview/evaluation.js';
import voiceRoutes from './company-interview/voice.js';

const router = express.Router();

router.use(sessionRoutes);
router.use(interactionRoutes);
router.use(evaluationRoutes);
router.use(voiceRoutes);

export default router;
