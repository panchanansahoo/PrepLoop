/**
 * Streaming Improvement Plan Response Handler
 * Sends large plan responses as Server-Sent Events (SSE) for better UX
 * Prevents timeout on slow networks and large data transfers
 */

import express from 'express';
import { improvementPlanService } from '../services/improvementPlanService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * Stream improvement plan generation response
 * Sends data in chunks using Server-Sent Events (SSE)
 *
 * Endpoint: POST /api/improvement-plan/stream
 * Response: Server-sent events with plan sections
 */
router.post('/stream', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { focusAreas = [], lazyMode = true } = req.body;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');

    // Send opening event
    res.write('event: start\n');
    res.write('data: {"status":"generating","message":"Starting improvement plan generation"}\n\n');

    try {
      // Step 1: Analyze weaknesses (send progress update)
      res.write('event: progress\n');
      res.write('data: {"step":"analyzing","message":"Analyzing your skill weaknesses..."}\n\n');

      const analysis = await improvementPlanService._analyzeWeaknesses(
        req.user.interviewSessions || [],
        focusAreas,
        lazyMode
      );

      res.write('event: analysis_complete\n');
      res.write(`data: ${JSON.stringify({ weaknesses: analysis.weaknesses })}\n\n`);

      // Step 2: Build improvement plan (send progress update)
      res.write('event: progress\n');
      res.write('data: {"step":"building","message":"Creating personalized improvement plan..."}\n\n');

      const plan = await improvementPlanService._buildImprovementPlan(
        userId,
        analysis,
        req.user.profile
      );

      // Step 3: Send daily plan (large data, send in chunks)
      if (plan.plan_data.dailyPlan) {
        res.write('event: daily_plan\n');
        res.write(`data: ${JSON.stringify({ dailyPlan: plan.plan_data.dailyPlan })}\n\n`);
      }

      // Step 4: Send recommendations
      if (plan.plan_data.recommendations) {
        res.write('event: recommendations\n');
        res.write(`data: ${JSON.stringify({ recommendations: plan.plan_data.recommendations })}\n\n`);
      }

      // Step 5: Send milestones
      if (plan.plan_data.milestones) {
        res.write('event: milestones\n');
        res.write(`data: ${JSON.stringify({ milestones: plan.plan_data.milestones })}\n\n`);
      }

      // Step 6: Send completion event with full plan
      res.write('event: complete\n');
      res.write(`data: ${JSON.stringify({ plan, status: 'success' })}\n\n`);

      res.end();
    } catch (error) {
      res.write('event: error\n');
      res.write(`data: ${JSON.stringify({ message: error.message, status: 'error' })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error('Stream endpoint error:', error);
    res.status(500).json({ error: 'Streaming failed' });
  }
});

/**
 * Chunked transfer encoding for large responses
 * Alternative to SSE: traditional chunked HTTP response
 */
router.get('/chunked/:planId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId } = req.params;

    // Set chunked transfer headers
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');

    res.write('{"plan":');

    // Fetch plan in sections
    try {
      const plan = await improvementPlanService.getLatestPlan(userId, planId);

      // Send plan metadata
      const metadata = {
        id: plan.id,
        created_at: plan.created_at,
        user_id: plan.user_id
      };
      res.write(JSON.stringify(metadata) + ',');
      res.write('"sections":[');

      // Send each section separately
      const sections = [
        plan.plan_data.weaknesses,
        plan.plan_data.dailyPlan,
        plan.plan_data.recommendations,
        plan.plan_data.milestones
      ];

      for (let i = 0; i < sections.length; i++) {
        res.write(JSON.stringify(sections[i]));
        if (i < sections.length - 1) res.write(',');
      }

      res.write(']}');
      res.end();
    } catch (error) {
      res.write(`,"error":"${error.message}"}`);
      res.end();
    }
  } catch (error) {
    console.error('Chunked endpoint error:', error);
    res.status(500).json({ error: 'Chunked transfer failed' });
  }
});

export default router;
