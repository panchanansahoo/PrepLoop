import { useMemo } from 'react';
import { TrendingUp, Zap, Target, Clock, CheckCircle2, BookOpen, ArrowUp } from 'lucide-react';
import './roadmap-quick-stats.css';

export default function RoadmapQuickStats({
    totalProblems = 0,
    solvedProblems = 0,
    completedGuideCount = 0,
    totalGuideCount = 0,
    branchStats = [],
    trackingData = {},
}) {
    const stats = useMemo(() => {
        const overallProgress = totalProblems > 0 ? Math.round((solvedProblems / totalProblems) * 100) : 0;
        const guideCompletion = totalGuideCount > 0 ? Math.round((completedGuideCount / totalGuideCount) * 100) : 0;

        // Find top branch
        const topBranch = branchStats.length > 0
            ? branchStats.reduce((prev, current) =>
                current.progressPercent > prev.progressPercent ? current : prev
            )
            : null;

        // Find branch needing most attention
        const needsAttention = branchStats.length > 0
            ? branchStats.reduce((prev, current) =>
                current.progressPercent < prev.progressPercent ? current : prev
            )
            : null;

        // Estimate time to completion (rough: 5 min per problem avg)
        const remainingProblems = totalProblems - solvedProblems;
        const estimatedHours = Math.ceil(remainingProblems * 5 / 60);

        // Calculate velocity (problems solved per day - from tracking data)
        const velocity = trackingData.dailyVelocity || 0;

        return {
            overallProgress,
            guideCompletion,
            topBranch,
            needsAttention,
            estimatedHours,
            remainingProblems,
            velocity,
        };
    }, [totalProblems, solvedProblems, completedGuideCount, totalGuideCount, branchStats, trackingData]);

    const getProgressColor = (percent) => {
        if (percent >= 75) return '#34d399';
        if (percent >= 50) return '#fbbf24';
        if (percent >= 25) return '#f97316';
        return '#ef4444';
    };

    return (
        <div className="roadmap-quick-stats">
            <div className="roadmap-quick-stats-header">
                <div className="roadmap-quick-stats-title">
                    <TrendingUp size={14} />
                    <span>Quick Stats</span>
                </div>
            </div>

            {/* Overall Progress */}
            <div className="roadmap-quick-stat-card">
                <div className="roadmap-quick-stat-label">Overall Progress</div>
                <div className="roadmap-quick-stat-value">
                    {stats.overallProgress}%
                </div>
                <div className="roadmap-quick-stat-bar">
                    <div
                        className="roadmap-quick-stat-bar-fill"
                        style={{
                            width: `${stats.overallProgress}%`,
                            background: getProgressColor(stats.overallProgress),
                        }}
                    />
                </div>
                <div className="roadmap-quick-stat-meta">
                    {solvedProblems} of {totalProblems} problems solved
                </div>
            </div>

            {/* Guide Completion */}
            <div className="roadmap-quick-stat-card">
                <div className="roadmap-quick-stat-label">
                    <CheckCircle2 size={12} />
                    Guides Completed
                </div>
                <div className="roadmap-quick-stat-value">
                    {completedGuideCount}/{totalGuideCount}
                </div>
                <div className="roadmap-quick-stat-bar">
                    <div
                        className="roadmap-quick-stat-bar-fill"
                        style={{
                            width: `${stats.guideCompletion}%`,
                            background: '#34d399',
                        }}
                    />
                </div>
                <div className="roadmap-quick-stat-meta">
                    {stats.guideCompletion}% complete
                </div>
            </div>

            {/* Time Estimate */}
            {stats.estimatedHours > 0 && (
                <div className="roadmap-quick-stat-card">
                    <div className="roadmap-quick-stat-label">
                        <Clock size={12} />
                        Estimated Time
                    </div>
                    <div className="roadmap-quick-stat-value">
                        {stats.estimatedHours}h
                    </div>
                    <div className="roadmap-quick-stat-meta">
                        ~{stats.remainingProblems} problems remaining
                    </div>
                </div>
            )}

            {/* Velocity */}
            {stats.velocity > 0 && (
                <div className="roadmap-quick-stat-card">
                    <div className="roadmap-quick-stat-label">
                        <Zap size={12} />
                        Daily Velocity
                    </div>
                    <div className="roadmap-quick-stat-value">
                        {stats.velocity}
                        <span className="roadmap-quick-stat-unit">/day</span>
                    </div>
                    <div className="roadmap-quick-stat-meta">
                        Problems solved per day
                    </div>
                </div>
            )}

            {/* Top Branch */}
            {stats.topBranch && (
                <div className="roadmap-quick-stat-card">
                    <div className="roadmap-quick-stat-label">
                        <ArrowUp size={12} />
                        Top Progress
                    </div>
                    <div className="roadmap-quick-stat-top-branch">
                        <div
                            className="roadmap-quick-stat-top-branch-dot"
                            style={{ background: stats.topBranch.color }}
                        />
                        <span>{stats.topBranch.label}</span>
                    </div>
                    <div className="roadmap-quick-stat-meta">
                        {stats.topBranch.progressPercent}% complete
                    </div>
                </div>
            )}

            {/* Needs Attention */}
            {stats.needsAttention && (
                <div className="roadmap-quick-stat-card roadmap-quick-stat-card-warning">
                    <div className="roadmap-quick-stat-label">
                        <Target size={12} />
                        Focus Area
                    </div>
                    <div className="roadmap-quick-stat-needs-attention">
                        <div
                            className="roadmap-quick-stat-needs-attention-dot"
                            style={{ background: stats.needsAttention.color }}
                        />
                        <span>{stats.needsAttention.label}</span>
                    </div>
                    <div className="roadmap-quick-stat-meta">
                        {stats.needsAttention.progressPercent}% complete • {stats.needsAttention.totalCount} problems
                    </div>
                </div>
            )}

            {/* Insights */}
            <div className="roadmap-quick-stat-insights">
                <div className="roadmap-quick-stat-insight-title">Insights</div>
                {stats.overallProgress >= 90 ? (
                    <div className="roadmap-quick-stat-insight">
                        ✨ You're almost there! Keep up the momentum.
                    </div>
                ) : stats.overallProgress >= 50 ? (
                    <div className="roadmap-quick-stat-insight">
                        🎯 Halfway done! Focus on the challenging areas.
                    </div>
                ) : (
                    <div className="roadmap-quick-stat-insight">
                        🚀 Great start! Consistency is key to mastery.
                    </div>
                )}
            </div>
        </div>
    );
}
