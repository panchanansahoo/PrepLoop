import express from 'express';
import { supabaseAdmin } from '../../db/supabaseClient.js';
import { optionalAuth } from '../../middleware/auth.ts';
import { customInterviewLimiter, customInterviewSubmissionLimiter } from '../../middleware/apiRateLimiter.js';
import { evaluateFresherAnswer } from '../../services/interviewAnswerEvaluator.js';
import {
  isInterviewLinkExpired,
  verifyInterviewInviteeEmail,
  getInterviewScheduleStatus,
  matchExpectedTopics,
  evaluateAssessmentIntegrity,
} from '../../utils/privateInterviewAccess.js';
import { dispatchInterviewWebhook } from '../../utils/interviewMailer.js';

const router = express.Router();

// ─── Get Question Set by Share Code (Public — no auth required) ───
router.get('/question-set/:code', customInterviewLimiter, optionalAuth, async (req, res) => {
  try {
    const { code } = req.params;

    if (!code || code.length < 5) {
      return res.status(400).json({ error: 'Invalid share code' });
    }

    const { data, error } = await supabaseAdmin
      .from('admin_question_sets')
      .select('id, title, description, share_code, interview_type, difficulty, requires_login, questions, settings, is_active, passcode_hash, expires_at, max_attempts, attempts_started, allowed_emails')
      .eq('share_code', code)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Question set not found' });
    }

    if (!data.is_active) {
      return res.status(410).json({ error: 'This interview is no longer available' });
    }
    if (isInterviewLinkExpired(data.expires_at)) {
      return res.status(410).json({ error: 'This interview link has expired' });
    }

    const allowedEmails = Array.isArray(data.allowed_emails)
      ? data.allowed_emails
      : (Array.isArray(data.settings?.allowedEmails) ? data.settings.allowedEmails : []);

    const scheduledAt = data.scheduled_at || data.settings?.scheduledAt || null;
    const scheduledDurationMinutes = data.scheduled_duration_minutes || data.settings?.scheduledDurationMinutes || 45;
    const scheduleInfo = getInterviewScheduleStatus(scheduledAt, scheduledDurationMinutes);

    if (scheduleInfo.status === 'ended') {
      return res.status(410).json({ error: 'This scheduled interview session has ended' });
    }

    res.json({
      questionSet: {
        id: data.id,
        title: data.title,
        description: data.description,
        interviewType: data.interview_type,
        difficulty: data.difficulty,
        requiresLogin: data.requires_login,
        requiresPasscode: Boolean(data.passcode_hash),
        requiresEmailAllowlist: allowedEmails.length > 0,
        expiresAt: data.expires_at,
        scheduledAt,
        scheduledDurationMinutes,
        scheduleStatus: scheduleInfo.status,
        isScheduled: scheduleInfo.isScheduled,
        secondsUntilStart: scheduleInfo.secondsUntilStart,
        canStartNow: scheduleInfo.canStartNow,
        remainingAttempts: data.max_attempts === null
          ? null
          : Math.max(0, data.max_attempts - (data.attempts_started || 0)),
        questionCount: Array.isArray(data.questions) ? data.questions.length : 0,
        questions: [],
        settings: data.settings || {},
        shareCode: data.share_code,
        token: data.share_code,
      }
    });
  } catch (error) {
    console.error('Get question set by code error:', error);
    res.status(500).json({ error: 'Failed to fetch question set' });
  }
});

// ─── Get Question Set by Candidate Token Alias (/token/:token) ───
router.get('/token/:token', customInterviewLimiter, optionalAuth, async (req, res) => {
  req.params.code = req.params.token;
  try {
    const { code } = req.params;

    if (!code || code.length < 5) {
      return res.status(400).json({ error: 'Invalid candidate token' });
    }

    const { data, error } = await supabaseAdmin
      .from('admin_question_sets')
      .select('id, title, description, share_code, interview_type, difficulty, requires_login, questions, settings, is_active, passcode_hash, expires_at, max_attempts, attempts_started, allowed_emails')
      .eq('share_code', code)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Question set not found' });
    }

    if (!data.is_active) {
      return res.status(410).json({ error: 'This interview is no longer available' });
    }
    if (isInterviewLinkExpired(data.expires_at)) {
      return res.status(410).json({ error: 'This interview link has expired' });
    }

    const allowedEmails = Array.isArray(data.allowed_emails)
      ? data.allowed_emails
      : (Array.isArray(data.settings?.allowedEmails) ? data.settings.allowedEmails : []);

    const scheduledAt = data.scheduled_at || data.settings?.scheduledAt || null;
    const scheduledDurationMinutes = data.scheduled_duration_minutes || data.settings?.scheduledDurationMinutes || 45;
    const scheduleInfo = getInterviewScheduleStatus(scheduledAt, scheduledDurationMinutes);

    if (scheduleInfo.status === 'ended') {
      return res.status(410).json({ error: 'This scheduled interview session has ended' });
    }

    res.json({
      questionSet: {
        id: data.id,
        title: data.title,
        description: data.description,
        interviewType: data.interview_type,
        difficulty: data.difficulty,
        requiresLogin: data.requires_login,
        requiresPasscode: Boolean(data.passcode_hash),
        requiresEmailAllowlist: allowedEmails.length > 0,
        expiresAt: data.expires_at,
        scheduledAt,
        scheduledDurationMinutes,
        scheduleStatus: scheduleInfo.status,
        isScheduled: scheduleInfo.isScheduled,
        secondsUntilStart: scheduleInfo.secondsUntilStart,
        canStartNow: scheduleInfo.canStartNow,
        remainingAttempts: data.max_attempts === null
          ? null
          : Math.max(0, data.max_attempts - (data.attempts_started || 0)),
        questionCount: Array.isArray(data.questions) ? data.questions.length : 0,
        questions: [],
        settings: data.settings || {},
        shareCode: data.share_code,
        token: data.share_code,
      }
    });
  } catch (error) {
    console.error('Get question set by token error:', error);
    res.status(500).json({ error: 'Failed to fetch question set' });
  }
});

// ─── Save Admin Interview Submission (Public — supports guest users) ───
router.post('/question-set/:code/submit', customInterviewSubmissionLimiter, optionalAuth, async (req, res) => {
  try {
    const { code } = req.params;
    const {
      attemptId, duration,
      userName, userEmail
    } = req.body;

    const { data: questionSet, error: fetchError } = await supabaseAdmin
      .from('admin_question_sets')
      .select('id, title, is_active, requires_login, allowed_emails, settings')
      .eq('share_code', code)
      .single();

    if (fetchError || !questionSet) {
      return res.status(404).json({ error: 'Question set not found' });
    }
    if (!questionSet.is_active) {
      return res.status(410).json({ error: 'This interview is no longer available' });
    }
    if (questionSet.requires_login && !req.user) {
      return res.status(401).json({ error: 'Login required for this interview' });
    }

    const allowedEmails = Array.isArray(questionSet.allowed_emails)
      ? questionSet.allowed_emails
      : (Array.isArray(questionSet.settings?.allowedEmails) ? questionSet.settings.allowedEmails : []);
    if (allowedEmails.length > 0) {
      const candidateEmail = req.user?.email || userEmail;
      if (!candidateEmail || !verifyInterviewInviteeEmail(candidateEmail, allowedEmails)) {
        return res.status(403).json({ error: 'Your email address is not authorized for this private interview' });
      }
    }
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('admin_interview_attempts')
      .select('id, question_set_id, user_id, stage, responses, expires_at, completed_at, submitted_at, question_snapshot')
      .eq('id', attemptId || '')
      .eq('question_set_id', questionSet.id)
      .single();
    if (attemptError || !attempt) {
      return res.status(404).json({ error: 'Interview attempt not found' });
    }
    if (new Date(attempt.expires_at).getTime() <= Date.now()) {
      return res.status(410).json({ error: 'This interview attempt has expired' });
    }
    if (!attempt.completed_at) {
      return res.status(409).json({ error: 'Interview must be completed before submission' });
    }
    if (attempt.submitted_at) {
      return res.status(409).json({ error: 'This interview has already been submitted' });
    }
    if (attempt.user_id && attempt.user_id !== req.user?.id) {
      return res.status(403).json({ error: 'Interview attempt belongs to another user' });
    }
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!attemptId || !UUID_REGEX.test(attemptId)) {
      return res.status(400).json({ error: 'A valid interview attempt is required' });
    }
    const serverResponses = Array.isArray(attempt.responses) ? attempt.responses : [];
    if (serverResponses.length > 100 || JSON.stringify(serverResponses).length > 200000) {
      return res.status(400).json({ error: 'Interview responses are too large' });
    }
    if (typeof userName === 'string' && userName.length > 255) {
      return res.status(400).json({ error: 'Name is too long' });
    }
    if (typeof userEmail === 'string' && userEmail.length > 255) {
      return res.status(400).json({ error: 'Email is too long' });
    }

    const parsedDuration = Number(duration);
    const sanitizedDuration = Number.isFinite(parsedDuration)
      ? Math.min(86400, Math.max(0, Math.round(parsedDuration)))
      : 0;
    const candidateAnswers = serverResponses
      .filter((response) => response && response.role === 'candidate')
      .map((response) => response.content || response.text || '')
      .filter((answer) => typeof answer === 'string' && answer.trim());
    const serverScores = candidateAnswers.map((answer) =>
      evaluateFresherAnswer(answer, attempt.stage || 'Technical').score
    );
    const serverOverallScore = serverScores.length > 0
      ? Math.round(serverScores.reduce((sum, score) => sum + score, 0) / serverScores.length)
      : 0;
    const sanitizedUserId = req.user?.id || null;

    const rawSnapshots = Array.isArray(req.body.snapshots) ? req.body.snapshots : [];
    const sanitizedSnapshots = rawSnapshots
      .filter((s) => s && typeof s === 'object' && typeof s.thumbnail === 'string')
      .slice(0, 5)
      .map((s) => ({
        trigger: String(s.trigger || 'checkpoint').slice(0, 50),
        timestamp: s.timestamp || new Date().toISOString(),
        thumbnail: s.thumbnail.slice(0, 50000),
      }));

    const baseIntegrity = evaluateAssessmentIntegrity(
      req.body.tabSwitchCount ?? req.body.tabSwitches,
      req.body.pasteCount ?? req.body.pastes
    );
    const integrity = {
      ...baseIntegrity,
      snapshots: sanitizedSnapshots,
    };

    const questionList = Array.isArray(attempt.question_snapshot) && attempt.question_snapshot.length > 0
      ? attempt.question_snapshot
      : (Array.isArray(questionSet.questions) ? questionSet.questions : []);

    const candidateTurns = serverResponses.filter((r) => r && r.role === 'candidate');
    const breakdown = questionList.map((qItem, idx) => {
      const qText = typeof qItem === 'string' ? qItem : (qItem?.question || qItem?.text || `Question ${idx + 1}`);
      const expectedTopics = Array.isArray(qItem?.expectedTopics)
        ? qItem.expectedTopics
        : (Array.isArray(qItem?.topics) ? qItem.topics : (Array.isArray(qItem?.keywords) ? qItem.keywords : []));

      const matchedTurn = candidateTurns.find((t) => t.questionIndex === idx) ||
        candidateTurns.find((t) => t.question && t.question.trim().toLowerCase() === qText.trim().toLowerCase()) ||
        candidateTurns[idx];

      const answer = matchedTurn?.content || matchedTurn?.text || '';
      const topicEvaluation = matchExpectedTopics(answer, expectedTopics);
      const turnScore = answer ? evaluateFresherAnswer(answer, attempt.stage || 'Technical').score : 0;

      return {
        questionIndex: idx + 1,
        question: qText,
        answer: answer || 'No response recorded',
        score: turnScore,
        coveredTopics: topicEvaluation.coveredTopics,
        missedTopics: topicEvaluation.missedTopics,
        coverageRatio: topicEvaluation.coverageRatio,
        elapsedSeconds: matchedTurn?.elapsedSeconds || 0,
        timeLimit: qItem?.timeLimit || null,
      };
    });

    const passingScore = Number(questionSet.settings?.passingScore) || 70;
    let decision = 'qualified';
    if (integrity.flagged || serverOverallScore < passingScore - 15) {
      decision = 'rejected';
    } else if (serverOverallScore < passingScore) {
      decision = 'review_needed';
    }

    const submissionPayload = {
      question_set_id: questionSet.id,
      attempt_id: attemptId,
      user_id: sanitizedUserId,
      user_name: req.user?.user_metadata?.full_name || req.user?.email || userName || null,
      user_email: req.user?.email || userEmail || null,
      responses: serverResponses,
      scores: {
        serverOverallScore,
        answerCount: candidateAnswers.length,
        integrity,
        breakdown,
        passingScore,
        decision,
      },
      overall_score: serverOverallScore,
      duration: sanitizedDuration,
      completed_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('admin_interview_submissions')
      .insert(submissionPayload)
      .select('id')
      .single();

    if (error?.code === '23505') {
      return res.status(409).json({ error: 'This interview has already been submitted' });
    }

    if (error) throw error;
    const { error: markSubmittedError } = await supabaseAdmin
      .from('admin_interview_attempts')
      .update({ submitted_at: new Date().toISOString() })
      .eq('id', attempt.id)
      .is('submitted_at', null);
    if (markSubmittedError) {
      console.error('Failed to finalize custom interview attempt:', markSubmittedError.code || markSubmittedError.message);
    }

    const webhookUrl = questionSet.settings?.webhookUrl;
    if (webhookUrl) {
      dispatchInterviewWebhook(webhookUrl, questionSet.settings?.webhookSecret, {
        event: 'interview.submission.completed',
        questionSetId: questionSet.id,
        questionSetTitle: questionSet.title || 'Private Interview',
        attemptId,
        candidateName: submissionPayload.user_name,
        candidateEmail: submissionPayload.user_email,
        overallScore: serverOverallScore,
        passingScore,
        decision,
        integrity: {
          rating: integrity.integrityRating,
          score: integrity.integrityScore,
          flagged: integrity.flagged,
          tabSwitchCount: integrity.tabSwitchCount,
          pasteCount: integrity.pasteCount,
          snapshotsCount: sanitizedSnapshots.length,
        },
        durationSeconds: sanitizedDuration,
        completedAt: submissionPayload.completed_at,
      }).catch((err) => console.error('Submission webhook error:', err.message));
    }

    res.status(201).json({ success: true, submissionId: data?.id });
  } catch (error) {
    console.error('Save submission error:', error);
    res.status(500).json({ error: 'Failed to save submission' });
  }
});

// ─── Save Admin Interview Submission by Token Alias (/token/:token/submit) ───
router.post('/token/:token/submit', customInterviewSubmissionLimiter, optionalAuth, async (req, res) => {
  req.params.code = req.params.token;
  try {
    const { code } = req.params;
    const {
      attemptId, duration,
      userName, userEmail
    } = req.body;

    const { data: questionSet, error: fetchError } = await supabaseAdmin
      .from('admin_question_sets')
      .select('id, title, is_active, requires_login, allowed_emails, settings, questions')
      .eq('share_code', code)
      .single();

    if (fetchError || !questionSet) {
      return res.status(404).json({ error: 'Question set not found' });
    }
    if (!questionSet.is_active) {
      return res.status(410).json({ error: 'This interview is no longer available' });
    }
    if (questionSet.requires_login && !req.user) {
      return res.status(401).json({ error: 'Login required for this interview' });
    }

    const allowedEmails = Array.isArray(questionSet.allowed_emails)
      ? questionSet.allowed_emails
      : (Array.isArray(questionSet.settings?.allowedEmails) ? questionSet.settings.allowedEmails : []);
    if (allowedEmails.length > 0) {
      const candidateEmail = req.user?.email || userEmail;
      if (!candidateEmail || !verifyInterviewInviteeEmail(candidateEmail, allowedEmails)) {
        return res.status(403).json({ error: 'Your email address is not authorized for this private interview' });
      }
    }
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('admin_interview_attempts')
      .select('id, question_set_id, user_id, stage, responses, expires_at, completed_at, submitted_at, question_snapshot')
      .eq('id', attemptId || '')
      .eq('question_set_id', questionSet.id)
      .single();
    if (attemptError || !attempt) {
      return res.status(404).json({ error: 'Interview attempt not found' });
    }
    if (new Date(attempt.expires_at).getTime() <= Date.now()) {
      return res.status(410).json({ error: 'This interview attempt has expired' });
    }
    if (!attempt.completed_at) {
      return res.status(409).json({ error: 'Interview must be completed before submission' });
    }
    if (attempt.submitted_at) {
      return res.status(409).json({ error: 'This interview has already been submitted' });
    }
    if (attempt.user_id && attempt.user_id !== req.user?.id) {
      return res.status(403).json({ error: 'Interview attempt belongs to another user' });
    }
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!attemptId || !UUID_REGEX.test(attemptId)) {
      return res.status(400).json({ error: 'A valid interview attempt is required' });
    }
    const serverResponses = Array.isArray(attempt.responses) ? attempt.responses : [];
    if (serverResponses.length > 100 || JSON.stringify(serverResponses).length > 200000) {
      return res.status(400).json({ error: 'Interview responses are too large' });
    }
    if (typeof userName === 'string' && userName.length > 255) {
      return res.status(400).json({ error: 'Name is too long' });
    }
    if (typeof userEmail === 'string' && userEmail.length > 255) {
      return res.status(400).json({ error: 'Email is too long' });
    }

    const parsedDuration = Number(duration);
    const sanitizedDuration = Number.isFinite(parsedDuration)
      ? Math.min(86400, Math.max(0, Math.round(parsedDuration)))
      : 0;
    const candidateAnswers = serverResponses
      .map((entry, index) => ({
        index: index + 1,
        question: entry.question || entry.text || '',
        answer: entry.answer || entry.userAnswer || '',
      }))
      .filter((qa) => Boolean(qa.answer));

    const rawSnapshots = Array.isArray(req.body.snapshots) ? req.body.snapshots : [];
    const sanitizedSnapshots = rawSnapshots
      .filter((s) => s && typeof s === 'object' && typeof s.thumbnail === 'string')
      .slice(0, 5)
      .map((s) => ({
        trigger: String(s.trigger || 'checkpoint').slice(0, 50),
        timestamp: s.timestamp || new Date().toISOString(),
        thumbnail: s.thumbnail.slice(0, 50000),
      }));

    const baseIntegrity = evaluateAssessmentIntegrity(
      req.body.tabSwitchCount ?? req.body.tabSwitches,
      req.body.pasteCount ?? req.body.pastes
    );
    const integrity = {
      ...baseIntegrity,
      snapshots: sanitizedSnapshots,
    };

    const questionList = Array.isArray(attempt.question_snapshot) && attempt.question_snapshot.length > 0
      ? attempt.question_snapshot
      : (Array.isArray(questionSet.questions) ? questionSet.questions : []);

    const candidateTurns = serverResponses.filter((r) => r && r.role === 'candidate');
    const breakdown = questionList.map((qItem, idx) => {
      const qText = typeof qItem === 'string' ? qItem : (qItem?.question || qItem?.text || `Question ${idx + 1}`);
      const expectedTopics = Array.isArray(qItem?.expectedTopics)
        ? qItem.expectedTopics
        : (Array.isArray(qItem?.topics) ? qItem.topics : (Array.isArray(qItem?.keywords) ? qItem.keywords : []));

      const matchedTurn = candidateTurns.find((t) => t.questionIndex === idx) ||
        candidateTurns.find((t) => t.question && t.question.trim().toLowerCase() === qText.trim().toLowerCase()) ||
        candidateTurns[idx];

      const answer = matchedTurn?.content || matchedTurn?.text || '';
      const topicEvaluation = matchExpectedTopics(answer, expectedTopics);
      const turnScore = answer ? evaluateFresherAnswer(answer, attempt.stage || 'Technical').score : 0;

      return {
        questionIndex: idx + 1,
        question: qText,
        answer: answer || 'No response recorded',
        score: turnScore,
        coveredTopics: topicEvaluation.coveredTopics,
        missedTopics: topicEvaluation.missedTopics,
        coverageRatio: topicEvaluation.coverageRatio,
        elapsedSeconds: matchedTurn?.elapsedSeconds || 0,
        timeLimit: qItem?.timeLimit || null,
      };
    });

    const passingScore = Number(questionSet.settings?.passingScore) || 70;
    let decision = 'qualified';
    if (integrity.flagged || overallScore < passingScore - 15) {
      decision = 'rejected';
    } else if (overallScore < passingScore) {
      decision = 'review_needed';
    }

    let scores = {
      integrity,
      breakdown,
      passingScore,
      decision,
    };
    let overallScore = 0;
    if (candidateAnswers.length > 0) {
      try {
        const evaluation = await evaluateFresherAnswer({
          question: candidateAnswers[0].question,
          answer: candidateAnswers.map((item) => `Q: ${item.question}\nA: ${item.answer}`).join('\n\n'),
          role: questionSet.settings?.roleName || 'Software Engineer',
          company: questionSet.settings?.companyName || 'General Practice',
          expectedTopics: questionSet.settings?.expectedTopics || [],
          experienceLevel: questionSet.settings?.experienceLevel || 'fresher',
        });
        if (evaluation && typeof evaluation.overallScore === 'number') {
          overallScore = evaluation.overallScore;
          scores = {
            ...scores,
            clarity: evaluation.clarity || 0,
            relevance: evaluation.relevance || 0,
            depth: evaluation.depth || 0,
            structure: evaluation.structure || 0,
            evaluationMethod: 'llm_rubric',
          };
        }
      } catch (evalErr) {
        console.warn('Submission evaluation fallback:', evalErr.message);
      }
    }

    const safeUserName = typeof userName === 'string' && userName.trim()
      ? userName.trim()
      : (req.user?.user_metadata?.full_name || 'Guest Candidate');
    const rawUserEmail = typeof userEmail === 'string' && userEmail.trim()
      ? userEmail.trim()
      : (req.user?.email || null);
    const safeUserEmail = typeof rawUserEmail === 'string' ? rawUserEmail.trim().toLowerCase() || null : null;

    const { data, error } = await supabaseAdmin
      .from('admin_interview_submissions')
      .insert({
        question_set_id: questionSet.id,
        user_id: req.user?.id || null,
        user_name: safeUserName,
        user_email: safeUserEmail,
        responses: serverResponses,
        scores,
        overall_score: overallScore,
        duration: sanitizedDuration,
        attempt_id: attempt.id,
      })
      .select('id')
      .single();

    if (error?.code === '23505') {
      return res.status(409).json({ error: 'This interview has already been submitted' });
    }

    if (error) throw error;
    await supabaseAdmin
      .from('admin_interview_attempts')
      .update({ submitted_at: new Date().toISOString() })
      .eq('id', attempt.id)
      .is('submitted_at', null);

    const webhookUrl = questionSet.settings?.webhookUrl;
    if (webhookUrl) {
      dispatchInterviewWebhook(webhookUrl, questionSet.settings?.webhookSecret, {
        event: 'interview.submission.completed',
        questionSetId: questionSet.id,
        questionSetTitle: questionSet.title || 'Private Interview',
        attemptId: attempt.id,
        candidateName: safeUserName,
        candidateEmail: safeUserEmail,
        overallScore,
        passingScore,
        decision,
        integrity: {
          rating: integrity.integrityRating,
          score: integrity.integrityScore,
          flagged: integrity.flagged,
          tabSwitchCount: integrity.tabSwitchCount,
          pasteCount: integrity.pasteCount,
          snapshotsCount: sanitizedSnapshots.length,
        },
        durationSeconds: sanitizedDuration,
        completedAt: new Date().toISOString(),
      }).catch((err) => console.error('Submission webhook error:', err.message));
    }

    res.status(201).json({ success: true, submissionId: data?.id });
  } catch (error) {
    console.error('Save submission by token error:', error);
    res.status(500).json({ error: 'Failed to save submission' });
  }
});

export default router;

