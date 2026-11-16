import express from 'express';
import sessionRoutes from './company-interview/session.js';
import interactionRoutes from './company-interview/interaction.js';
import evaluationRoutes from './company-interview/evaluation.js';
import voiceRoutes from './company-interview/voice.js';
import intelligenceRoutes from './company-interview/intelligence.js';
import { getPaginatedQuestions, getAvailableCompanies, getCompanyStats } from '../services/companyQuestionService.ts';

const router = express.Router();

/**
 * GET /api/company-interview/questions
 * Paginated and searchable question bank endpoint.
 * Query params: company, role, stage, difficulty, search, page (default 1), limit (default 20, max 100)
 */
router.get('/questions', async (req, res) => {
  try {
    const { company, role, stage, difficulty, search } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const result = await getPaginatedQuestions({
      company: typeof company === 'string' ? company : undefined,
      role: typeof role === 'string' ? role : undefined,
      stage: typeof stage === 'string' ? stage : undefined,
      difficulty: typeof difficulty === 'string' ? difficulty : undefined,
      search: typeof search === 'string' ? search : undefined,
      page,
      limit,
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve company questions',
      message: error?.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/company-interview/companies
 * Returns available companies and aggregated question stats.
 */
router.get('/companies', async (_req, res) => {
  try {
    const [companies, stats] = await Promise.all([
      getAvailableCompanies(),
      getCompanyStats(),
    ]);
    return res.json({
      success: true,
      companies,
      stats,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve companies',
      message: error?.message || 'Internal server error',
    });
  }
});

router.use(sessionRoutes);
router.use(interactionRoutes);
router.use(evaluationRoutes);
router.use(voiceRoutes);
router.use(intelligenceRoutes);

export default router;
