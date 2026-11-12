import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import './config/env.js';
// Comprehensive Improvements
import { apiCacheMiddleware } from './middleware/apiCache.js';
import { enhancedSecurity } from './middleware/securityEnhanced.js';
import collaborationService from './services/collaborationService.ts';
import realtimeInterviewService from './services/realtimeInterviewService.js';

import { disableConsoleLogs } from './utils/productionLogger.js';
import { validateStartupEnv } from './config/startupEnvValidation.js';
import { validateEnvironment } from './config/envValidation.js';
import { corsOptions } from './config/cors.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { sanitizeInput } from './middleware/sanitization.js';
import {
  aiEndpointsLimiter,
  paymentEndpointsLimiter,
  jobsEndpointsLimiter,
  adminEndpointsLimiter,
} from './middleware/apiRateLimiter.js';
import { createLogger } from './utils/structuredLogger.js';
import { setupGracefulShutdown } from './utils/gracefulShutdown.js';
import cacheManager from './utils/cacheManager.js';
import performanceMonitor from './utils/performanceMonitor.js';

let routesInitialized = false;
const voiceHttpLogger = createLogger('voice-http');

// Disable console.log in production
if (process.env.NODE_ENV === 'production') {
  disableConsoleLogs();
}

// Validate environment variables
validateEnvironment();
validateStartupEnv();

const app = express();
app.set('trust proxy', process.env.TRUST_PROXY === 'false' ? false : 1);

// Keep a tiny endpoint available while heavier route initialization completes.
// This lets Render detect the bound port instead of timing out during cold start.
app.get('/', (_req, res) => {
  res.status(200).json({
    service: 'Preploop backend',
    status: 'running',
    health: '/health',
    live: '/health/live',
  });
});

app.get('/health/live', (_req, res) => {
  res.status(200).json({
    alive: true,
    initializing: !routesInitialized,
    timestamp: new Date().toISOString(),
  });
});

async function initializeServer() {
  try {
    console.log('📦 Initializing API Route Registry...');
    const { createApiRouter } = await import('./routes/index.js');
    const { authenticateToken } = await import('./middleware/auth.ts');
    const { errorHandler } = await import('./middleware/errorHandler.js');
    const { healthCheck, readinessCheck, livenessCheck } = await import('./middleware/healthCheck.js');
    const interviewModule = await import('./routes/interview.js');
    const { getInterviewAnalytics, getInterviewRecommendations } = interviewModule;
    const apiRouter = await createApiRouter({
      authenticateToken,
      getInterviewAnalytics,
      getInterviewRecommendations,
    });
    console.log('✅ Routes loaded successfully');

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
      max: Number.parseInt(process.env.AUTH_RATE_LIMIT_MAX || (process.env.NODE_ENV === 'development' ? '100' : '60'), 10),
      message: 'Too many authentication attempts. Please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });

    // Middleware setup

    // Advanced security middleware

    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            frameAncestors: ["'none'"],
          },
        },
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
      })
    );

    // Enable compression
    app.use(
      compression({
        filter: (req, _res) => {
          if (req.headers['x-no-compression']) {
            return false;
          }
          return compression.filter(req, _res);
        },
        level: 6,
      })
    );

    // CORS with secure configuration
    app.use(cors(corsOptions));
    app.use('/api/payment/webhook', express.raw({ type: 'application/json', limit: '1mb' }));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(requestIdMiddleware); // Add request ID tracing before rate limiting

    // Advanced security middleware (mounted after body parsers so request bodies are inspected)
    app.use(enhancedSecurity());
    const httpLogger = createLogger('http');
    app.use((req, res, next) => {
      const startedAt = Date.now();
      res.on('finish', () => {
        const durationMs = Date.now() - startedAt;
        const route = req.route?.path || req.path;
        performanceMonitor.recordRequest({
          id: req.requestId,
          path: route,
          method: req.method,
          duration: durationMs,
          status: res.statusCode,
          error: res.statusCode >= 500,
        });
        const logPayload = {
          requestId: req.requestId || res.locals?.requestId || null,
          userId: req.user?.id || null,
          route,
          method: req.method,
          durationMs,
          statusCode: res.statusCode,
        };
        if (res.statusCode >= 500) {
          httpLogger.error('HTTP request failed', logPayload);
        } else if (res.statusCode >= 400) {
          httpLogger.warn('HTTP client error', logPayload);
        } else {
          httpLogger.info('HTTP request completed', logPayload);
        }
      });
      next();
    });

    // Input sanitization (skip for webhooks)
    app.use(sanitizeInput({ skipPaths: ['/payment/webhook'] }));

    // Rate limiting
    app.use('/api/auth', authLimiter);
    app.use('/api/ai', aiEndpointsLimiter);
    app.use('/api/ai-features', aiEndpointsLimiter);
    app.use('/api/payment', paymentEndpointsLimiter);
    app.use('/api/jobs', jobsEndpointsLimiter);
    app.use('/api/admin', adminEndpointsLimiter);
    app.use('/api/', limiter);
    app.use('/api', apiCacheMiddleware());

    const enableVoiceDebugLogs =
      process.env.VOICE_DEBUG_LOGS === 'true' || process.env.NODE_ENV === 'development';
    if (enableVoiceDebugLogs) {
      app.use('/api/voice', (req, res, next) => {
        const startedAt = Date.now();
        const requestId =
          req.requestId || res.locals.requestId || req.get('X-Request-ID') || 'unknown';
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
    app.get('/health/ready', (req, res, next) => {
      if (!routesInitialized) {
        return res.status(503).json({ ready: false, message: 'Routes are still initializing' });
      }
      return readinessCheck(req, res, next);
    });
    app.get('/health/live', livenessCheck);

    // OpenAPI & Swagger Documentation endpoints
    app.get('/api/docs/openapi.json', async (_req, res) => {
      try {
        const APIDocGenerator = (await import('./utils/apiDocGenerator.js')).default;
        const generator = new APIDocGenerator();
        const spec = await generator.generate();
        res.json(spec);
      } catch (err) {
        res.status(500).json({ error: 'Failed to generate API docs', message: err.message });
      }
    });

    app.get('/api/docs', async (_req, res) => {
      try {
        const APIDocGenerator = (await import('./utils/apiDocGenerator.js')).default;
        const generator = new APIDocGenerator();
        const spec = await generator.generate();
        res.setHeader('Content-Type', 'text/html');
        res.send(`<!DOCTYPE html>
<html>
<head>
  <title>PrepLoop API Documentation</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
  <style>
    body { margin: 0; background-color: #0f172a; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      spec: ${JSON.stringify(spec)},
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIBundle.SwaggerUIStandalonePreset
      ],
    });
  </script>
</body>
</html>`);
      } catch (err) {
        res.status(500).json({ error: 'Failed to render API documentation', message: err.message });
      }
    });

    // CSRF token endpoint (for cookie-based auth flows)
    const { csrfTokenEndpoint } = await import('./middleware/csrf.js');
    app.get('/api/csrf-token', csrfTokenEndpoint);
    const { csrfProtection } = await import('./middleware/csrf.js');
    app.use('/api', csrfProtection);

    // Register all API routes via standardized Route Registry
    app.use('/api', apiRouter);
    // Catch-all 404 handler for undefined API routes to prevent silent failures
    app.use('/api', (req, res, _next) => {
      console.warn(`[404] API Endpoint Not Found: ${req.method} ${req.originalUrl}`);
      res.status(404).json({ error: 'Endpoint not found' });
    });

    // Error handler middleware
    app.use(errorHandler);

    // Verify AI models on startup
    const { verifyGroqModelsOnStartup, verifyGeminiModelOnStartup } = await import('./routes/company-interview/helpers.js');
    await Promise.allSettled([
      verifyGroqModelsOnStartup().catch((err) => {
        console.warn('[Server Startup] Groq model pre-flight check bypassed:', err.message);
      }),
      verifyGeminiModelOnStartup().catch((err) => {
        console.warn('[Server Startup] Gemini model pre-flight check bypassed:', err.message);
      }),
    ]);
  } catch (error) {
    console.error('❌ Failed to initialize server:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

const DEFAULT_PORT = Number(process.env.PORT || 5000);
const MAX_PORT_RETRIES = 10;

function startServer(port, attempt = 0) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
      console.log(`📚 API documentation available at http://localhost:${port}/api`);
      resolve(server);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        // In production, fail immediately - don't retry ports
        if (process.env.NODE_ENV === 'production') {
          console.error(
            `❌ Port ${port} is already in use (production mode). ` +
              'Exiting immediately - do not attempt port retry in production.'
          );
          return reject(error);
        }

        // In development, retry with next port
        if (attempt < MAX_PORT_RETRIES) {
          const nextPort = port + 1;
          console.warn(`Port ${port} is already in use. Retrying on ${nextPort}...`);
          return resolve(startServer(nextPort, attempt + 1));
        }

        console.error(
          `❌ Port ${port} is already in use and max retries (${MAX_PORT_RETRIES}) exceeded.`
        );
        return reject(error);
      }

      console.error('❌ Server error:', error.message);
      return reject(error);
    });
  });
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

// Start listening before heavier route imports so platform port scans pass.
startServer(DEFAULT_PORT)
  .then((server) => {
    // Initialize collaboration service (must happen before shutdown setup)
    collaborationService.initialize(server);
    try {
      realtimeInterviewService.initialize(server);
      console.log('✅ Realtime interview service initialized');
    } catch (realtimeErr) {
      console.warn('Realtime interview service initialization warning:', realtimeErr.message);
    }
    console.log('✅ Collaboration service initialized');

    // Setup graceful shutdown with configurable timeouts
    setupGracefulShutdown(server, {
      shutdownTimeout: Number(process.env.SHUTDOWN_TIMEOUT || 30000), // 30 seconds
      forceExitTimeout: Number(process.env.FORCE_EXIT_TIMEOUT || 5000), // 5 seconds
    });

    console.log('✅ Graceful shutdown handlers registered');

    // ── Eager model preload (fire-and-forget, non-blocking) ──
    cacheManager.connect().catch((err) => {
      console.warn('[startup] Cache manager initialization failed (non-fatal):', err.message);
    });

    initializeServer()
      .then(() => {
        routesInitialized = true;
      })
      .catch((error) => {
        console.error('Failed to initialize server routes:', error.message);
        process.exit(1);
      });

    import('./services/voiceService.js')
      .then((mod) => mod.default.preloadKokoroTTS())
      .catch((err) =>
        console.warn('[startup] Kokoro preload import failed (non-fatal):', err.message)
      );
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  });

export default app;
