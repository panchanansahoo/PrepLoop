/**
 * Standalone test server for fresher-interview route
 * Run this to test the route independently
 */

import express from 'express';
import fresherInterviewRoutes from './routes/fresher-interview.js';

const app = express();
app.use(express.json());

// Mock authentication middleware for testing
app.use((req, res, next) => {
  req.user = { id: 'test-user-123' };
  next();
});

app.use('/api/fresher-interview', fresherInterviewRoutes);

const PORT = 5001;

app.listen(PORT, () => {
  console.log(`🧪 Test server running on http://localhost:${PORT}`);
  console.log('\nTest the endpoints:');
  console.log(`POST http://localhost:${PORT}/api/fresher-interview/start`);
  console.log(`POST http://localhost:${PORT}/api/fresher-interview/answer`);
  console.log(`GET  http://localhost:${PORT}/api/fresher-interview/session/:sessionId`);
  console.log('\nExample curl command:');
  console.log(`curl -X POST http://localhost:${PORT}/api/fresher-interview/start -H "Content-Type: application/json" -d "{\\"interviewerName\\":\\"John\\",\\"role\\":\\"HR\\",\\"company\\":\\"TechCorp\\",\\"roundName\\":\\"Technical\\"}"`);
});
