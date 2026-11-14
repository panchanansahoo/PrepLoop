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
  const shareCode = questionSet.share_code || questionSet.token || '';
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

  const rawBody = JSON.stringify({
    id: `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    event: payload.event || 'interview.submission.completed',
    createdAt: new Date().toISOString(),
    data: payload,
  });

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

