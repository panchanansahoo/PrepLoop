import express from 'express';
import { authenticateToken, optionalAuth } from '../../middleware/auth.ts';
import { LearningPathService } from '../../services/learningPathService.ts';

const router = express.Router();

router.get("/learning-paths", authenticateToken, (_req, res) => {
  try {
    const paths = LearningPathService.getCatalog();
    res.json({ paths });
  } catch (error) {
    console.error("Error fetching learning paths:", error);
    res.status(500).json({ error: "Failed to fetch learning paths" });
  }
});

router.get("/learning-paths/:pathId", authenticateToken, (req, res) => {
  try {
    const { pathId } = req.params;
    const pathData = LearningPathService.getPathDetail(pathId);

    if (!pathData) {
      return res.status(404).json({ error: "Learning path not found" });
    }

    res.json(pathData);
  } catch (error) {
    console.error("Error fetching learning path:", error);
    res.status(500).json({ error: "Failed to fetch learning path" });
  }
});

router.get("/learning-path/dsa", optionalAuth, async (req, res) => {
  try {
    const pathWithProgress = await LearningPathService.getDsaPathWithProgress(req.user?.id);
    res.json(pathWithProgress);
  } catch (error) {
    console.error("Error fetching DSA learning path:", error);
    res.status(500).json({ error: "Failed to fetch learning path" });
  }
});

router.get("/learning-path/dsa/module/:moduleSlug", optionalAuth, async (req, res) => {
  try {
    const module = await LearningPathService.getDsaModule(req.params.moduleSlug, req.user?.id);
    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }
    res.json(module);
  } catch (error) {
    console.error("Error fetching module:", error);
    res.status(500).json({ error: "Failed to fetch module" });
  }
});

router.get("/learning-path/lld", optionalAuth, async (req, res) => {
  try {
    const pathWithProgress = await LearningPathService.getLldPathWithProgress(req.user?.id);
    res.json(pathWithProgress);
  } catch (error) {
    console.error("Error fetching LLD learning path:", error);
    res.status(500).json({ error: "Failed to fetch learning path" });
  }
});

router.get("/learning-path/lld/module/:moduleSlug", optionalAuth, async (req, res) => {
  try {
    const module = await LearningPathService.getLldModule(req.params.moduleSlug, req.user?.id);
    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }
    res.json(module);
  } catch (error) {
    console.error("Error fetching module:", error);
    res.status(500).json({ error: "Failed to fetch module" });
  }
});

router.get("/learning-path/ai", optionalAuth, async (req, res) => {
  try {
    const pathWithProgress = await LearningPathService.getAiPathWithProgress(req.user?.id);
    res.json(pathWithProgress);
  } catch (error) {
    console.error("Error fetching AI learning path:", error);
    res.status(500).json({ error: "Failed to fetch learning path" });
  }
});

export default router;
