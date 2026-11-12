/**
 * Real-time Interview WebSocket Service
 * Handles instant answer processing, live feedback, and streaming responses
 */
import { WebSocketServer } from 'ws';
import crypto from 'crypto';
import { InterviewStateMachineService } from './interviewStateMachine.js';
import { InterviewScoringService } from './interviewScoringService.ts';
import { computeNextMood, getMoodProfile, MOODS } from './interviewerMoodEngine.js';
import { evaluateFresherAnswer } from './interviewAnswerEvaluator.js';

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
    this.disconnectedSessions = new Map(); // sessionId -> { context, state, disconnectedAt, timeoutTimer }
  }

  initialize(server) {
    this.wss = new WebSocketServer({ server, path: '/ws/interview' });

    this.wss.on('connection', (ws, req) => {
      let requestedSessionId = null;
      try {
        if (req?.url) {
          const parsedUrl = new URL(req.url, 'http://localhost');
          requestedSessionId = parsedUrl.searchParams.get('sessionId');
        }
      } catch {
        /* ignore url parse error */
      }

      let sessionId = requestedSessionId;
      let resumed = false;

      if (sessionId && this.disconnectedSessions.has(sessionId)) {
        const saved = this.disconnectedSessions.get(sessionId);
        if (saved.timeoutTimer) clearTimeout(saved.timeoutTimer);
        this.disconnectedSessions.delete(sessionId);

        this.sessions.set(sessionId, {
          ws,
          context: saved.context,
          state: saved.state || 'idle',
        });
        resumed = true;
        console.log(`[RealtimeInterview] Resumed session: ${sessionId}`);
      } else {
        sessionId = sessionId || this.generateSessionId();
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
      }

      const activeSession = this.sessions.get(sessionId);

      // Send connected / resumed message
      ws.send(JSON.stringify({
        type: resumed ? 'resumed' : 'connected',
        sessionId,
        context: activeSession.context,
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

      // Handle disconnect with 60s grace period
      ws.on('close', () => {
        console.log(`[RealtimeInterview] Disconnected: ${sessionId}`);
        const currentSession = this.sessions.get(sessionId);
        if (currentSession) {
          const timeoutTimer = setTimeout(() => {
            if (this.disconnectedSessions.has(sessionId)) {
              console.log(`[RealtimeInterview] Session grace window expired, purging: ${sessionId}`);
              this.disconnectedSessions.delete(sessionId);
            }
          }, 60_000);

          this.disconnectedSessions.set(sessionId, {
            context: currentSession.context,
            state: currentSession.state,
            disconnectedAt: Date.now(),
            timeoutTimer,
          });
          this.sessions.delete(sessionId);
        }
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

      case 'resume':
        await this.handleResume(sessionId, session, message);
        break;

      default:
        console.warn(`[RealtimeInterview] Unknown message type: ${message.type}`);
    }
  }

  handleResume(currentSessionId, session, message) {
    const { targetSessionId, sessionId } = message;
    const resumeId = targetSessionId || sessionId;
    if (!resumeId) {
      session.ws.send(JSON.stringify({ type: 'error', error: 'Missing sessionId for resume' }));
      return;
    }

    if (this.disconnectedSessions.has(resumeId)) {
      const saved = this.disconnectedSessions.get(resumeId);
      if (saved.timeoutTimer) clearTimeout(saved.timeoutTimer);
      this.disconnectedSessions.delete(resumeId);

      this.sessions.delete(currentSessionId);
      this.sessions.set(resumeId, {
        ws: session.ws,
        context: saved.context,
        state: saved.state || 'idle',
      });

      session.ws.send(JSON.stringify({
        type: 'resumed',
        sessionId: resumeId,
        context: saved.context,
        state: saved.state,
        timestamp: Date.now(),
      }));
    } else {
      session.ws.send(JSON.stringify({
        type: 'resume_failed',
        reason: 'Session expired or not found',
        sessionId: resumeId,
      }));
    }
  }

  async handleStart(session, message) {
    const { ws, context } = session;
    const { company, role, stage, experienceLevel, interviewType, difficulty, totalQuestions } = message;

    // Update context
    Object.assign(context, {
      company: company || 'General',
      role: role || 'Software Engineer',
      stage: stage || 'intake',
      experienceLevel: experienceLevel || 'fresher',
      interviewType: interviewType || 'dsa',
      difficulty: difficulty || 'medium',
      totalQuestions: Number(totalQuestions) || 10,
      turns: 0,
      topicFollowUpCount: 0,
      scoreHistory: [],
      moodState: MOODS.NEUTRAL,
    });

    // Generate first question
    const question = await this.generateQuestion(context);

    // Send question
    ws.send(JSON.stringify({
      type: 'question',
      question,
      questionIndex: 1,
      stage: context.stage,
      difficulty: context.difficulty,
      mood: context.moodState,
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

    context.turns = (context.turns || 0) + 1;

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

    // 1. Evaluate answer quality using evaluateFresherAnswer for comprehensive semantic scoring
    const evalResult = evaluateFresherAnswer(answer, context.stage, code);

    // 2. Track score in history
    context.scoreHistory = context.scoreHistory || [];
    context.scoreHistory.push({ score: evalResult.score, turn: context.turns });

    // 3. Score trend analysis
    const scoreTrend = InterviewScoringService.calculateTrendFromHistory(context.scoreHistory);

    // 4. Adaptive difficulty progression
    const adaptiveDiff = InterviewScoringService.deriveAdaptiveDifficulty(
      context.difficulty,
      evalResult.score / 10,
      context.turns,
      scoreTrend,
      context.experienceLevel
    );
    if (adaptiveDiff.changed) {
      context.difficulty = adaptiveDiff.newDifficulty;
    }

    // 5. Emotional intelligence / Interviewer Mood state transition
    const wordCount = String(answer || '').trim().split(/\s+/).filter(Boolean).length;
    const cumulativeScores = context.scoreHistory.map((entry) => entry.score);
    let consecutiveLowScores = 0;
    for (let i = cumulativeScores.length - 1; i >= 0; i -= 1) {
      if (cumulativeScores[i] < 50) consecutiveLowScores += 1;
      else break;
    }
    const { nextMood } = computeNextMood(context.moodState || MOODS.NEUTRAL, {
      score: evalResult.score,
      wordCount,
      cumulativeScores,
      consecutiveLowScores,
    });
    const moodProfile = getMoodProfile(nextMood);
    context.moodState = nextMood;

    // 6. Proportional state machine stage progression
    const nextState = InterviewStateMachineService.advanceState({
      turns: context.turns,
      totalQuestions: context.totalQuestions,
      stage: context.stage,
      interviewType: context.interviewType,
      difficulty: context.difficulty,
    });
    context.stage = nextState.stage;

    // Generate feedback and next question in parallel
    const [feedback, nextQuestion] = await Promise.all([
      this.generateFeedback(context, answer),
      this.generateNextQuestion(context),
    ]);

    const finalScore = Number.isFinite(feedback?.score) ? Math.round((feedback.score * 0.6) + (evalResult.score * 0.4)) : evalResult.score;

    // Send feedback
    ws.send(JSON.stringify({
      type: 'feedback',
      feedback: feedback?.comment || evalResult.feedbackSummary,
      score: finalScore,
      rubric: evalResult.rubric,
      strengths: evalResult.strengths,
      improvements: evalResult.improvements,
      stage: context.stage,
      difficulty: context.difficulty,
      mood: {
        state: context.moodState,
        expression: moodProfile.expression,
        avatarOverlay: moodProfile.avatarOverlay,
        ttsProsody: moodProfile.ttsProsody,
      },
      adaptiveDifficulty: adaptiveDiff,
      timestamp: Date.now(),
    }));

    // Send next question
    ws.send(JSON.stringify({
      type: 'question',
      question: nextQuestion,
      questionIndex: context.questionIndex + 1,
      stage: context.stage,
      difficulty: context.difficulty,
      mood: context.moodState,
      timestamp: Date.now(),
    }));

    context.conversation.push({
      role: 'feedback',
      content: feedback?.comment || evalResult.feedbackSummary,
      score: feedback?.score ?? finalScore,
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

export { RealtimeInterviewService };
export default new RealtimeInterviewService();
