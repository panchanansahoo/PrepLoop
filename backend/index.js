import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import './config/env.js';
// Comprehensive Improvements
import { apiCacheMiddleware } from './middleware/apiCache.js';
import { enhancedSecurity } from './middleware/securityEnhanced.js';
import cspMiddleware from './middleware/csp.js';
import { queryTimeout } from './middleware/queryTimeout.js';
import { etagMiddleware } from './middleware/etag.js';
import collaborationService from './services/collaborationService.js';

import { disableConsoleLogs } from './utils/productionLogger.js';
import { validateStartupEnv } from './config/startupEnvValidation.js';
import { validateEnvironment } from './config/envValidation.js';
import { corsOptions } from './config/cors.js';
import { server as serverConfig, auth as authConfig, cache as cacheConfig } from './config/appConfig.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { sanitizeInput } from './middleware/sanitization.js';
import { configureExpressTrustProxy, createProxyValidationMiddleware } from './middleware/proxyValidation.js';
import { createMetricsSecurityMiddleware } from './middleware/metricsAuth.js';
import { aiEndpointsLimiter, paymentEndpointsLimiter, jobsEndpointsLimiter, adminEndpointsLimiter } from './middleware/apiRateLimiter.js';
import { createLogger } from './utils/structuredLogger.js';
import { setupGracefulShutdown } from './utils/gracefulShutdown.js';
import { initializeApplicationInsights } from './utils/applicationInsightsSetup.js';
import cacheManager from './utils/cacheManager.js';

let app;
const voiceHttpLogger = createLogger('voice-http');

// Disable console.log in production
if (process.env.NODE_ENV === 'production') {
  disableConsoleLogs();
}

// Validate environment variables
validateEnvironment();
validateStartupEnv();

async function initializeServer() {
  try {
    // Initialize cache manager with error handling
    console.log('🔄 Initializing cache manager...');
    await cacheManager.connect();
    console.log('✅ Cache manager connected');

    // Initialize Application Insights early, but don't block on failure
    void initializeApplicationInsights(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING);

    console.log('📦 Loading routes...');

    // Route loading helper — returns null on failure so server keeps running
    const failedGroups = [];
    async function loadRoute(name, path) {
      try {
        return (await import(path)).default;
      } catch (err) {
        console.error(`⚠️ Failed to load route "${name}" from ${path}:`, err.message);
        failedGroups.push(name);
        return null;
      }
    }

    // ─── Core infrastructure routes ───
    const authRoutes = await loadRoute('auth', './routes/auth.js');
    const healthRoutes = await loadRoute('health', './routes/health.js');
    const userRoutes = await loadRoute('user', './routes/user.js');
    const contactRoutes = await loadRoute('contact', './routes/contact.js');
    const adminRoutes = await loadRoute('admin', './routes/admin.js');
    const gdprRoutes = await loadRoute('gdpr', './routes/gdpr.js');
    const metricsRoutes = await loadRoute('metrics', './routes/metrics.js');
    const analyticsEventsRoutes = await loadRoute('analytics-events', './routes/analytics-events.js');
    const performanceMetricsRoutes = await loadRoute('performance-metrics', './routes/performance-metrics.js');

    // ─── Practice & DSA routes ───
    const dsaRoutes = await loadRoute('dsa', './routes/dsa.js');
    const practiceRoutes = await loadRoute('practice', './routes/practice.js');
    const flashcardsRoutes = await loadRoute('flashcards', './routes/flashcards.js');
    const patternTrainerRoutes = await loadRoute('pattern-trainer', './routes/pattern-trainer.js');
    const complexityAnalyzerRoutes = await loadRoute('complexity-analyzer', './routes/complexity-analyzer.js');
    const codeTranslatorRoutes = await loadRoute('code-translator', './routes/code-translator.js');
    const bugDebuggerRoutes = await loadRoute('bug-debugger', './routes/bug-debugger.js');
    const conceptExplainerRoutes = await loadRoute('concept-explainer', './routes/concept-explainer.js');
    const questionQualityRoutes = await loadRoute('question-quality', './routes/question-quality.js');
    const dailyChallengesRoutes = await loadRoute('daily-challenges', './routes/daily-question.js');

    // ─── Interview & AI routes ───
    const aiRoutes = await loadRoute('ai', './routes/ai.js');
    const aiFeaturesRoutes = await loadRoute('ai-features', './routes/ai-features.js');
    const coachRoutes = await loadRoute('coach', './routes/coach.js');
    let interviewRoutes = null, getInterviewAnalytics = null, getInterviewRecommendations = null;
    try {
      const interviewModule = await import('./routes/interview.js');
      interviewRoutes = interviewModule.default;
      getInterviewAnalytics = interviewModule.getInterviewAnalytics;
      getInterviewRecommendations = interviewModule.getInterviewRecommendations;
    } catch (err) {
      console.error('⚠️ Failed to load route "interview":', err.message);
      failedGroups.push('interview');
    }
    const interviewEnhancedRoutes = await loadRoute('interview-enhanced', './routes/interview-enhanced.js');
    const interviewSuiteRoutes = await loadRoute('interview-suite', './routes/interview-suite.js');
    const companyInterviewRoutes = await loadRoute('company-interview', './routes/companyInterview.js');
    const voiceRoutes = await loadRoute('voice', './routes/voice.js');
    const fresherInterviewRoutes = await loadRoute('fresher-interview', './routes/fresher-interview.js');
    const behavioralCoachRoutes = await loadRoute('behavioral-coach', './routes/behavioral-coach.js');
    const interviewExperiencesRoutes = await loadRoute('interview-experiences', './routes/interview-experiences.js');
    const codeReviewRoutes = await loadRoute('code-review', './routes/code-review.js');
    const peerInterviewRoutes = await loadRoute('peer-interview', './routes/peer-interview.js');

    // ─── Career & content routes ───
    const resumeRoutes = await loadRoute('resume', './routes/resume.js');
    const systemDesignRoutes = await loadRoute('system-design', './routes/systemDesign.js');
    const communityRoutes = await loadRoute('community', './routes/community.js');
    const blogRoutes = await loadRoute('blog', './routes/blog.js');
    const activityRoutes = await loadRoute('activity', './routes/activity.js');
    const jobsRoutes = await loadRoute('jobs', './routes/jobs.js');
    const copilotRoutes = await loadRoute('copilot', './routes/copilot.js');
    const negotiationRoutes = await loadRoute('negotiation', './routes/negotiation.js');

    // ─── Platform & feature routes ───
    const paymentRoutes = await loadRoute('payment', './routes/payment.js');
    const notesRoutes = await loadRoute('notes', './routes/notes.js');
    const coinsRoutes = await loadRoute('coins', './routes/coins.js');
    const chatRoutes = await loadRoute('chat', './routes/chat.js');
    const scheduleRoutes = await loadRoute('schedule', './routes/schedule.js');
    const hrRoutes = await loadRoute('hr', './routes/hr.js');
    const libraryRoutes = await loadRoute('library', './routes/library.js');
    const improvementPlanRoutes = await loadRoute('improvement-plan', './routes/improvement-plan.js');
    const studyGroupsRoutes = await loadRoute('study-groups', './routes/study-groups.js');
    const leaderboardRoutes = await loadRoute('leaderboard', './routes/leaderboard.js');

    // ─── Student feature routes ───
    const skillHeatmapRoutes = await loadRoute('skill-heatmap', './routes/skill-heatmap.js');
    const dailyWinRoutes = await loadRoute('daily-win', './routes/daily-win.js');
    const answerTimerRoutes = await loadRoute('answer-timer', './routes/answer-timer.js');
    const jdQuestionsRoutes = await loadRoute('jd-questions', './routes/jd-questions.js');
    const readinessCheckRoutes = await loadRoute('readiness-check', './routes/readiness-check.js');
    const questionBankRoutes = await loadRoute('question-bank', './routes/question-bank.js');
    const weeklyReportRoutes = await loadRoute('weekly-report', './routes/weekly-report.js');
    const rejectionAnalyzerRoutes = await loadRoute('rejection-analyzer', './routes/rejection-analyzer.js');
    const accountabilityRoutes = await loadRoute('accountability', './routes/accountability.js');

    // ─── Middleware imports ───
    const { tracingMiddleware } = await import('./utils/tracer.js');
    const { authenticateToken } = await import('./middleware/auth.js');
    const { errorHandler } = await import('./middleware/errorHandler.js');
    const { healthCheck, readinessCheck: readinessCheckMw, livenessCheck } = await import('./middleware/healthCheck.js');
    const { metrics } = await import('./utils/metrics.js');

    if (failedGroups.length > 0) {
      console.warn(`⚠️ Server starting with ${failedGroups.length} failed route group(s): ${failedGroups.join(', ')}`);
    } else {
      console.log('✅ All routes loaded successfully');
    }

    app = express();
    
    // SECURITY: Configure trust proxy with hardened validation
    // Calls proxyValidation middleware to detect and block IP spoofing attempts
    configureExpressTrustProxy(app);
    
    // SECURITY: Validate proxy headers before rate limiting
    // Prevents attackers from spoofing X-Forwarded-For to bypass rate limits
    app.use(createProxyValidationMiddleware());

    // Configure rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: Number.parseInt(process.env.GLOBAL_RATE_LIMIT_MAX || '250', 10),
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });

    // Stricter rate limit for auth endpoints to prevent brute-force attacks
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: Number.parseInt(process.env.AUTH_RATE_LIMIT_MAX || '30', 10),
      message: 'Too many authentication attempts. Please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });

    // Middleware setup
    // Advanced security middleware

    app.use(enhancedSecurity());

    // CSP middleware (applies only to HTML responses, not APIs)
    app.use(cspMiddleware({
      reportUri: process.env.CSP_REPORT_URI,
    }));

    app.use(helmet({
      contentSecurityPolicy: false, // Disabled in favor of custom cspMiddleware
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }));
    
    // Enable compression
    app.use(compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
      level: 6,
    }));
    
    // CORS with secure configuration
    app.use(cors(corsOptions));
    
    // CRITICAL: Raw body parsing for webhook signature verification
    // Must be applied BEFORE express.json() to prevent body parsing
    // Only applies to /api/payment/webhook, other routes use JSON parser
    app.use('/api/payment/webhook', express.raw({
      type: 'application/json',
      limit: '1mb',
    }));
    
    // JSON body parsing for all other routes
    // This will NOT parse /api/payment/webhook because it was already handled above
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(requestIdMiddleware); // Add request ID tracing before rate limiting
    app.use(tracingMiddleware()); // Distributed tracing spans
    
    // Input sanitization (skip for payment webhook to preserve raw body for signature verification)
    app.use(sanitizeInput({ skipPaths: ['/api/payment/webhook'] }));
    
    // Request timeout protection — prevents runaway queries from holding connections
    app.use(queryTimeout());
    
    // API cache middleware (before rate limiting)
    // Safe cacheable GET requests are served from cache, bypassing rate limits
    app.use('/api', apiCacheMiddleware());
    
    // ETag middleware — generates weak ETags for GET responses
    // Enables 304 Not Modified to reduce bandwidth on repeated requests
    app.use('/api', etagMiddleware());
    
    // Rate limiting (after cache middleware)
    // Cache hits never reach this middleware
    app.use('/api/auth', authLimiter);
    app.use('/api/ai', aiEndpointsLimiter);
    app.use('/api/ai-features', aiEndpointsLimiter);
    app.use('/api/payment', paymentEndpointsLimiter);
    app.use('/api/jobs', jobsEndpointsLimiter);
    app.use('/api/admin', adminEndpointsLimiter);
    app.use('/api/', limiter);

    const enableVoiceDebugLogs = process.env.VOICE_DEBUG_LOGS === 'true' || process.env.NODE_ENV === 'development';
    if (enableVoiceDebugLogs) {
      app.use('/api/voice', (req, res, next) => {
        const startedAt = Date.now();
        const requestId = req.requestId || res.locals.requestId || req.get('X-Request-ID') || 'unknown';
        let responseCompleted = false;
        voiceHttpLogger.info('Voice request started', {
          requestId,
          method: req.method,
          path: req.originalUrl,
          hasAuthHeader: Boolean(req.headers.authorization),
        });

        req.on('aborted', () => {
          voiceHttpLogger.warn('Voice request aborted by client', {
            requestId,
            method: req.method,
            path: req.originalUrl,
            durationMs: Date.now() - startedAt,
          });
        });

        res.on('finish', () => {
          responseCompleted = true;
          voiceHttpLogger.info('Voice request completed', {
            requestId,
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: Date.now() - startedAt,
            responseContentType: res.getHeader('content-type') || null,
          });
        });

        res.on('close', () => {
          if (responseCompleted) return;
          voiceHttpLogger.warn('Voice request connection closed before finish', {
            requestId,
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: Date.now() - startedAt,
            writableEnded: res.writableEnded,
            responseContentType: res.getHeader('content-type') || null,
          });
        });

        next();
      });
    }

    // Health check endpoints (middleware-based)
    app.get('/health', healthCheck);
    app.get('/health/ready', readinessCheckMw);
    app.get('/health/live', livenessCheck);
    
    // Enhanced health routes (router-based with additional diagnostics)
    if (healthRoutes) app.use('/', healthRoutes);

    // Helper: only mount routes that loaded successfully
    function mount(path, router) {
      if (router) app.use(path, router);
    }

    // Register all routes (null-safe — skips any that failed to load)
    mount('/api/auth', authRoutes);
    mount('/api/dsa', dsaRoutes);
    mount('/api/practice', practiceRoutes);
    mount('/api/ai', aiRoutes);
    mount('/api/ai-features', aiFeaturesRoutes);
    mount('/api/user', userRoutes);
    mount('/api/resume', resumeRoutes);
    mount('/api/system-design', systemDesignRoutes);
    mount('/api/community', communityRoutes);
    mount('/api/ai/coach', coachRoutes);

    // Monitoring middleware for interview endpoints
    app.use('/api/ai/interview', (req, res, next) => {
      metrics.increment('interview.api.requests');
      const startTime = Date.now();
      
      res.on('finish', () => {
        metrics.timing('interview.api.response.time', Date.now() - startTime);
        metrics.increment('interview.api.responses', { statusCode: res.statusCode });
      });
      
      next();
    });

    mount('/api/ai/interview', interviewRoutes);
    mount('/api/ai/interview/v2', interviewEnhancedRoutes);
    if (getInterviewAnalytics) app.get('/api/analytics/overview', authenticateToken, getInterviewAnalytics);
    if (getInterviewRecommendations) app.get('/api/recommendations', authenticateToken, getInterviewRecommendations);
    mount('/api/interview-suite', interviewSuiteRoutes);
    mount('/api/contact', contactRoutes);
    mount('/api/blog', blogRoutes);
    mount('/api/activity', activityRoutes);
    mount('/api/company-interview', companyInterviewRoutes);
    mount('/api/payment', paymentRoutes);
    mount('/api/voice', voiceRoutes);
    mount('/api/notes', notesRoutes);
    mount('/api/admin', adminRoutes);
    mount('/api/jobs', jobsRoutes);
    mount('/api/coins', coinsRoutes);
    mount('/api/chat', chatRoutes);
    mount('/api/schedule', scheduleRoutes);
    mount('/api/hr', hrRoutes);
    mount('/api/library', libraryRoutes);
    mount('/api/improvement-plan', improvementPlanRoutes);
    mount('/api/study-groups', studyGroupsRoutes);
    mount('/api/fresher-interview', fresherInterviewRoutes);
    mount('/api/copilot', copilotRoutes);
    mount('/api/leaderboard', leaderboardRoutes);
    mount('/api/behavioral-coach', behavioralCoachRoutes);
    mount('/api/daily-question', dailyChallengesRoutes);
    mount('/api/interview-experiences', interviewExperiencesRoutes);

    // Feature routes
    mount('/api/code-review', codeReviewRoutes);
    mount('/api/peer-interview', peerInterviewRoutes);
    mount('/api/negotiation', negotiationRoutes);
    mount('/api/flashcards', flashcardsRoutes);
    mount('/api/complexity', complexityAnalyzerRoutes);
    mount('/api/jd-questions', jdQuestionsRoutes);
    mount('/api/readiness', readinessCheckRoutes);
    mount('/api/concept-explainer', conceptExplainerRoutes);
    mount('/api/code-translator', codeTranslatorRoutes);
    mount('/api/pattern-trainer', patternTrainerRoutes);
    mount('/api/bug-debugger', bugDebuggerRoutes);
    mount('/api/skill-heatmap', skillHeatmapRoutes);
    mount('/api/daily-win', dailyWinRoutes);
    mount('/api/answer-timer', answerTimerRoutes);

    // Student feature routes
    mount('/api/question-bank', questionBankRoutes);
    mount('/api/weekly-report', weeklyReportRoutes);
    mount('/api/rejection-analyzer', rejectionAnalyzerRoutes);
    mount('/api/accountability', accountabilityRoutes);

    // Infrastructure routes
    mount('/api/gdpr', gdprRoutes);
    mount('/api/metrics', performanceMetricsRoutes);
    mount('/api/questions', questionQualityRoutes);
    
    // SECURITY: Protect metrics endpoint with authentication and IP allowlist
    if (metricsRoutes) app.use('/metrics', createMetricsSecurityMiddleware(), metricsRoutes);
    
    mount('/api/analytics', analyticsEventsRoutes);

    // Error handler middleware
    app.use(errorHandler);

  } catch (error) {
    console.error('❌ Failed to initialize server:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

const DEFAULT_PORT = Number(process.env.PORT || 5000);
const MAX_PORT_RETRIES = 10;

function startServer(port, attempt = 0) {
  const server = app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📚 API documentation available at http://localhost:${port}/api`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      // In production, fail immediately - don't retry ports
      if (process.env.NODE_ENV === 'production') {
        console.error(
          `❌ Port ${port} is already in use (production mode). ` +
          'Exiting immediately - do not attempt port retry in production.'
        );
        process.exit(1);
      }
      
      // In development, retry with next port
      if (attempt < MAX_PORT_RETRIES) {
        const nextPort = port + 1;
        console.warn(`Port ${port} is already in use. Retrying on ${nextPort}...`);
        startServer(nextPort, attempt + 1);
        return;
      }

      console.error(
        `❌ Port ${port} is already in use and max retries (${MAX_PORT_RETRIES}) exceeded.`
      );
      process.exit(1);
    }

    console.error('❌ Server error:', error.message);
    process.exit(1);
  });

  return server;
}

// Register process error handlers BEFORE server startup
// Inspired by concurrently v9's graceful shutdown patterns
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection:', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: promise.toString().slice(0, 100),
  });
  // Log but don't exit immediately - some rejections may be recoverable
  // Exit with code 1 only if it's a critical error
  if (process.env.NODE_ENV === 'production') {
    console.error('🚨 Unhandled rejection in production - exiting');
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', {
    message: error.message,
    stack: error.stack,
    name: error.name,
  });
  console.error('🚨 Fatal error - server cannot continue safely. Exiting.');
  process.exit(1);
});

// Initialize server and start listening
initializeServer().then(() => {
  const server = startServer(DEFAULT_PORT);

  // Initialize collaboration service
  collaborationService.initialize(server);
  console.log('✅ Collaboration service initialized');

  // Initialize interview WebSocket observability service
  import('./services/websocketService.js')
    .then(({ initWebSocket }) => {
      initWebSocket(server);
      console.log('✅ Interview WebSocket service initialized on /ws');
    })
    .catch(err => console.warn('[startup] WebSocket service init failed (non-fatal):', err.message));

  // Setup graceful shutdown with configurable timeouts
  setupGracefulShutdown(server, {
    shutdownTimeout: Number(process.env.SHUTDOWN_TIMEOUT || 30000), // 30 seconds
    forceExitTimeout: Number(process.env.FORCE_EXIT_TIMEOUT || 5000), // 5 seconds
  });

  console.log('✅ Graceful shutdown handlers registered');

  // ── Eager model preload (fire-and-forget, non-blocking) ──
  import('./services/voiceService.js')
    .then(mod => mod.default.preloadKokoroTTS())
    .catch(err => console.warn('[startup] Kokoro preload import failed (non-fatal):', err.message));
}).catch((error) => {
  console.error('❌ Failed to start server:', error.message);
  console.error(error.stack);
  process.exit(1);
});

export default app;
