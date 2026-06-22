/**
 * Real-time Interview WebSocket Service
 * Handles instant answer processing, live feedback, and streaming responses
 */
import { WebSocketServer } from 'ws';
import crypto from 'crypto';

// Lazy-initialize Groq to avoid duplicate SDK instances across the process.
// Uses a promise-based singleton so the first call initializes, subsequent calls reuse.
let _groqPromise = null;
function getGroqClient() {
  if (_groqPromise) return _groqPromise;
  _groqPromise = (async () => {
    try {
      const { default: Groq } = await import('groq-sdk');
      return process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
    } catch {
      return null;
    }
  })();
  return _groqPromise;
}

class RealtimeInterviewService {
  constructor() {
    this.wss = null;
    this.sessions = new Map(); // sessionId -> { ws, context, state }
  }

  initialize(server) {
    this.wss = new WebSocketServer({ server, path: '/ws/interview' });

    this.wss.on('connection', (ws, _req) => {
      const sessionId = this.generateSessionId();
      console.log(`[RealtimeInterview] New connection: ${sessionId}`);

      // Initialize session
      this.sessions.set(sessionId, {
        ws,
        context: {
          conversation: [],
          questionIndex: 0,
          company: 'General',
          role: 'Software Engineer',
          stage: 'Technical',
        },
        state: 'idle',
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        sessionId,
        timestamp: Date.now(),
      }));

      // Handle messages
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleMessage(sessionId, message);
        } catch (err) {
          console.error('[RealtimeInterview] Message error:', err);
          ws.send(JSON.stringify({
            type: 'error',
            error: err.message,
          }));
        }
      });

      // Handle disconnect
      ws.on('close', () => {
        console.log(`[RealtimeInterview] Disconnected: ${sessionId}`);
        this.sessions.delete(sessionId);
      });

      ws.on('error', (err) => {
        console.error(`[RealtimeInterview] WebSocket error:`, err);
      });
    });

    console.log('[RealtimeInterview] WebSocket server initialized');
  }

  async handleMessage(sessionId, message) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const { ws, context: _context } = session;

    switch (message.type) {
      case 'start':
        await this.handleStart(session, message);
        break;

      case 'answer':
        await this.handleAnswer(session, message);
        break;

      case 'transcript':
        await this.handleTranscript(session, message);
        break;

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;

      default:
        console.warn(`[RealtimeInterview] Unknown message type: ${message.type}`);
    }
  }

  async handleStart(session, message) {
    const { ws, context } = session;
    const { company, role, stage, experienceLevel } = message;

    // Update context
    Object.assign(context, { company, role, stage, experienceLevel });

    // Generate first question
    const question = await this.generateQuestion(context);

    // Send question
    ws.send(JSON.stringify({
      type: 'question',
      question,
      questionIndex: 1,
      timestamp: Date.now(),
    }));

    context.conversation.push({
      role: 'interviewer',
      content: question,
      timestamp: Date.now(),
    });
    context.questionIndex = 1;
  }

  async handleAnswer(session, message) {
    const { ws, context } = session;
    const { answer, code, language } = message;

    // Add answer to conversation
    context.conversation.push({
      role: 'candidate',
      content: answer,
      code,
      language,
      timestamp: Date.now(),
    });

    // Send processing indicator
    ws.send(JSON.stringify({
      type: 'processing',
      timestamp: Date.now(),
    }));

    // Generate feedback and next question in parallel
    const [feedback, nextQuestion] = await Promise.all([
      this.generateFeedback(context, answer),
      this.generateNextQuestion(context),
    ]);

    // Send feedback
    ws.send(JSON.stringify({
      type: 'feedback',
      feedback: feedback.comment,
      score: feedback.score,
      strengths: feedback.strengths,
      improvements: feedback.improvements,
      timestamp: Date.now(),
    }));

    // Send next question
    ws.send(JSON.stringify({
      type: 'question',
      question: nextQuestion,
      questionIndex: context.questionIndex + 1,
      timestamp: Date.now(),
    }));

    context.conversation.push({
      role: 'feedback',
      content: feedback.comment,
      score: feedback.score,
      timestamp: Date.now(),
    });

    context.conversation.push({
      role: 'interviewer',
      content: nextQuestion,
      timestamp: Date.now(),
    });

    context.questionIndex++;
  }

  handleTranscript(session, message) {
    const { ws } = session;
    const { text, isFinal } = message;

    // Echo transcript for confirmation (optional)
    ws.send(JSON.stringify({
      type: 'transcript_ack',
      text,
      isFinal,
      timestamp: Date.now(),
    }));
  }

  async generateQuestion(context) {
    const groq = await getGroqClient();
    if (!groq) {
      return this.getFallbackQuestion(context);
    }

    try {
      const prompt = `You are a ${context.company} interviewer conducting a ${context.stage} interview for a ${context.role} position.

Generate ONE interview question appropriate for this stage.

Rules:
- Be concise and clear
- Match the difficulty to the stage
- No markdown, just the question text

Question:`;

      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 200,
      });

      return completion.choices[0]?.message?.content?.trim() || this.getFallbackQuestion(context);
    } catch (err) {
      console.error('[RealtimeInterview] Question generation error:', err);
      return this.getFallbackQuestion(context);
    }
  }

  async generateNextQuestion(context) {
    const groq = await getGroqClient();
    if (!groq) {
      return this.getFallbackQuestion(context);
    }

    try {
      const recentConversation = context.conversation.slice(-6).map(m => ({
        role: m.role === 'interviewer' ? 'assistant' : 'user',
        content: m.content,
      }));

      const prompt = `Based on the conversation, generate the next interview question.

Rules:
- Build on previous answers
- Increase depth gradually
- Be concise
- No markdown

Next question:`;

      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          ...recentConversation,
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 200,
      });

      return completion.choices[0]?.message?.content?.trim() || this.getFallbackQuestion(context);
    } catch (err) {
      console.error('[RealtimeInterview] Next question error:', err);
      return this.getFallbackQuestion(context);
    }
  }

  async generateFeedback(context, answer) {
    const groq = await getGroqClient();
    if (!groq) {
      return {
        comment: 'Good answer. Let me ask you a follow-up.',
        score: 75,
        strengths: ['Clear communication'],
        improvements: ['Add more detail'],
      };
    }

    try {
      const prompt = `Evaluate this interview answer:

Question: ${context.conversation[context.conversation.length - 2]?.content || 'Previous question'}
Answer: ${answer}

Provide feedback in JSON format:
{
  "comment": "brief feedback (1-2 sentences)",
  "score": number 0-100,
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"]
}`;

      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 300,
      });

      const raw = completion.choices[0]?.message?.content?.trim() || '';
      const jsonMatch = raw.match(/\{[\s\S]+\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('No JSON in response');
    } catch (err) {
      console.error('[RealtimeInterview] Feedback error:', err);
      return {
        comment: 'Good answer. Let me ask you a follow-up.',
        score: 75,
        strengths: ['Clear communication'],
        improvements: ['Add more detail'],
      };
    }
  }

  getFallbackQuestion(context) {
    const fallbacks = {
      'Technical': [
        'Can you explain the difference between a stack and a queue?',
        'How would you optimize a slow database query?',
        'What is your approach to debugging production issues?',
      ],
      'DSA / Coding': [
        'How would you reverse a linked list?',
        'Explain your approach to finding duplicates in an array.',
        'What is the time complexity of binary search?',
      ],
      'System Design': [
        'How would you design a URL shortening service?',
        'Explain how you would scale a web application.',
        'What are the trade-offs between SQL and NoSQL databases?',
      ],
      'Behavioral': [
        'Tell me about a time you faced a difficult technical challenge.',
        'How do you handle disagreements with team members?',
        'Describe a project you are most proud of.',
      ],
      'HR': [
        'Why do you want to work at our company?',
        'What are your career goals for the next 5 years?',
        'How do you handle stress and tight deadlines?',
      ],
    };

    const questions = fallbacks[context.stage] || fallbacks['Technical'];
    return questions[context.questionIndex % questions.length];
  }

  generateSessionId() {
    return `session_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  }

  getActiveSessionCount() {
    return this.sessions.size;
  }
}

export default new RealtimeInterviewService();
