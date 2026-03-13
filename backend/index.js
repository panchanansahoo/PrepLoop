import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import dsaRoutes from './routes/dsa.js';
import practiceRoutes from './routes/practice.js';
import aiRoutes from './routes/ai.js';
import userRoutes from './routes/user.js';
import resumeRoutes from './routes/resume.js';
import systemDesignRoutes from './routes/systemDesign.js';
import communityRoutes from './routes/community.js';
import coachRoutes from './routes/coach.js';
import interviewRoutes from './routes/interview.js';
import contactRoutes from './routes/contact.js';
import blogRoutes from './routes/blog.js';
import activityRoutes from './routes/activity.js';
import companyInterviewRoutes from './routes/companyInterview.js';
import paymentRoutes from './routes/payment.js';
import voiceRoutes from './routes/voice.js';
import notesRoutes from './routes/notes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

// Stricter rate limit for auth endpoints to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5174'].filter(Boolean),
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/auth', authLimiter);
app.use('/api/', limiter);

// Debug middleware
app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.url} from ${req.headers.origin}`);
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/dsa', dsaRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/user', userRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/system-design', systemDesignRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/ai/coach', coachRoutes);
app.use('/api/ai/interview', interviewRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/company-interview', companyInterviewRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/notes', notesRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API documentation available at http://localhost:${PORT}/api`);
});

export default app;
