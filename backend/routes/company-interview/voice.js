import express from 'express';
import Groq from 'groq-sdk';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { optionalAuth, authenticateToken } from '../../middleware/auth.js';
import { supabaseAdmin } from '../../db/supabaseClient.js';
import { aiCallWithRetry } from '../../utils/aiClient.js';
import { getRandomQuestionSet, getFilteredQuestions, getQuestionCount } from '../../services/companyQuestionService.js';
import { buildInitialVoiceTelemetry, buildVoiceTelemetrySnapshot } from '../../utils/voiceTelemetry.js';
import { buildAnswerFeedbackPrompt, normalizeInterviewFeedback } from '../../utils/interviewFeedback.js';
import { evaluateFresherAnswer } from '../../services/interviewAnswerEvaluator.js';
import { groq, safeDeleteUploadFile, MAX_HISTORY_TURNS, truncateConversationHistory, deterministicScore, deterministicPick, safeJsonParse, UPLOAD_DIR, upload, COMPANY_CATEGORIES, getCompanyCategory, PERSONA_PROFILES, DEFAULT_ADVANCED_OPTIONS, INTERVIEW_RUNTIME_MODES, normalizeInterviewRuntimeMode, buildInterviewRuntime, STAGE_ALIASES, resolveInterviewStage, resolveResumeInterviewModeForExperience, normalizeAdvancedOptions, formatResumeContext, FRESHER_INTERVIEW_TOTAL_QUESTIONS, HR_CLOSING_MESSAGE, STATIC_INTERVIEW_QUESTIONS, STATIC_INTERVIEW_CLOSINGS, FRESHER_HR_FIXED, FRESHER_HR_TOPICS, FRESHER_HR_CLOSINGS, FRESHER_TECHNICAL_FIXED, FRESHER_TECHNICAL_TOPICS, getStaticInterviewQuestions, getStaticInterviewQuestion, getStaticInterviewClosing, getFresherTechnicalQuestion, getFresherTechnicalAIPrompt, getFresherHRQuestion, getFresherHRAIPrompt, getFresherHRClosing, INTERVIEWER_NAMES, pickFallbackInterviewerName, getResumeProjectPrompt, getTopSkillPrompt, buildHrResponseSnippet, getFresherScriptedQuestion, getFresherQuestionTopic, getFresherFallbackQuestion, isFinalNoAnswer, getInterviewerPersona, getCompanyChallengeProfile, getAdaptiveDifficultyPrompt, buildInterviewMemoryPrompt, buildFocusSignal } from './helpers.js';

const router = express.Router();

// ─── Analyze speech for pace, fillers, clarity ───
router.post('/speech-feedback', optionalAuth, async (req, res) => {
  const { transcript, duration } = req.body;

  try {
    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ error: 'Transcript is required' });
    }
    const words = transcript.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const wpm = duration > 0 ? Math.round((wordCount / duration) * 60) : 0;

    const fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally', 'so', 'right', 'i mean', 'kind of', 'sort of'];
    const fillerCount = {};
    let totalFillers = 0;
    const lowerTranscript = transcript.toLowerCase();
    fillerWords.forEach(fw => {
      const regex = new RegExp(`\\b${fw}\\b`, 'gi');
      const matches = lowerTranscript.match(regex);
      if (matches && matches.length > 0) {
        fillerCount[fw] = matches.length;
        totalFillers += matches.length;
      }
    });

    const fillerRate = wordCount > 0 ? (totalFillers / wordCount * 100).toFixed(1) : 0;

    let paceAssessment = 'Good';
    if (wpm < 100) paceAssessment = 'Too slow — try to speak more confidently';
    else if (wpm > 180) paceAssessment = 'Too fast — slow down for clarity';
    else if (wpm >= 130 && wpm <= 160) paceAssessment = 'Excellent pace!';

    let clarityScore = 85;
    if (totalFillers > 5) clarityScore -= totalFillers * 2;
    if (wpm < 90 || wpm > 190) clarityScore -= 10;
    clarityScore = Math.max(0, Math.min(100, clarityScore));

    const avgWordLength = words.length > 0 ? words.reduce((a, w) => a + w.length, 0) / words.length : 0;
    let confidenceScore = 70;
    if (wpm >= 120 && wpm <= 170) confidenceScore += 10;
    if (totalFillers <= 2) confidenceScore += 10;
    if (avgWordLength > 4.5) confidenceScore += 5;
    if (wordCount > 50) confidenceScore += 5;
    confidenceScore = Math.min(100, confidenceScore);

    res.json({
      wordCount, wpm, paceAssessment, fillerCount, totalFillers,
      fillerRate: `${fillerRate}%`, clarityScore, confidenceScore,
      tips: [
        totalFillers > 3 ? `Reduce filler words (found ${totalFillers}: ${Object.keys(fillerCount).join(', ')})` : 'Great job minimizing filler words!',
        wpm < 120 ? 'Speak a bit faster to maintain engagement' : wpm > 170 ? 'Slow down slightly' : 'Your pace is great!',
        'Pause briefly between key points for emphasis',
        confidenceScore < 70 ? 'Try to sound more assertive' : 'Good confidence level!'
      ]
    });
  } catch (error) {
    console.error('Speech feedback error:', error.message);
    res.status(500).json({ error: 'Failed to analyze speech' });
  }
});


// ─── Text-to-Speech (Orpheus TTS) ───
router.post('/tts', optionalAuth, async (req, res) => {
  const { text, persona } = req.body;

  if (!text || String(text).trim().length === 0) {
    return res.status(400).json({ error: 'Text is required' });
  }

  // Sanitize text early — strip HTML tags to prevent XSS via reflected content
  const sanitizedText = String(text).replace(/<[^>]*>/g, '').substring(0, 1500);

  if (sanitizedText.length === 0) {
    return res.status(400).json({ error: 'Text is required after sanitization' });
  }

  const voiceMap = {
    friendly: 'diana',
    analytical: 'tara',
    formal: 'charlie',
    casual: 'leo',
    default: 'diana'
  };
  const selectedVoice = voiceMap[persona] || voiceMap.default;

  try {
    if (!groq) {
      return res.status(503).json({ error: 'AI service unavailable', fallback: true });
    }

    if (text.length > 1500) {
      return res.status(413).json({ error: 'Text too long for TTS', fallback: true });
    }

    // Primary: Orpheus with persona-selected voice
    const response = await groq.audio.speech.create({
      model: 'canopylabs/orpheus-v1-english',
      input: sanitizedText,
      voice: selectedVoice,
      response_format: 'wav',
    });

    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.length < 100) {
      return res.status(500).json({ error: 'TTS returned empty audio', fallback: true });
    }

    res.set({
      'Content-Type': 'audio/wav',
      'Content-Length': buffer.length,
      'Cache-Control': 'no-cache',
    });
    res.send(buffer);
  } catch (error) {
    console.error('Orpheus TTS error:', error.message?.substring(0, 200));

    // Fallback: try PlayAI — sanitizedText is in scope here
    try {
      const response = await groq.audio.speech.create({
        model: 'playai-tts',
        input: sanitizedText,
        voice: 'Arista-PlayAI',
        response_format: 'wav',
      });
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length > 100) {
        res.set({ 'Content-Type': 'audio/wav', 'Content-Length': buffer.length, 'Cache-Control': 'no-cache' });
        return res.send(buffer);
      }
    } catch (fallbackErr) {
      console.error('PlayAI fallback failed:', fallbackErr.message?.substring(0, 200));
    }

    res.status(500).json({ error: 'TTS failed', fallback: true });
  }
});


// ─── Speech-to-Text (Whisper) ───
router.post('/stt', optionalAuth, upload.single('audio'), async (req, res) => {
  const filePath = req.file?.path;

  // Validate that the resolved path stays within the expected temp directory
  if (filePath) {
    const resolvedPath = path.resolve(filePath);
    const resolvedUploadDir = path.resolve(UPLOAD_DIR);
    if (!resolvedPath.startsWith(resolvedUploadDir + path.sep) && resolvedPath !== resolvedUploadDir) {
      safeDeleteUploadFile(filePath);
      return res.status(400).json({ error: 'Invalid file path' });
    }
  }

  try {
    if (!groq) {
      safeDeleteUploadFile(filePath);
      return res.status(503).json({ error: 'AI service unavailable' });
    }

    if (!filePath) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const transcription = await groq.audio.transcriptions.create({
      model: 'whisper-large-v3-turbo',
      file: fs.createReadStream(filePath),
      response_format: 'json',
    });

    // Clean up temp file
    safeDeleteUploadFile(filePath);

    res.json({
      text: transcription.text || '',
      language: transcription.language || 'en',
    });
  } catch (error) {
    console.error('STT error:', error.message);
    safeDeleteUploadFile(filePath);
    res.status(500).json({ error: 'STT failed' });
  }
});


export default router;
