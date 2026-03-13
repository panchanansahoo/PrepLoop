import React, { useState, useMemo } from 'react';
import {
  Trophy, Star, Flame, Zap, Crown, Target, Shield, Award,
  TrendingUp, ChevronRight, Lock, Sparkles, Medal
} from 'lucide-react';
import { useGamification } from '../hooks/useGamification';
import { BADGES, BADGE_TIERS, MOCK_LEADERBOARD, getLevel, getLevelProgress, LEVELS } from '../data/gamificationData';
import StreakHeatmap from '../components/StreakHeatmap';
import XPNotification from '../components/XPNotification';
import { useTheme } from '../context/ThemeContext';

export default function GamificationDashboard() {
  const gam = useGamification();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState('overview');
  const [leaderboardPeriod, setLeaderboardPeriod] = useState('weekly');

  const level = getLevel(gam.totalXP);
  const progress = getLevelProgress(gam.totalXP);
  const earnedBadgeSet = new Set(gam.earnedBadges);

  // Partition badges
  const earnedBadges = BADGES.filter(b => earnedBadgeSet.has(b.id));
  const lockedBadges = BADGES.filter(b => !earnedBadgeSet.has(b.id));

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Sparkles },
    { id: 'badges', label: 'Badges', icon: Award },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'activity', label: 'Activity', icon: Flame },
  ];

  return (
    <div className={`min-h-screen ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#0a0a0a] text-white'} selection:bg-purple-500/30`}>
      {/* Subtle Background */}
      <div className={`fixed inset-0 pointer-events-none ${isLight ? 'bg-gradient-to-b from-indigo-50/50 via-slate-50 to-slate-50' : 'bg-gradient-to-b from-purple-900/10 via-[#0a0a0a] to-[#0a0a0a]'}`} />

      <XPNotification notification={gam.notification} onDismiss={gam.dismissNotification} />

      <div className="max-w-6xl mx-auto px-6 py-8 pt-24 relative z-10">
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 28 }}>{level.icon}</span>
            <h1 style={{ fontSize: 28, fontWeight: 800, background: `linear-gradient(135deg, ${level.color}, #fff)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {level.name}
            </h1>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Your coding journey — earn XP, unlock badges, climb the leaderboard</p>
        </div>

        {/* XP Progress Card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)',
          padding: 28, marginBottom: 24,
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
                { label: 'Problems', value: gam.problemsSolved, icon: Target, color: '#6ee7b7' },
                { label: 'Streak', value: `${gam.currentStreak}🔥`, icon: Flame, color: '#f59e0b' },
                { label: 'Badges', value: earnedBadges.length, icon: Medal, color: '#a78bfa' },
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

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 4, border: '1px solid rgba(255,255,255,0.06)' }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: active ? 'rgba(139,92,246,0.15)' : 'transparent',
                color: active ? '#c084fc' : 'rgba(255,255,255,0.4)',
                fontWeight: active ? 700 : 500, fontSize: 13, transition: 'all 0.2s',
              }}>
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              {[
                { label: 'Easy Solved', value: gam.easySolved, color: '#6ee7b7', bg: 'rgba(16,185,129,0.08)' },
                { label: 'Medium Solved', value: gam.mediumSolved, color: '#fbbf24', bg: 'rgba(251,191,36,0.08)' },
                { label: 'Hard Solved', value: gam.hardSolved, color: '#f87171', bg: 'rgba(248,113,113,0.08)' },
                { label: 'Best Streak', value: `${gam.bestStreak} days`, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
                { label: 'Daily Challenges', value: gam.dailyChallengesCompleted, color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
                { label: 'Streak Freezes', value: gam.streakFreezes, color: '#67e8f9', bg: 'rgba(103,232,249,0.08)' },
              ].map((s, i) => (
                <div key={i} style={{
                  background: s.bg, borderRadius: 14, padding: '16px 18px',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Level Roadmap */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 24,
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Level Roadmap</div>
              <div style={{ display: 'flex', gap: 0, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
                {LEVELS.map((lvl, i) => {
                  const isCurrent = level.index === i;
                  const isUnlocked = level.index >= i;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: 14,
                        background: isCurrent ? `linear-gradient(135deg, ${lvl.color}30, ${lvl.color}10)` : isUnlocked ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                        border: isCurrent ? `2px solid ${lvl.color}` : '1px solid rgba(255,255,255,0.05)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                        opacity: isUnlocked ? 1 : 0.4,
                      }}>
                        <span style={{ fontSize: 18 }}>{lvl.icon}</span>
                        <span style={{ fontSize: 8, color: isUnlocked ? lvl.color : 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{lvl.name}</span>
                      </div>
                      {i < LEVELS.length - 1 && (
                        <div style={{
                          width: 24, height: 2,
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
              background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 24,
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Recent Badges</div>
                <button onClick={() => setActiveTab('badges')} style={{
                  background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>View All <ChevronRight size={14} /></button>
              </div>
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none' }}>
                {(earnedBadges.length > 0 ? earnedBadges.slice(-6).reverse() : BADGES.slice(0, 6)).map((badge, i) => {
                  const Icon = badge.icon;
                  const tier = BADGE_TIERS[badge.tier];
                  const earned = earnedBadgeSet.has(badge.id);
                  return (
                    <div key={i} style={{
                      width: 100, flexShrink: 0, textAlign: 'center', padding: 12, borderRadius: 14,
                      background: earned ? `${tier.color}10` : 'rgba(255,255,255,0.02)',
                      border: earned ? `1px solid ${tier.color}30` : '1px solid rgba(255,255,255,0.05)',
                      opacity: earned ? 1 : 0.4,
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, margin: '0 auto 8px',
                        background: earned ? `linear-gradient(135deg, ${tier.color}40, ${tier.color}15)` : 'rgba(255,255,255,0.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: earned ? `0 0 16px ${tier.glow}` : 'none',
                      }}>
                        {earned ? <Icon size={18} color={tier.color} /> : <Lock size={14} color="rgba(255,255,255,0.2)" />}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: earned ? '#fff' : 'rgba(255,255,255,0.3)', lineHeight: 1.2 }}>{badge.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'badges' && (
          <div>
            {/* Earned */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Award size={18} color="#fbbf24" /> Earned ({earnedBadges.length})
              </div>
              {earnedBadges.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
                  No badges earned yet. Start solving problems to unlock your first badge!
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                  {earnedBadges.map((badge, i) => <BadgeCard key={i} badge={badge} earned />)}
                </div>
              )}
            </div>
            {/* Locked */}
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock size={18} /> Locked ({lockedBadges.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {lockedBadges.map((badge, i) => <BadgeCard key={i} badge={badge} earned={false} />)}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div>
            {/* Period Toggle */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 4, width: 'fit-content', border: '1px solid rgba(255,255,255,0.06)' }}>
              {['weekly', 'monthly', 'alltime'].map(p => (
                <button key={p} onClick={() => setLeaderboardPeriod(p)} style={{
                  padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: leaderboardPeriod === p ? 'rgba(139,92,246,0.15)' : 'transparent',
                  color: leaderboardPeriod === p ? '#c084fc' : 'rgba(255,255,255,0.4)',
                  fontWeight: 600, fontSize: 12, textTransform: 'capitalize',
                }}>{p === 'alltime' ? 'All Time' : p}</button>
              ))}
            </div>

            {/* Leaderboard Table */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)',
              overflow: 'hidden',
            }}>
              {MOCK_LEADERBOARD.map((entry, i) => {
                const rankColors = ['#fbbf24', '#C0C0C0', '#CD7F32'];
                const isTop3 = i < 3;
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
                    borderBottom: i < MOCK_LEADERBOARD.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    background: isTop3 ? `${rankColors[i]}05` : 'transparent',
                    transition: 'background 0.2s',
                  }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                     onMouseLeave={e => e.currentTarget.style.background = isTop3 ? `${rankColors[i]}05` : 'transparent'}>
                    {/* Rank */}
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isTop3 ? `${rankColors[i]}15` : 'rgba(255,255,255,0.04)',
                      color: isTop3 ? rankColors[i] : 'rgba(255,255,255,0.4)',
                      fontWeight: 800, fontSize: 14,
                    }}>
                      {isTop3 ? ['🥇', '🥈', '🥉'][i] : entry.rank}
                    </div>
                    {/* Avatar + Name */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{entry.avatar}</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{entry.name}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{entry.level}</div>
                      </div>
                    </div>
                    {/* Stats */}
                    <div style={{ display: 'flex', gap: 20 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#a78bfa' }}>{entry.xp.toLocaleString()}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>XP</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#6ee7b7' }}>{entry.solved}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Solved</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>{entry.streak}🔥</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Streak</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <StreakHeatmap
              activityHistory={gam.activityHistory}
              currentStreak={gam.currentStreak}
              bestStreak={gam.bestStreak}
            />

            {/* XP Log */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 24,
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Recent Activity</div>
              {gam.xpLog.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
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
    </div>
  );
}

function BadgeCard({ badge, earned }) {
  const Icon = badge.icon;
  const tier = BADGE_TIERS[badge.tier];
  return (
    <div style={{
      padding: 16, borderRadius: 14,
      background: earned ? `${tier.color}08` : 'rgba(255,255,255,0.02)',
      border: earned ? `1px solid ${tier.color}25` : '1px solid rgba(255,255,255,0.05)',
      display: 'flex', alignItems: 'center', gap: 12,
      opacity: earned ? 1 : 0.5,
      transition: 'all 0.2s',
      cursor: 'default',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: earned ? `linear-gradient(135deg, ${tier.color}30, ${tier.color}10)` : 'rgba(255,255,255,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: earned ? `0 0 20px ${tier.glow}` : 'none',
      }}>
        {earned ? <Icon size={20} color={tier.color} /> : <Lock size={16} color="rgba(255,255,255,0.2)" />}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: earned ? '#fff' : 'rgba(255,255,255,0.4)', marginBottom: 2 }}>{badge.name}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.3 }}>{badge.desc}</div>
        <div style={{ fontSize: 9, fontWeight: 700, color: tier.color, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{tier.label}</div>
      </div>
    </div>
  );
}
