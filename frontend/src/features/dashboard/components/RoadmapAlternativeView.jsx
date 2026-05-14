import React, { useState, useMemo } from 'react';
import { Grid3X3, List, ChevronRight, CheckCircle2, Circle, BookOpen, Zap, Award } from 'lucide-react';
import './roadmap-alternative-view.css';

export default function RoadmapAlternativeView({ enrichedRoots, view = 'mindmap', onViewChange, guideProgressById = {} }) {
    const [gridLayout, setGridLayout] = useState('grid'); // grid or list

    // Flatten and enrich guides for card view
    const guides = useMemo(() => {
        const allGuides = [];
        const collectGuides = (nodes) => {
            nodes.forEach((node) => {
                if (node.guide) {
                    const progress = guideProgressById[node.guide.id] || {};
                    allGuides.push({
                        ...node.guide,
                        nodeId: node.id,
                        completed: progress.isComplete || false,
                        solvedCount: progress.solvedCount || 0,
                        totalCount: progress.solvedCount ? progress.solvedCount + progress.remainingCount : node.guide.problemCount || 0,
                        difficulty: node.difficulty || 'Medium',
                        lineage: node.lineage || [],
                        branch: node.lineage?.[0]?.label || 'Other',
                    });
                }
                if (node.children?.length) {
                    collectGuides(node.children);
                }
            });
        };
        collectGuides(enrichedRoots);
        return allGuides;
    }, [enrichedRoots, guideProgressById]);

    // Group guides by branch
    const guidesByBranch = useMemo(() => {
        return guides.reduce((acc, guide) => {
            const branch = guide.branch;
            if (!acc[branch]) {
                acc[branch] = [];
            }
            acc[branch].push(guide);
            return acc;
        }, {});
    }, [guides]);

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

    const getDifficultyIcon = (difficulty) => {
        switch (difficulty) {
            case 'Easy':
                return <Circle size={12} />;
            case 'Medium':
                return <Zap size={12} />;
            case 'Hard':
                return <Award size={12} />;
            default:
                return <Circle size={12} />;
        }
    };

    if (view === 'mindmap') {
        return null; // Mindmap view handled by main component
    }

    return (
        <div className="roadmap-alternative-view">
            {/* View Toggle */}
            <div className="view-toggle">
                <button
                    className={`toggle-btn ${gridLayout === 'grid' ? 'active' : ''}`}
                    onClick={() => setGridLayout('grid')}
                    title="Grid view"
                >
                    <Grid3X3 size={18} />
                    Grid
                </button>
                <button
                    className={`toggle-btn ${gridLayout === 'list' ? 'active' : ''}`}
                    onClick={() => setGridLayout('list')}
                    title="List view"
                >
                    <List size={18} />
                    List
                </button>
            </div>

            {/* Content */}
            <div className={`alt-view-content alt-view-${gridLayout}`}>
                {Object.entries(guidesByBranch).map(([branch, branchGuides]) => (
                    <div key={branch} className="branch-section">
                        <div className="branch-header">
                            <h2>{branch}</h2>
                            <span className="branch-count">{branchGuides.length} guides</span>
                        </div>

                        {gridLayout === 'grid' ? (
                            <div className="guides-grid">
                                {branchGuides.map((guide) => (
                                    <GuideCard
                                        key={guide.id}
                                        guide={guide}
                                        getDifficultyColor={getDifficultyColor}
                                        getDifficultyIcon={getDifficultyIcon}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="guides-list">
                                {branchGuides.map((guide) => (
                                    <GuideListItem
                                        key={guide.id}
                                        guide={guide}
                                        getDifficultyColor={getDifficultyColor}
                                        getDifficultyIcon={getDifficultyIcon}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function GuideCard({ guide, getDifficultyColor, getDifficultyIcon }) {
    const progress = guide.totalCount > 0 ? Math.round((guide.solvedCount / guide.totalCount) * 100) : 0;

    return (
        <div className={`guide-card guide-card-${guide.difficulty.toLowerCase()}`}>
            {/* Status Indicator */}
            <div className="card-status">
                {guide.completed ? (
                    <CheckCircle2 size={20} className="status-icon completed" />
                ) : guide.solvedCount > 0 ? (
                    <div className="status-icon in-progress">{Math.ceil((guide.solvedCount / guide.totalCount) * 100)}%</div>
                ) : (
                    <Circle size={20} className="status-icon not-started" />
                )}
            </div>

            {/* Content */}
            <div className="card-content">
                <h3>{guide.name || guide.label}</h3>
                <p className="card-description">{guide.description?.substring(0, 100)}...</p>

                {/* Stats */}
                <div className="card-stats">
                    <span className="stat">
                        <BookOpen size={14} />
                        {guide.totalCount} problems
                    </span>
                    <span className="stat">
                        <span className="difficulty-badge" style={{ color: getDifficultyColor(guide.difficulty) }}>
                            {getDifficultyIcon(guide.difficulty)}
                            {guide.difficulty}
                        </span>
                    </span>
                </div>

                {/* Progress Bar */}
                {guide.totalCount > 0 && (
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{
                                width: `${progress}%`,
                                backgroundColor: getDifficultyColor(guide.difficulty),
                            }}
                        />
                    </div>
                )}

                {/* Progress Text */}
                {guide.totalCount > 0 && (
                    <p className="progress-text">
                        {guide.solvedCount}/{guide.totalCount} solved
                    </p>
                )}
            </div>

            {/* Action Button */}
            <button className="card-action">
                Start Guide
                <ChevronRight size={16} />
            </button>
        </div>
    );
}

function GuideListItem({ guide, getDifficultyColor, getDifficultyIcon }) {
    const progress = guide.totalCount > 0 ? Math.round((guide.solvedCount / guide.totalCount) * 100) : 0;

    return (
        <div className={`guide-list-item guide-item-${guide.difficulty.toLowerCase()}`}>
            {/* Status */}
            <div className="item-status">
                {guide.completed ? (
                    <CheckCircle2 size={18} className="status-icon completed" />
                ) : guide.solvedCount > 0 ? (
                    <div className="status-progress">{Math.ceil(progress)}%</div>
                ) : (
                    <Circle size={18} className="status-icon not-started" />
                )}
            </div>

            {/* Info */}
            <div className="item-info">
                <div className="item-header">
                    <h4>{guide.name || guide.label}</h4>
                    <span className="difficulty-tag" style={{ color: getDifficultyColor(guide.difficulty) }}>
                        {getDifficultyIcon(guide.difficulty)}
                        {guide.difficulty}
                    </span>
                </div>
                <p className="item-description">{guide.description?.substring(0, 80)}...</p>
            </div>

            {/* Stats */}
            <div className="item-stats">
                <span className="stat-label">{guide.totalCount} problems</span>
                {guide.totalCount > 0 && (
                    <div className="mini-progress">
                        <div
                            className="mini-progress-fill"
                            style={{
                                width: `${progress}%`,
                                backgroundColor: getDifficultyColor(guide.difficulty),
                            }}
                        />
                    </div>
                )}
                <span className="stat-label">{guide.solvedCount}/{guide.totalCount}</span>
            </div>

            {/* Action */}
            <button className="item-action">
                <ChevronRight size={16} />
            </button>
        </div>
    );
}
