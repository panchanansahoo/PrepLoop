import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import './config/env.js';
import { requestIdMiddleware } from './middleware/requestId.js';

let app;

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
    const interviewRoutes = (await import('./routes/interview.js')).default;
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
    const realInterviewRoutes = (await import('./routes/real-interview.js')).default;
    const scheduleRoutes = (await import('./routes/schedule.js')).default;
    const streakRoutes = (await import('./routes/streak.js')).default;
    const hrRoutes = (await import('./routes/hr.js')).default;
    
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
    app.use(cors({
      origin: [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5174'].filter(Boolean),
      credentials: true
    }));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(requestIdMiddleware); // Add request ID tracing before rate limiting
    app.use('/api/auth', authLimiter);
    app.use('/api/', limiter);

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', message: 'Server is running' });
    });

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
    app.use('/api/real-interview', realInterviewRoutes);
    app.use('/api/schedule', scheduleRoutes);
    app.use('/api/streak', streakRoutes);
    app.use('/api/hr', hrRoutes);

    // Error handler middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    });

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
    if (error.code === 'EADDRINUSE' && attempt < MAX_PORT_RETRIES) {
      const nextPort = port + 1;
      console.warn(`Port ${port} is already in use. Retrying on ${nextPort}...`);
      startServer(nextPort, attempt + 1);
      return;
    }

    console.error('❌ Server error:', error.message);
    process.exit(1);
  });

  return server;
}

// Initialize server and start listening
initializeServer().then(() => {
  startServer(DEFAULT_PORT);
}).catch((error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});

export default app;
