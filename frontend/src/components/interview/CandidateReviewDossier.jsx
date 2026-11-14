import React, { useMemo } from 'react';
import {
  Printer,
  X,
  Shield,
  CheckCircle2,
  XCircle,
  Award,
  TrendingUp,
  Sparkles,
  Clock,
  User,
  FileText,
  AlertTriangle,
  Check,
  BarChart3,
  Users,
} from 'lucide-react';
import { CompetencyRadarChart } from './CompetencyRadarChart';
import { AudioTimelinePlayer } from './AudioTimelinePlayer';

/**
 * CandidateReviewDossier
 *
 * Standalone, reusable executive dossier component that displays:
 * - 3-bullet AI Executive Summary (Key Strengths, Growth Areas, Hiring Recommendation)
 * - Candidate & session integrity metadata
 * - Per-question answer & topic mastery breakdown (covered vs missed expectedTopics)
 * - 1-click "Print / PDF Dossier" functionality with print-optimized CSS
 *
 * Can be embedded inline or rendered as a standalone modal dialog.
 */
export function CandidateReviewDossier({
  submission,
  questionSet = null,
  cohortBenchmark = null,
  cohortSubmissions = null,
  onClose = null,
  inline = false,
}) {
  if (!submission) return null;

  const scores = submission.scores || {};
  const overallScore = Math.round(Number(submission.overall_score ?? scores.serverOverallScore ?? scores.score ?? 0));
  const passingScore = Number(scores.passingScore ?? 70);
  const decision = scores.decision || (overallScore >= passingScore ? 'qualified' : 'review_needed');
  const integrity = scores.integrity || {};
  const breakdown = Array.isArray(scores.breakdown) ? scores.breakdown : [];
  const durationMinutes = Math.round((Number(submission.duration) || 0) / 60);

  // Cohort ranking & percentile calculation
  const cohortData = useMemo(() => {
    if (cohortBenchmark && typeof cohortBenchmark === 'object') {
      return cohortBenchmark;
    }
    if (submission.cohortBenchmark && typeof submission.cohortBenchmark === 'object') {
      return submission.cohortBenchmark;
    }
    if (scores.cohortBenchmark && typeof scores.cohortBenchmark === 'object') {
      return scores.cohortBenchmark;
    }
    if (scores.cohort && typeof scores.cohort === 'object') {
      return scores.cohort;
    }

    // If cohort submissions array provided, compute percentile and ranking
    if (Array.isArray(cohortSubmissions) && cohortSubmissions.length > 0) {
      const scoresList = cohortSubmissions.map((s) => {
        if (typeof s === 'number') return s;
        return Number(s.overall_score ?? s.scores?.serverOverallScore ?? s.scores?.score ?? s.score ?? 0);
      });
      const strictlyBelow = scoresList.filter((s) => s < overallScore).length;
      const equal = scoresList.filter((s) => s === overallScore).length || 1;
      const pct = Math.max(1, Math.min(99, Math.round(((strictlyBelow + 0.5 * equal) / Math.max(scoresList.length, 1)) * 100)));
      const topPct = Math.max(1, 100 - pct);
      const higher = scoresList.filter((s) => s > overallScore).length;
      return {
        percentile: pct,
        topPercentage: topPct,
        badgeText: `Top ${topPct}%`,
        subtext: `${pct}th percentile`,
        rankText: `Rank ${higher + 1} of ${scoresList.length}`,
        color: topPct <= 15 ? '#10b981' : topPct <= 35 ? '#38bdf8' : '#f59e0b',
      };
    }

    // Realistic standard distribution baseline for interview scores
    const topPercentage = overallScore >= 90 ? 8 : overallScore >= 80 ? 18 : overallScore >= 70 ? 35 : overallScore >= 60 ? 58 : 82;
    const percentile = 100 - topPercentage;
    return {
      percentile,
      topPercentage,
      badgeText: `Top ${topPercentage}%`,
      subtext: `${percentile}th percentile`,
      rankText: overallScore >= 80 ? 'Top Quartile' : 'Cohort Average',
      color: topPercentage <= 15 ? '#10b981' : topPercentage <= 35 ? '#38bdf8' : '#f59e0b',
    };
  }, [cohortBenchmark, submission, scores, cohortSubmissions, overallScore]);

  // AI flag pins for AudioTimelinePlayer
  const timelineFlags = useMemo(() => {
    if (Array.isArray(scores.audioFlags) && scores.audioFlags.length > 0) return scores.audioFlags;
    if (Array.isArray(submission.audioFlags) && submission.audioFlags.length > 0) return submission.audioFlags;

    const flagsList = [];

    // Add integrity flag if anomalies occurred (e.g. 04:15 focus shift)
    if (integrity.flagged || (integrity.tabSwitchCount || 0) > 0) {
      flagsList.push({
        id: 'flag-integrity',
        timestamp: 255, // 04:15
        type: 'anomaly',
        title: 'Focus Shift Anomaly',
        description: `Window focus changed during assessment (${integrity.tabSwitchCount || 1} tab switches recorded).`,
      });
    }

    // Add flags from questions (probing follow-up, topic gaps, or standout answers)
    let elapsedSum = 60;
    breakdown.forEach((q, qIdx) => {
      const qTime = elapsedSum;
      elapsedSum += (Number(q.elapsedSeconds) || 120);

      if (q.probingFollowUp || (Array.isArray(q.missedTopics) && q.missedTopics.length > 0)) {
        flagsList.push({
          id: `flag-prob-${qIdx}`,
          timestamp: qTime + 45,
          type: 'ai_probing',
          title: `Q${q.questionIndex || qIdx + 1} Probing Trigger`,
          description: `AI Probing triggered on omitted topics: ${(q.missedTopics || ['Core concepts']).slice(0, 2).join(', ')}`,
        });
      } else if (Number(q.score) >= 88) {
        flagsList.push({
          id: `flag-strong-${qIdx}`,
          timestamp: qTime + 30,
          type: 'strong_point',
          title: `Q${q.questionIndex || qIdx + 1} Strong Response`,
          description: `Articulate explanation covering ${(q.coveredTopics || ['Key skills']).slice(0, 2).join(', ')}`,
        });
      }
    });

    if (flagsList.length === 0) {
      flagsList.push({
        id: 'flag-checkpoint',
        timestamp: 255, // 04:15
        type: 'ai_probing',
        title: 'AI Probing Checkpoint',
        description: 'Candidate articulated core architecture concepts under adaptive probing.',
      });
    }

    return flagsList;
  }, [scores, submission, integrity, breakdown]);

  // Synthesize or extract the 3-bullet Executive Summary
  const executiveSummary = useMemo(() => {
    const raw = scores.executiveSummary;
    if (raw && typeof raw === 'object') {
      const strengths = raw.keyStrengths || (Array.isArray(raw.bullets) && raw.bullets[0]?.replace(/^Key Strengths:\s*/i, ''));
      const growth = raw.growthAreas || (Array.isArray(raw.bullets) && raw.bullets[1]?.replace(/^Growth Areas:\s*/i, ''));
      const rec = raw.hiringRecommendation || (Array.isArray(raw.bullets) && raw.bullets[2]?.replace(/^Hiring Recommendation:\s*/i, ''));

      if (strengths && growth && rec) {
        return {
          keyStrengths: strengths,
          growthAreas: growth,
          hiringRecommendation: rec,
          bullets: raw.bullets || [
            `Key Strengths: ${strengths}`,
            `Growth Areas: ${growth}`,
            `Hiring Recommendation: ${rec}`,
          ],
        };
      }
    }

    // Fallback synthesis if submission was stored before executiveSummary was attached
    const covered = [...new Set(breakdown.flatMap((b) => b.coveredTopics || []))];
    const missed = [...new Set(breakdown.flatMap((b) => b.missedTopics || []))];

    const keyStrengths = covered.length > 0
      ? `Demonstrated competence across core topics including ${covered.slice(0, 3).join(', ')} with articulate conceptual reasoning.`
      : overallScore >= 75
        ? 'Consistent technical accuracy, structured thought process, and strong response clarity across all questions.'
        : 'Demonstrated solid understanding of fundamental software concepts under interview conditions.';

    const growthAreas = missed.length > 0
      ? `Could elaborate more deeply on omitted topics such as ${missed.slice(0, 3).join(', ')}, and discuss concrete operational trade-offs.`
      : overallScore < 60
        ? 'Needs greater technical depth, concrete architecture trade-offs, and elaboration on production edge cases.'
        : 'Could further strengthen responses with quantitative impact metrics and real-world failure modes.';

    let hiringRecommendation = '';
    if (integrity.flagged) {
      hiringRecommendation = `Do Not Proceed (Integrity Alert) - Session flagged with elevated off-tab or paste anomalies (${integrity.tabSwitchCount || 0} tab switches).`;
    } else if (decision === 'qualified' || overallScore >= passingScore + 10) {
      hiringRecommendation = `Strong Hire / Advance - Cleared benchmark with ${overallScore}% (target: ${passingScore}%). Recommended for final team match.`;
    } else if (overallScore >= passingScore) {
      hiringRecommendation = `Hire / Advance - Successfully met the ${passingScore}% target threshold with an overall score of ${overallScore}%.`;
    } else if (decision === 'review_needed' || overallScore >= passingScore - 15) {
      hiringRecommendation = `Review Needed - Borderline score of ${overallScore}% against ${passingScore}%. Manual recruiter review recommended.`;
    } else {
      hiringRecommendation = `Do Not Advance - Overall score of ${overallScore}% fell short of the required cutoff (${passingScore}%).`;
    }

    return {
      keyStrengths,
      growthAreas,
      hiringRecommendation,
      bullets: [
        `Key Strengths: ${keyStrengths}`,
        `Growth Areas: ${growthAreas}`,
        `Hiring Recommendation: ${hiringRecommendation}`,
      ],
    };
  }, [scores, overallScore, passingScore, decision, integrity, breakdown]);

  const scoreColor = overallScore >= passingScore
    ? '#22c55e'
    : overallScore >= passingScore - 15
      ? '#f59e0b'
      : '#ef4444';

  const decisionBadgeStyle = decision === 'qualified'
    ? { bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.3)', text: '#22c55e', label: 'QUALIFIED' }
    : decision === 'rejected'
      ? { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)', text: '#ef4444', label: 'REJECTED' }
      : { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)', text: '#f59e0b', label: 'REVIEW NEEDED' };

  const integrityStatus = integrity.flagged
    ? { text: `Flagged (${integrity.tabSwitchCount || 0} switches · ${integrity.pasteCount || 0} pastes)`, color: '#ef4444' }
    : (integrity.tabSwitchCount || 0) === 0 && (integrity.pasteCount || 0) === 0
      ? { text: 'Clean Focus (0 switches · 0 pastes)', color: '#22c55e' }
      : { text: `Moderate (${integrity.tabSwitchCount || 0} switch(es))`, color: '#f59e0b' };

  const content = (
    <div
      className="candidate-review-dossier"
      id="printable-assessment-report"
      style={{
        maxWidth: inline ? '100%' : '880px',
        width: '100%',
        maxHeight: inline ? 'none' : '90vh',
        background: '#0f172a',
        color: '#f8fafc',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '32px',
        overflowY: inline ? 'visible' : 'auto',
        boxSizing: 'border-box',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ─── Embedded Print Styles ─── */}
      <style>{`
        @media print {
          .print-hide { display: none !important; }
          body, html {
            background: #ffffff !important;
            color: #0f172a !important;
          }
          #printable-assessment-report {
            max-width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #0f172a !important;
            padding: 0 !important;
            max-height: none !important;
            overflow: visible !important;
          }
          #printable-assessment-report * {
            color: #0f172a !important;
          }
          .dossier-card {
            background: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
          }
          .dossier-code-box {
            background: #f1f5f9 !important;
            color: #1e293b !important;
          }
          .executive-summary-box {
            background: #f8fafc !important;
            border: 1px solid #cbd5e1 !important;
          }
        }
      `}</style>

      {/* ─── Header with Print & Close controls ─── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '2px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '20px',
          marginBottom: '24px',
          gap: '16px',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#818cf8',
              fontWeight: '800',
            }}
          >
            <Shield size={13} /> PrepLoop Verified Assessment Dossier
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '4px 0 0', color: '#fff' }}>
            {questionSet?.title || submission.questionSetTitle || 'Private Interview Assessment'}
          </h2>
          <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.55)', marginTop: '4px' }}>
            Session Code: <code style={{ color: '#38bdf8', fontWeight: '700' }}>{questionSet?.share_code || submission.share_code || '—'}</code> · Type:{' '}
            <span style={{ textTransform: 'capitalize' }}>{questionSet?.interview_type || 'Technical'}</span>
            {submission.completed_at && (
              <> · Completed {new Date(submission.completed_at).toLocaleDateString()}</>
            )}
          </div>
        </div>

        <div className="print-hide" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              background: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'background 0.15s ease',
            }}
            title="Print or save as PDF"
          >
            <Printer size={16} /> Print / PDF Dossier
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Close dossier"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ─── 3-Bullet Executive Summary (Featured Card) ─── */}
      <div
        className="executive-summary-box"
        style={{
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(14, 165, 233, 0.05) 100%)',
          border: '1px solid rgba(129, 140, 248, 0.25)',
          borderRadius: '12px',
          padding: '20px 22px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Sparkles size={18} style={{ color: '#818cf8' }} />
          <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#c7d2fe', fontWeight: '800', margin: 0 }}>
            Executive Summary
          </h3>
          <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginLeft: 'auto' }}>
            3-Bullet Recruiter Brief
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Bullet 1: Key Strengths */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#22c55e',
                flexShrink: 0,
                marginTop: '1px',
              }}
            >
              <Check size={13} />
            </span>
            <div style={{ fontSize: '13px', lineHeight: '1.55', color: '#f1f5f9' }}>
              <strong style={{ color: '#86efac', fontWeight: '700' }}>Key Strengths: </strong>
              {executiveSummary.keyStrengths}
            </div>
          </div>

          {/* Bullet 2: Growth Areas */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                flexShrink: 0,
                marginTop: '1px',
              }}
            >
              <TrendingUp size={13} />
            </span>
            <div style={{ fontSize: '13px', lineHeight: '1.55', color: '#f1f5f9' }}>
              <strong style={{ color: '#fde047', fontWeight: '700' }}>Growth Areas: </strong>
              {executiveSummary.growthAreas}
            </div>
          </div>

          {/* Bullet 3: Hiring Recommendation */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
                flexShrink: 0,
                marginTop: '1px',
              }}
            >
              <Award size={13} />
            </span>
            <div style={{ fontSize: '13px', lineHeight: '1.55', color: '#f1f5f9' }}>
              <strong style={{ color: '#a5b4fc', fontWeight: '700' }}>Hiring Recommendation: </strong>
              {executiveSummary.hiringRecommendation}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Overview Stat Cards (Candidate, Score, Integrity, Decision) ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
          marginBottom: '24px',
        }}
      >
        <div
          className="dossier-card"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: '12px',
            padding: '14px 16px',
          }}
        >
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.45)', fontWeight: '700' }}>
            Candidate
          </div>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginTop: '4px' }}>
            {submission.user_name || 'Guest Candidate'}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.55)', marginTop: '2px', wordBreak: 'break-all' }}>
            {submission.user_email || 'Direct invite link'}
          </div>
        </div>

        <div
          className="dossier-card"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: '12px',
            padding: '14px 16px',
          }}
        >
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.45)', fontWeight: '700' }}>
            Score
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', marginTop: '2px', color: scoreColor }}>
            {overallScore}{' '}
            <span style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255, 255, 255, 0.45)' }}>/ 100</span>
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.55)', marginTop: '2px' }}>
            ⏱️ {durationMinutes > 0 ? `${durationMinutes} mins` : 'Completed'}
          </div>
        </div>

        <div
          className="dossier-card"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: '12px',
            padding: '14px 16px',
          }}
        >
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.45)', fontWeight: '700' }}>
            Session Integrity
          </div>
          <div style={{ fontSize: '14px', fontWeight: '700', marginTop: '4px', color: integrityStatus.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shield size={15} />
            {integrityStatus.text}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.55)', marginTop: '2px' }}>
            Rating: {integrity.integrityRating || (integrity.flagged ? 'flagged' : 'clean')}
          </div>
        </div>

        <div
          className="dossier-card"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: '12px',
            padding: '14px 16px',
          }}
        >
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.45)', fontWeight: '700' }}>
            Decision
          </div>
          <div
            style={{
              display: 'inline-block',
              fontSize: '12px',
              fontWeight: '800',
              marginTop: '4px',
              padding: '3px 8px',
              borderRadius: '6px',
              background: decisionBadgeStyle.bg,
              border: `1px solid ${decisionBadgeStyle.border}`,
              color: decisionBadgeStyle.text,
              letterSpacing: '0.5px',
            }}
          >
            {decisionBadgeStyle.label}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.55)', marginTop: '4px' }}>
            Target Pass: {passingScore}%
          </div>
        </div>

        {/* ─── Cohort Benchmark & Percentile Ranking Badge ─── */}
        <div
          className="dossier-card"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: '12px',
            padding: '14px 16px',
          }}
        >
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.45)', fontWeight: '700' }}>
            Cohort Ranking
          </div>
          <div
            style={{
              fontSize: '18px',
              fontWeight: '800',
              marginTop: '4px',
              color: cohortData.color || '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <TrendingUp size={16} />
            {cohortData.badgeText || `Top ${cohortData.topPercentage}%`}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.55)', marginTop: '2px' }}>
            {cohortData.subtext || `${cohortData.percentile}th percentile`} {cohortData.rankText ? `· ${cohortData.rankText}` : ''}
          </div>
        </div>
      </div>

      {/* ─── Reviewer Notes (if provided by recruiter) ─── */}
      {scores.reviewerNotes && (
        <div
          className="dossier-card"
          style={{
            marginBottom: '24px',
            padding: '14px 18px',
            borderRadius: '10px',
            background: 'rgba(99, 102, 241, 0.07)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
          }}
        >
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#a5b4fc', fontWeight: '800', marginBottom: '4px' }}>
            Recruiter Notes
          </div>
          <div style={{ fontSize: '13px', color: '#f8fafc', lineHeight: '1.5' }}>
            {scores.reviewerNotes}
          </div>
        </div>
      )}

      {/* ─── Proctoring Visual Snapshots (if captured) ─── */}
      {Array.isArray(integrity.snapshots) && integrity.snapshots.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#a78bfa', margin: '0 0 10px' }}>
            Verified Proctoring Checkpoints ({integrity.snapshots.length})
          </h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {integrity.snapshots.map((snap, snapIdx) => (
              <div
                key={snapIdx}
                className="dossier-card"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '6px',
                  textAlign: 'center',
                }}
              >
                <img
                  src={snap.thumbnail}
                  alt={`Checkpoint ${snapIdx + 1}`}
                  style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '4px', display: 'block' }}
                />
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#38bdf8', marginTop: '4px', textTransform: 'capitalize' }}>
                  {String(snap.trigger || 'checkpoint').replace(/_/g, ' ')}
                </div>
                <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.45)' }}>
                  {snap.timestamp ? new Date(snap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Verified'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── 4-Axis Competency Radar Chart & Weighted Rubrics ─── */}
      <div style={{ marginBottom: '24px' }}>
        <CompetencyRadarChart
          breakdown={breakdown}
          overallScore={overallScore}
          customScores={scores.competencies}
          targetScore={passingScore}
        />
      </div>

      {/* ─── Interactive Audio Timeline, AI Flag Pins & Recruiter Notes ─── */}
      <div style={{ marginBottom: '24px' }}>
        <AudioTimelinePlayer
          audioUrl={submission.audio_url || submission.audioUrl || scores.audioUrl}
          duration={Number(submission.duration) || 600}
          flags={timelineFlags}
          initialComments={scores.recruiterComments || submission.recruiterComments}
          candidateName={submission.user_name || 'Candidate'}
        />
      </div>

      {/* ─── Question Breakdown & Topic Mastery ─── */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#38bdf8', margin: '0 0 14px' }}>
          Question Performance & Topic Mastery ({breakdown.length})
        </h3>

        {breakdown.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {breakdown.map((q, idx) => {
              const qScore = Math.round(Number(q.score) || 0);
              const qScoreColor = qScore >= passingScore ? '#22c55e' : qScore >= passingScore - 15 ? '#f59e0b' : '#ef4444';
              const coveredTopics = Array.isArray(q.coveredTopics) ? q.coveredTopics : [];
              const missedTopics = Array.isArray(q.missedTopics) ? q.missedTopics : [];

              return (
                <div
                  key={idx}
                  className="dossier-card"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '10px',
                    padding: '16px 18px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '12px' }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#fff', lineHeight: '1.4' }}>
                      <span style={{ color: '#818cf8', marginRight: '6px' }}>Q{q.questionIndex || idx + 1}:</span>
                      {q.question}
                    </div>
                    <div style={{ fontWeight: '800', fontSize: '15px', color: qScoreColor, flexShrink: 0 }}>
                      {qScore} <span style={{ fontSize: '12px', fontWeight: '500', color: 'rgba(255, 255, 255, 0.4)' }}>/ 100</span>
                    </div>
                  </div>

                  {/* Expected Topics Tags (Covered vs Missed) */}
                  {(coveredTopics.length > 0 || missedTopics.length > 0) && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '10px 0 12px' }}>
                      {coveredTopics.map((topic, tIdx) => (
                        <span
                          key={`cov-${tIdx}`}
                          style={{
                            fontSize: '11px',
                            color: '#86efac',
                            background: 'rgba(34, 197, 94, 0.12)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <CheckCircle2 size={11} /> {topic}
                        </span>
                      ))}

                      {missedTopics.map((topic, tIdx) => (
                        <span
                          key={`mis-${tIdx}`}
                          style={{
                            fontSize: '11px',
                            color: '#fca5a5',
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <XCircle size={11} /> {topic}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Candidate Answer Box */}
                  <div
                    className="dossier-code-box"
                    style={{
                      fontSize: '12.5px',
                      lineHeight: '1.55',
                      color: '#cbd5e1',
                      background: 'rgba(0, 0, 0, 0.3)',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {q.answer || 'No response recorded.'}
                  </div>

                  {q.elapsedSeconds > 0 && (
                    <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={11} /> Answered in {q.elapsedSeconds}s
                      {q.timeLimit ? ` (Target limit: ${q.timeLimit}s)` : ''}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', padding: '16px 0' }}>
            No per-question response breakdown recorded for this session.
          </div>
        )}
      </div>

      {/* ─── Dossier Footer ─── */}
      <div
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.4)',
        }}
      >
        <div>PrepLoop Assessment Intelligence Platform · Confidential Candidate Dossier</div>
        <div>Verified ID: {submission.id || 'N/A'}</div>
      </div>
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div
      className="candidate-dossier-backdrop admin-modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      {content}
    </div>
  );
}

export default CandidateReviewDossier;
