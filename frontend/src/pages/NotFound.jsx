import { Link } from 'react-router-dom';
import {Home, ArrowLeft, Sparkles, Compass} from 'lucide-react';
import './NotFound.css';

export default function NotFound() {
    return (
        <div className="not-found-page">
            <div className="not-found-glow" />

            <div className="not-found-container">
                {/* Animated 404 number */}
                <div className="not-found-hero">
                    <span className="not-found-digit">4</span>
                    <div className="not-found-orb">
                        <Compass size={48} className="not-found-orb-icon" />
                    </div>
                    <span className="not-found-digit">4</span>
                </div>

                <h1 className="not-found-title">
                    Page Not Found
                </h1>

                <p className="not-found-description">
                    The page you're looking for doesn't exist or has been moved.
                    Let's get you back on track.
                </p>

                {/* Quick actions */}
                <div className="not-found-actions">
                    <Link to="/" className="not-found-btn not-found-btn--primary">
                        <Home size={16} />
                        Go Home
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="not-found-btn not-found-btn--ghost"
                    >
                        <ArrowLeft size={16} />
                        Go Back
                    </button>
                </div>

                {/* Suggested pages */}
                <div className="not-found-suggestions">
                    <h3 className="not-found-suggestions-title">
                        <Sparkles size={14} />
                        Popular destinations
                    </h3>
                    <div className="not-found-suggestions-grid">
                        <Link to="/dashboard" className="not-found-card">
                            <span className="not-found-card-emoji">📊</span>
                            <span>Dashboard</span>
                        </Link>
                        <Link to="/problems" className="not-found-card">
                            <span className="not-found-card-emoji">💡</span>
                            <span>Problems</span>
                        </Link>
                        <Link to="/interview-suite" className="not-found-card">
                            <span className="not-found-card-emoji">🎙️</span>
                            <span>Interviews</span>
                        </Link>
                        <Link to="/learning-path" className="not-found-card">
                            <span className="not-found-card-emoji">🗺️</span>
                            <span>Learning Path</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
