import React, { useState } from 'react';
import {
    TrendingUp,
    BarChart3,
    Zap,
    Award,
    Target,
    Calendar,
    Download,
    ChevronRight,
    AlertCircle,
} from 'lucide-react';
import './roadmap-analytics.css';

export default function RoadmapAnalytics({ analytics, onExport, isExpanded = false }) {
    const [expanded, setExpanded] = useState(isExpanded);
    const [activeTab, setActiveTab] = useState('overview');

    if (!analytics) {
        return null;
    }

    const { overview, difficultyAnalytics, velocity, currentStreak, maxStreak, branchAnalytics, timeEstimates, weakAreas, strengths, performanceMetrics } = analytics;

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'Easy':
                return '#10b981';
            case 'Medium':
                return '#f59e0b';
            case 'Hard':
                return '#ef4444';
            default:
                return '#6b7280';
        }
    };

    const renderOverviewTab = () => (
        <div className="analytics-tab-content">
            <div className="analytics-grid-2">
                {/* Completion Rate */}
                <div className="analytics-card">
                    <div className="analytics-card-header">
                        <Award size={20} className="analytics-icon" />
                        <h4>Completion Rate</h4>
                    </div>
                    <div className="analytics-progress-circle">
                        <svg viewBox="0 0 100 100" className="progress-ring">
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="rgba(107, 114, 128, 0.2)"
                                strokeWidth="8"
                            />
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="8"
                                strokeDasharray={`${(overview.overallProgress / 100) * 283} 283`}
                                strokeLinecap="round"
                                className="progress-ring-fill"
                            />
                            <text x="50" y="50" textAnchor="middle" dy="0.3em" className="progress-text">
                                {overview.overallProgress}%
                            </text>
                        </svg>
                    </div>
                    <p className="analytics-card-meta">
                        {overview.totalSolved} of {overview.totalProblems} problems solved
                    </p>
                </div>

                {/* Guides Progress */}
                <div className="analytics-card">
                    <div className="analytics-card-header">
                        <Target size={20} className="analytics-icon" />
                        <h4>Guides Progress</h4>
                    </div>
                    <div className="analytics-stat-group">
                        <div className="analytics-stat">
                            <span className="stat-value" style={{ color: '#10b981' }}>
                                {overview.completedGuides}
                            </span>
                            <span className="stat-label">Completed</span>
                        </div>
                        <div className="analytics-stat">
                            <span className="stat-value" style={{ color: '#f59e0b' }}>
                                {overview.inProgressGuides}
                            </span>
                            <span className="stat-label">In Progress</span>
                        </div>
                        <div className="analytics-stat">
                            <span className="stat-value" style={{ color: '#6b7280' }}>
                                {overview.notStartedGuides}
                            </span>
                            <span className="stat-label">Not Started</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Difficulty Breakdown */}
            <div className="analytics-card">
                <div className="analytics-card-header">
                    <BarChart3 size={20} className="analytics-icon" />
                    <h4>Performance by Difficulty</h4>
                </div>
                <div className="difficulty-bars">
                    {difficultyAnalytics.map((d) => (
                        <div key={d.difficulty} className="difficulty-bar-group">
                            <div className="difficulty-bar-header">
                                <span className="difficulty-label">{d.difficulty}</span>
                                <span className="difficulty-rate" style={{ color: getDifficultyColor(d.difficulty) }}>
                                    {d.completionRate}%
                                </span>
                            </div>
                            <div className="difficulty-bar-container">
                                <div
                                    className="difficulty-bar-fill"
                                    style={{
                                        width: `${d.completionRate}%`,
                                        backgroundColor: getDifficultyColor(d.difficulty),
                                    }}
                                />
                            </div>
                            <div className="difficulty-bar-meta">
                                {d.completed}/{d.total} guides • {d.solvedProblems}/{d.totalProblems} problems
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderVelocityTab = () => (
        <div className="analytics-tab-content">
            <div className="analytics-grid-2">
                {/* Velocity */}
                <div className="analytics-card">
                    <div className="analytics-card-header">
                        <TrendingUp size={20} className="analytics-icon" />
                        <h4>Learning Velocity</h4>
                    </div>
                    <div className="velocity-stat">
                        <div className="velocity-value">{velocity.guidesPerDay}</div>
                        <div className="velocity-label">Guides per day</div>
                    </div>
                    <div className="velocity-details">
                        <p>{velocity.guidesPerWeek} guides per week</p>
                        <p>Est. {velocity.estimatedCompletionDays} days to completion</p>
                    </div>
                </div>

                {/* Streak */}
                <div className="analytics-card">
                    <div className="analytics-card-header">
                        <Zap size={20} className="analytics-icon" />
                        <h4>Streak Tracking</h4>
                    </div>
                    <div className="streak-stat">
                        <div className="streak-current">
                            <span className="streak-label">Current</span>
                            <span className="streak-value">{currentStreak} days</span>
                        </div>
                        <div className="streak-separator" />
                        <div className="streak-max">
                            <span className="streak-label">Personal Best</span>
                            <span className="streak-value">{maxStreak} days</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Time to Completion */}
            <div className="analytics-card">
                <div className="analytics-card-header">
                    <Calendar size={20} className="analytics-icon" />
                    <h4>Time to Completion</h4>
                </div>
                <div className="time-estimate">
                    <div className="time-row">
                        <span className="time-label">Estimated Time</span>
                        <span className="time-value">{timeEstimates.hoursToComplete}h</span>
                    </div>
                    <div className="time-row">
                        <span className="time-label">At 2hrs/day pace</span>
                        <span className="time-value">{timeEstimates.daysToComplete} days</span>
                    </div>
                    <div className="time-row">
                        <span className="time-label">Completion Date</span>
                        <span className="time-value">{timeEstimates.estimatedCompletionDate}</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderBranchTab = () => (
        <div className="analytics-tab-content">
            <div className="branch-analytics-list">
                {branchAnalytics.map((branch) => (
                    <div key={branch.name} className="branch-analytics-card">
                        <div className="branch-header">
                            <h4>{branch.name}</h4>
                            <span className="branch-completion">{branch.completionRate}%</span>
                        </div>

                        <div className="branch-progress-bar">
                            <div
                                className="branch-progress-fill"
                                style={{ width: `${branch.completionRate}%` }}
                            />
                        </div>

                        <div className="branch-stats">
                            <div className="branch-stat">
                                <span className="branch-stat-label">Guides</span>
                                <span className="branch-stat-value">
                                    {branch.completedGuides}/{branch.totalGuides}
                                </span>
                            </div>
                            <div className="branch-stat">
                                <span className="branch-stat-label">Problems</span>
                                <span className="branch-stat-value">
                                    {branch.solvedProblems}/{branch.totalProblems}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderInsightsTab = () => (
        <div className="analytics-tab-content">
            {/* Strengths */}
            {strengths.length > 0 && (
                <div className="analytics-card">
                    <div className="analytics-card-header">
                        <Award size={20} className="analytics-icon" style={{ color: '#10b981' }} />
                        <h4>Your Strengths</h4>
                    </div>
                    <div className="insights-list">
                        {strengths.map((s) => (
                            <div key={s.difficulty} className="insight-item">
                                <span className="insight-badge" style={{ backgroundColor: `${getDifficultyColor(s.difficulty)}20` }}>
                                    {s.difficulty}
                                </span>
                                <span className="insight-text">
                                    {s.completionRate}% mastery
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Weak Areas */}
            {weakAreas.length > 0 && (
                <div className="analytics-card">
                    <div className="analytics-card-header">
                        <AlertCircle size={20} className="analytics-icon" style={{ color: '#ef4444' }} />
                        <h4>Areas for Improvement</h4>
                    </div>
                    <div className="insights-list">
                        {weakAreas.map((w) => (
                            <div key={w.difficulty} className="insight-item warning">
                                <span className="insight-badge" style={{ backgroundColor: `${getDifficultyColor(w.difficulty)}20` }}>
                                    {w.difficulty}
                                </span>
                                <span className="insight-text">
                                    Focus: Only {w.completionRate}% complete
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Performance Metrics */}
            <div className="analytics-card">
                <div className="analytics-card-header">
                    <TrendingUp size={20} className="analytics-icon" />
                    <h4>Performance Metrics</h4>
                </div>
                <div className="performance-grid">
                    <div className="performance-item">
                        <span className="perf-label">Avg Problems/Guide</span>
                        <span className="perf-value">{performanceMetrics.avgProblemsPerGuide}</span>
                    </div>
                    <div className="performance-item">
                        <span className="perf-label">Total Hours</span>
                        <span className="perf-value">{performanceMetrics.totalHoursSpent}h</span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="roadmap-analytics-container">
            {/* Header */}
            <div className="analytics-header" onClick={() => setExpanded(!expanded)}>
                <div className="analytics-header-left">
                    <BarChart3 className="header-icon" />
                    <h3>Advanced Analytics</h3>
                </div>
                <div className="analytics-header-right">
                    {onExport && (
                        <button className="analytics-export-btn" onClick={(e) => {
                            e.stopPropagation();
                            onExport();
                        }} title="Export report">
                            <Download size={18} />
                        </button>
                    )}
                    <button className={`expand-btn ${expanded ? 'expanded' : ''}`}>
                        <ChevronRight />
                    </button>
                </div>
            </div>

            {/* Expandable Content */}
            {expanded && (
                <div className="analytics-content">
                    {/* Tab Navigation */}
                    <div className="analytics-tabs">
                        <button
                            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            Overview
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'velocity' ? 'active' : ''}`}
                            onClick={() => setActiveTab('velocity')}
                        >
                            Velocity
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'branches' ? 'active' : ''}`}
                            onClick={() => setActiveTab('branches')}
                        >
                            Branches
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
                            onClick={() => setActiveTab('insights')}
                        >
                            Insights
                        </button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'overview' && renderOverviewTab()}
                    {activeTab === 'velocity' && renderVelocityTab()}
                    {activeTab === 'branches' && renderBranchTab()}
                    {activeTab === 'insights' && renderInsightsTab()}
                </div>
            )}
        </div>
    );
}
