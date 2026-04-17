import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import './config/env.js';
import { validateStartupEnv } from './config/startupEnvValidation.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { isAllowedCorsOrigin } from './middleware/corsOrigin.js';
import { createLogger } from './utils/structuredLogger.js';
import { setupGracefulShutdown } from './utils/gracefulShutdown.js';

let app;
const voiceHttpLogger = createLogger('voice-http');

// Validate startup environment before proceeding
validateStartupEnv();

async function initializeServer() {
  try {
    console.log('📦 Loading routes...');
    const authRoutes = (await import('./routes/auth.js')).default;
    const dsaRoutes = (await import('./routes/dsa.js')).default;
    const practiceRoutes = (await import('./routes/practice.js')).default;
    const aiRoutes = (await import('./routes/ai.js')).default;
    const aiFeaturesRoutes = (await import('./routes/ai-features.js')).default;
    const userRoutes = (await import('./routes/user.js')).default;
    const resumeRoutes = (await import('./routes/resume.js')).default;
    const systemDesignRoutes = (await import('./routes/systemDesign.js')).default;
    const communityRoutes = (await import('./routes/community.js')).default;
    const coachRoutes = (await import('./routes/coach.js')).default;
    const interviewModule = await import('./routes/interview.js');
    const interviewRoutes = interviewModule.default;
    const { getInterviewAnalytics, getInterviewRecommendations } = interviewModule;
    const interviewEnhancedRoutes = (await import('./routes/interview-enhanced.js')).default;
    const interviewSuiteRoutes = (await import('./routes/interview-suite.js')).default;
    const contactRoutes = (await import('./routes/contact.js')).default;
    const blogRoutes = (await import('./routes/blog.js')).default;
    const activityRoutes = (await import('./routes/activity.js')).default;
    const companyInterviewRoutes = (await import('./routes/companyInterview.js')).default;
    const paymentRoutes = (await import('./routes/payment.js')).default;
    const voiceRoutes = (await import('./routes/voice.js')).default;
    const notesRoutes = (await import('./routes/notes.js')).default;
    const adminRoutes = (await import('./routes/admin.js')).default;
    const jobsRoutes = (await import('./routes/jobs.js')).default;
    const coinsRoutes = (await import('./routes/coins.js')).default;
    const chatRoutes = (await import('./routes/chat.js')).default;
    const scheduleRoutes = (await import('./routes/schedule.js')).default;
    const hrRoutes = (await import('./routes/hr.js')).default;
    const libraryRoutes = (await import('./routes/library.js')).default;
    const improvementPlanRoutes = (await import('./routes/improvement-plan.js')).default;
    const studyGroupsRoutes = (await import('./routes/study-groups.js')).default;
    const fresherInterviewRoutes = (await import('./routes/fresher-interview.js')).default;
    
    const { authenticateToken } = await import('./middleware/auth.js');
    const { errorHandler } = await import('./middleware/errorHandler.js');
    const { healthCheck, readinessCheck, livenessCheck } = await import('./middleware/healthCheck.js');

    console.log('✅ Routes loaded successfully');

    app = express();
    app.set('trust proxy', process.env.TRUST_PROXY === 'false' ? false : 1);

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
    app.use(helmet());
    const configuredOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:4173',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:4173',
    ].filter(Boolean);

    app.use(cors({
      origin(origin, callback) {
        if (isAllowedCorsOrigin(origin, configuredOrigins)) {
          return callback(null, true);
        }

        return callback(new Error(`Not allowed by CORS: ${origin}`));
      },
      credentials: true,
    }));
    app.use('/api/payment/webhook', express.raw({ type: 'application/json', limit: '1mb' }));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(requestIdMiddleware); // Add request ID tracing before rate limiting
    app.use('/api/auth', authLimiter);
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

    // Health check endpoints
    app.get('/health', healthCheck);
    app.get('/health/ready', readinessCheck);
    app.get('/health/live', livenessCheck);

    // Register all routes
    app.use('/api/auth', authRoutes);
    app.use('/api/dsa', dsaRoutes);
    app.use('/api/practice', practiceRoutes);
    app.use('/api/ai', aiRoutes);
    app.use('/api/ai-features', aiFeaturesRoutes);
    app.use('/api/user', userRoutes);
    app.use('/api/resume', resumeRoutes);
    app.use('/api/system-design', systemDesignRoutes);
    app.use('/api/community', communityRoutes);
    app.use('/api/ai/coach', coachRoutes);
    app.use('/api/ai/interview', interviewRoutes);
    app.use('/api/ai/interview/v2', interviewEnhancedRoutes);
    app.use('/api/ai', interviewEnhancedRoutes);
    app.get('/api/analytics/overview', authenticateToken, getInterviewAnalytics);
    app.get('/api/recommendations', authenticateToken, getInterviewRecommendations);
    app.use('/api/interview-suite', interviewSuiteRoutes);
    app.use('/api/contact', contactRoutes);
    app.use('/api/blog', blogRoutes);
    app.use('/api/activity', activityRoutes);
    app.use('/api/company-interview', companyInterviewRoutes);
    app.use('/api/payment', paymentRoutes);
    app.use('/api/voice', voiceRoutes);
    app.use('/api/notes', notesRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/jobs', jobsRoutes);
    app.use('/api/coins', coinsRoutes);
    app.use('/api/chat', chatRoutes);
    app.use('/api/schedule', scheduleRoutes);
    app.use('/api/hr', hrRoutes);
    app.use('/api/library', libraryRoutes);
    app.use('/api/improvement-plan', improvementPlanRoutes);
    app.use('/api/study-groups', studyGroupsRoutes);
    app.use('/api/fresher-interview', fresherInterviewRoutes);

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

// Graceful shutdown will be registered after server starts
let shutdownManager = null;

// Initialize server and start listening
initializeServer().then(() => {
  const server = startServer(DEFAULT_PORT);

  // Setup graceful shutdown with configurable timeouts
  shutdownManager = setupGracefulShutdown(server, {
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
  process.exit(1);
});

export default app;
