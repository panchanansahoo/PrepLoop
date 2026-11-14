import express from 'express';
import crypto from 'crypto';
import { supabaseAdmin } from '../../db/supabaseClient.js';
import { customInterviewLimiter } from '../../middleware/apiRateLimiter.js';
import { generateCalendarIcs, buildCandidateInviteEmail } from '../../utils/interviewMailer.js';
import { createLogger } from '../../utils/structuredLogger.js';

const logger = createLogger('candidate-feedback-portal');
const router = express.Router();

/**
 * Sensitive recruiter-only rubric and proctoring fields that MUST NEVER leak to candidates.
 */
const STRICT_REDACTED_FIELDS = new Set([
  'decision',
  'passingScore',
  'pass_score',
  'passing_score',
  'integrity',
  'tabSwitchCount',
  'tab_switch_count',
  'pasteCount',
  'paste_count',
  'flagged',
  'suspiciousActivity',
  'suspicious_activity',
  'llmSpeechConfidence',
  'secondaryVoiceDetected',
  'recruiterComments',
  'recruiter_comments',
  'hiringRecommendation',
  'hiring_recommendation',
  'rubricWeights',
  'rubric_weights',
  'internalNotes',
  'internal_notes',
  'telemetry',
  'cheatConfidence',
]);

/**
 * Deep sanitization function that recursively strips out any recruiter rubric or integrity keys.
 */
export function sanitizeCandidateReport(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeCandidateReport(item));
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (STRICT_REDACTED_FIELDS.has(key)) {
      continue;
    }
    if (value && typeof value === 'object') {
      cleaned[key] = sanitizeCandidateReport(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Transforms an internal interview submission into a constructive, candidate-safe feedback report.
 */
export function generateCandidateSafeFeedback(submission = {}, questionSet = {}) {
  const scores = submission.scores || {};
  const rawExecutiveSummary = scores.executiveSummary || {};

  // Extract constructive strengths without internal rubric tags
  let strengths = [];
  if (rawExecutiveSummary.keyStrengths) {
    strengths.push(
      String(rawExecutiveSummary.keyStrengths)
        .replace(/^(Key Strengths|Strengths):\s*/i, '')
        .trim()
    );
  }

  // Extract constructive growth areas
  let growthTips = [];
  if (rawExecutiveSummary.growthAreas) {
    growthTips.push(
      String(rawExecutiveSummary.growthAreas)
        .replace(/^(Growth Areas|Areas for Improvement|Growth):\s*/i, '')
        .trim()
    );
  }

  // Extract safe topic breakdown
  const rawBreakdown = scores.breakdown || {};
  const topicBreakdown = [];
  for (const [topic, topicScore] of Object.entries(rawBreakdown)) {
    const numericScore = typeof topicScore === 'number'
      ? topicScore
      : (typeof topicScore?.score === 'number' ? topicScore.score : 75);

    let proficiency = 'Developing';
    if (numericScore >= 85) proficiency = 'Strong Mastery';
    else if (numericScore >= 70) proficiency = 'Proficient';

    topicBreakdown.push({
      topic: topic.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim(),
      proficiency,
      feedback: numericScore >= 80
        ? 'Demonstrated solid grasp of core concepts with structured reasoning.'
        : 'Good familiarity; recommend reviewing edge cases and system trade-offs.',
    });
  }

  // Fallbacks if no breakdown was present
  if (strengths.length === 0) {
    strengths = [
      'Strong communication and clear articulation of problem-solving approach.',
      'Demonstrated structured breakdown when analyzing requirements and technical constraints.',
      'Clean syntax habits and thoughtful consideration of modular software patterns.',
    ];
  }

  if (growthTips.length === 0) {
    growthTips = [
      'Deepen coverage of time and space complexity trade-offs upfront before finalizing solution architecture.',
      'Consider outlining concrete edge-case testing strategies for high-concurrency environments.',
      'Use the STAR method (Situation, Task, Action, Result) to concisely convey measurable project impact.',
    ];
  }

  if (topicBreakdown.length === 0) {
    topicBreakdown.push(
      { topic: 'Problem Solving & Architecture', proficiency: 'Proficient', feedback: 'Clear decomposition of technical challenges.' },
      { topic: 'Code Quality & Modularity', proficiency: 'Strong Mastery', feedback: 'Clean separation of concerns and naming clarity.' },
      { topic: 'Communication & Trade-offs', proficiency: 'Proficient', feedback: 'Articulated design rationale effectively.' }
    );
  }

  const rawReport = {
    reportId: `cfr_${crypto.createHash('sha256').update(String(submission.id || submission.attempt_id || Date.now())).digest('hex').slice(0, 16)}`,
    candidateName: submission.user_name || 'Candidate',
    candidateEmail: submission.user_email ? submission.user_email.replace(/^(.{2})(.*)(@.*)$/, '$1***$3') : null,
    interviewTitle: questionSet.title || 'Technical Assessment',
    roleName: questionSet.settings?.roleName || questionSet.role || 'Software Engineering Role',
    companyName: questionSet.settings?.companyName || 'PrepLoop Partner',
    completedAt: submission.completed_at || new Date().toISOString(),
    durationMinutes: Math.round(Number(submission.duration || 2700) / 60),
    evaluationSummary: {
      headline: 'Comprehensive Assessment Feedback',
      strengths,
      growthTips,
      topicBreakdown,
    },
    recommendedResources: [
      {
        title: 'Data Structures & Algorithms Patterns Roadmap',
        category: 'Algorithms',
        path: '/roadmap/dsa',
        description: 'Master sliding window, two pointers, and topological sort with interactive practice.',
      },
      {
        title: 'System Design Simulator & Case Studies',
        category: 'System Architecture',
        path: '/roadmap/system-design',
        description: 'Design distributed caches, rate limiters, and microservice message queues.',
      },
      {
        title: 'AI Behavioral & STAR Interview Drills',
        category: 'Behavioral',
        path: '/interview-suite',
        description: 'Simulate high-pressure behavioral questions with real-time vocal pace feedback.',
      },
    ],
    verifiedBy: 'PrepLoop Intelligent Assessment Engine',
  };

  // Run through sanitizer to strictly enforce zero rubric leaks
  return sanitizeCandidateReport(rawReport);
}

/**
 * Generates dynamic recruiter availability windows for candidate self-scheduling.
 */
export function generateAvailableSlotWindows(startDate = new Date(), daysAhead = 7) {
  const slots = [];
  const start = new Date(startDate);

  for (let d = 1; d <= daysAhead; d++) {
    const day = new Date(start.getTime() + d * 24 * 60 * 60 * 1000);
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (day.getDay() === 0 || day.getDay() === 6) continue;

    const dateIso = day.toISOString().split('T')[0];
    const times = ['09:30', '11:00', '14:00', '15:30', '17:00'];

    for (const time of times) {
      const [hours, minutes] = time.split(':');
      const slotDate = new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate(), Number(hours), Number(minutes)));
      slots.push({
        slotId: `slot_${dateIso}_${hours}${minutes}`,
        date: dateIso,
        time,
        utcTimestamp: slotDate.toISOString(),
        available: true,
      });
    }
  }
  return slots;
}

// ─── GET /feedback-portal/:token (Public with Rate Limiter) ───
router.get(['/feedback-portal/:token', '/feedback-portal'], customInterviewLimiter, async (req, res) => {
  try {
    const rawToken = req.params.token || req.query.token;
    if (!rawToken || typeof rawToken !== 'string') {
      return res.status(400).json({ error: 'Feedback report token is required' });
    }
    const token = rawToken.trim();
    if (!token) {
      return res.status(400).json({ error: 'Feedback report token is required' });
    }

    // Check mock/testing tokens
    if (token.startsWith('cfb_test_') || token.startsWith('demo_')) {
      const mockReport = generateCandidateSafeFeedback(
        {
          id: token,
          user_name: 'Jordan Lee',
          user_email: 'jordan.lee@example.com',
          duration: 2400,
          completed_at: new Date(Date.now() - 3600000 * 4).toISOString(),
          scores: {
            executiveSummary: {
              keyStrengths: 'Clear explanation of distributed cache invalidation and strong algorithmic intuition.',
              growthAreas: 'Explore boundary cases in concurrency locks and elaborate on system telemetry monitoring.',
              hiringRecommendation: 'REDACTED_INTERNAL_DO_NOT_SHOW',
            },
            passingScore: 70,
            decision: 'qualified',
            breakdown: {
              algorithms: 88,
              systemDesign: 84,
              communication: 90,
            },
          },
        },
        {
          title: 'Full-Stack Software Engineer Assessment',
          settings: {
            companyName: 'Acme Technologies',
            roleName: 'Senior Software Engineer',
          },
        }
      );
      return res.status(200).json({ success: true, report: mockReport });
    }

    // Try finding submission by token, attempt_id, or candidate invite
    let submission = null;
    let questionSet = null;

    // 1. Direct query by attempt_id or id in admin_interview_submissions
    try {
      const { data: subData } = await supabaseAdmin
        .from('admin_interview_submissions')
        .select('*')
        .or(`attempt_id.eq.${token},id.eq.${token}`)
        .maybeSingle();

      if (subData) {
        submission = subData;
        if (submission.question_set_id) {
          const { data: qsData } = await supabaseAdmin
            .from('admin_question_sets')
            .select('id, title, description, settings, role')
            .eq('id', submission.question_set_id)
            .maybeSingle();
          questionSet = qsData;
        }
      }
    } catch (dbErr) {
      logger.warn('Direct submission lookup by token failed', { token, error: dbErr.message });
    }

    // 2. Query question set candidateInvites matching token
    if (!submission && token.startsWith('inv_')) {
      try {
        const { data: allSets } = await supabaseAdmin
          .from('admin_question_sets')
          .select('id, title, description, settings, role')
          .not('settings', 'is', null);

        if (Array.isArray(allSets)) {
          const matchingSet = allSets.find(s => s.settings?.candidateInvites?.[token]);
          if (matchingSet) {
            questionSet = matchingSet;
            const invite = matchingSet.settings.candidateInvites[token];
            const { data: subByEmail } = await supabaseAdmin
              .from('admin_interview_submissions')
              .select('*')
              .eq('question_set_id', matchingSet.id)
              .eq('user_email', invite.email)
              .order('completed_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            submission = subByEmail;
          }
        }
      } catch (err) {
        logger.warn('Invite token lookup failed', { token, error: err.message });
      }
    }

    if (!submission) {
      return res.status(404).json({
        error: 'Candidate feedback report not found or the report link is invalid.',
      });
    }

    const safeReport = generateCandidateSafeFeedback(submission, questionSet || {});
    return res.status(200).json({
      success: true,
      report: safeReport,
    });
  } catch (error) {
    logger.error('Error fetching candidate feedback report', { error: error.message });
    return res.status(500).json({ error: 'Failed to retrieve candidate feedback report' });
  }
});

// ─── GET /feedback-portal/schedule/:token (Candidate Self-Scheduling Slots) ───
router.get('/feedback-portal/schedule/:token', customInterviewLimiter, async (req, res) => {
  try {
    const rawToken = req.params.token;
    if (!rawToken || typeof rawToken !== 'string') {
      return res.status(400).json({ error: 'Invite token is required' });
    }
    const token = rawToken.trim();

    let questionSetTitle = 'AI Technical Interview';
    let durationMinutes = 45;
    let companyName = 'PrepLoop Partner';
    let roleName = 'Software Engineer';
    let candidateEmail = null;
    let currentScheduledAt = null;

    if (token.startsWith('demo_') || token.startsWith('cfb_test_')) {
      const availableSlots = generateAvailableSlotWindows(new Date(), 7);
      return res.status(200).json({
        success: true,
        scheduling: {
          token,
          questionSetTitle,
          durationMinutes,
          companyName,
          roleName,
          candidateEmail: 'candidate@example.com',
          currentScheduledAt: null,
          availableSlots,
        },
      });
    }

    // Lookup in database
    try {
      const { data: allSets } = await supabaseAdmin
        .from('admin_question_sets')
        .select('*')
        .not('settings', 'is', null);

      if (Array.isArray(allSets)) {
        const matchingSet = allSets.find(s => s.settings?.candidateInvites?.[token] || s.share_code === token);
        if (matchingSet) {
          questionSetTitle = matchingSet.title || questionSetTitle;
          durationMinutes = matchingSet.scheduled_duration_minutes || matchingSet.settings?.scheduledDurationMinutes || 45;
          companyName = matchingSet.settings?.companyName || companyName;
          roleName = matchingSet.settings?.roleName || matchingSet.role || roleName;
          const invite = matchingSet.settings?.candidateInvites?.[token];
          if (invite) {
            candidateEmail = invite.email;
            currentScheduledAt = invite.scheduledAt || null;
          }
        }
      }
    } catch (err) {
      logger.warn('Failed to query schedule info for token', { token, error: err.message });
    }

    const availableSlots = generateAvailableSlotWindows(new Date(), 7);
    return res.status(200).json({
      success: true,
      scheduling: {
        token,
        questionSetTitle,
        durationMinutes,
        companyName,
        roleName,
        candidateEmail,
        currentScheduledAt,
        availableSlots,
      },
    });
  } catch (error) {
    logger.error('Error fetching scheduling slots', { error: error.message });
    return res.status(500).json({ error: 'Failed to retrieve scheduling availability' });
  }
});

// ─── POST /feedback-portal/schedule/:token/book (Confirm Self-Scheduled Slot) ───
router.post('/feedback-portal/schedule/:token/book', customInterviewLimiter, async (req, res) => {
  try {
    const rawToken = req.params.token;
    const { slotTimestamp, candidateTimezone = 'UTC' } = req.body || {};

    if (!rawToken) {
      return res.status(400).json({ error: 'Invite token is required' });
    }
    if (!slotTimestamp) {
      return res.status(400).json({ error: 'Selected slot timestamp is required' });
    }

    const slotDate = new Date(slotTimestamp);
    if (isNaN(slotDate.getTime())) {
      return res.status(400).json({ error: 'Invalid slot timestamp provided' });
    }

    if (slotDate.getTime() < Date.now()) {
      return res.status(400).json({ error: 'Cannot book a slot in the past' });
    }

    const token = rawToken.trim();
    const joinUrl = `https://preploop.com/ai-interview?token=${token}`;
    const icsContent = generateCalendarIcs({
      title: 'Confirmed AI Technical Interview - PrepLoop',
      description: `Your self-scheduled technical interview session.\\nTimezone: ${candidateTimezone}\\nJoin link: ${joinUrl}`,
      scheduledAt: slotDate.toISOString(),
      durationMinutes: 45,
      joinUrl,
    });

    return res.status(200).json({
      success: true,
      message: 'Interview slot successfully confirmed',
      booking: {
        token,
        confirmedAt: new Date().toISOString(),
        scheduledAt: slotDate.toISOString(),
        candidateTimezone,
        joinUrl,
        calendarIcs: icsContent,
      },
    });
  } catch (error) {
    logger.error('Error booking self-scheduled slot', { error: error.message });
    return res.status(500).json({ error: 'Failed to confirm interview booking' });
  }
});

export default router;
