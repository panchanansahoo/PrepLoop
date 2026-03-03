import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User, Mail, Briefcase, Award, Code2, Settings, LogOut, Shield,
  Trophy, Star, Flame, Zap, Crown, Target, Sparkles, Medal,
  TrendingUp, ChevronRight, Lock
} from 'lucide-react';
import { useGamification } from '../hooks/useGamification';
import { BADGES, BADGE_TIERS, MOCK_LEADERBOARD, getLevel, getLevelProgress, LEVELS } from '../data/gamificationData';
import StreakHeatmap from '../components/StreakHeatmap';
import XPNotification from '../components/XPNotification';

export default function Profile() {
  const { user, logout } = useAuth();
  const gam = useGamification();
  const [profile, setProfile] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    bio: '',
    currentRole: '',
    experience: '',
    skills: '',
    education: ''
  });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeGamTab, setActiveGamTab] = useState('overview');
  const [leaderboardPeriod, setLeaderboardPeriod] = useState('weekly');

  const level = getLevel(gam.totalXP);
  const progress = getLevelProgress(gam.totalXP);
  const earnedBadgeSet = new Set(gam.earnedBadges);
  const earnedBadges = BADGES.filter(b => earnedBadgeSet.has(b.id));
  const lockedBadges = BADGES.filter(b => !earnedBadgeSet.has(b.id));

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setProfile(prev => ({ ...prev, ...data }));
      }
    } catch (err) { console.error(err); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(profile)
      });
      setEditing(false);
    } catch (err) { alert('Failed to save'); }
    setSaving(false);
  };

  const gamTabs = [
    { id: 'overview', label: 'Overview', icon: Sparkles },
    { id: 'badges', label: 'Badges', icon: Award },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'activity', label: 'Activity', icon: Flame },
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <XPNotification notification={gam.notification} onDismiss={gam.dismissNotification} />

      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 30 }}>Profile</h1>

      {/* Profile Card */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 32, border: '1px solid var(--border)', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6c5ce7, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 700, color: 'white'
            }}>
              {(user?.fullName || user?.email || '?')[0].toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>{profile.fullName || 'User'}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{profile.email}</p>
            </div>
          </div>
          <button onClick={() => editing ? handleSave() : setEditing(true)} className="btn-hero-primary" style={{ border: 'none', cursor: 'pointer', padding: '10px 20px', fontSize: 14 }}>
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Edit Profile'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { label: 'Full Name', key: 'fullName', icon: <User size={14} /> },
            { label: 'Current Role', key: 'currentRole', icon: <Briefcase size={14} /> },
            { label: 'Experience', key: 'experience', icon: <Award size={14} /> },
            { label: 'Education', key: 'education', icon: <Shield size={14} /> }
          ].map((field, i) => (
            <div key={i}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                {field.icon} {field.label}
              </label>
              {editing ? (
                <input
                  value={profile[field.key] || ''}
                  onChange={e => setProfile({ ...profile, [field.key]: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14 }}
                />
              ) : (
                <div style={{ color: profile[field.key] ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: 14, padding: '10px 0' }}>
                  {profile[field.key] || 'Not set'}
                </div>
              )}
            </div>
          ))}
        </div>

        {editing && (
          <div style={{ marginTop: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Bio</label>
            <textarea
              value={profile.bio || ''}
              onChange={e => setProfile({ ...profile, bio: e.target.value })}
              rows={3}
              placeholder="Tell us about yourself..."
              style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
        )}
      </div>

      {/* Gamification Section */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 28, border: '1px solid var(--border)', marginBottom: 20 }}>
        {/* XP Progress Card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 24, marginBottom: 20,
          border: '1px solid rgba(255,255,255,0.06)',
          backgroundImage: `radial-gradient(ellipse at top left, ${level.color}10, transparent 60%)`,
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
            {/* Level Ring */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ position: 'relative', width: 80, height: 80 }}>
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                  <circle cx="40" cy="40" r="34" fill="none" stroke={level.color} strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress.progress / 100)}`}
                    strokeLinecap="round"
                    style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 1s ease' }} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                  {level.icon}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{gam.totalXP.toLocaleString()} <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>XP</span></div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                  {progress.nextLevel ? `${progress.xpToNext} XP to ${progress.nextLevel.icon} ${progress.nextLevel.name}` : 'Max level reached!'}
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[
                { label: 'Problems', value: gam.problemsSolved, color: '#6ee7b7' },
                { label: 'Streak', value: `${gam.currentStreak}🔥`, color: '#f59e0b' },
                { label: 'Badges', value: earnedBadges.length, color: '#a78bfa' },
              ].map((stat, i) => (
                <div key={i} style={{ textAlign: 'center', minWidth: 70 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* XP Progress Bar */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{level.icon} {level.name}</span>
              {progress.nextLevel && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{progress.nextLevel.icon} {progress.nextLevel.name}</span>}
            </div>
            <div style={{ height: 8, borderRadius: 8, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 8,
                background: `linear-gradient(90deg, ${level.color}, ${level.color}88)`,
                width: `${progress.progress}%`,
                transition: 'width 1s ease',
                boxShadow: `0 0 12px ${level.color}40`,
              }} />
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4, textAlign: 'right' }}>{progress.progress}%</div>
          </div>
        </div>

        {/* Gamification Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 4, border: '1px solid rgba(255,255,255,0.06)' }}>
          {gamTabs.map(tab => {
            const Icon = tab.icon;
            const active = activeGamTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveGamTab(tab.id)} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: active ? 'rgba(139,92,246,0.15)' : 'transparent',
                color: active ? '#c084fc' : 'rgba(255,255,255,0.4)',
                fontWeight: active ? 700 : 500, fontSize: 13, transition: 'all 0.2s',
                fontFamily: 'inherit',
              }}>
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeGamTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              {[
                { label: 'Easy Solved', value: gam.easySolved, color: '#6ee7b7', bg: 'rgba(16,185,129,0.08)' },
                { label: 'Medium Solved', value: gam.mediumSolved, color: '#fbbf24', bg: 'rgba(251,191,36,0.08)' },
                { label: 'Hard Solved', value: gam.hardSolved, color: '#f87171', bg: 'rgba(248,113,113,0.08)' },
                { label: 'Best Streak', value: `${gam.bestStreak} days`, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
                { label: 'Daily Challenges', value: gam.dailyChallengesCompleted, color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
                { label: 'Streak Freezes', value: gam.streakFreezes, color: '#67e8f9', bg: 'rgba(103,232,249,0.08)' },
              ].map((s, i) => (
                <div key={i} style={{
                  background: s.bg, borderRadius: 14, padding: '14px 16px',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Level Roadmap */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 20,
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 14 }}>Level Roadmap</div>
              <div style={{ display: 'flex', gap: 0, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
                {LEVELS.map((lvl, i) => {
                  const isCurrent = level.index === i;
                  const isUnlocked = level.index >= i;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 12,
                        background: isCurrent ? `linear-gradient(135deg, ${lvl.color}30, ${lvl.color}10)` : isUnlocked ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                        border: isCurrent ? `2px solid ${lvl.color}` : '1px solid rgba(255,255,255,0.05)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                        opacity: isUnlocked ? 1 : 0.4,
                      }}>
                        <span style={{ fontSize: 16 }}>{lvl.icon}</span>
                        <span style={{ fontSize: 7, color: isUnlocked ? lvl.color : 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{lvl.name}</span>
                      </div>
                      {i < LEVELS.length - 1 && (
                        <div style={{
                          width: 20, height: 2,
                          background: level.index > i ? lvl.color : 'rgba(255,255,255,0.08)',
                          transition: 'background 0.3s',
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Badges */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 20,
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Recent Badges</div>
                <button onClick={() => setActiveGamTab('badges')} style={{
                  background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit',
                }}>View All <ChevronRight size={14} /></button>
              </div>
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none' }}>
                {(earnedBadges.length > 0 ? earnedBadges.slice(-6).reverse() : BADGES.slice(0, 6)).map((badge, i) => {
                  const Icon = badge.icon;
                  const tier = BADGE_TIERS[badge.tier];
                  const earned = earnedBadgeSet.has(badge.id);
                  return (
                    <div key={i} style={{
                      width: 90, flexShrink: 0, textAlign: 'center', padding: 10, borderRadius: 12,
                      background: earned ? `${tier.color}10` : 'rgba(255,255,255,0.02)',
                      border: earned ? `1px solid ${tier.color}30` : '1px solid rgba(255,255,255,0.05)',
                      opacity: earned ? 1 : 0.4,
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, margin: '0 auto 6px',
                        background: earned ? `linear-gradient(135deg, ${tier.color}40, ${tier.color}15)` : 'rgba(255,255,255,0.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: earned ? `0 0 16px ${tier.glow}` : 'none',
                      }}>
                        {earned ? <Icon size={16} color={tier.color} /> : <Lock size={12} color="rgba(255,255,255,0.2)" />}
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: earned ? '#fff' : 'rgba(255,255,255,0.3)', lineHeight: 1.2 }}>{badge.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeGamTab === 'badges' && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Award size={16} color="#fbbf24" /> Earned ({earnedBadges.length})
              </div>
              {earnedBadges.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
                  No badges earned yet. Start solving problems to unlock your first badge!
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                  {earnedBadges.map((badge, i) => <BadgeCard key={i} badge={badge} earned />)}
                </div>
              )}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock size={16} /> Locked ({lockedBadges.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {lockedBadges.map((badge, i) => <BadgeCard key={i} badge={badge} earned={false} />)}
              </div>
            </div>
          </div>
        )}

        {activeGamTab === 'leaderboard' && (
          <div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 4, width: 'fit-content', border: '1px solid rgba(255,255,255,0.06)' }}>
              {['weekly', 'monthly', 'alltime'].map(p => (
                <button key={p} onClick={() => setLeaderboardPeriod(p)} style={{
                  padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: leaderboardPeriod === p ? 'rgba(139,92,246,0.15)' : 'transparent',
                  color: leaderboardPeriod === p ? '#c084fc' : 'rgba(255,255,255,0.4)',
                  fontWeight: 600, fontSize: 12, textTransform: 'capitalize', fontFamily: 'inherit',
                }}>{p === 'alltime' ? 'All Time' : p}</button>
              ))}
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.03)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)',
              overflow: 'hidden',
            }}>
              {MOCK_LEADERBOARD.map((entry, i) => {
                const rankColors = ['#fbbf24', '#C0C0C0', '#CD7F32'];
                const isTop3 = i < 3;
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px',
                    borderBottom: i < MOCK_LEADERBOARD.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    background: isTop3 ? `${rankColors[i]}05` : 'transparent',
                    transition: 'background 0.2s',
                  }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = isTop3 ? `${rankColors[i]}05` : 'transparent'}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isTop3 ? `${rankColors[i]}15` : 'rgba(255,255,255,0.04)',
                      color: isTop3 ? rankColors[i] : 'rgba(255,255,255,0.4)',
                      fontWeight: 800, fontSize: 13,
                    }}>
                      {isTop3 ? ['🥇', '🥈', '🥉'][i] : entry.rank}
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 20 }}>{entry.avatar}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{entry.name}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{entry.level}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 18 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>{entry.xp.toLocaleString()}</div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>XP</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#6ee7b7' }}>{entry.solved}</div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>Solved</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>{entry.streak}🔥</div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>Streak</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeGamTab === 'activity' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <StreakHeatmap
              activityHistory={gam.activityHistory}
              currentStreak={gam.currentStreak}
              bestStreak={gam.bestStreak}
            />

            <div style={{
              background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 20,
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 14 }}>Recent Activity</div>
              {gam.xpLog.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
                  No activity yet. Start solving problems!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {gam.xpLog.slice().reverse().slice(0, 15).map((log, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Zap size={14} color="#fbbf24" />
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{log.action.replace(/_/g, ' ')}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#6ee7b7' }}>+{log.xp} XP</span>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Subscription */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, border: '1px solid var(--border)', marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>Subscription</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ background: 'rgba(108,92,231,0.15)', color: 'var(--accent)', padding: '4px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>
              Starter Plan
            </span>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Free forever · Limited features</p>
          </div>
          <Link to="/pricing" style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            Upgrade →
          </Link>
        </div>
      </div>

      {/* Danger Zone */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, border: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: 16, marginBottom: 12, color: 'var(--red)' }}>Danger Zone</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Log out of your account</p>
          </div>
          <button onClick={logout} style={{
            background: 'rgba(255,71,87,0.1)', color: 'var(--red)',
            border: '1px solid var(--red)', padding: '8px 20px',
            borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit'
          }}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

function BadgeCard({ badge, earned }) {
  const Icon = badge.icon;
  const tier = BADGE_TIERS[badge.tier];
  return (
    <div style={{
      padding: 14, borderRadius: 12,
      background: earned ? `${tier.color}08` : 'rgba(255,255,255,0.02)',
      border: earned ? `1px solid ${tier.color}25` : '1px solid rgba(255,255,255,0.05)',
      display: 'flex', alignItems: 'center', gap: 12,
      opacity: earned ? 1 : 0.5,
      transition: 'all 0.2s',
      cursor: 'default',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: earned ? `linear-gradient(135deg, ${tier.color}30, ${tier.color}10)` : 'rgba(255,255,255,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: earned ? `0 0 20px ${tier.glow}` : 'none',
      }}>
        {earned ? <Icon size={18} color={tier.color} /> : <Lock size={14} color="rgba(255,255,255,0.2)" />}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: earned ? '#fff' : 'rgba(255,255,255,0.4)', marginBottom: 2 }}>{badge.name}</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', lineHeight: 1.3 }}>{badge.desc}</div>
        <div style={{ fontSize: 8, fontWeight: 700, color: tier.color, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{tier.label}</div>
      </div>
    </div>
  );
}
