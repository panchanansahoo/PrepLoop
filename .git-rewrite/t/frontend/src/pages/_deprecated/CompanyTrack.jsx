import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    Building2, Clock, Target, CheckCircle2, ArrowRight,
    BookOpen, Star, ChevronRight, Award, Lightbulb, Users
} from 'lucide-react';
import { companyTracks, getTrackById, getTracksByCategory } from '../data/companyTracks';

function TrackList() {
    const grouped = getTracksByCategory();

    return (
        <div className="ct-container">
            <div className="ct-list-header">
                <Building2 size={28} style={{ color: 'var(--accent)' }} />
                <div>
                    <h1 className="ct-title">Company Tracks</h1>
                    <p className="ct-subtitle">Structured preparation plans for top recruiters</p>
                </div>
            </div>

            {Object.entries(grouped).map(([category, tracks]) => (
                <div key={category} className="ct-category">
                    <h2 className="ct-cat-title">{category}</h2>
                    <div className="ct-track-grid">
                        {tracks.map(track => (
                            <Link to={`/company-track/${track.id}`} key={track.id} className="ct-track-card">
                                <div className="ct-track-logo">{track.logo}</div>
                                <div className="ct-track-info">
                                    <h3>{track.name}</h3>
                                    <p>{track.fullName}</p>
                                    <div className="ct-track-meta">
                                        <span className={`ct-diff ct-diff-${track.difficulty.toLowerCase().replace('-', '')}`}>
                                            {track.difficulty}
                                        </span>
                                        <span className="ct-prep-time">
                                            <Clock size={12} /> {track.prepTime}
                                        </span>
                                        <span className="ct-salary">{track.salary}</span>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="ct-track-arrow" />
                            </Link>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function TrackDetail({ trackId }) {
    const track = getTrackById(trackId);
    const [completedSections, setCompletedSections] = useState(
        () => JSON.parse(localStorage.getItem(`ct_progress_${trackId}`) || '{}')
    );

    if (!track) return <div className="ct-container"><p>Track not found</p></div>;

    const toggleSection = (sectionIndex) => {
        const updated = { ...completedSections, [sectionIndex]: !completedSections[sectionIndex] };
        setCompletedSections(updated);
        localStorage.setItem(`ct_progress_${trackId}`, JSON.stringify(updated));
    };

    const totalSections = track.syllabus.length;
    const completedCount = Object.values(completedSections).filter(Boolean).length;
    const progressPercent = totalSections > 0 ? Math.round((completedCount / totalSections) * 100) : 0;

    return (
        <div className="ct-container">
            <Link to="/company-track" className="ct-back">← All Tracks</Link>

            {/* Track Header */}
            <div className="ct-detail-header">
                <div className="ct-detail-logo">{track.logo}</div>
                <div>
                    <h1>{track.name}</h1>
                    <p className="ct-detail-full">{track.fullName}</p>
                    <div className="ct-track-meta">
                        <span className={`ct-diff ct-diff-${track.difficulty.toLowerCase().replace('-', '')}`}>
                            {track.difficulty}
                        </span>
                        <span className="ct-prep-time"><Clock size={12} /> {track.prepTime}</span>
                        <span className="ct-salary">{track.salary}</span>
                    </div>
                </div>
            </div>

            {/* Progress */}
            <div className="ct-progress-bar-wrap">
                <div className="ct-progress-label">
                    <span>Preparation Progress</span>
                    <span>{progressPercent}%</span>
                </div>
                <div className="ct-progress-bar">
                    <div className="ct-progress-fill" style={{ width: `${progressPercent}%` }} />
                </div>
            </div>

            {/* Rounds */}
            <div className="ct-section">
                <h2><Users size={16} /> Interview Rounds</h2>
                <div className="ct-rounds">
                    {track.rounds.map((round, i) => (
                        <div key={i} className={`ct-round ct-round-${round.type}`}>
                            <div className="ct-round-num">{i + 1}</div>
                            <div>
                                <h4>{round.name}</h4>
                                <p>{round.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Syllabus */}
            <div className="ct-section">
                <h2><BookOpen size={16} /> Syllabus</h2>
                <div className="ct-syllabus">
                    {track.syllabus.map((section, i) => (
                        <div key={i} className={`ct-syl-card ${completedSections[i] ? 'completed' : ''}`}>
                            <div className="ct-syl-header">
                                <button className="ct-syl-check" onClick={() => toggleSection(i)}>
                                    <CheckCircle2 size={18} />
                                </button>
                                <h4>{section.section}</h4>
                            </div>
                            <div className="ct-syl-topics">
                                {section.topics.map((t, j) => (
                                    <span key={j} className="ct-syl-topic">{t}</span>
                                ))}
                            </div>
                            {section.link && (
                                <Link to={section.link} className="ct-syl-link">
                                    Practice →
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Must-Do */}
            <div className="ct-section">
                <h2><Star size={16} /> Must-Do Topics</h2>
                <div className="ct-must-do">
                    {track.mustDo.map((item, i) => (
                        <div key={i} className="ct-must-item">
                            <Target size={14} style={{ color: 'var(--accent)' }} />
                            <span>{item}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tips */}
            <div className="ct-section">
                <h2><Lightbulb size={16} /> Preparation Tips</h2>
                <div className="ct-tips">
                    {track.tips.map((tip, i) => (
                        <div key={i} className="ct-tip">
                            <span className="ct-tip-num">{i + 1}</span>
                            <span>{tip}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function CompanyTrack() {
    const { id } = useParams();
    return id ? <TrackDetail trackId={id} /> : <TrackList />;
}
