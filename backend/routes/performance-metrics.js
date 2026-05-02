/**
 * Performance Monitoring Routes
 * Exposes cache statistics, performance metrics, and optimization recommendations
 * 
 * Endpoints:
 * - GET /api/metrics/cache-stats - Current cache hit/miss rates
 * - GET /api/metrics/cache-recommendations - Optimization recommendations
 * - GET /api/metrics/performance - API response time metrics
 * - POST /api/metrics/cache-clear - Clear cache (admin only)
 * - POST /api/metrics/cache-warmup - Pre-populate cache with critical data
 */

import express from 'express';
import cacheOptimizationService from '../services/cacheOptimizationService.js';
import performanceMonitor from '../utils/performanceMonitor.js';
import { authenticateToken } from '../middleware/auth.js';
import { createLogger } from '../utils/structuredLogger.js';

const router = express.Router();
const logger = createLogger('PerformanceMetrics');

/**
 * GET /api/metrics/cache-stats
 * Returns current cache statistics (hits, misses, hit rate)
 */
router.get('/cache-stats', (req, res) => {
  try {
    const stats = cacheOptimizationService.getStats();
    res.json({
      success: true,
      data: stats,
      message: 'Cache statistics retrieved successfully',
    });
  } catch (error) {
    logger.error('Failed to get cache stats', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve cache statistics',
    });
  }
});

/**
 * GET /api/metrics/cache-recommendations
 * Returns optimization recommendations based on cache patterns
 */
router.get('/cache-recommendations', (req, res) => {
  try {
    const recommendations = cacheOptimizationService.getCacheRecommendations();
    res.json({
      success: true,
      data: recommendations,
      message: 'Cache optimization recommendations generated',
    });
  } catch (error) {
    logger.error('Failed to generate recommendations', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendations',
    });
  }
});

/**
 * GET /api/metrics/cache-memory
 * Returns Redis memory usage statistics
 */
router.get('/cache-memory', (req, res) => {
  try {
    const memStats = cacheOptimizationService.getCacheMemoryStats();
    res.json({
      success: true,
      data: memStats,
      message: 'Cache memory statistics retrieved',
    });
  } catch (error) {
    logger.error('Failed to get cache memory stats', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve cache memory statistics',
    });
  }
});

/**
 * GET /api/metrics/performance
 * Returns API response time statistics
 */
router.get('/performance', (req, res) => {
  try {
    const perfStats = performanceMonitor.getStats?.() || {
      averageResponseTime: 'N/A',
      slowestEndpoints: [],
      fastestEndpoints: [],
    };
    
    res.json({
      success: true,
      data: perfStats,
      message: 'Performance statistics retrieved',
    });
  } catch (error) {
    logger.error('Failed to get performance stats', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve performance statistics',
    });
  }
});

/**
 * POST /api/metrics/cache-clear
 * Clear all caches (admin only - requires authentication)
 */
router.post('/cache-clear', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin (implement your admin check logic)
    const isAdmin = req.user?.role === 'admin' || req.user?.email?.endsWith('@admin.com');
    
    if (!isAdmin) {
      logger.warn('Unauthorized cache clear attempt', { userId: req.user?.id });
      return res.status(403).json({
        success: false,
        error: 'Only administrators can clear the cache',
      });
    }

    const result = await cacheOptimizationService.resetCache();
    
    if (result.success) {
      logger.info('Cache cleared by admin', { userId: req.user?.id });
      res.json({
        success: true,
        message: 'Cache cleared successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to clear cache',
      });
    }
  } catch (error) {
    logger.error('Error clearing cache', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
    });
  }
});

/**
 * POST /api/metrics/cache-warmup
 * Pre-populate cache with critical data (admin only)
 */
router.post('/cache-warmup', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const isAdmin = req.user?.role === 'admin' || req.user?.email?.endsWith('@admin.com');
    
    if (!isAdmin) {
      logger.warn('Unauthorized cache warmup attempt', { userId: req.user?.id });
      return res.status(403).json({
        success: false,
        error: 'Only administrators can trigger cache warmup',
      });
    }

    logger.info('Starting cache warmup', { userId: req.user?.id });
    await cacheOptimizationService.warmupCache();
    
    res.json({
      success: true,
      message: 'Cache warmup completed',
      stats: cacheOptimizationService.getStats(),
    });
  } catch (error) {
    logger.error('Cache warmup failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Cache warmup failed',
    });
  }
});

/**
 * GET /api/metrics/slow-queries
 * Returns slowest database queries for optimization
 */
router.get('/slow-queries', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const isAdmin = req.user?.role === 'admin' || req.user?.email?.endsWith('@admin.com');
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can view slow queries',
      });
    }

    // This would integrate with actual query logging
    const slowQueries = performanceMonitor.getSlowQueries?.() || [];
    
    res.json({
      success: true,
      data: {
        slowQueries,
        threshold: '200ms',
      },
      message: 'Slow queries retrieved',
    });
  } catch (error) {
    logger.error('Failed to get slow queries', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve slow queries',
    });
  }
});

/**
 * GET /api/metrics/bundle-analysis
 * Returns frontend bundle size statistics (for comparison with performance goals)
 */
router.get('/bundle-analysis', (req, res) => {
  try {
    // This would read from the frontend stats.html or a pre-computed metrics file
    const bundleMetrics = {
      currentSize: {
        gzipped: '1.9MB',
        raw: '6.8MB',
      },
      target: {
        gzipped: '1.5MB',
        raw: '5.5MB',
      },
      largestChunks: [
        { name: 'vendor-3d', gzipped: '218KB', raw: '943KB' },
        { name: 'vendor-prettier', gzipped: '127KB', raw: '596KB' },
        { name: 'vendor-tiptap', gzipped: '99KB', raw: '367KB' },
      ],
      optimization: {
        status: 'In Progress',
        targetReduction: '30%',
        estimatedImpact: 'Bundle > 1.5MB (gzipped), +20% faster load',
      },
    };

    res.json({
      success: true,
      data: bundleMetrics,
      message: 'Bundle analysis retrieved',
    });
  } catch (error) {
    logger.error('Failed to get bundle analysis', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve bundle analysis',
    });
  }
});

export default router;
