import express from 'express';
import profileRoutes from './user/profile.js';
import dashboardRoutes from './user/dashboard.js';
import learningRoutes from './user/learning.js';
import quizRoutes from './user/quiz.js';
import productivityRoutes from './user/productivity.js';

const router = express.Router();

router.use(profileRoutes);
router.use(dashboardRoutes);
router.use(learningRoutes);
router.use(quizRoutes);
router.use(productivityRoutes);

export default router;
