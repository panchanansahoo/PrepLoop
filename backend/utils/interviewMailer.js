import crypto from 'crypto';
import { sendEmail, isEmailConfigured, getFromAddress } from '../services/emailService.js';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { isSafeOutboundUrl } from './ssrfGuard.js';
import { createLogger } from './structuredLogger.js';

const logger = createLogger('interview-mailer');

/**
 * Generates an RFC 5545 formatted .ics calendar invitation string.
 */
export function generateCalendarIcs({
  title = 'AI Technical Interview Session',
  description = 'Private scheduled technical interview on PrepLoop',
  scheduledAt,
  durationMinutes = 45,
  joinUrl = 'https://preploop.com',
  organizerName = 'PrepLoop Interview Platform',
  organizerEmail = 'no-reply@preploop.me',
} = {}) {
  const startDate = scheduledAt ? new Date(scheduledAt) : new Date(Date.now() + 3600000);
  const durationMs = (Number(durationMinutes) || 45) * 60 * 1000;
  const endDate = new Date(startDate.getTime() + durationMs);

  const formatUtcDate = (date) =>
    date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const dtStart = formatUtcDate(startDate);
  const dtEnd = formatUtcDate(endDate);
  const dtStamp = formatUtcDate(new Date());
  const uid = `interview-${crypto.randomUUID()}@preploop.me`;

  const cleanTitle = String(title).replace(/[\r\n]+/g, ' ').slice(0, 100);
  const cleanDesc = String(description).replace(/[\r\n]+/g, '\\n').slice(0, 1000);

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PrepLoop Inc.//Interview Platform//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${cleanTitle}`,
    `DESCRIPTION:${cleanDesc}\\n\\nJoin URL: ${joinUrl}`,
    `URL:${joinUrl}`,
    `ORGANIZER;CN=${organizerName}:mailto:${organizerEmail}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'TRANSP:OPAQUE',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Interview Reminder: 15 minutes before start',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Builds a styled, responsive HTML email template for candidate invitations.
 */
export function buildCandidateInviteEmail({
  candidateEmail,
  candidateName = '',
  questionSetTitle = 'Private Interview Session',
  scheduledAt = null,
  durationMinutes = 45,
  joinUrl = 'https://preploop.com',
  passcode = null,
  companyName = '',
  roleName = '',
  customMessage = '',
} = {}) {
  const greeting = candidateName ? `Hi ${candidateName},` : 'Hello,';
  const roleDisplay = roleName ? `for the <strong>${roleName}</strong> role` : '';
  const companyDisplay = companyName ? `at <strong>${companyName}</strong>` : '';
  const contextSentence = roleDisplay || companyDisplay
    ? `You have been invited to complete a private scheduled interview ${roleDisplay} ${companyDisplay}.`.trim()
    : 'You have been invited to complete a private scheduled interview assessment.';

  const formattedDate = scheduledAt
    ? new Date(scheduledAt).toUTCString()
    : 'Flexible / Upon Link Access';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Invitation: ${questionSetTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b1120; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b1120; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #111827; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); padding: 32px 28px; text-align: left;">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: rgba(255, 255, 255, 0.85); font-weight: 700; margin-bottom: 6px;">
                PrepLoop AI Technical Interview
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; line-height: 1.3;">
                ${questionSetTitle}
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 28px 28px 20px;">
              <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px; color: #e2e8f0;">
                ${greeting}
              </p>
              <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px; color: #cbd5e1;">
                ${contextSentence}
              </p>

              ${customMessage ? `
              <div style="background-color: rgba(99, 102, 241, 0.1); border-left: 4px solid #6366f1; padding: 12px 16px; border-radius: 6px; margin-bottom: 24px; font-size: 14px; line-height: 1.5; color: #e0e7ff;">
                ${customMessage.replace(/\n/g, '<br/>')}
              </div>
              ` : ''}

              <!-- Session Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 12px; margin-bottom: 24px; border: 1px solid rgba(255, 255, 255, 0.06);">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #94a3b8; width: 140px;">📅 Scheduled Start:</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #f8fafc; font-weight: 600;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #94a3b8;">⏱️ Duration:</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #38bdf8; font-weight: 600;">${durationMinutes} Minutes</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #94a3b8;">📧 Verified Email:</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #34d399; font-weight: 600;">${candidateEmail}</td>
                      </tr>
                      ${passcode ? `
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #94a3b8;">🔑 Access Passcode:</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #fbbf24; font-family: monospace; font-weight: 700;">${passcode}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 28px 0;">
                <a href="${joinUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);">
                  Join Private Interview &rarr;
                </a>
              </div>

              <!-- Important Notes -->
              <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px dashed rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 14px 18px; margin-top: 20px; font-size: 12px; color: #94a3b8; line-height: 1.6;">
                <strong style="color: #cbd5e1;">Candidate Preparation Checklist:</strong>
                <ul style="margin: 6px 0 0; padding-left: 20px;">
                  <li>You can enter the waiting room up to 10 minutes prior to start time.</li>
                  <li>Ensure a functional microphone and webcam in a quiet environment.</li>
                  <li>Assessments include anti-cheating telemetry (tab switch monitoring). Please remain focused in the interview window.</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding: 18px 28px; text-align: center; font-size: 12px; color: #64748b;">
              &copy; ${new Date().getFullYear()} PrepLoop. All rights reserved.<br/>
              Direct Link: <a href="${joinUrl}" style="color: #38bdf8; text-decoration: none;">${joinUrl}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Interview Invitation: ${questionSetTitle}

${greeting}

${contextSentence}

${customMessage ? `Note from Recruiter:\n${customMessage}\n\n` : ''}
Session Details:
- Scheduled Start: ${formattedDate}
- Duration: ${durationMinutes} minutes
- Invitee Email: ${candidateEmail}
${passcode ? `- Access Passcode: ${passcode}\n` : ''}
Join your session directly at:
${joinUrl}

Checklist:
1. Early check-in opens 10 minutes before the scheduled time.
2. Please test your microphone and camera beforehand.
3. Assessments are monitored for window focus and integrity.

Best regards,
PrepLoop Interview Platform
  `.trim();

  return { html, text };
}

/**
 * Dispatches candidate invitations across an allowlist with personalized URLs and calendar invites.
 */
export async function dispatchCandidateInvitations({
  questionSet,
  candidateEmails = [],
  customMessage = '',
  baseUrl = 'https://preploop.com',
  organizerName = 'PrepLoop Interview Platform',
} = {}) {
  if (!questionSet || !questionSet.id) {
    throw new Error('Valid question set is required');
  }

  const rawList = Array.isArray(candidateEmails) && candidateEmails.length > 0
    ? candidateEmails
    : (Array.isArray(questionSet.allowed_emails) ? questionSet.allowed_emails : (questionSet.settings?.allowedEmails || []));

  const cleanEmails = [...new Set(rawList.map(e => String(e || '').trim().toLowerCase()).filter(Boolean))];
  if (cleanEmails.length === 0) {
    throw new Error('No candidate emails provided for invitation dispatch');
  }

  const scheduledAt = questionSet.scheduled_at || questionSet.settings?.scheduledAt || null;
  const durationMinutes = questionSet.scheduled_duration_minutes || questionSet.settings?.scheduledDurationMinutes || 45;
  const _shareCode = questionSet.share_code || questionSet.token || '';
  const emailConfigured = isEmailConfigured();

  const existingInvites = { ...(questionSet.settings?.candidateInvites || {}) };
  const updatedInvites = { ...existingInvites };

  const results = [];
  let sentCount = 0;
  let simulatedCount = 0;
  let failedCount = 0;

  for (const email of cleanEmails) {
    // Generate or retrieve unique single-use token for this candidate
    let inviteToken = Object.keys(existingInvites).find(
      t => existingInvites[t]?.email?.toLowerCase() === email.toLowerCase()
    );
    if (!inviteToken) {
      inviteToken = `inv_${crypto.randomBytes(12).toString('hex')}`;
    }
    updatedInvites[inviteToken] = {
      email,
      createdAt: existingInvites[inviteToken]?.createdAt || new Date().toISOString(),
      status: existingInvites[inviteToken]?.status || 'pending',
    };

    const candidateUrl = `${baseUrl.replace(/\/+$/, '')}/ai-interview?token=${inviteToken}`;
    const emailContent = buildCandidateInviteEmail({
      candidateEmail: email,
      questionSetTitle: questionSet.title || 'Technical Interview Session',
      scheduledAt,
      durationMinutes,
      joinUrl: candidateUrl,
      companyName: questionSet.settings?.companyName || '',
      roleName: questionSet.settings?.roleName || questionSet.role || '',
      customMessage,
    });

    const icsContent = generateCalendarIcs({
      title: `${questionSet.title || 'Technical Interview'} - PrepLoop`,
      description: `Private scheduled interview session on PrepLoop.\\nRole: ${questionSet.settings?.roleName || 'Software Engineer'}\\nJoin link: ${candidateUrl}`,
      scheduledAt,
      durationMinutes,
      joinUrl: candidateUrl,
      organizerName,
    });

    const calendarAttachments = scheduledAt && icsContent ? [
      {
        filename: 'interview-invitation.ics',
        content: icsContent,
        contentType: 'text/calendar; method=REQUEST; charset=UTF-8',
      },
    ] : [];

    if (emailConfigured) {
      try {
        const sendResult = await sendEmail({
          to: email,
          subject: `Interview Invitation: ${questionSet.title || 'PrepLoop Assessment'}`,
          html: emailContent.html,
          text: emailContent.text,
          from: getFromAddress(),
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
          },
          attachments: calendarAttachments,
        });
        sentCount += 1;
        results.push({
          email,
          status: 'sent',
          joinUrl: candidateUrl,
          messageId: sendResult.id || null,
          provider: sendResult.provider,
        });
      } catch (err) {
        logger.error('Failed to send candidate email', { email, error: err.message });
        failedCount += 1;
        results.push({
          email,
          status: 'failed',
          joinUrl: candidateUrl,
          error: err.message,
        });
      }
    } else {
      simulatedCount += 1;
      logger.info('Simulated candidate invitation dispatch (email provider not configured)', { email, candidateUrl });
      results.push({
        email,
        status: 'simulated',
        joinUrl: candidateUrl,
        icsPreview: Boolean(icsContent),
        note: 'Simulated dispatch (email service credentials not configured in environment)',
      });
    }
  }

  // Persist generated candidate invite tokens in questionSet settings
  try {
    await supabaseAdmin
      .from('admin_question_sets')
      .update({
        settings: {
          ...(questionSet.settings || {}),
          candidateInvites: updatedInvites,
        },
      })
      .eq('id', questionSet.id);
  } catch (dbErr) {
    logger.warn('Failed to persist candidateInvites in questionSet settings', { error: dbErr.message });
  }

  return {
    total: cleanEmails.length,
    sent: sentCount,
    simulated: simulatedCount,
    failed: failedCount,
    isSimulated: !emailConfigured,
    results,
    candidateInvites: updatedInvites,
  };
}

/**
 * Formats an interview submission event into a rich, Slack-compatible Block Kit message card
 * with a visual score pill, hiring decision tag, and deep-link review URL.
 *
 * @param {Object} data - Interview submission details
 * @returns {Object} Slack message card payload with text, blocks, and colored attachment
 */
export function formatSlackWebhookPayload(data = {}) {
  const candidateName = data.candidateName || data.userName || data.user_name || 'Anonymous Candidate';
  const candidateEmail = data.candidateEmail || data.userEmail || data.user_email || 'N/A';
  const questionSetTitle = data.questionSetTitle || data.title || 'Private Interview Assessment';
  const score = Math.round(Number(data.overallScore ?? data.overall_score ?? data.score ?? 0));
  const passScore = Number(data.passingScore ?? data.scores?.passingScore ?? 70);
  const integrity = data.integrity || data.scores?.integrity || {};
  const decision = data.decision || data.scores?.decision || (score >= passScore && !integrity.flagged ? 'qualified' : 'review_needed');
  const executiveSummary = data.executiveSummary || data.scores?.executiveSummary || null;
  const durationSeconds = Number(data.durationSeconds ?? data.duration ?? 0);
  const completedAt = data.completedAt || data.completed_at || null;

  const decisionLabel = decision === 'qualified'
    ? 'QUALIFIED'
    : decision === 'rejected'
      ? 'REJECTED'
      : 'REVIEW NEEDED';

  const decisionColor = decision === 'qualified'
    ? '#22c55e'
    : decision === 'rejected'
      ? '#ef4444'
      : '#f59e0b';

  const decisionEmoji = decision === 'qualified'
    ? '🟢'
    : decision === 'rejected'
      ? '🔴'
      : '🟡';

  const scoreEmoji = score >= 80 ? '🌟' : score >= 60 ? '⚡' : '⚠️';
  const durationMinutes = Math.round(durationSeconds / 60);

  const fallbackReviewUrl = data.reviewUrl ||
    (data.submissionId
      ? `https://preploop.com/admin/submissions?submissionId=${data.submissionId}`
      : data.attemptId
        ? `https://preploop.com/admin/question-sets?attemptId=${data.attemptId}`
        : 'https://preploop.com/admin/question-sets');

  // Extract executive summary bullets
  let summaryBullets = [];
  if (Array.isArray(executiveSummary?.bullets) && executiveSummary.bullets.length > 0) {
    summaryBullets = executiveSummary.bullets;
  } else if (executiveSummary && typeof executiveSummary === 'object') {
    if (executiveSummary.keyStrengths) summaryBullets.push(`Key Strengths: ${executiveSummary.keyStrengths}`);
    if (executiveSummary.growthAreas) summaryBullets.push(`Growth Areas: ${executiveSummary.growthAreas}`);
    if (executiveSummary.hiringRecommendation) summaryBullets.push(`Hiring Recommendation: ${executiveSummary.hiringRecommendation}`);
  }

  const integrityText = integrity.flagged
    ? `⚠️ *Flagged* (${integrity.tabSwitchCount || 0} tab switches, ${integrity.pasteCount || 0} pastes)`
    : (integrity.tabSwitchCount || 0) === 0 && (integrity.pasteCount || 0) === 0
      ? '🛡️ *Clean Focus* (0 tab switches)'
      : `ℹ️ *Moderate* (${integrity.tabSwitchCount || 0} tab switches)`;

  const fallbackText = `[${decisionEmoji} ${decisionLabel}] ${candidateName} scored ${score}% on "${questionSetTitle}" (Passing: ${passScore}%)`;

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `🎯 Interview Completed: ${candidateName}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Assessment:*\n${questionSetTitle}`,
        },
        {
          type: 'mrkdwn',
          text: `*Candidate:*\n${candidateName} (<mailto:${candidateEmail}|${candidateEmail}>)`,
        },
        {
          type: 'mrkdwn',
          text: `*Performance Score:*\n${scoreEmoji} \`${score} / 100\` (Target: ${passScore}%)`,
        },
        {
          type: 'mrkdwn',
          text: `*Hiring Status:*\n${decisionEmoji} *${decisionLabel}*`,
        },
        {
          type: 'mrkdwn',
          text: `*Session Integrity:*\n${integrityText}`,
        },
        {
          type: 'mrkdwn',
          text: `*Duration:*\n⏱️ ${durationMinutes > 0 ? `${durationMinutes} mins` : 'Completed'}`,
        },
      ],
    },
  ];

  if (summaryBullets.length > 0) {
    const bulletsFormatted = summaryBullets
      .map((b) => {
        const idx = b.indexOf(':');
        return idx > -1
          ? `• *${b.slice(0, idx)}:* ${b.slice(idx + 1).trim()}`
          : `• ${b}`;
      })
      .join('\n');

    blocks.push(
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*📋 Executive Summary:*\n${bulletsFormatted}`,
        },
      }
    );
  }

  blocks.push(
    {
      type: 'divider',
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '📄 View Full Candidate Dossier',
            emoji: true,
          },
          url: fallbackReviewUrl,
          style: decision === 'qualified' ? 'primary' : 'default',
        },
      ],
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `PrepLoop Assessment Intelligence · Completed ${completedAt ? new Date(completedAt).toUTCString() : new Date().toUTCString()}`,
        },
      ],
    }
  );

  return {
    text: fallbackText,
    blocks,
    attachments: [
      {
        color: decisionColor,
        blocks: [],
      },
    ],
  };
}

/**
 * Dispatches an event payload to a configured recruiter webhook URL with SSRF defense and HMAC signature.
 */
export async function dispatchInterviewWebhook(webhookUrl, webhookSecret = '', payload = {}) {
  if (!webhookUrl || typeof webhookUrl !== 'string') {
    return { success: false, error: 'Webhook URL is required' };
  }

  if (!isSafeOutboundUrl(webhookUrl)) {
    logger.warn('SSRF defense blocked dispatch to unsafe webhook URL', { webhookUrl });
    return { success: false, error: 'Target webhook URL blocked by SSRF defense policy' };
  }

  const isSlack = webhookUrl.includes('slack.com') || webhookUrl.includes('hooks.slack');
  const slackPayload = formatSlackWebhookPayload(payload);

  const requestBody = isSlack
    ? slackPayload
    : {
        id: `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        event: payload.event || 'interview.submission.completed',
        createdAt: new Date().toISOString(),
        data: payload,
        slackCard: slackPayload,
      };

  const rawBody = JSON.stringify(requestBody);

  const headers = {
    'Content-Type': 'application/json',
    'X-PrepLoop-Event': payload.event || 'interview.submission.completed',
    'User-Agent': 'PrepLoop-Webhook/1.0',
  };

  if (webhookSecret && typeof webhookSecret === 'string') {
    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');
    headers['X-PrepLoop-Signature'] = `sha256=${signature}`;
  }

  const startTime = Date.now();
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: rawBody,
      signal: AbortSignal.timeout(5000),
    });

    const latencyMs = Date.now() - startTime;
    return {
      success: response.ok,
      status: response.status,
      latencyMs,
    };
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    logger.warn('Webhook delivery failed', { webhookUrl, error: err.message, latencyMs });
    return {
      success: false,
      error: err.message,
      latencyMs,
    };
  }
}

/**
 * Builds a styled HTML and text reminder email for 24h and 1h countdown pings.
 *
 * @param {Object} options
 * @param {string} options.candidateEmail - Invitee email address
 * @param {string} [options.candidateName] - Candidate display name
 * @param {string} [options.questionSetTitle] - Title of the interview or role
 * @param {string|Date} options.scheduledAt - ISO timestamp or Date of scheduled interview
 * @param {number} [options.durationMinutes=45] - Duration of the session in minutes
 * @param {string} [options.joinUrl] - Direct join URL with token
 * @param {'24h'|'1h'} [options.countdown='24h'] - Urgency countdown window: '24h' or '1h'
 * @param {string} [options.companyName] - Sponsoring company name
 * @param {string} [options.roleName] - Target role name
 * @param {string} [options.customMessage] - Optional custom message from recruiter
 * @returns {{ html: string, text: string, subject: string, countdown: string }}
 */
export function buildCandidateReminderEmail({
  candidateEmail,
  candidateName = '',
  questionSetTitle = 'AI Technical Interview Session',
  scheduledAt,
  durationMinutes = 45,
  joinUrl = 'https://preploop.com',
  countdown = '24h',
  companyName = '',
  roleName = '',
  customMessage = '',
} = {}) {
  const isOneHour = String(countdown).toLowerCase() === '1h' || String(countdown).includes('1');
  const normalizedCountdown = isOneHour ? '1h' : '24h';

  const greeting = candidateName ? `Hi ${candidateName},` : 'Hello,';
  const roleDisplay = roleName || questionSetTitle;
  const companyDisplay = companyName ? ` at ${companyName}` : '';

  const subject = isOneHour
    ? `🚨 Starting in 1 Hour: Your Interview for ${roleDisplay}${companyDisplay}`
    : `⏳ Reminder: Your Interview for ${roleDisplay}${companyDisplay} is in 24 Hours`;

  const badgeText = isOneHour ? '1 HOUR COUNTDOWN' : '24 HOURS REMINDER';
  const badgeBg = isOneHour ? '#ef4444' : '#6366f1';
  const headerSubtitle = isOneHour
    ? 'Your interview waiting lobby is now opening. Join 10 minutes early for device checks.'
    : 'Your private interview assessment is scheduled for tomorrow. Here is your quick checklist.';

  const formattedDate = scheduledAt
    ? new Date(scheduledAt).toUTCString()
    : 'Flexible / As Scheduled';

  const ctaButtonText = isOneHour
    ? 'Enter Pre-Flight Waiting Room →'
    : 'Review Pre-Flight Checklist & Details →';

  const checklistItems = isOneHour
    ? [
        'Waiting room and pre-flight audio check is now unlocked (up to 10 minutes prior).',
        'Have your webcam, microphone, and quiet workspace ready.',
        'Assessments monitor tab switches and browser focus — keep only your interview tab open.',
        'Use Google Chrome, Firefox, or Safari for optimal WebRTC audio clarity.',
      ]
    : [
        'Test your camera, microphone, and internet connection before tomorrow.',
        'Find a quiet, well-lit space free from background noise.',
        'Review core competencies and relevant technical topics.',
        'You can check in up to 10 minutes prior to your scheduled time.',
      ];

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b1120; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b1120; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #111827; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          <!-- Header Banner -->
          <tr>
            <td style="background: ${isOneHour ? 'linear-gradient(135deg, #dc2626 0%, #ea580c 100%)' : 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)'}; padding: 32px 28px; text-align: left;">
              <div style="display: inline-block; background-color: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.2); padding: 4px 10px; border-radius: 9999px; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #ffffff; font-weight: 800; margin-bottom: 10px;">
                ${badgeText}
              </div>
              <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 800; color: #ffffff; line-height: 1.3;">
                ${roleDisplay}
              </h1>
              <p style="margin: 0; font-size: 14px; color: rgba(255, 255, 255, 0.9); line-height: 1.5;">
                ${headerSubtitle}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 28px 28px 20px;">
              <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px; color: #e2e8f0;">
                ${greeting}
              </p>
              <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px; color: #cbd5e1;">
                ${isOneHour
                  ? `Your scheduled interview ${companyDisplay ? `with <strong>${companyName}</strong>` : ''} starts in approximately <strong>1 hour</strong>. Please ensure you are settled and ready to begin.`
                  : `This is a friendly reminder that your upcoming interview ${companyDisplay ? `with <strong>${companyName}</strong>` : ''} is taking place tomorrow.`}
              </p>

              ${customMessage ? `
              <div style="background-color: rgba(99, 102, 241, 0.1); border-left: 4px solid #6366f1; padding: 12px 16px; border-radius: 6px; margin-bottom: 24px; font-size: 14px; line-height: 1.5; color: #e0e7ff;">
                <strong>Note from recruiter:</strong><br/>
                ${customMessage.replace(/\n/g, '<br/>')}
              </div>
              ` : ''}

              <!-- Session Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 12px; margin-bottom: 24px; border: 1px solid rgba(255, 255, 255, 0.06);">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #94a3b8; width: 140px;">📅 Scheduled Time:</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #f8fafc; font-weight: 600;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #94a3b8;">⏱️ Duration:</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #38bdf8; font-weight: 600;">${durationMinutes} Minutes</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #94a3b8;">📧 Candidate:</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #34d399; font-weight: 600;">${candidateEmail}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #94a3b8;">🎯 Countdown:</td>
                        <td style="padding: 6px 0; font-size: 14px; color: ${isOneHour ? '#f87171' : '#a5b4fc'}; font-weight: 700;">
                          ${isOneHour ? 'T-Minus 60 Minutes' : 'T-Minus 24 Hours'}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Action CTA -->
              <div style="text-align: center; margin: 28px 0;">
                <a href="${joinUrl}" target="_blank" style="display: inline-block; background: ${isOneHour ? 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)' : 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)'}; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 14px ${isOneHour ? 'rgba(239, 68, 68, 0.4)' : 'rgba(79, 70, 229, 0.4)'};">
                  ${ctaButtonText}
                </a>
              </div>

              <!-- Checklist -->
              <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px dashed rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 14px 18px; margin-top: 20px; font-size: 13px; color: #94a3b8; line-height: 1.6;">
                <strong style="color: #cbd5e1;">${isOneHour ? 'Immediate Pre-Flight Checklist:' : 'Preparation Checklist:'}</strong>
                <ul style="margin: 6px 0 0; padding-left: 20px;">
                  ${checklistItems.map(item => `<li style="margin-bottom: 4px;">${item}</li>`).join('')}
                </ul>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding: 18px 28px; text-align: center; font-size: 12px; color: #64748b;">
              &copy; ${new Date().getFullYear()} PrepLoop. All rights reserved.<br/>
              Direct Join URL: <a href="${joinUrl}" style="color: #38bdf8; text-decoration: none;">${joinUrl}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
${subject}

${greeting}

${isOneHour
  ? `Your scheduled interview${companyDisplay} starts in approximately 1 hour.`
  : `This is a reminder that your interview${companyDisplay} is tomorrow.`}

${customMessage ? `Note from Recruiter:\n${customMessage}\n\n` : ''}
Session Details:
- Scheduled Start: ${formattedDate}
- Duration: ${durationMinutes} minutes
- Invitee Email: ${candidateEmail}
- Countdown: ${normalizedCountdown}

Checklist:
${checklistItems.map((item, idx) => `${idx + 1}. ${item}`).join('\n')}

Join your session directly at:
${joinUrl}

Best regards,
PrepLoop Interview Platform
  `.trim();

  return {
    html,
    text,
    subject,
    countdown: normalizedCountdown,
  };
}

/**
 * Formats a concise multi-channel SMS or WhatsApp reminder payload for candidates.
 *
 * @param {Object} options
 * @returns {{ text: string, length: number, countdown: string }}
 */
export function formatCandidateSmsReminder({
  candidateName = '',
  questionSetTitle = 'AI Technical Interview',
  scheduledAt,
  countdown = '24h',
  joinUrl = 'https://preploop.com',
} = {}) {
  const isOneHour = String(countdown).toLowerCase() === '1h' || String(countdown).includes('1');
  const greeting = candidateName ? `Hi ${candidateName}, ` : '';
  const timeStr = scheduledAt ? ` at ${new Date(scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '';

  const text = isOneHour
    ? `PrepLoop Alert: ${greeting}your interview for "${questionSetTitle}" starts in 1 hour${timeStr}! Pre-flight lobby is now open: ${joinUrl}`
    : `PrepLoop Reminder: ${greeting}your interview for "${questionSetTitle}" is tomorrow${timeStr}. Pre-flight checklist & join link: ${joinUrl}`;

  return {
    text,
    length: text.length,
    countdown: isOneHour ? '1h' : '24h',
  };
}

/**
 * Formats a Slack/webhook notification alerting recruiters when a 24h or 1h candidate ping is dispatched.
 *
 * @param {Object} options
 * @returns {Object} Slack message card payload
 */
export function formatSlackReminderPayload({
  candidateName = 'Candidate',
  candidateEmail = 'N/A',
  questionSetTitle = 'Interview Assessment',
  scheduledAt,
  countdown = '24h',
  joinUrl = 'https://preploop.com',
  durationMinutes = 45,
} = {}) {
  const isOneHour = String(countdown).toLowerCase() === '1h' || String(countdown).includes('1');
  const countdownPill = isOneHour ? '🚨 1 Hour Countdown' : '⏳ 24 Hours Countdown';
  const color = isOneHour ? '#ef4444' : '#6366f1';
  const formattedDate = scheduledAt ? new Date(scheduledAt).toUTCString() : 'Upcoming';

  const fallbackText = `[Reminder Sent - ${countdownPill}] ${candidateName} was pinged for "${questionSetTitle}" (Scheduled: ${formattedDate})`;

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `⏰ Interview Ping Dispatched: ${countdownPill}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Assessment:*\n${questionSetTitle}`,
        },
        {
          type: 'mrkdwn',
          text: `*Candidate:*\n${candidateName} (<mailto:${candidateEmail}|${candidateEmail}>)`,
        },
        {
          type: 'mrkdwn',
          text: `*Scheduled Start:*\n📅 ${formattedDate}`,
        },
        {
          type: 'mrkdwn',
          text: `*Session Window:*\n⏱️ ${durationMinutes} minutes`,
        },
      ],
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '🔗 Direct Candidate Lobby Link',
            emoji: true,
          },
          url: joinUrl,
        },
      ],
    },
  ];

  return {
    text: fallbackText,
    blocks,
    attachments: [
      {
        color,
        blocks: [],
      },
    ],
  };
}

/**
 * Dispatches a multi-channel countdown reminder (24h or 1h) to a candidate.
 *
 * @param {Object} options
 * @returns {Promise<Object>} Delivery summary
 */
export async function dispatchCandidateReminder({
  questionSet,
  candidateEmail,
  candidateName = '',
  countdown = '24h',
  baseUrl = 'https://preploop.com',
  customMessage = '',
} = {}) {
  if (!questionSet || !candidateEmail) {
    throw new Error('Valid questionSet and candidateEmail are required for reminder dispatch');
  }

  const cleanEmail = String(candidateEmail).trim().toLowerCase();
  const scheduledAt = questionSet.scheduled_at || questionSet.settings?.scheduledAt || null;
  const durationMinutes = questionSet.scheduled_duration_minutes || questionSet.settings?.scheduledDurationMinutes || 45;

  const existingInvites = questionSet.settings?.candidateInvites || {};
  let inviteToken = Object.keys(existingInvites).find(
    t => existingInvites[t]?.email?.toLowerCase() === cleanEmail
  );
  if (!inviteToken) {
    inviteToken = `inv_${crypto.randomBytes(12).toString('hex')}`;
  }

  const joinUrl = `${baseUrl.replace(/\/+$/, '')}/ai-interview?token=${inviteToken}`;

  const emailContent = buildCandidateReminderEmail({
    candidateEmail: cleanEmail,
    candidateName,
    questionSetTitle: questionSet.title || 'Technical Interview Session',
    scheduledAt,
    durationMinutes,
    joinUrl,
    countdown,
    companyName: questionSet.settings?.companyName || '',
    roleName: questionSet.settings?.roleName || questionSet.role || '',
    customMessage,
  });

  const smsContent = formatCandidateSmsReminder({
    candidateName,
    questionSetTitle: questionSet.title || 'Technical Interview',
    scheduledAt,
    countdown,
    joinUrl,
  });

  const slackReminderPayload = formatSlackReminderPayload({
    candidateName,
    candidateEmail: cleanEmail,
    questionSetTitle: questionSet.title || 'Technical Interview',
    scheduledAt,
    countdown,
    joinUrl,
    durationMinutes,
  });

  const emailConfigured = isEmailConfigured();
  let result = {
    email: cleanEmail,
    countdown,
    joinUrl,
    subject: emailContent.subject,
    smsText: smsContent.text,
    status: 'simulated',
    messageId: null,
  };

  if (emailConfigured) {
    try {
      const sendResult = await sendEmail({
        to: cleanEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        from: getFromAddress(),
      });
      result.status = 'sent';
      result.messageId = sendResult.id || null;
      result.provider = sendResult.provider;
    } catch (err) {
      logger.error('Failed to send candidate reminder email', { email: cleanEmail, error: err.message });
      result.status = 'failed';
      result.error = err.message;
    }
  } else {
    logger.info('Simulated candidate reminder dispatch (email provider not configured)', { email: cleanEmail, countdown });
  }

  // If questionSet has recruiter webhook configured, trigger Slack ping
  const webhookUrl = questionSet.settings?.webhookUrl;
  if (webhookUrl) {
    try {
      await dispatchInterviewWebhook(webhookUrl, questionSet.settings?.webhookSecret, {
        event: `interview.reminder.${countdown}`,
        candidateEmail: cleanEmail,
        candidateName,
        questionSetTitle: questionSet.title,
        scheduledAt,
        countdown,
        joinUrl,
      });
    } catch (webhookErr) {
      logger.warn('Failed to dispatch recruiter webhook for reminder', { error: webhookErr.message });
    }
  }

  return result;
}


