import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Clock, Target, Zap, ChevronRight, ChevronDown,
  Building2, FileText, Shield, AlertTriangle, Play, Sparkles,
  Trophy, BarChart3, Timer, Hash, BookOpen, Star
} from 'lucide-react';
import { EXAM_CATALOG, getExamsByCompany } from '../data/examData';
import { useTheme } from '../context/ThemeContext';

const COMPANY_META = {
  TCS: { icon: '🏢', color: '#818cf8', desc: 'Tata Consultancy Services' },
  Cognizant: { icon: '🅲', color: '#34d399', desc: 'Cognizant Technology Solutions' },
  Infosys: { icon: '🔵', color: '#38bdf8', desc: 'Infosys Limited' },
  Wipro: { icon: '🟣', color: '#a855f7', desc: 'Wipro Limited' },
  Accenture: { icon: '🔶', color: '#f59e0b', desc: 'Accenture PLC' },
  Capgemini: { icon: '🧭', color: '#0ea5e9', desc: 'Capgemini' },
  HCLTech: { icon: '🟢', color: '#22c55e', desc: 'HCLTech' },
  'Tech Mahindra': { icon: '🟠', color: '#f97316', desc: 'Tech Mahindra' },
};

export default function ExamHub() {
  const [expandedCompany, setExpandedCompany] = useState(null);
  const [selectedTier, setSelectedTier] = useState('all');
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const examsByCompany = useMemo(() => getExamsByCompany(), []);
  const companies = Object.keys(examsByCompany);

  const totalExams = EXAM_CATALOG.length;
  const totalSections = EXAM_CATALOG.reduce((s, e) => s + e.sections.length, 0);
  const totalQuestions = EXAM_CATALOG.reduce((s, e) => s + e.totalQuestions, 0);

  return (
    <div style={{ minHeight: '100vh', background: isLight ? '#f8f9fa' : '#030303', color: isLight ? '#1a1a2e' : '#fff', paddingBottom: 80 }}>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section style={{
        padding: '60px 24px 40px', maxWidth: 1200, margin: '0 auto', textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 16px', borderRadius: 99,
          background: isLight ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          fontSize: 13, color: '#f59e0b', marginBottom: 24
        }}>
          <Trophy size={14} />
          {totalExams} Exam Patterns • {totalQuestions}+ Questions
        </div>

        <h1 style={{
          fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 700,
          lineHeight: 1.1, marginBottom: 16, letterSpacing: '-0.02em'
        }}>
          Company Exam{' '}
          <span style={{
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            Practice
          </span>
        </h1>
        <p style={{
          fontSize: 18, color: isLight ? '#6b7280' : '#71717a',
          maxWidth: 640, margin: '0 auto 40px', lineHeight: 1.6
        }}>
          Full-length mock tests matching the exact pattern of TCS NQT, Cognizant GenC / Superset,
          Infosys, Wipro NLTH, and Accenture — section‑wise timed practice.
        </p>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
          gap: 16, maxWidth: 700, margin: '0 auto 48px'
        }}>
          {[
            { label: 'Exam Patterns', value: totalExams, icon: <FileText size={18} />, color: '#818cf8' },
            { label: 'Companies', value: companies.length, icon: <Building2 size={18} />, color: '#f472b6' },
            { label: 'Total Sections', value: totalSections, icon: <Target size={18} />, color: '#facc15' },
            { label: 'Questions', value: `${totalQuestions}+`, icon: <Hash size={18} />, color: '#34d399' },
          ].map((s, i) => (
            <div key={i} style={{
              background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
              border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, padding: '20px 16px', textAlign: 'center'
            }}>
              <div style={{ color: s.color, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: isLight ? '#6b7280' : '#71717a', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Companies ────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {companies.map(company => {
            const meta = COMPANY_META[company] || { icon: '🏢', color: '#818cf8', desc: company };
            const exams = examsByCompany[company];
            const isExpanded = expandedCompany === company;

            return (
              <div key={company} style={{
                background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
                border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16, overflow: 'hidden', transition: 'border-color 0.3s',
                borderColor: isExpanded ? `${meta.color}40` : undefined
              }}>
                {/* Company Header */}
                <div
                  onClick={() => setExpandedCompany(isExpanded ? null : company)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '24px 28px', cursor: 'pointer', transition: 'background 0.2s',
                    background: isExpanded ? (isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)') : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 14,
                      background: `${meta.color}15`, color: meta.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 26
                    }}>
                      {meta.icon}
                    </div>
                    <div>
                      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{company}</h2>
                      <p style={{ fontSize: 14, color: isLight ? '#6b7280' : '#71717a', margin: 0 }}>
                        {meta.desc} • {exams.length} exam {exams.length === 1 ? 'pattern' : 'patterns'}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {exams.map(e => (
                        <span key={e.id} style={{
                          padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                          background: `${e.badgeColor}18`, color: e.badgeColor
                        }}>
                          {e.badge}
                        </span>
                      ))}
                    </div>
                    <ChevronDown size={20} style={{
                      color: isLight ? '#9ca3af' : '#71717a',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform 0.3s'
                    }} />
                  </div>
                </div>

                {/* Exam Cards */}
                {isExpanded && (
                  <div style={{ padding: '0 28px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {exams.map(exam => (
                      <ExamCard key={exam.id} exam={exam} isLight={isLight} navigate={navigate} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: '64px auto 0', padding: '0 24px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32, textAlign: 'center' }}>
          How <span style={{ color: '#f59e0b' }}>Exam Practice</span> Works
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 16 }}>
          {[
            { step: '01', title: 'Pick an Exam', desc: 'Choose your target company and exam tier', icon: <Building2 size={20} />, color: '#818cf8' },
            { step: '02', title: 'Select Mode', desc: 'Full mock or section-wise timed practice', icon: <Target size={20} />, color: '#34d399' },
            { step: '03', title: 'Solve Sections', desc: 'Each section has its own timer and question set', icon: <Timer size={20} />, color: '#f472b6' },
            { step: '04', title: 'Get Results', desc: 'Detailed analytics, section scores, and review', icon: <BarChart3 size={20} />, color: '#facc15' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: 24, borderRadius: 16, textAlign: 'center',
              background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
              border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)',
              transition: 'all 0.25s'
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, margin: '0 auto 12px',
                background: `${s.color}15`, color: s.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>{s.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.step}</div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontSize: 13, color: isLight ? '#6b7280' : '#71717a', margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ─── Individual Exam Card ─────────────────────────────────────────────── */

function ExamCard({ exam, isLight, navigate }) {
  const [showSections, setShowSections] = useState(false);
  const totalMarks = exam.sections.reduce((s, sec) => s + (sec.questionCount * sec.marksPerQuestion), 0);

  return (
    <div style={{
      background: isLight ? '#fff' : 'rgba(255,255,255,0.03)',
      border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)',
      borderRadius: 16, overflow: 'hidden', transition: 'all 0.2s'
    }}>
      {/* Card Header */}
      <div style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 28 }}>{exam.icon}</span>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{exam.title}</h3>
                <p style={{ fontSize: 13, color: isLight ? '#6b7280' : '#71717a', margin: '4px 0 0' }}>{exam.subtitle}</p>
              </div>
            </div>
            <p style={{ fontSize: 14, color: isLight ? '#6b7280' : '#a1a1aa', lineHeight: 1.6, margin: 0 }}>{exam.description}</p>
          </div>
          <span style={{
            padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
            background: `${exam.badgeColor}18`, color: exam.badgeColor, whiteSpace: 'nowrap'
          }}>
            {exam.badge}
          </span>
        </div>

        {/* Meta Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
          {[
            { label: `${exam.totalTime} min`, icon: <Clock size={13} />, color: '#818cf8' },
            { label: `${exam.totalQuestions} Qs`, icon: <Hash size={13} />, color: '#34d399' },
            { label: `${totalMarks} Marks`, icon: <Star size={13} />, color: '#facc15' },
            { label: `${exam.sections.length} Sections`, icon: <Target size={13} />, color: '#f472b6' },
            exam.negativeMarking && { label: 'Negative Marking', icon: <AlertTriangle size={13} />, color: '#f87171' },
            { label: `Pass: ${exam.passingPercent}%`, icon: <Shield size={13} />, color: '#a855f7' },
          ].filter(Boolean).map((tag, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
              background: `${tag.color}10`, color: tag.color
            }}>
              {tag.icon} {tag.label}
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(`/exam-practice/${exam.id}?mode=full`)}
            style={{
              padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700,
              background: exam.gradient, color: '#fff', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: `0 4px 15px ${exam.color}30`
            }}
          >
            <Play size={16} /> Start Full Mock Test
          </button>
          <button
            onClick={() => setShowSections(!showSections)}
            style={{
              padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
              border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.08)',
              color: isLight ? '#374151' : '#d4d4d8', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <BookOpen size={16} /> Section-wise Practice
            <ChevronDown size={14} style={{
              transform: showSections ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.2s'
            }} />
          </button>
        </div>
      </div>

      {/* Sections Breakout */}
      {showSections && (
        <div style={{
          borderTop: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.04)',
          padding: '20px 28px',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: 12
        }}>
          {exam.sections.map(sec => (
            <div
              key={sec.id}
              onClick={() => navigate(`/exam-practice/${exam.id}?mode=section&section=${sec.id}`)}
              style={{
                padding: '16px 20px', borderRadius: 12, cursor: 'pointer',
                background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
                border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = `${sec.color}40`;
                e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';
                e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{sec.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{sec.title}</span>
              </div>
              <p style={{ fontSize: 12, color: isLight ? '#6b7280' : '#71717a', margin: '0 0 10px', lineHeight: 1.5 }}>
                {sec.description}
              </p>
              <div style={{ display: 'flex', gap: 8, fontSize: 11, flexWrap: 'wrap' }}>
                <span style={{ color: sec.color }}>{sec.questionCount} Qs</span>
                <span style={{ color: '#818cf8' }}>{sec.timeLimit} min</span>
                <span style={{ color: '#facc15' }}>{sec.marksPerQuestion} mark{sec.marksPerQuestion > 1 ? 's' : ''}/Q</span>
                {sec.negativePerWrong > 0 && (
                  <span style={{ color: '#f87171' }}>-{sec.negativePerWrong} per wrong</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: 8 }}>
                <span style={{ fontSize: 12, color: sec.color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Practice <ChevronRight size={14} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
