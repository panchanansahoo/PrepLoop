import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, MessageCircle, Trophy, Flame, Star, ExternalLink,
  Github, Linkedin, Twitter, ChevronRight, Calendar, Sparkles,
  BookOpen, Target, Mic, Code2, Zap, Crown, Medal, Award,
  Globe, Hash, ArrowRight, Clock, TrendingUp, Heart
} from 'lucide-react';

// ── Discord SVG Icon ──
function DiscordIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  );
}

// ── Study Group Card ──
function StudyGroupCard({ group }) {
  return (
    <div style={{
      padding: '18px 20px', borderRadius: 16,
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
      transition: 'all 0.2s', cursor: 'pointer',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: `${group.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${group.color}25`,
          fontSize: 20,
        }}>
          {group.emoji}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{group.name}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{group.members} members</div>
        </div>
      </div>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, margin: '0 0 12px' }}>
        {group.description}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {group.tags.map((tag, i) => (
            <span key={i} style={{
              padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
              background: 'rgba(139,92,246,0.08)', color: '#a78bfa',
              border: '1px solid rgba(139,92,246,0.12)',
            }}>
              {tag}
            </span>
          ))}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 11, fontWeight: 600, color: '#6ee7b7',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6ee7b7' }} />
          {group.online} online
        </div>
      </div>
    </div>
  );
}

// ── Event Card ──
function EventCard({ event }) {
  return (
    <div style={{
      padding: '16px 18px', borderRadius: 14,
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center', gap: 14,
      transition: 'all 0.2s', cursor: 'pointer',
    }}
    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
    >
      <div style={{
        width: 52, height: 52, borderRadius: 14, flexShrink: 0,
        background: `${event.color}10`, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${event.color}20`,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: event.color, textTransform: 'uppercase' }}>{event.month}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{event.day}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{event.title}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
          {event.time} · {event.type}
        </div>
      </div>
      <span style={{
        padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 700,
        background: event.live ? 'rgba(248,113,113,0.12)' : 'rgba(110,231,183,0.12)',
        color: event.live ? '#f87171' : '#6ee7b7',
        border: `1px solid ${event.live ? 'rgba(248,113,113,0.2)' : 'rgba(110,231,183,0.2)'}`,
      }}>
        {event.live ? '● LIVE' : 'Upcoming'}
      </span>
    </div>
  );
}

// ── Mock Data ──
const STUDY_GROUPS = [
  { name: 'DSA Grinders', emoji: '🔥', members: '2.4k', online: 128, color: '#f59e0b', tags: ['LeetCode', 'Daily'], description: 'Daily problem-solving sessions with collaborative discussion and competitive tracking.' },
  { name: 'System Design Club', emoji: '🏗️', members: '1.8k', online: 84, color: '#60a5fa', tags: ['Architecture', 'HLD'], description: 'Weekly system design mock interviews, whiteboarding sessions, and case studies.' },
  { name: 'FAANG Prep', emoji: '🎯', members: '3.1k', online: 215, color: '#6ee7b7', tags: ['Google', 'Meta', 'Amazon'], description: 'Focused preparation for FAANG-level interviews with real interview experiences.' },
  { name: 'Web Dev Warriors', emoji: '⚡', members: '1.2k', online: 67, color: '#c084fc', tags: ['React', 'Node.js'], description: 'Full-stack development discussions, project showcases, and code reviews.' },
  { name: 'ML & Data Science', emoji: '🤖', members: '890', online: 42, color: '#fb923c', tags: ['Python', 'AI/ML'], description: 'Machine learning study group covering algorithms, papers, and implementations.' },
  { name: 'Competitive Programming', emoji: '🏆', members: '1.5k', online: 96, color: '#f87171', tags: ['Codeforces', 'Contests'], description: 'Contest prep, editorial discussions, and competitive programming techniques.' },
];

const UPCOMING_EVENTS = [
  { title: 'Weekly Mock Interview Marathon', month: 'APR', day: '01', time: '7:00 PM IST', type: 'Mock Interview', color: '#c084fc', live: false },
  { title: 'System Design: Design Twitter', month: 'APR', day: '03', time: '8:00 PM IST', type: 'Workshop', color: '#60a5fa', live: false },
  { title: 'DSA Speed Round Challenge', month: 'APR', day: '05', time: '6:30 PM IST', type: 'Contest', color: '#fbbf24', live: false },
  { title: 'Resume Review AMA', month: 'APR', day: '08', time: '9:00 PM IST', type: 'AMA', color: '#6ee7b7', live: false },
];

const LEADERBOARD = [
  { rank: 1, name: 'CodeNinja42', points: 12840, solved: 482, streak: 45, avatar: '🥇' },
  { rank: 2, name: 'AlgoQueen', points: 11250, solved: 420, streak: 38, avatar: '🥈' },
  { rank: 3, name: 'StackMaster', points: 10680, solved: 398, streak: 31, avatar: '🥉' },
  { rank: 4, name: 'ByteCrusher', points: 9420, solved: 355, streak: 28, avatar: '4️⃣' },
  { rank: 5, name: 'RecursiveRaj', points: 8900, solved: 340, streak: 22, avatar: '5️⃣' },
];

const DISCUSSIONS = [
  { title: 'Best approach for Two Sum variations?', author: 'CodeNinja42', replies: 24, likes: 18, tag: 'DSA', time: '2h ago' },
  { title: 'Google L4 Interview Experience (Offer!)', author: 'AlgoQueen', replies: 67, likes: 142, tag: 'Experience', time: '5h ago' },
  { title: 'Dynamic Programming roadmap — what order?', author: 'DPLearner', replies: 31, likes: 45, tag: 'Roadmap', time: '8h ago' },
  { title: 'Is LeetCode premium worth it in 2026?', author: 'ByteCrusher', replies: 53, likes: 89, tag: 'Discussion', time: '12h ago' },
  { title: 'System Design: Rate Limiter deep dive', author: 'ArchitectPro', replies: 19, likes: 36, tag: 'System Design', time: '1d ago' },
];

// ── Main Component ──
export default function CommunityHub() {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', label: 'Overview', icon: Globe },
    { id: 'groups', label: 'Study Groups', icon: Users },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'discussions', label: 'Discussions', icon: MessageCircle },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 0' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.1))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(59,130,246,0.2)',
          }}>
            <Users size={22} color="#60a5fa" />
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: '#fff' }}>Community Hub</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              Connect, compete, and grow with fellow engineers
            </p>
          </div>
        </div>
      </div>

      {/* ── Discord CTA Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(88,101,242,0.15), rgba(139,92,246,0.08))',
        borderRadius: 20, padding: '28px 32px', marginBottom: 24,
        border: '1px solid rgba(88,101,242,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', right: -40, top: -40, width: 200, height: 200,
          borderRadius: '50%', background: 'rgba(88,101,242,0.08)', filter: 'blur(60px)',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <DiscordIcon size={28} color="#5865F2" />
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#fff' }}>Join Our Discord Community</h2>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, maxWidth: 500 }}>
            Get instant help, join study groups, participate in contests, and connect with 5,000+ engineers preparing for interviews.
          </p>
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            {[
              { label: '5,000+ Members', icon: Users },
              { label: 'Active 24/7', icon: Clock },
              { label: 'Free Forever', icon: Heart },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                  <Icon size={13} />
                  {stat.label}
                </div>
              );
            })}
          </div>
        </div>
        <a
          href="https://discord.gg/preploop"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '12px 28px', borderRadius: 14, textDecoration: 'none',
            background: '#5865F2', color: '#fff', fontSize: 14, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 24px rgba(88,101,242,0.35)',
            transition: 'all 0.3s', position: 'relative', zIndex: 1,
          }}
        >
          <DiscordIcon size={18} color="#fff" />
          Join Discord
          <ExternalLink size={14} />
        </a>
      </div>

      {/* ── Section Tabs ── */}
      <div style={{
        display: 'flex', gap: 4, padding: 4, borderRadius: 14,
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
        marginBottom: 24, overflowX: 'auto',
      }}>
        {sections.map(sec => {
          const Icon = sec.icon;
          const active = activeSection === sec.id;
          return (
            <button key={sec.id} onClick={() => setActiveSection(sec.id)} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: active ? '#60a5fa' : 'rgba(255,255,255,0.4)',
              fontWeight: active ? 700 : 500, fontSize: 13, fontFamily: 'inherit',
              transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}>
              <Icon size={15} /> {sec.label}
            </button>
          );
        })}
      </div>

      {/* ── Section Content ── */}
      {activeSection === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Social Links */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {[
              { label: 'Discord', desc: 'Join 5,000+ members', icon: DiscordIcon, color: '#5865F2', href: 'https://discord.gg/preploop' },
              { label: 'GitHub', desc: 'Open-source resources', icon: Github, color: '#fff', href: 'https://github.com/preploop' },
              { label: 'Twitter / X', desc: 'Tips & announcements', icon: Twitter, color: '#1DA1F2', href: 'https://twitter.com/preploop' },
              { label: 'LinkedIn', desc: 'Career connections', icon: Linkedin, color: '#0A66C2', href: 'https://linkedin.com/company/preploop' },
            ].map((social, i) => {
              const Icon = social.icon;
              return (
                <a key={i} href={social.href} target="_blank" rel="noopener noreferrer" style={{
                  padding: '16px 18px', borderRadius: 16, textDecoration: 'none',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = `${social.color}40`}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: `${social.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${social.color}20`,
                  }}>
                    <Icon size={20} color={social.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{social.label}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{social.desc}</div>
                  </div>
                  <ExternalLink size={14} color="rgba(255,255,255,0.2)" style={{ marginLeft: 'auto' }} />
                </a>
              );
            })}
          </div>

          {/* Top Discussions Preview */}
          <div style={{
            background: 'var(--bg-card)', borderRadius: 20, padding: 24,
            border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={18} color="#fbbf24" /> Trending Discussions
              </h3>
              <button onClick={() => setActiveSection('discussions')} style={{
                background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                View All <ChevronRight size={14} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DISCUSSIONS.slice(0, 3).map((d, i) => (
                <div key={i} style={{
                  padding: '12px 16px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'background 0.2s', cursor: 'pointer',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 3 }}>{d.title}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                      by {d.author} · {d.time}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MessageCircle size={12} /> {d.replies}
                    </span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Heart size={12} /> {d.likes}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Featured study groups */}
          <div style={{
            background: 'var(--bg-card)', borderRadius: 20, padding: 24,
            border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={18} color="#6ee7b7" /> Popular Study Groups
              </h3>
              <button onClick={() => setActiveSection('groups')} style={{
                background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                View All <ChevronRight size={14} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
              {STUDY_GROUPS.slice(0, 4).map((group, i) => (
                <StudyGroupCard key={i} group={group} />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSection === 'groups' && (
        <div style={{
          background: 'var(--bg-card)', borderRadius: 20, padding: 24,
          border: '1px solid var(--border)',
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={18} color="#6ee7b7" /> All Study Groups
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
            {STUDY_GROUPS.map((group, i) => (
              <StudyGroupCard key={i} group={group} />
            ))}
          </div>
        </div>
      )}

      {activeSection === 'leaderboard' && (
        <div style={{
          background: 'var(--bg-card)', borderRadius: 20, padding: 24,
          border: '1px solid var(--border)',
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trophy size={18} color="#fbbf24" /> Community Leaderboard
          </h3>
          <div style={{
            background: 'rgba(255,255,255,0.03)', borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '50px 1fr 100px 80px 80px',
              padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)',
              fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              <div>Rank</div><div>Engineer</div><div style={{ textAlign: 'right' }}>Points</div>
              <div style={{ textAlign: 'right' }}>Solved</div><div style={{ textAlign: 'right' }}>Streak</div>
            </div>
            {LEADERBOARD.map((entry, i) => {
              const rankColors = ['#fbbf24', '#C0C0C0', '#CD7F32'];
              const isTop3 = i < 3;
              return (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '50px 1fr 100px 80px 80px',
                  padding: '14px 18px', alignItems: 'center',
                  borderBottom: i < LEADERBOARD.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  background: isTop3 ? `${rankColors[i]}05` : 'transparent',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={(e) => e.currentTarget.style.background = isTop3 ? `${rankColors[i]}05` : 'transparent'}
                >
                  <div style={{
                    fontSize: 18, fontWeight: 800,
                    color: isTop3 ? rankColors[i] : 'rgba(255,255,255,0.4)',
                  }}>
                    {entry.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{entry.name}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 700, color: '#a78bfa' }}>{entry.points.toLocaleString()}</div>
                  <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 700, color: '#6ee7b7' }}>{entry.solved}</div>
                  <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>{entry.streak}🔥</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeSection === 'events' && (
        <div style={{
          background: 'var(--bg-card)', borderRadius: 20, padding: 24,
          border: '1px solid var(--border)',
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} color="#c084fc" /> Upcoming Events
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {UPCOMING_EVENTS.map((event, i) => (
              <EventCard key={i} event={event} />
            ))}
          </div>
          <div style={{
            marginTop: 20, padding: '16px 20px', borderRadius: 14,
            background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.1)',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 10px' }}>
              Want to host an event or workshop? We'd love to feature you!
            </p>
            <a href="https://discord.gg/preploop" target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 20px', borderRadius: 10, textDecoration: 'none',
              background: 'rgba(139,92,246,0.15)', color: '#c084fc',
              fontSize: 12, fontWeight: 700, border: '1px solid rgba(139,92,246,0.2)',
            }}>
              <Mic size={14} /> Apply to Host <ExternalLink size={12} />
            </a>
          </div>
        </div>
      )}

      {activeSection === 'discussions' && (
        <div style={{
          background: 'var(--bg-card)', borderRadius: 20, padding: 24,
          border: '1px solid var(--border)',
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageCircle size={18} color="#60a5fa" /> Community Discussions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DISCUSSIONS.map((d, i) => {
              const tagColors = {
                DSA: '#c084fc', Experience: '#6ee7b7', Roadmap: '#fbbf24',
                Discussion: '#60a5fa', 'System Design': '#fb923c',
              };
              return (
                <div key={i} style={{
                  padding: '16px 18px', borderRadius: 14,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  transition: 'all 0.2s', cursor: 'pointer',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{d.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                        <span>by {d.author}</span>
                        <span>·</span>
                        <span>{d.time}</span>
                        <span style={{
                          padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 700,
                          background: `${tagColors[d.tag] || '#60a5fa'}12`,
                          color: tagColors[d.tag] || '#60a5fa',
                          border: `1px solid ${tagColors[d.tag] || '#60a5fa'}20`,
                        }}>
                          {d.tag}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexShrink: 0, marginTop: 4 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#60a5fa' }}>{d.replies}</div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>replies</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#f87171' }}>{d.likes}</div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>likes</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
